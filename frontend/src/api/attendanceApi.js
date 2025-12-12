import axios from "axios";
const BASE = "http://127.0.0.1:8000/api/v1";

// Export attendance CSV (returns Blob)
export async function exportAttendance(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  const res = await axios.get(`${BASE}/attendance/export?${params}`, {
    responseType: "blob",
    timeout: 60000,
  });
  return res.data; // Blob
}

// Quick preview of today's attendance (fallback)
export async function attendanceToday() {
  const res = await axios.get(`${BASE}/attendance/today`);
  return res.data;
}
