import axios from "axios";

const BASE = "http://127.0.0.1:8000/api/v1/unknowns";

export async function fetchUnknowns() {
  const res = await axios.get(BASE + "/");
  return res.data;
}

export function unknownUrl(filename) {
  return `${BASE}/${encodeURIComponent(filename)}`;
}

export async function assignUnknown(filename, student_id) {
  const form = new FormData();
  form.append("filename", filename);
  form.append("student_id", student_id);
  const res = await axios.post(BASE + "/assign", form);
  return res.data;
}

export async function deleteUnknown(filename) {
  const res = await axios.delete(BASE + `/${encodeURIComponent(filename)}`);
  return res.data;
}
