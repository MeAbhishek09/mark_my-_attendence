# backend/app/main.py
import traceback
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv()
# routers
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

# DEV: allow local frontend origin + allow all for quick testing.
FRONTEND_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# In dev you can add "*" temporarily, but in prod set exact origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# include routers
app.include_router(routes_sessions.router, prefix="/api/v1/sessions", tags=["sessions"])
app.include_router(routes_attendance_export.router, prefix="/api/v1/attendance", tags=["attendance_export"])
app.include_router(routes_enroll.router, prefix="/api/v1/enroll", tags=["enroll"])
app.include_router(routes_recognize.router, prefix="/api/v1/recognize", tags=["recognize"])
app.include_router(routes_students.router, prefix="/api/v1/students", tags=["students"])
app.include_router(routes_attendance.router, prefix="/api/v1/attendance", tags=["attendance"])
app.include_router(routes_unknowns.router, prefix="/api/v1/unknowns", tags=["unknowns"])


@app.get("/", tags=["root"])
async def root():
    return {"message": "Face Attendance Backend Running"}


@app.on_event("startup")
async def on_startup():
    try:
        # initialize Mongo/Beanie
        await init_db()
        print("Mongo / Beanie initialized.")
    except Exception:
        traceback.print_exc()
        print("Warning: failed to initialize Mongo/Beanie on startup.")
