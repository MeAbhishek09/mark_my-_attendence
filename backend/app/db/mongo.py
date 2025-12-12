# backend/app/db/mongo.py
import os
import motor.motor_asyncio
from beanie import init_beanie
from app.db.models_mongo import Student, FaceEmbedding, SessionModel

MONGO_URI = os.getenv(
    "MONGODB_URI",
    "mongodb://mongo_user:mongo_pass@mongo:27017/attendance_db?authSource=admin"
)

client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)

# prefer database from URI if present, otherwise fallback to "attendance_db"
db = client.get_default_database()
if db is None:
    db = client["attendance_db"]

async def init_db():
    """
    Call this at FastAPI startup to initialize Beanie with document models.
    """
    await init_beanie(database=db, document_models=[Student, FaceEmbedding, SessionModel])
