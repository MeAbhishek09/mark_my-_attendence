# backend/app/api/v1/routes_recognize.py
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Depends
from app.utils.image import read_imagefile, save_crop_image
from app.services.face_engine import get_faces_and_embeddings, match_embedding
from app.db.session import SessionLocal

from app.db import models_mongo
from app.services.attendance_service_mongo import mark_attendance
import numpy as np
import os
import time

router = APIRouter()

# unknown_faces folder in backend root: backend/unknown_faces
UNKNOWN_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../unknown_faces"))
os.makedirs(UNKNOWN_DIR, exist_ok=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/")
async def recognize(file: UploadFile = File(...), db = Depends(get_db), session_id: Optional[int] = None):
    """
    Recognize faces in uploaded image.

    Optional query param:
      - session_id: int -> if provided, mark_attendance will record session-aware attendance.

    Response:
      {"faces": [{"bbox": [x1,y1,x2,y2], "match": {"recognized":bool, "student_id":..., "name":..., "score":...}}, ...]}
    """
    # read image (OpenCV BGR numpy array)
    img = read_imagefile(file.file)
    if img is None:
        return {"faces": []}

    faces = get_faces_and_embeddings(img)

    # load all enrolled embeddings from DB
    enrolled = []
    rows = db.query(models_mongo.FaceEmbedding).all()
    for r in rows:
        try:
            emb = np.frombuffer(r.embedding, dtype=np.float32)
        except Exception:
            # skip malformed embedding row
            continue
        student = db.query(models_mongo.Student).filter(models_mongo.Student.id == r.student_id).first()
        if student:
            enrolled.append({"student_id": student.id, "name": student.name, "embedding": emb})

    results = []
    for idx, f in enumerate(faces):
        emb = f["embedding"].astype(np.float32)
        match = match_embedding(emb, enrolled, threshold=0.60)
        results.append({"bbox": f["bbox"], "match": match})

        if match.get("recognized"):
            # recognized -> mark attendance (debounced & session-aware inside service)
            try:
                mark_attendance(match["student_id"], float(match["score"]), session_id=session_id)
            except Exception as e:
                # don't fail the whole request if marking fails; just log to console
                print("mark_attendance error:", e)
        else:
            # unknown face -> save thumbnail for manual review
            try:
                x1, y1, x2, y2 = f["bbox"]
                h, w = img.shape[:2]
                x1 = max(0, int(x1)); y1 = max(0, int(y1))
                x2 = min(w, int(x2)); y2 = min(h, int(y2))
                ts = int(time.time() * 1000)
                filename = f"unknown_{ts}_{idx}.jpg"
                filepath = os.path.join(UNKNOWN_DIR, filename)
                save_crop_image(img, (x1, y1, x2, y2), filepath)
            except Exception as e:
                print("save unknown crop error:", e)
    return {"faces": results}
