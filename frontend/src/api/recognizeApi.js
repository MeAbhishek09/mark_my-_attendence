// frontend/src/api/recognizeApi.js
import axios from "axios";
const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export async function recognizeFace(imageBlob, opts = {}) {
  const fd = new FormData();
  fd.append("file", imageBlob, "frame.jpg");
  if (opts.session_id) fd.append("session_id", opts.session_id);

  const res = await axios.post(
    `${API_BASE}/api/v1/recognize/`,
    fd,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
}

