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
from tailor import tailor_resume

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

@app.post("/upload")
async def upload_files(resume: UploadFile = File(...), job_description: str = Form(...)):
    # Save uploaded resume temporarily
    temp_pdf_path = f"temp_{resume.filename}"
    with open(temp_pdf_path, "wb") as buffer:
        buffer.write(await resume.read())
    
    # 1. Convert PDF to customizable format (DOCX or Text)
    # For high fidelity, we try DOCX
    docx_path = pdf_to_docx(temp_pdf_path)
    
    # 2. Tailor content using LLM
    # This function will read the docx, replace content, and save a new docx
    tailored_docx_path = tailor_resume(docx_path, job_description)
    
    # 3. Convert back to PDF
    tailored_pdf_path = docx_to_pdf(tailored_docx_path)
    
    # Clean up
    if os.path.exists(temp_pdf_path):
        os.remove(temp_pdf_path)
    if os.path.exists(docx_path):
        os.remove(docx_path)
        
    # extract just the filename for the download url
    filename = os.path.basename(tailored_pdf_path)
    
    return {"message": "Resume tailored successfully", "pdf_path": tailored_pdf_path, "download_url": f"http://localhost:8000/download/{filename}"}



if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
