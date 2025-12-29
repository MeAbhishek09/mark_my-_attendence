# backend/app/db/models_mongo.py
from typing import Optional, List
from beanie import Document, Indexed
from pydantic import BaseModel, Field
from datetime import datetime, date


class Student(Document):
    # All fields are required (non-optional)
    roll_no: Indexed(int, unique=True) = Field(..., description="Numeric roll number, unique")
    name: str = Field(..., description="Student full name")
    exam_no: int = Field(..., description="Numeric exam number")
    course_name: str = Field(..., description="Course name (replaces class)")
    dept: str = Field(..., description="Department code/name")
    sem: int = Field(..., ge=1, le=10, description="Semester (1-10)")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    # ===== ENROLLMENT TRACKING (🔥 IMPORTANT) =====
    enroll_failures: int = Field(default=0, description="Failed image enroll attempts")
    enrolled_images: int = Field(default=0, description="Successfully enrolled images")
    enroll_status: str = "IN_PROGRESS" 


    class Settings:
        name = "students"

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

from beanie import Document
from pydantic import Field
from datetime import datetime, timezone


class SessionModel(Document):
    # ===== Session Info =====
    dept: str
    sem: str
    subject: str
    course_name: str

    # ===== Time Control =====
    start_time: datetime
    end_time: datetime
    duration_mins: int

    # ===== REQUIRED FOR YOUR ROUTER FILTER =====
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    class Settings:
        name = "sessions"  # MongoDB collection name




class AttendanceLog(Document):
    session_id: str
    student_id: str
    student_name: Optional[str] = None

    date: date
    in_time: datetime
    out_time: Optional[datetime] = None

    confidence: float

    class Settings:
        name = "attendance_logs"
