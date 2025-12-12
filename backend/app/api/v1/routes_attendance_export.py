# backend/app/api/v1/routes_attendance_export.py
from fastapi import APIRouter, Query, Response
from app.db.models_mongo import SessionModel
import csv
from io import StringIO
from datetime import datetime
from typing import Optional

router = APIRouter()

@router.get("/attendance/export")
async def export_attendance(dept: Optional[str] = Query(None), sem: Optional[str] = Query(None), subject: Optional[str] = Query(None)):
    q = {}
    if dept: q["dept"] = dept
    if sem: q["sem"] = sem
    if subject: q["subject"] = subject

    sessions = SessionModel.find(q)
    out = StringIO()
    w = csv.writer(out)
    w.writerow(["session_id","dept","sem","subject","student_id","student_name","first_seen","last_seen","confidence","marked_at"])

    async for s in sessions:
        for att in s.attendances:
            w.writerow([
                str(s.id), s.dept, s.sem, s.subject,
                att.student_id, att.student_name,
                att.first_seen.isoformat(), att.last_seen.isoformat(),
                att.confidence, att.marked_at.isoformat()
            ])

    csv_text = out.getvalue()
    headers = {
        "Content-Disposition": f'attachment; filename="attendance_{datetime.utcnow().date().isoformat()}.csv"',
        "Content-Type": "text/csv"
    }
    return Response(content=csv_text, media_type="text/csv", headers=headers)
