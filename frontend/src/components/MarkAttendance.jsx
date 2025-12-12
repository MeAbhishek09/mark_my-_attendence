import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { recognizeFace, detectFace } from "../api/recognizeApi";
import { startSession, stopSession, sessionSummary } from "../api/sessionsApi";
import { fetchDepartments, fetchSubjects } from "../api/catalogApi";

const CAPTURE_INTERVAL_MS = 1500;

export default function MarkAttendance() {
  const webcamRef = useRef(null);
  const intervalRef = useRef(null);

  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [dept, setDept] = useState("");
  const [sem, setSem] = useState("");
  const [subject, setSubject] = useState("");

  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState("idle");
  const [present, setPresent] = useState([]);
  const [startedAt, setStartedAt] = useState(null);

  useEffect(() => {
    async function loadDeps() {
      const d = await fetchDepartments();
      setDepartments(d);
    }
    loadDeps();
  }, []);

  useEffect(() => {
    if (!dept || !sem) {
      setSubjects([]);
      return;
    }
    async function loadSubjects() {
      const s = await fetchSubjects(dept, sem);
      setSubjects(s);
    }
    loadSubjects();
  }, [dept, sem]);

  const dataURLtoBlob = (dataurl) => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    const u8arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
    return new Blob([u8arr], { type: mime });
  };

  const start = async () => {
    if (!dept || !sem || !subject) {
      alert("Please select Department, Semester and Subject");
      return;
    }

    setStatus("Starting session...");
    try {
      const res = await startSession({ dept, sem, subject, teacher: "Teacher" });
      setSessionId(res.session_id);
      setStartedAt(res.started_at || new Date().toISOString());
      setStatus("Running");
      setPresent([]);

      intervalRef.current = setInterval(() => captureAndRecognize(res.session_id), CAPTURE_INTERVAL_MS);
    } catch (err) {
      console.error(err);
      setStatus("Failed to start");
      alert("Failed to start session: " + (err?.response?.data?.detail || err?.message));
    }
  };

  const stop = async () => {
    if (!sessionId) return;
    clearInterval(intervalRef.current);
    setStatus("Stopping...");
    try {
      await stopSession(sessionId);
      const summ = await sessionSummary(sessionId);
      setPresent(summ.present || present);
      setStatus("Stopped");
      setSessionId(null);
    } catch (err) {
      console.error(err);
      setStatus("Error stopping");
    }
  };

  const captureAndRecognize = async (sid) => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    const blob = dataURLtoBlob(imageSrc);

    // Quick detect first: do not send frames without face
    try {
      const hasFace = await detectFace(blob);
      if (!hasFace) {
        setStatus("No live face");
        return;
      }
    } catch (e) {
      // detection failed (network?), still try to recognize but be cautious
      console.warn("detectFace failed, proceeding to recognize", e);
    }

    setStatus("Recognizing...");
    const response = await recognizeFace(blob);
    if (!response || !response.faces) {
      setStatus("No face");
      return;
    }

    const recogs = response.faces.filter((f) => f.match && f.match.recognized);
    const now = new Date().toISOString();

    if (recogs.length === 0) {
      setStatus("No recognized faces");
      return;
    }

    setStatus("Matched");
    setPresent((prev) => {
      const map = new Map(prev.map((p) => [p.student_id, p]));
      recogs.forEach((r) => {
        const id = r.match.student_id;
        const name = r.match.name;
        const conf = Number(r.match.score).toFixed(2);
        const existing = map.get(id);
        if (existing) {
          existing.last_seen = now;
          existing.confidence = conf;
        } else {
          map.set(id, { student_id: id, name, confidence: conf, last_seen: now });
        }
      });
      return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    });
  };

  return (
    <div className="p-6 flex flex-col items-center">
      <h2 className="text-3xl font-bold mb-6">Mark Attendance</h2>

      <div className="grid grid-cols-3 gap-4 w-full max-w-4xl mb-4">
        <select className="border p-2 rounded" value={dept} onChange={(e) => setDept(e.target.value)}>
          <option value="">Select Department</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>

        <select className="border p-2 rounded" value={sem} onChange={(e) => setSem(e.target.value)}>
          <option value="">Select Semester</option>
          {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select className="border p-2 rounded" value={subject} onChange={(e) => setSubject(e.target.value)}>
          <option value="">Select Subject</option>
          {subjects.map((s) => <option key={s.code} value={s.name}>{s.name}</option>)}
        </select>
      </div>

      <div className="mb-6 flex items-center gap-3">
        {!sessionId ? (
          <button className="bg-green-600 text-white px-5 py-2 rounded" onClick={start}>Start Attendance</button>
        ) : (
          <button className="bg-red-600 text-white px-5 py-2 rounded" onClick={stop}>Stop Attendance</button>
        )}
        <div className="text-sm text-gray-600 ml-2">
          {status} {startedAt ? ` • started: ${new Date(startedAt).toLocaleString()}` : ""}
        </div>
      </div>

      <div className="flex justify-center w-full mb-6">
        <div className="border-4 border-blue-500 rounded-xl overflow-hidden shadow-lg">
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "user", width: 560, height: 420 }}
            className="w-[560px] h-[420px]"
          />
        </div>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Present ({present.length})</h3>
          <ul>
            {present.map((p) => (
              <li key={p.student_id} className="mb-2">
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-gray-500">Last seen: {new Date(p.last_seen).toLocaleTimeString()} • {p.confidence}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Session Info</h3>
          <div>Dept: {dept || "-"}</div>
          <div>Sem: {sem || "-"}</div>
          <div>Subject: {subject || "-"}</div>
          <div>Session ID: {sessionId || "-"}</div>
          <div className="mt-2 text-sm text-gray-600">Notes: Attendance marks are debounced on the backend.</div>
        </div>
      </div>
    </div>
  );
}
