from sqlalchemy import Column, Integer, String, Text, Date, JSON
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    text = Column(Text)
    summary = Column(Text)
    entities = Column(JSON)
    topics = Column(JSON)
    source = Column(String)
    region = Column(String)
    date = Column(Date)

# ...add Embedding, Tag, UserNote models as needed...
