from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from . import models, crud, schemas, nlp
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload-document")
async def upload_document(
    file: UploadFile = File(...),
    source: str = Form(...),
    region: str = Form(...),
    date: str = Form(...)
):
    content = await file.read()
    text = nlp.extract_text(file.filename, content)
    summary = nlp.summarize(text)
    entities = nlp.ner(text)
    topics = nlp.classify(text)
    doc = crud.save_document(file.filename, text, summary, entities, topics, source, region, date)
    return {
        "id": doc.id,
        "summary": summary,
        "entities": entities,
        "topics": topics
    }

@app.get("/search-documents")
def search_documents(
    query: str,
    region: Optional[str] = None,
    type: Optional[str] = None,
    date: Optional[str] = None
):
    return crud.search_documents(query, region, type, date)

@app.get("/document/{doc_id}")
def get_document(doc_id: int):
    return crud.get_document(doc_id)