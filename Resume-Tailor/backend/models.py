from datetime import datetime
from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship

class Application(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    company_name: str
    job_role: str
    job_link: Optional[str] = None
    date_applied: datetime = Field(default_factory=datetime.now)
    status: str = Field(default="Applied")
    job_description: Optional[str] = None
    resume_path: Optional[str] = None
    
    # Relationship
    timeline_events: List["TimelineEvent"] = Relationship(back_populates="application")

class TimelineEvent(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    application_id: int = Field(foreign_key="application.id")
    date: datetime = Field(default_factory=datetime.now)
    title: str
    description: Optional[str] = None
    
    # Relationship
    application: Optional[Application] = Relationship(back_populates="timeline_events")
