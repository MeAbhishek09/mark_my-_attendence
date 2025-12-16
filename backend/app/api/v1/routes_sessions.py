from fastapi import APIRouter, Body, HTTPException
from datetime import datetime, timedelta, timezone

router = APIRouter()

# IST timezone
IST = timezone(timedelta(hours=5, minutes=30))

from app.db.models_mongo import SessionModel, AttendanceLog

router = APIRouter()

UTC = timezone.utc
@router.post("/")
async def create_session(payload: dict = Body(...)):
    print("RECEIVED PAYLOAD:", payload)

    required = ["dept", "sem", "subject", "course_name", "start_time", "duration"]
    for r in required:
        if r not in payload:
            raise HTTPException(400, f"{r} is required")

    try:
        # start_time from <datetime-local> → local IST
        local_time = datetime.fromisoformat(payload["start_time"])

        # convert IST → UTC before saving
        start_time_utc = local_time.astimezone(UTC)

        duration = int(payload["duration"])
    except Exception as e:
        print("PARSE ERROR:", e)
        raise HTTPException(400, "Invalid start_time or duration")

    end_time_utc = start_time_utc + timedelta(minutes=duration)

    # 🚫 DUPLICATE CHECK
    existing = await SessionModel.find_one({
        "dept": payload["dept"],
        "sem": str(payload["sem"]),
        "subject": payload["subject"],
        "start_time": start_time_utc
    })

    if existing:
        raise HTTPException(400, "Session already exists")

    session = SessionModel(
        dept=payload["dept"],
        sem=str(payload["sem"]),
        subject=payload["subject"],
        course_name=payload["course_name"],
        start_time=start_time_utc,
        end_time=end_time_utc,
        duration_mins=duration,
    )

    await session.insert()

    return {
        "success": True,
        "id": str(session.id),
        "start_time": start_time_utc.isoformat(),
        "end_time": end_time_utc.isoformat(),
    }


from datetime import datetime, timedelta, timezone

UTC = timezone.utc

@router.get("/")
async def list_sessions():
    now = datetime.now(UTC)
    twelve_hours_ago = now - timedelta(hours=12)

    sessions = []

    async for s in SessionModel.find():
        start_time = s.start_time.replace(tzinfo=UTC)
        end_time = s.end_time.replace(tzinfo=UTC)

        # 🔹 UPCOMING
        if now < start_time:
            status = "UPCOMING"

        # 🔹 ACTIVE
        elif start_time <= now <= end_time:
            status = "LIVE"

        # 🔹 EXPIRED (ONLY LAST 12 HOURS)
        elif twelve_hours_ago <= end_time < now:
            status = "EXPIRED"

        # ❌ Too old → skip
        else:
            continue

        sessions.append({
            "id": str(s.id),
            "dept": s.dept,
            "sem": s.sem,
            "subject": s.subject,
            "course_name": s.course_name,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "duration": s.duration_mins,
            "status": status,
        })

    return sessions



@router.post("/{session_id}/mark")
async def mark_attendance(session_id: str, payload: dict):
    print("\n[MARK ATTENDANCE] payload =", payload)

    # 1️⃣ Get session
    session = await SessionModel.get(session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    # 2️⃣ TIME — UTC ONLY ✅
    now = datetime.now(timezone.utc)

    start_time = session.start_time
    end_time = session.end_time

    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)
    if end_time.tzinfo is None:
        end_time = end_time.replace(tzinfo=timezone.utc)

    print("[TIME][UTC] now:", now)
    print("[TIME][UTC] start:", start_time)
    print("[TIME][UTC] end:", end_time)

    if now < start_time:
        raise HTTPException(400, "Session not started yet")

    if now > end_time:
        raise HTTPException(400, "Session expired")

    # 3️⃣ Extract payload
    student_id = payload.get("student_id")
    student_name = payload.get("student_name")
    confidence = float(payload.get("confidence", 0))

    if not student_id:
        raise HTTPException(400, "student_id missing")

    if confidence < 0.60:
        raise HTTPException(400, "Low confidence")

    # 4️⃣ Prevent duplicate attendance
    existing = await AttendanceLog.find_one({
        "session_id": session_id,
        "student_id": student_id
    })
    if existing:
        raise HTTPException(400, "Attendance already marked")

    # 5️⃣ Save attendance (store UTC)
    log = AttendanceLog(
        session_id=session_id,
        student_id=student_id,
        student_name=student_name,
        confidence=confidence,
        in_time=now,
        date=now.date(),
    )
    await log.insert()

    print("✅ Attendance marked successfully")

    return {
        "success": True,
        "message": "Attendance marked successfully",
        "student_id": student_id,
        "confidence": confidence,
    }
