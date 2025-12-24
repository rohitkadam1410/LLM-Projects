from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel

class Application(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    company_name: str
    job_role: str
    job_link: Optional[str] = None
    date_applied: datetime = Field(default_factory=datetime.now)
    status: str = Field(default="Applied")
    job_description: Optional[str] = None
    resume_path: Optional[str] = None
