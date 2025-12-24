from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from database import init_db, get_session
from models import Application, TimelineEvent
from sqlmodel import Session, select
from datetime import datetime
import shutil
import uvicorn
import os
from dotenv import load_dotenv
from scraper import fetch_job_description
from pdf_handler import pdf_to_docx, docx_to_pdf
from tailor import analyze_gaps, generate_tailored_resume
from pydantic import BaseModel


# Load env variables from potential locations
load_dotenv() # current dir
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")) # LLM-Projects root?
# Actually cleaner to just try loading the specific path the user mentioned if possible, or just standard .env
load_dotenv("d:\\projects\\LLM-Projects\\.env")

# from .pdf_handler import pdf_to_docx, docx_to_pdf
# from .tailor import tailor_resume
from datetime import datetime
from pdf_handler import pdf_to_docx, docx_to_pdf
from tailor import analyze_gaps, generate_tailored_resume
from pydantic import BaseModel
from typing import List, Dict
from fastapi.responses import FileResponse

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/download/{filename}")
async def download_file(filename: str):
    file_path = os.path.join(os.getcwd(), filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type='application/pdf', filename=filename)
    return {"error": "File not found"}

class EditsRequest(BaseModel):
    filename: str
    sections: List[Dict]

@app.post("/analyze")
async def analyze_resume(resume: UploadFile = File(...), job_description: str = Form(...)):
    # Save uploaded resume temporarily
    temp_pdf_path = f"temp_{resume.filename}"
    with open(temp_pdf_path, "wb") as buffer:
        buffer.write(await resume.read())
    
    # 1. Convert PDF to customizable format (DOCX)
    docx_path = pdf_to_docx(temp_pdf_path)
    
    # 2. Analyze gaps using LLM (Use PDF for reading text)
    analysis_result = analyze_gaps(docx_path, job_description, pdf_path=temp_pdf_path)
    
    # We return the filename so the frontend can send it back for the next step
    # Ideally, we should use a session ID or a more robust temp file management system
    # For now, we rely on the filename being uniqueish enough or trusted context
    return {
        "message": "Analysis complete", 
        "sections": analysis_result.get("sections", []),
        "initial_score": analysis_result.get("initial_score", 0),
        "projected_score": analysis_result.get("projected_score", 0),
        "filename": resume.filename,
        "temp_docx_path": docx_path 
    }

@app.post("/generate")
async def generate_resume_endpoint(request: EditsRequest):
    # Reconstruct paths
    # We assume the file is still there. In a real app, use S3 or DB.
    # The analyze step created "temp_filename.pdf" and then "temp_filename.docx"
    
    # We need the docx path.
    # Let's trust the frontend ensures the flow is sequential and fast enough that temp files exist.
    
    original_filename = request.filename
    temp_pdf_path = f"temp_{original_filename}"
    docx_path = temp_pdf_path.replace(".pdf", ".docx")
    
    if not os.path.exists(docx_path):
        return {"error": "Session expired or file not found. Please upload again."}
        
    # 3. Apply edits
    tailored_docx_path = generate_tailored_resume(docx_path, request.sections)
    
    # 4. Convert back to PDF
    tailored_pdf_path = docx_to_pdf(tailored_docx_path)
    
    # extract just the filename for the download url
    filename = os.path.basename(tailored_pdf_path)
    
    return {
        "message": "Resume tailored successfully", 
        "pdf_path": tailored_pdf_path, 
        "download_url": f"http://localhost:8000/download/{filename}"
    }

# --- Application Tracker Endpoints ---

@app.post("/fetch-jd")
def get_jd(url: str = Form(...)):
    description = fetch_job_description(url)
    # Extract metadata
    from scraper import extract_job_metadata
    metadata = extract_job_metadata(description)
    return {
        "job_description": description,
        "company": metadata.get("company", ""),
        "role": metadata.get("role", "")
    }

@app.get("/applications", response_model=List[Application])
def get_applications(session: Session = Depends(get_session)):
    applications = session.exec(select(Application)).all()
    return applications

@app.post("/applications", response_model=Application)
async def create_application(
    company_name: str = Form(...),
    job_role: str = Form(...),
    job_link: str = Form(None),
    status: str = Form("Applied"),
    job_description: str = Form(None),
    resume: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    # Save resume specifically for this application
    os.makedirs("application_resumes", exist_ok=True)
    # create a unique filename to avoid collisions
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    safe_filename = f"{timestamp}_{resume.filename}"
    file_location = os.path.join("application_resumes", safe_filename)
    
    with open(file_location, "wb+") as file_object:
        file_object.write(await resume.read())

    application = Application(
        company_name=company_name,
        job_role=job_role,
        job_link=job_link,
        status=status,
        job_description=job_description,
        resume_path=file_location
    )
    session.add(application)
    session.commit()
    session.refresh(application)
    return application

@app.delete("/applications/{application_id}")
def delete_application(application_id: int, session: Session = Depends(get_session)):
    app = session.get(Application, application_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Delete file if exists (optional, safely)
    if app.resume_path and os.path.exists(app.resume_path):
        try:
            os.remove(app.resume_path)
        except:
            pass
            
    session.delete(app)
    session.commit()
    return {"ok": True}

@app.patch("/applications/{application_id}/status")
def update_status(application_id: int, status: str = Form(...), session: Session = Depends(get_session)):
    app = session.get(Application, application_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    old_status = app.status
    app.status = status
    session.add(app)
    
    # Add Timeline Event
    event = TimelineEvent(application_id=app.id, title="Status Change", description=f"Status changed from {old_status} to {status}")
    session.add(event)
    
    session.commit()
    session.refresh(app)
    return app

@app.get("/applications/{application_id}/timeline", response_model=List[TimelineEvent])
def get_timeline(application_id: int, session: Session = Depends(get_session)):
    events = session.exec(select(TimelineEvent).where(TimelineEvent.application_id == application_id).order_by(TimelineEvent.date.desc())).all()
    return events

@app.post("/applications/{application_id}/timeline")
def add_timeline_event(application_id: int, title: str = Form(...), description: str = Form(None), session: Session = Depends(get_session)):
    event = TimelineEvent(application_id=application_id, title=title, description=description)
    session.add(event)
    session.commit()
    session.refresh(event)
    return event

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
