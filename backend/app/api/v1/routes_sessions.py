# backend/app/api/v1/routes_sessions.py
from fastapi import APIRouter, Body, HTTPException
from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from beanie import PydanticObjectId

from app.db.models_mongo import SessionModel, Student

router = APIRouter()

class StartSessionPayload(BaseModel):
    dept: Optional[str] = None
    sem: Optional[str] = None
    subject: Optional[str] = None
    teacher: Optional[str] = None

@router.post("/start")
async def start_session(payload: StartSessionPayload = Body(...)):
    """
    POST /api/v1/sessions/start
    Body: { dept, sem, subject, teacher }
    Returns created session id and started_at
    """
    s = SessionModel(
        dept=payload.dept,
        sem=payload.sem,
        subject=payload.subject,
        teacher=payload.teacher,
        started_at=datetime.utcnow(),
    )
    await s.insert()
    return {"session_id": str(s.id), "started_at": s.started_at.isoformat(), "dept": s.dept, "sem": s.sem, "subject": s.subject}

@router.post("/{session_id}/stop")
async def stop_session(session_id: str):
    """
    POST /api/v1/sessions/{id}/stop
    Set stopped_at on session
    """
    try:
        sid = PydanticObjectId(session_id)
    except Exception:
        raise HTTPException(status_code=400, detail="invalid session_id")

    session = await SessionModel.get(sid)
    if not session:
        raise HTTPException(status_code=404, detail="session not found")

    session.stopped_at = datetime.utcnow()
    await session.save()
    return {"session_id": session_id, "stopped_at": session.stopped_at.isoformat()}

@router.get("/{session_id}/summary")
async def session_summary(session_id: str):
    """
    GET /api/v1/sessions/{id}/summary
    Returns session metadata and list of attendances.
    """
    try:
        sid = PydanticObjectId(session_id)
    except Exception:
        raise HTTPException(status_code=400, detail="invalid session_id")

    session = await SessionModel.get(sid)
    if not session:
        raise HTTPException(status_code=404, detail="session not found")

    # optional: resolve student names if you stored only ids in attendances
    present = []
    for att in session.attendances:
        student_name = att.student_name
        # If student_name missing but you stored student_id referencing Student, try to fetch
        if (not student_name or student_name == "") and att.student_id:
            try:
                stud = await Student.get(PydanticObjectId(att.student_id))
                if stud:
                    student_name = stud.name
            except Exception:
                pass
        present.append({
            "student_id": att.student_id,
            "student_name": student_name,
            "first_seen": att.first_seen.isoformat() if att.first_seen else None,
            "last_seen": att.last_seen.isoformat() if att.last_seen else None,
            "confidence": att.confidence
        })

    return {
        "session": {
            "id": str(session.id),
            "dept": session.dept,
            "sem": session.sem,
            "subject": session.subject,
            "teacher": session.teacher,
            "started_at": session.started_at.isoformat() if session.started_at else None,
            "stopped_at": session.stopped_at.isoformat() if session.stopped_at else None,
        },
        "present": present
    }
