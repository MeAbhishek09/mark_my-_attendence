from fastapi import APIRouter, Depends
from app.db.session import SessionLocal
from app.db import models_mongo
from datetime import date

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/today")
def attendance_today(db = Depends(get_db)):
    today = date.today()
    rows = db.query(models_mongo.AttendanceLog).filter_by(date=today).all()
    return [{
        "student_id": r.student_id,
        "student_name": r.student.name if r.student else None,
        "in_time": r.in_time.isoformat() if r.in_time else None,
        "out_time": r.out_time.isoformat() if r.out_time else None,
        "confidence": r.confidence
    } for r in rows]
