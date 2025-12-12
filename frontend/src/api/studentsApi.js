import axios from "axios";

const BASE = "http://127.0.0.1:8000/api/v1";

export async function createStudent({ roll_no, name, class_name, exam_no, dept, sem }) {
  const payload = { roll_no, name, class_name };
  const res = await axios.post(`${BASE}/students/`, payload);
  return res.data; // { id, roll_no, name }
}

// Enroll a single image for a student using your existing enroll endpoint.
// fileBlob is a Blob or File object
export async function enrollImage(student_id, name, fileBlob) {
  const form = new FormData();
  form.append("file", fileBlob, "capture.jpg");
  const url = `${BASE}/enroll/?student_id=${encodeURIComponent(student_id)}&name=${encodeURIComponent(name)}`;
  const res = await axios.post(url, form, { headers: { "Content-Type": "multipart/form-data" }, timeout: 20000 });
  return res.data;
}
