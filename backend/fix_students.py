# backend/fix_students_mongo.py
import os
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime

# Replace this with your Atlas URI or set MONGODB_URI env var
MONGODB_URI = os.environ.get("MONGODB_URI") or "mongodb+srv://abhishek1322005_db_user:oNma9fWP3rv9RMjr@attendance-cluster.v8oxtfe.mongodb.net/attendance_db?retryWrites=true&w=majority"
DB_NAME = os.environ.get("MONGODB_DB") or None  # if None, client.get_default_database() is used

client = MongoClient(MONGODB_URI)
db = client.get_default_database() if DB_NAME is None else client[DB_NAME]
col = db["students"]

def safe_int(v, default=None):
    if v is None:
        return default
    if isinstance(v, int):
        return v
    try:
        # strip whitespace, handle empty string
        if isinstance(v, str):
            s = v.strip()
            if s == "":
                return default
            return int(s)
        return int(v)
    except Exception:
        return default

def main():
    total = col.count_documents({})
    print(f"Found {total} student documents. Processing...")

    updated = 0
    for doc in col.find({}):
        doc_id = doc["_id"]
        update = {}
        # roll_no: convert to int if possible, keep original otherwise
        rn = safe_int(doc.get("roll_no"), default=None)
        if rn is not None:
            if doc.get("roll_no") != rn:
                update["roll_no"] = rn
        else:
            # If we cannot parse roll_no, leave as-is but print warning
            if "roll_no" not in doc or doc.get("roll_no") in [None, ""]:
                # set placeholder roll_no based on _id timestamp to avoid missing field
                placeholder = int(str(doc_id)[-6:], 16) % 1000000
                update["roll_no"] = placeholder
                print(f"[WARN] doc {doc_id}: roll_no missing/invalid. Setting placeholder {placeholder}")

        # exam_no: set to int (or 0 if empty)
        ex = safe_int(doc.get("exam_no"), default=0)
        if ex is None:
            ex = 0
        if doc.get("exam_no") != ex:
            update["exam_no"] = ex

        # sem: ensure integer 1..10, default to 1
        sem = safe_int(doc.get("sem"), default=1)
        if sem is None:
            sem = 1
        if sem < 1:
            sem = 1
        if sem > 10:
            sem = 10
        if doc.get("sem") != sem:
            update["sem"] = sem

        # course_name (required): fill from class_name if present, else empty string
        course_name = doc.get("course_name")
        if not course_name:
            if doc.get("class_name"):
                update["course_name"] = str(doc.get("class_name"))
                print(f"[INFO] doc {doc_id}: filled course_name from class_name")
            else:
                update["course_name"] = ""
                print(f"[WARN] doc {doc_id}: course_name missing -> set to empty string")

        # name: ensure exists
        if not doc.get("name"):
            update["name"] = f"student_{str(doc_id)}"
            print(f"[WARN] doc {doc_id}: name missing -> set placeholder")

        # dept: ensure exists (default "")
        if "dept" not in doc or doc.get("dept") is None:
            update["dept"] = ""

        # created_at: ensure present
        if "created_at" not in doc or doc.get("created_at") is None:
            update["created_at"] = datetime.utcnow()

        if update:
            col.update_one({"_id": doc_id}, {"$set": update})
            updated += 1

    print(f"Done. Documents updated: {updated}")

if __name__ == "__main__":
    main()
