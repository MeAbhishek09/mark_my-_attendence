from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from fastapi.responses import FileResponse, JSONResponse
from app.db.session import SessionLocal
from app.db import models_mongo
from app.services.face_engine import get_faces_and_embeddings
import os
import numpy as np

router = APIRouter()

# unknown_faces folder (backend/unknown_faces)
UNKNOWN_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "unknown_faces"))
os.makedirs(UNKNOWN_DIR, exist_ok=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def list_unknowns():
    """
    Returns a list of unknown thumbnails (filenames).
    """
    files = []
    for fname in sorted(os.listdir(UNKNOWN_DIR), reverse=True):
        if fname.lower().endswith((".jpg", ".jpeg", ".png")):
            files.append({"filename": fname, "url": f"/api/v1/unknowns/{fname}"})
    return files

@router.get("/{filename}")
def serve_unknown(filename: str):
    """
    Serves the image file.
    """
    safe_name = os.path.basename(filename)
    path = os.path.join(UNKNOWN_DIR, safe_name)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path, media_type="image/jpeg")

@router.post("/assign")
def assign_unknown_to_student(filename: str = Form(...), student_id: int = Form(...), db = Depends(get_db)):
    """
    Assign unknown thumbnail to an existing student.
    This will extract embedding from the image and save it in FaceEmbedding linked to student.
    """
    safe_name = os.path.basename(filename)
    path = os.path.join(UNKNOWN_DIR, safe_name)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="File not found")

    # read image via OpenCV using face_engine
    import cv2
    img = cv2.imread(path)
    if img is None:
        raise HTTPException(status_code=400, detail="Failed to read image")

    faces = get_faces_and_embeddings(img)
    if not faces:
        raise HTTPException(status_code=400, detail="No face detected in image")

    emb = faces[0]["embedding"].astype(np.float32)

    # check student exists
    student = db.query(models_mongo.Student).filter(models_mongo.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # save embedding
    emb_row = models_mongo.FaceEmbedding(student_id=student.id, embedding=emb.tobytes())
    db.add(emb_row)
    db.commit()
    db.refresh(emb_row)

    # Optionally, remove the unknown file after assignment
    try:
        os.remove(path)
    except Exception:
        pass

    return {"success": True, "message": "Assigned embedding to student", "student_id": student.id}

@router.delete("/{filename}")
def delete_unknown(filename: str):
    """
    Delete an unknown thumbnail.
    """
    safe_name = os.path.basename(filename)
    path = os.path.join(UNKNOWN_DIR, safe_name)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="File not found")
    os.remove(path)
    return JSONResponse({"success": True, "deleted": safe_name})
