import axios from "axios";
const BASE = "http://127.0.0.1:8000/api/v1";

export async function startSession({ dept, sem, subject, teacher }) {
  const res = await axios.post(`${BASE}/sessions/start`, { dept, sem, subject, teacher });
  return res.data; // { session_id, started_at }
}

export async function stopSession(session_id) {
  const res = await axios.post(`${BASE}/sessions/${session_id}/stop`);
  return res.data;
}

export async function sessionSummary(session_id) {
  const res = await axios.get(`${BASE}/sessions/${session_id}/summary`);
  return res.data;
}

export async function exportAttendance(filters = {}) {
  // returns a CSV download URL or CSV blob
  const params = new URLSearchParams(filters).toString();
  const res = await axios.get(`${BASE}/attendance/export?${params}`, { responseType: "blob" });
  return res.data; // blob
}
