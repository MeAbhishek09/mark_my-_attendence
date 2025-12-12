from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from app.utils.image import read_imagefile
from app.services.face_engine import get_faces_and_embeddings
from app.db.session import SessionLocal
from app.db import models_mongo
import numpy as np

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/")
async def enroll(student_id: int, name: str, file: UploadFile = File(...), db = Depends(get_db)):
    img = read_imagefile(file.file)
    faces = get_faces_and_embeddings(img)
    if not faces:
        raise HTTPException(status_code=400, detail="No face detected")
    emb = faces[0]["embedding"].astype(np.float32)

    # create student if not exists
    student = db.query(models_mongo.Student).filter_by(id=student_id).first()
    if not student:
        student = models_mongo.Student(id=student_id, roll_no=str(student_id), name=name)
        db.add(student)
        db.commit()
        db.refresh(student)

    # save embedding
    emb_row = models_mongo.FaceEmbedding(student_id=student.id, embedding=emb.tobytes())
    db.add(emb_row)
    db.commit()
    db.refresh(emb_row)

    return {"success": True, "msg": "enrolled", "bbox": faces[0]["bbox"]}
