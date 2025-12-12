#!/usr/bin/env bash
set -e

# load .env if exists
if [ -f "/app/.env" ]; then
  export $(cat /app/.env | sed 's/#.*//g' | xargs)
fi

echo "Waiting for MongoDB..."
python - <<PY
import os, time
from pymongo import MongoClient
uri = os.getenv("MONGODB_URI")
if not uri:
    print("MONGODB_URI not set"); exit(1)
for i in range(60):
    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=2000)
        client.admin.command('ping')
        print("Mongo up")
        break
    except Exception as e:
        print("Waiting for mongo...", e)
        time.sleep(1)
else:
    print("Mongo did not start in time"); exit(1)
PY

# Start uvicorn with workers
uvicorn app.main:app --host ${APP_HOST:-0.0.0.0} --port ${APP_PORT:-8000} --workers ${WORKERS:-2}
