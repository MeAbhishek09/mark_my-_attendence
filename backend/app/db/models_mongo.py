# backend/app/db/models_mongo.py
from typing import Optional, List
from beanie import Document, Indexed
from pydantic import BaseModel, Field
from datetime import datetime


class Student(Document):
    # All fields are required (non-optional)
    roll_no: Indexed(int, unique=True) = Field(..., description="Numeric roll number, unique")
    name: str = Field(..., description="Student full name")
    exam_no: int = Field(..., description="Numeric exam number")
    course_name: str = Field(..., description="Course name (replaces class)")
    dept: str = Field(..., description="Department code/name")
    sem: int = Field(..., ge=1, le=10, description="Semester (1-10)")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")

    class Settings:
        name = "students"

# class Student(Document):
#     roll_no: Indexed(str)  # indexed field
#     name: str
#     exam_no: Optional[str] = None
#     class_name: Optional[str] = None
#     dept: Optional[str] = None
#     sem: Optional[str] = None
#     created_at: datetime = Field(default_factory=datetime.utcnow)

#     class Settings:
#         name = "students"

class FaceEmbedding(Document):
    student_id: Optional[str] = None  # store str id (or PydanticObjectId)
    embedding: bytes  # you store raw bytes (np.tobytes)
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "face_embeddings"

class SessionAttendance(BaseModel):
    student_id: Optional[str] = None
    student_name: Optional[str] = None
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    confidence: Optional[float] = None
    marked_at: Optional[datetime] = None

class SessionModel(Document):
    dept: Optional[str] = None
    sem: Optional[str] = None
    subject: Optional[str] = None
    teacher: Optional[str] = None
    started_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    stopped_at: Optional[datetime] = None
    attendances: List[SessionAttendance] = Field(default_factory=list)

    class Settings:
        name = "sessions"
