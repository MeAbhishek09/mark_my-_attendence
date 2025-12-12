# backend/app/api/v1/routes_students.py
from fastapi import APIRouter, Body, HTTPException, UploadFile, File, Form, Query
from typing import Optional, List, Dict, Any
from app.db.models_mongo import Student
from app.db import mongo as mongo_module   # raw mongo DB (expects app/db/mongo.py exposing `db`)
from datetime import datetime
# backend: add to backend/app/api/v1/routes_students.py (imports at top)
from bson import ObjectId
router = APIRouter()

def doc_to_dict(doc: Student) -> Dict[str, Any]:
    """
    Convert a Beanie Student document to JSON-serializable dict.
    Accepts a Student Document instance.
    """
    d = doc.dict()
    d["id"] = str(doc.id)
    ca = d.get("created_at")
    if isinstance(ca, datetime):
        d["created_at"] = ca.isoformat()
    else:
        d["created_at"] = ca
    return d

@router.post("/", summary="Create a student (all fields required)")
async def create_student(payload: dict = Body(...)):
    # Validate presence of all required fields
    required = ["roll_no", "name", "exam_no", "dept", "sem", "course_name"]
    for key in required:
        if key not in payload or payload.get(key) in [None, ""]:
            raise HTTPException(status_code=400, detail=f"{key} is required")

    # Convert numeric fields and validate
    try:
        roll_no = int(payload["roll_no"])
        exam_no = int(payload["exam_no"])
        sem = int(payload["sem"])
    except Exception:
        raise HTTPException(status_code=400, detail="roll_no, exam_no and sem must be integers")

    if sem < 1 or sem > 10:
        raise HTTPException(status_code=400, detail="sem must be between 1 and 10")

    # Uniqueness check (roll_no)
    existing = await Student.find_one({"roll_no": roll_no})
    if existing:
        raise HTTPException(status_code=400, detail="student with this roll_no already exists")

    # create Student (fields required by model)
    st = Student(
        roll_no=roll_no,
        name=str(payload["name"]).strip(),
        exam_no=exam_no,
        course_name=str(payload["course_name"]).strip(),
        dept=str(payload["dept"]).strip(),
        sem=sem
    )
    await st.insert()
    return doc_to_dict(st)


# --- Fault-tolerant students listing (raw Mongo, avoids Beanie parsing errors) ---
@router.get("/", summary="List students (supports q, dept, roll_no) - fault tolerant")
async def list_students(
    q: Optional[str] = Query(None, description="search text (name/roll/exam)"),
    dept: Optional[str] = Query(None),
    roll_no: Optional[str] = Query(None),
    limit: int = Query(200, ge=1, le=2000),
    skip: int = Query(0, ge=0),
):
    """
    Return students using a raw Mongo query to avoid Beanie parsing errors when DB
    contains documents that don't yet match the strict model.
    This is intended to be temporary while you run a backfill / cleanup.
    """
    filt: Dict[str, Any] = {}
    if roll_no is not None:
        # try numeric first, otherwise use string
        try:
            filt["roll_no"] = int(roll_no)
        except Exception:
            filt["roll_no"] = roll_no
    if dept:
        filt["dept"] = str(dept)

    if q:
        regex = {"$regex": q, "$options": "i"}
        filt["$or"] = [{"name": regex}, {"roll_no": regex}, {"exam_no": regex}]

    db = mongo_module.db  # expects motor or pymongo async DB instance
    cursor = db["students"].find(filt).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)

    out: List[Dict[str, Any]] = []
    for d in docs:
        ca = d.get("created_at")
        created_at = None
        if isinstance(ca, datetime):
            created_at = ca.isoformat()
        elif isinstance(ca, (int, float)):
            try:
                created_at = datetime.utcfromtimestamp(ca).isoformat()
            except Exception:
                created_at = str(ca)
        elif isinstance(ca, str):
            created_at = ca

        out.append({
            "id": str(d.get("_id")) if d.get("_id") else None,
            "roll_no": d.get("roll_no", ""),
            "exam_no": d.get("exam_no", ""),
            "name": d.get("name", ""),
            "dept": d.get("dept", ""),
            "sem": d.get("sem", ""),
            "course_name": d.get("course_name", "") or d.get("class_name", ""),
            "created_at": created_at,
        })
    return out


@router.post("/with-photo", summary="Create student with photo (form + file)")
async def create_student_with_photo(
    roll_no: str = Form(...),
    name: str = Form(...),
    exam_no: str = Form(...),
    dept: str = Form(...),
    sem: str = Form(...),
    course_name: str = Form(...),
    file: UploadFile = File(...),
):
    # basic validation (same rules as JSON endpoint)
    try:
        roll_no_i = int(roll_no)
        exam_no_i = int(exam_no)
        sem_i = int(sem)
    except Exception:
        raise HTTPException(status_code=400, detail="roll_no, exam_no and sem must be integers")

    if sem_i < 1 or sem_i > 10:
        raise HTTPException(status_code=400, detail="sem must be between 1 and 10")

    existing = await Student.find_one({"roll_no": roll_no_i})
    if existing:
        raise HTTPException(status_code=400, detail="student with this roll_no already exists")

    # validate file
    if not file:
        raise HTTPException(status_code=400, detail="file is required")
    if not (file.content_type and file.content_type.startswith("image/")):
        raise HTTPException(status_code=400, detail="uploaded file must be an image")
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="uploaded image is empty")

    st = Student(
        roll_no=roll_no_i,
        name=name.strip(),
        exam_no=exam_no_i,
        course_name=course_name.strip(),
        dept=dept.strip(),
        sem=sem_i,
    )
    await st.insert()

    # The actual image/enroll processing should be handled by your enroll pipeline.
    # You can call your enroll logic here or in a background task.

    return doc_to_dict(st)




@router.delete("/", summary="Bulk delete students by ids")
async def bulk_delete_students(payload: dict = Body(...)):
    """
    Accepts: { "ids": ["id1", "id2", ...] }
    Each id is expected to be a string student.id (ObjectId) created by Mongo/Beanie.
    Returns: {"deleted_count": N}
    """
    ids = payload.get("ids") or []
    if not isinstance(ids, list) or not ids:
        raise HTTPException(status_code=400, detail="ids must be a non-empty list")

    db = mongo_module.db
    obj_ids = []
    for s in ids:
        try:
            obj_ids.append(ObjectId(s))
        except Exception:
            # skip invalid ObjectId strings
            pass

    if not obj_ids:
        raise HTTPException(status_code=400, detail="no valid ObjectId in ids")

    res = await db["students"].delete_many({"_id": {"$in": obj_ids}})
    return {"deleted_count": int(res.deleted_count)}
