from .models import Document
from sqlalchemy.orm import Session
from .database import get_db

def save_document(filename, text, summary, entities, topics, source, region, date):
    db = next(get_db())
    doc = Document(
        filename=filename,
        text=text,
        summary=summary,
        entities=entities,
        topics=topics,
        source=source,
        region=region,
        date=date
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

def search_documents(query, region, type, date):
    db = next(get_db())
    # ...implement semantic/text search using pgvector or LIKE...
    return []

def get_document(doc_id):
    db = next(get_db())
    return db.query(Document).filter(Document.id == doc_id).first()