from fastapi import APIRouter, Query
from datetime import date, datetime, timedelta
from app.db.models_mongo import AttendanceLog, Student, SessionModel
from datetime import timezone


router = APIRouter()

@router.get("/preview")
async def attendance_preview(
    range: str = Query("today", enum=["today", "week", "month", "year"])
):
    today = date.today()

    # 🔹 date range calculation
    if range == "today":
        start = today
    elif range == "week":
        start = today - timedelta(days=today.weekday())
    elif range == "month":
        start = today.replace(day=1)
    elif range == "year":
        start = today.replace(month=1, day=1)

    records = []

    async for log in AttendanceLog.find({"date": {"$gte": start}}):
        student = await Student.get(log.student_id)
        session = await SessionModel.get(log.session_id)

        records.append({
            "roll_no": student.roll_no if student else None,
            "student_name": student.name if student else log.student_name,
            "dept": student.dept if student else None,
            "sem": student.sem if student else None,
            "subject": session.subject if session else None,
            "in_time": (
                log.in_time.replace(tzinfo=timezone.utc).isoformat()
                if log.in_time else None
            ),
            "confidence": log.confidence,
        })

    return records
