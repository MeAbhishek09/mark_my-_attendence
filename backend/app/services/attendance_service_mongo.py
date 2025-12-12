# backend/app/services/attendance_service_mongo.py
from datetime import datetime
from beanie import PydanticObjectId
from typing import Optional
from app.db.models_mongo import SessionModel

async def mark_attendance(session_id: Optional[str], student_id: str, student_name: Optional[str], confidence: float):
    if not session_id:
        return {"marked": False, "reason": "no_session"}
    try:
        sid = PydanticObjectId(session_id)
    except Exception:
        return {"marked": False, "reason": "invalid_session_id"}

    session = await SessionModel.get(sid)
    if not session:
        return {"marked": False, "reason": "session_not_found"}

    now = datetime.utcnow()
    # update existing attendance if exists
    for att in session.attendances:
        if att.student_id == student_id:
            att.last_seen = now
            att.confidence = confidence
            att.marked_at = now
            await session.save()
            return {"marked": True, "updated": True}
    # append new attendance
    session.attendances.append({
        "student_id": student_id,
        "student_name": student_name,
        "first_seen": now,
        "last_seen": now,
        "confidence": confidence,
        "marked_at": now
    })
    await session.save()
    return {"marked": True, "appended": True}
