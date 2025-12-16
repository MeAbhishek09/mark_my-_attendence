// frontend/src/api/studentsApi.js
import axios from "axios";
const BASE_URL = "http://127.0.0.1:8000";

export async function createStudent(payload) {
  // payload must already have numeric roll_no, exam_no, sem
  const res = await axios.post(`${BASE_URL}/api/v1/students/`, payload);
  return res.data;
}

export async function enrollImage(studentId, studentName, fileBlob) {
  const form = new FormData();
  form.append("student_id", studentId);
  form.append("name", studentName);
  // form.append("student_name", studentName);
  form.append("file", fileBlob, "capture.jpg");
  const res = await axios.post(`${BASE_URL}/api/v1/enroll/`, form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000,
  });
  return res.data;
}
