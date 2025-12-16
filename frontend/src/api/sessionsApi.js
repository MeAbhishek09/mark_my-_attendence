import axios from "axios";

/* =========================
   API BASE URL
========================= */
const API_BASE =
  import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

/* =========================
   LIST ACTIVE SESSIONS
   GET /api/v1/sessions/
========================= */
export async function listSessions() {
  const res = await axios.get(`${API_BASE}/api/v1/sessions/`);
  return res.data;
}

/* =========================
   CREATE SESSION
   POST /api/v1/sessions/
========================= */
export async function createSession(payload) {
  /*
    payload must be:
    {
      dept: string,
      sem: string,
      subject: string,
      course_name: string,
      start_time: ISO string,
      duration: number (minutes)
    }
  */

  const res = await axios.post(
    `${API_BASE}/api/v1/sessions/`,
    {
      dept: payload.dept,
      sem: payload.sem,
      subject: payload.subject,
      course_name: payload.course_name,
      start_time: payload.start_time,
      duration: payload.duration,
    }
  );

  return res.data;
}

/* =========================
   MARK ATTENDANCE
   POST /api/v1/sessions/{id}/mark
========================= */
export async function markSessionAttendance(sessionId, payload) {
  /*
    payload:
    {
      student_id: string,
      student_name: string,
      confidence: number
    }
  */

  const res = await axios.post(
    `${API_BASE}/api/v1/sessions/${sessionId}/mark`,
    payload
  );

  return res.data;
}
