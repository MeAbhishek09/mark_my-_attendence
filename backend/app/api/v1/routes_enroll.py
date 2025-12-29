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

MAX_FAILURES = 5


# =========================
# FAILURE HANDLER
# =========================
async def register_failure(student: Student, msg: str):
    student.enroll_failures += 1
    await student.save()

    if student.enroll_failures >= MAX_FAILURES:
        # delete embeddings
        await FaceEmbedding.find(
            {"student_id": str(student.id)}
        ).delete()

        # delete student
        await student.delete()

        raise HTTPException(
            status_code=400,
            detail="ENROLLMENT_FAILED_STUDENT_REMOVED",
        )

    raise HTTPException(400, msg)


@router.post("/", summary="Enroll an image for an existing student")
async def enroll(
    student_id: str = Form(...),
    name: str = Form(...),
    file: UploadFile = File(...),
):
    # ---------- validate student ----------
    try:
        doc_id = PydanticObjectId(student_id)
    except Exception:
        raise HTTPException(400, "Invalid student_id")

    student = await Student.get(doc_id)
    if not student:
        raise HTTPException(404, "Student not found")

    # ---------- validate file ----------
    if not file or not file.content_type.startswith("image/"):
        await register_failure(student, "Invalid image file")

    contents = await file.read()
    if not contents:
        await register_failure(student, "Empty image")

    # ---------- read image ----------
    try:
        img = read_imagefile(io.BytesIO(contents))
    except Exception:
        await register_failure(student, "Image read failed")

    # ---------- face detection ----------
    try:
        faces = await asyncio.to_thread(get_faces_and_embeddings, img)
    except Exception:
        await register_failure(student, "Face engine failed")

    if not faces:
        await register_failure(student, "No face detected")

    # ---------- SUCCESS PATH ----------
    emb = faces[0]["embedding"].astype(np.float32)

    emb_doc = FaceEmbedding(
        student_id=str(student.id),
        embedding=emb.tobytes(),
        created_at=datetime.utcnow(),
    )
    await emb_doc.insert()

    student.enrolled_images += 1
    await student.save()

    return {
        "success": True,
        "status": "trained",
        "student_id": str(student.id),
        "faces_detected": len(faces),
        "enrolled_images": student.enrolled_images,
        "bbox": faces[0].get("bbox"),
    }


@router.post("/finalize/{student_id}", summary="Finalize enrollment")
async def finalize_enrollment(student_id: str):
    try:
        doc_id = PydanticObjectId(student_id)
    except Exception:
        raise HTTPException(400, "Invalid student_id")

    student = await Student.get(doc_id)
    if not student:
        raise HTTPException(404, "Student not found")

    # ❌ No images → delete student
    if student.enrolled_images == 0:
        await student.delete()
        raise HTTPException(400, "No images enrolled")

    # ✅ COMMIT
    student.enroll_status = "COMPLETED"
    await student.save()

    return {
        "success": True,
        "student_id": str(student.id),
        "enrolled_images": student.enrolled_images,
    }
