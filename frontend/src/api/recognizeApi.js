import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/v1/recognize/";

/**
 * Send a frame to the backend recognition endpoint.
 * Returns the parsed JSON (same as backend).
 */
export async function recognizeFace(imageBlob) {
  const formData = new FormData();
  formData.append("file", imageBlob, "frame.jpg");

  try {
    const response = await axios.post(API_URL, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    console.error("Recognition error:", error);
    return null;
  }
}

/**
 * Lightweight detection helper.
 * Re-uses the same endpoint but only returns `true` if at least one face was detected.
 * This is intentionally simple so you don't need a backend change.
 */
export async function detectFace(imageBlob) {
  const res = await recognizeFace(imageBlob);
  if (!res) return false;
  if (!res.faces) return false;
  return res.faces.length > 0;
}
