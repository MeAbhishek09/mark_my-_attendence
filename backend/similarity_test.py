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

a = emb_from_path(r"C:/Users/91991/Downloads/abhishek1.png")
b = emb_from_path(r"C:/Users/91991/Downloads/Abhishek_prof.jpg")
print("cosine similarity:", cosine_similarity(a, b))
