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
# FRONTEND_ORIGINS = [
#     "http://localhost:5173",
#     "http://127.0.0.1:5173",
# ]


origins_env = os.getenv("BACKEND_CORS_ORIGINS")

origins = (
    [o.strip() for o in origins_env.split(",") if o.strip()]
    if origins_env
    else ["http://localhost:5173"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
# app.include_router(routes_unknowns.router, prefix="/api/v1/unknowns", tags=["unknowns"])


@app.get("/", tags=["root"])
async def root():
    return {"message": "Face Attendance Backend Running"}



@app.on_event("startup")
async def on_startup():
    try:
        await init_db()
        print("✅ Mongo / Beanie initialized.")
    except Exception as e:
        traceback.print_exc()
        print("❌ Mongo init failed")
        raise RuntimeError("Database initialization failed") from e
