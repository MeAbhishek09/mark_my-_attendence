# backend/app/db/mongo.py
import os
import motor.motor_asyncio
from beanie import init_beanie
from app.db.models_mongo import Student, FaceEmbedding, SessionModel

MONGO_URI = os.getenv("MONGODB_URI")
if not MONGO_URI:
    raise RuntimeError("MONGODB_URI not set in environment")

client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = client.get_default_database()
if db is None:
    db = client["attendance_db"]

async def init_db():
    await init_beanie(database=db, document_models=[Student, FaceEmbedding, SessionModel])
