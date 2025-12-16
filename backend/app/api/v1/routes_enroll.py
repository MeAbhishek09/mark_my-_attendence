# backend/app/api/v1/routes_enroll.py
import io
import asyncio
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from beanie import PydanticObjectId
import numpy as np
from app.utils.image import read_imagefile
from app.services.face_engine import get_faces_and_embeddings
from app.db.models_mongo import Student, FaceEmbedding
from datetime import datetime

router = APIRouter()


@router.post("/", summary="Enroll an image for an existing student (multipart/form-data)")
async def enroll(
    student_id: str = Form(..., description="Student document id (ObjectId string)"),
    name: str = Form(..., description="Student name (for logging / verification)"),
    file: UploadFile = File(...),
):
    # Validate file present and is an image
    if not file:
        raise HTTPException(status_code=400, detail="file is required")
    if not (file.content_type and file.content_type.startswith("image/")):
        raise HTTPException(status_code=400, detail="uploaded file must be an image")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="uploaded image is empty")

    # Load image into OpenCV via your helper that expects a file-like object
    try:
        img = read_imagefile(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"failed to read image: {e}")

    # Run face detection / embedding in a thread (non-blocking for event loop)
    try:
        faces = await asyncio.to_thread(get_faces_and_embeddings, img)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"face engine error: {e}")

    if not faces:
        raise HTTPException(status_code=400, detail="No face detected in the image")
    

    # use the first face
    emb = faces[0]["embedding"].astype(np.float32)

    # find the student by document id (expect PydanticObjectId string)
    try:
        doc_id = PydanticObjectId(student_id)
    except Exception:
        raise HTTPException(status_code=400, detail="student_id must be a valid ObjectId string")

    student = await Student.get(doc_id)
    if not student:
        # Do NOT create student silently — require to call /students first
        raise HTTPException(status_code=404, detail="student not found. Create student using /api/v1/students/ before enrolling images.")
    
    print(f"[ENROLL] student={student.id} faces_detected={len(faces)}")
    # Optional: verify provided name matches record (log or warn)
    if name and student.name != name:
        # not fatal — but inform caller
        # you may choose to reject instead; for now we'll just include a warning in response
        warning = f"provided name '{name}' does not match stored name '{student.name}'"
    else:
        warning = None

    # Save embedding document (embedding bytes)
    emb_doc = FaceEmbedding(
        student_id=str(student.id),
        embedding=emb.tobytes(),
        image_url="",  # optionally fill if you store the original image
        created_at=datetime.utcnow(),
    )
    await emb_doc.insert()
    print(f"[ENROLL] embedding saved for student={student.id}")


    return {
        "status": "trained",
        "faces_detected": len(faces),
        "success": True,
        "msg": "enrolled",
        "student_id": str(student.id),
        "bbox": faces[0].get("bbox"),
        "warning": warning,
    }
