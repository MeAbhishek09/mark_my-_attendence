# import insightface
# import numpy as np
# import cv2
# from numpy.linalg import norm


# face_app = insightface.app.FaceAnalysis(
#     providers=['CUDAExecutionProvider', 'CPUExecutionProvider']
# )

# face_app.prepare(ctx_id=0, det_size=(640, 640))  # GPU if available, else CPU

# def get_faces_and_embeddings(image_bgr):
#     faces = face_app.get(image_bgr)
#     results = []
#     for f in faces:
#         emb = f.normed_embedding
#         bbox = f.bbox.astype(int).tolist()
#         results.append({"bbox": bbox, "embedding": emb})
#     return results

# def cosine_similarity(a, b):
#     return float(np.dot(a, b) / (norm(a) * norm(b) + 1e-8))

# def match_embedding(query_emb, enrolled, threshold=0.60):
#     """
#     Always returns a dict with the BEST similarity score,
#     even if below threshold.
#     """
#     if not enrolled:
#         return {
#             "recognized": False,
#             "student_id": None,
#             "name": None,
#             "score": 0.0,
#         }

#     best_score = -1.0
#     best_student = None

#     for e in enrolled:
#         score = cosine_similarity(query_emb, e["embedding"])
#         if score > best_score:
#             best_score = score
#             best_student = e

#     if best_score >= threshold:
#         return {
#             "recognized": True,
#             "student_id": best_student["student_id"],
#             "name": best_student["name"],
#             "score": float(best_score),
#         }
#     else:
#         return {
#             "recognized": False,
#             "student_id": best_student["student_id"],
#             "name": best_student["name"],
#             "score": float(best_score),
#         }


import insightface
import numpy as np
from numpy.linalg import norm

# 🔒 Global variable (initially empty)
face_app = None


def get_face_app():
    """
    Lazy-load InsightFace model.
    Loads ONLY on first request to reduce startup memory spike.
    """
    global face_app
    if face_app is None:
        face_app = insightface.app.FaceAnalysis(
            name="buffalo_s",                 # ✅ smaller model
            providers=["CPUExecutionProvider"] # ✅ CPU only
        )
        face_app.prepare(
            ctx_id=-1,                        # ✅ CPU (IMPORTANT)
            det_size=(640, 640)
        )
    return face_app


def get_faces_and_embeddings(image_bgr):
    app = get_face_app()
    faces = app.get(image_bgr)

    results = []
    for f in faces:
        emb = f.normed_embedding
        bbox = f.bbox.astype(int).tolist()
        results.append({
            "bbox": bbox,
            "embedding": emb
        })

    return results


def cosine_similarity(a, b):
    return float(np.dot(a, b) / (norm(a) * norm(b) + 1e-8))


def match_embedding(query_emb, enrolled, threshold=0.55):
    """
    Threshold tuned for buffalo_s.
    Always returns best match.
    """
    if not enrolled:
        return {
            "recognized": False,
            "student_id": None,
            "name": None,
            "score": 0.0,
        }

    best_score = -1.0
    best_student = None

    for e in enrolled:
        score = cosine_similarity(query_emb, e["embedding"])
        if score > best_score:
            best_score = score
            best_student = e

    if best_score >= threshold:
        return {
            "recognized": True,
            "student_id": best_student["student_id"],
            "name": best_student["name"],
            "score": float(best_score),
        }
    else:
        return {
            "recognized": False,
            "student_id": best_student["student_id"],
            "name": best_student["name"],
            "score": float(best_score),
        }