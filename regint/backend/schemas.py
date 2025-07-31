from pydantic import BaseModel
from typing import List, Optional

class DocumentOut(BaseModel):
    id: int
    filename: str
    summary: str
    entities: dict
    topics: list
    source: str
    region: str
    date: str

    class Config:
        orm_mode = True