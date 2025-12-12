# backend/test_mongo.py
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test():
    uri = os.getenv("MONGODB_URI", "mongodb://mongo_user:mongo_pass@localhost:27017/attendance_db?authSource=admin")
    print("Using MONGODB_URI:", uri)
    client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=3000)
    try:
        res = await client.admin.command("ping")
        print("Mongo ping OK:", res)
    except Exception as e:
        print("Mongo connection FAILED:", repr(e))

if __name__ == "__main__":
    asyncio.run(test())
