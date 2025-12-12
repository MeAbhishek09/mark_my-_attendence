import insightface
import numpy as np
import cv2
from numpy.linalg import norm

face_app = insightface.app.FaceAnalysis(
    providers=['CUDAExecutionProvider', 'CPUExecutionProvider']
)
face_app.prepare(ctx_id=0, det_size=(640, 640))  # GPU if available, else CPU

def get_faces_and_embeddings(image_bgr):
    faces = face_app.get(image_bgr)
    results = []
    for f in faces:
        emb = f.normed_embedding
        bbox = f.bbox.astype(int).tolist()
        results.append({"bbox": bbox, "embedding": emb})
    return results

def cosine_similarity(a, b):
    return float(np.dot(a, b) / (norm(a) * norm(b) + 1e-8))

def match_embedding(query_emb, enrolled_list, threshold=0.45):
    best_score = -1
    best_person = None

    for p in enrolled_list:
        score = cosine_similarity(query_emb, p["embedding"])
        if score > best_score:
            best_score = score
            best_person = p

    if best_person and best_score >= threshold:
        return {
            "recognized": True,
            "student_id": best_person["student_id"],
            "name": best_person["name"],
            "score": best_score
        }
    return {
        "recognized": False,
        "score": best_score
    }
