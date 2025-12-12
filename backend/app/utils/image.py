import numpy as np
import cv2
import os

def read_imagefile(file) -> np.ndarray:
    data = file.read()
    img_array = np.frombuffer(data, np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    return img

def save_crop_image(image_bgr: np.ndarray, bbox: tuple, out_path: str, resize_to: tuple = None):
    """
    Save a crop from image_bgr to out_path.
    bbox: (x1, y1, x2, y2)
    resize_to: (w, h) if you want to resize thumbnail (optional)
    """
    x1, y1, x2, y2 = bbox
    h, w = image_bgr.shape[:2]
    x1 = max(0, int(x1)); y1 = max(0, int(y1))
    x2 = min(w, int(x2)); y2 = min(h, int(y2))
    crop = image_bgr[y1:y2, x1:x2]
    if crop is None or crop.size == 0:
        return False
    if resize_to:
        crop = cv2.resize(crop, resize_to)
    # ensure directory exists
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    # write BGR image to disk
    cv2.imwrite(out_path, crop)
    return True
