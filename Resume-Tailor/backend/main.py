from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv

# Load env variables from potential locations
load_dotenv() # current dir
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")) # LLM-Projects root?
# Actually cleaner to just try loading the specific path the user mentioned if possible, or just standard .env
load_dotenv("d:\\projects\\LLM-Projects\\.env")

# from .pdf_handler import pdf_to_docx, docx_to_pdf
# from .tailor import tailor_resume
from pdf_handler import pdf_to_docx, docx_to_pdf
from tailor import analyze_gaps, generate_tailored_resume
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.responses import FileResponse

@app.get("/download/{filename}")
async def download_file(filename: str):
    file_path = os.path.join(os.getcwd(), filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type='application/pdf', filename=filename)
    return {"error": "File not found"}

from typing import List, Dict

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
    
    # 2. Analyze gaps using LLM
    sections = analyze_gaps(docx_path, job_description)
    
    # We return the filename so the frontend can send it back for the next step
    # Ideally, we should use a session ID or a more robust temp file management system
    # For now, we rely on the filename being uniqueish enough or trusted context
    return {
        "message": "Analysis complete", 
        "sections": sections, 
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



if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
