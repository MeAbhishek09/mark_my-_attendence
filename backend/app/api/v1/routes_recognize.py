from typing import Optional
from fastapi import APIRouter, UploadFile, File
from app.utils.image import read_imagefile, save_crop_image
from app.services.face_engine import get_faces_and_embeddings, match_embedding
from app.db.models_mongo import FaceEmbedding, Student
import numpy as np
import os
import time

router = APIRouter()

UNKNOWN_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../../../unknown_faces")
)
os.makedirs(UNKNOWN_DIR, exist_ok=True)


@router.post("/")
async def recognize(
    file: UploadFile = File(...),
    session_id: Optional[str] = None,
):
    print("[RECOGNIZE] session_id =", session_id)

    img = read_imagefile(file.file)
    if img is None:
        return {"faces": []}

    faces = get_faces_and_embeddings(img)

    # ✅ LOAD EMBEDDINGS USING BEANIE
    enrolled = []

    async for emb_doc in FaceEmbedding.find_all():
        try:
            emb = np.frombuffer(emb_doc.embedding, dtype=np.float32)
        except Exception:
            continue

        # ✅ THIS LINE GOES HERE (ONLY ONCE)
        student = await Student.get(emb_doc.student_id)

        if student:
            enrolled.append({
                "student_id": str(student.id),
                "name": student.name,
                "embedding": emb,
            })

    results = []

    for idx, f in enumerate(faces):
        emb = f["embedding"].astype(np.float32)
        match = match_embedding(emb, enrolled, threshold=0.60)

        print(
            f"[RECOGNIZE] recognized={match['recognized']} "
            f"student_id={match['student_id']} "
            f"score={match['score']:.4f}"
        )

        results.append({
            "bbox": f["bbox"],
            "match": match,
        })

        # save unknown face
        if not match["recognized"]:
            try:
                x1, y1, x2, y2 = f["bbox"]
                h, w = img.shape[:2]
                x1, y1 = max(0, int(x1)), max(0, int(y1))
                x2, y2 = min(w, int(x2)), min(h, int(y2))
                ts = int(time.time() * 1000)
                filename = f"unknown_{ts}_{idx}.jpg"
                save_crop_image(
                    img,
                    (x1, y1, x2, y2),
                    os.path.join(UNKNOWN_DIR, filename),
                )
            except Exception as e:
                print("save unknown crop error:", e)

    return {"faces": results}
