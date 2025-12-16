# similarity_test.py
import cv2
import numpy as np
from app.services.face_engine import get_faces_and_embeddings, cosine_similarity

def emb_from_path(path):
    img = cv2.imread(path)
    faces = get_faces_and_embeddings(img)
    if not faces:
        raise ValueError("No face found in " + path)
    return faces[0]["embedding"]

a = emb_from_path(r"C:/Users/91991/OneDrive/Pictures/Camera Roll 1/WIN_20251213_00_26_23_Pro.jpg")
b = emb_from_path(r"C:/Users/91991/OneDrive/Pictures/Camera Roll 1/WIN_20251213_00_26_17_Pro.jpg")
print("cosine similarity:", cosine_similarity(a, b))
