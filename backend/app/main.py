# backend/app/main.py
import traceback
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# import FastAPI routers (these modules should import DB lazily or use Beanie)
from app.api.v1 import (
    routes_enroll,
    routes_recognize,
    routes_students,
    routes_attendance,
    routes_unknowns,
    routes_sessions,
    routes_attendance_export,
)

# Beanie/Mongo init
from app.db.mongo import init_db

app = FastAPI(title="Student Face Attendance")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # in prod restrict to your frontend origin(s)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers (prefixes already set as you prefer)
app.include_router(routes_sessions.router, prefix="/api/v1/sessions", tags=["sessions"])
app.include_router(routes_attendance_export.router, prefix="/api/v1/attendance", tags=["attendance_export"])
app.include_router(routes_enroll.router, prefix="/api/v1/enroll", tags=["Enroll"])
app.include_router(routes_recognize.router, prefix="/api/v1/recognize", tags=["Recognize"])
app.include_router(routes_students.router, prefix="/api/v1/students", tags=["Students"])
app.include_router(routes_attendance.router, prefix="/api/v1/attendance", tags=["Attendance"])
app.include_router(routes_unknowns.router, prefix="/api/v1/unknowns", tags=["Unknowns"])


@app.get("/", tags=["root"])
async def root():
    return {"message": "Face Attendance Backend Running"}


# --- Startup: initialize mongo/beanie ---
@app.on_event("startup")
async def on_startup():
    try:
        # Initialize Beanie (registers document models)
        await init_db()
        print("Mongo / Beanie initialized.")
    except Exception:
        traceback.print_exc()
        print("Warning: failed to initialize Mongo/Beanie on startup.")
