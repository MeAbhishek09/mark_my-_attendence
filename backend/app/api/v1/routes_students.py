# backend/app/api/v1/routes_students.py
from fastapi import APIRouter, Body, UploadFile, File, HTTPException
from app.db.models_mongo import Student, FaceEmbedding
import numpy as np
from typing import Optional
from app.utils.image import read_imagefile, save_crop_image  # reuse your helpers
import io
import base64

router = APIRouter()

@router.post("/students/")
async def create_student(payload: dict = Body(...)):
    # payload: roll_no, name, exam_no, dept, sem, class_name
    if not payload.get("roll_no") or not payload.get("name"):
        raise HTTPException(status_code=400, detail="roll_no and name required")
    # unique roll_no enforced by Beanie/DB
    existing = await Student.find_one({"roll_no": payload["roll_no"]})
    if existing:
        raise HTTPException(status_code=400, detail="student exists")
    st = Student(**payload)
    await st.insert()
    return {"id": str(st.id), "roll_no": st.roll_no, "name": st.name}

@router.post("/enroll/")
async def enroll(student_id: Optional[str] = None, name: Optional[str] = None, file: UploadFile = File(...)):
    """
    Enroll endpoint: POST /enroll/?student_id=...&name=...
    Saves image to disk (optional) and saves embedding (bytes) with link to Student.
    """
    # read image file into numpy
    img = read_imagefile(file.file)
    if img is None:
        raise HTTPException(status_code=400, detail="invalid image")

    # compute embedding in thread (your face_engine)
    from app.services.face_engine import get_faces_and_embeddings  # import here to avoid startup heavy imports
    import asyncio
    faces = await asyncio.to_thread(get_faces_and_embeddings, img)
    if len(faces) == 0:
        raise HTTPException(status_code=400, detail="no face found in image")

    # take first face's embedding
    emb = faces[0]["embedding"].astype(np.float32)
    emb_bytes = emb.tobytes()

    # link student if provided
    student_link = None
    if student_id:
        student = await Student.get(student_id)
        if student:
            student_link = student

    fe = FaceEmbedding(student=student_link, embedding=emb_bytes)
    await fe.insert()

    # optional: save crop image
    try:
        x1, y1, x2, y2 = faces[0]["bbox"]
        ts = int(time.time() * 1000)
        save_crop_image(img, (int(x1), int(y1), int(x2), int(y2)), f"unknown_faces/enrolled_{ts}.jpg")
    except Exception:
        pass

    return {"success": True, "face_count": len(faces), "embedding_saved": True}
