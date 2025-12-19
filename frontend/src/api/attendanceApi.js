import axios from "axios";

// const BASE = "http://127.0.0.1:8000/api/v1";
const BASE = `${import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000"}/api/v1`;


export async function exportAttendance(filters = {}, range = "today") {
  const params = new URLSearchParams({ ...filters, range }).toString();

  const res = await axios.get(
    `${BASE}/attendance/export?${params}`,
    { responseType: "blob" }
  );

  return res.data;
}


export async function attendanceToday(range = "today") {
  const res = await axios.get(`${BASE}/attendance/preview`, {
    params: { range },
  });
  return res.data;
}
