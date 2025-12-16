# backend/app/api/v1/routes_attendance_export.py
from fastapi import APIRouter, Query, Response
from app.db.models_mongo import AttendanceLog, SessionModel
from typing import Optional
from io import StringIO
import csv
from datetime import datetime, date, timedelta

router = APIRouter()

@router.get("/export")
async def export_attendance(
    dept: Optional[str] = Query(None),
    sem: Optional[str] = Query(None),
    name: Optional[str] = Query(None),
    range: Optional[str] = Query("today"),  # ✅ NEW
):
    today = date.today()

    # ✅ DATE RANGE LOGIC
    if range == "today":
        start_date = today
        end_date = today

    elif range == "week":
        start_date = today - timedelta(days=today.weekday())
        end_date = today

    elif range == "month":
        start_date = today.replace(day=1)
        end_date = today

    elif range == "year":
        start_date = today.replace(month=1, day=1)
        end_date = today

    else:
        start_date = today
        end_date = today

    out = StringIO()
    writer = csv.writer(out)

    writer.writerow([
        "Dept",
        "Sem",
        "Subject",
        "Roll No",
        "Student Name",
        "Date",
        "In Time",
        "Confidence",
    ])

    async for log in AttendanceLog.find({
        "date": {"$gte": start_date, "$lte": end_date}
    }):
        session = await SessionModel.get(log.session_id)
        if not session:
            continue

        # 🔹 filters
        if dept and session.dept != dept:
            continue
        if sem and session.sem != sem:
            continue
        if name and log.student_name and name.lower() not in log.student_name.lower():
            continue

        writer.writerow([
            session.dept,
            session.sem,
            session.subject,
            log.student_id,
            log.student_name,
            log.date.isoformat(),
            log.in_time.replace(tzinfo=None).isoformat() if log.in_time else "",
            log.confidence,
        ])

    headers = {
        "Content-Disposition": f'attachment; filename="attendance_{range}_{today}.csv"',
        "Content-Type": "text/csv",
    }

    return Response(out.getvalue(), media_type="text/csv", headers=headers)
