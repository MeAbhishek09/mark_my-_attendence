# backend/app/db/models_mongo.py
from beanie import Document, Link, Indexed
from pydantic import Field
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class Student(Document):
    roll_no: Indexed(str, unique=True)
    name: str
    exam_no: Optional[str] = None
    class_name: Optional[str] = None
    dept: Optional[str] = None
    sem: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Collection:
        name = "students"

class FaceEmbedding(Document):
    student: Optional[Link[Student]] = None
    embedding: bytes  # store float32.tobytes()
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Collection:
        name = "face_embeddings"

class SessionAttendance(BaseModel):
    student_id: str
    student_name: Optional[str] = None
    first_seen: datetime = Field(default_factory=datetime.utcnow)
    last_seen: datetime = Field(default_factory=datetime.utcnow)
    confidence: Optional[float] = None
    marked_at: datetime = Field(default_factory=datetime.utcnow)

class SessionModel(Document):
    dept: Optional[str] = None
    sem: Optional[str] = None
    subject: Optional[str] = None
    teacher: Optional[str] = None
    started_at: datetime = Field(default_factory=datetime.utcnow)
    stopped_at: Optional[datetime] = None
    attendances: List[SessionAttendance] = Field(default_factory=list)

    class Collection:
        name = "sessions"
