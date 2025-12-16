import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import {
  createSession,
  listSessions,
  markSessionAttendance,
} from "../api/sessionsApi";
import { recognizeFace } from "../api/recognizeApi";

/* =========================
   CAMERA CONFIG
========================= */
const CAMERA_WIDTH = 480;
const CAMERA_HEIGHT = 360;

export default function MarkAttendance() {
  /* =========================
     SESSION STATE
  ========================= */
  const [sessions, setSessions] = useState([]);
  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState({
  dept: "",
  sem: "",
  subject: "",
  course_name: "",
  start_time: "",
  duration: "",
});


  /* =========================
     CAMERA / JOIN STATE
  ========================= */
  const webcamRef = useRef(null);
  const [joining, setJoining] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [faceBox, setFaceBox] = useState(null);
  const [student, setStudent] = useState(null);

  /* =========================
     LOAD SESSIONS
  ========================= */
  const loadSessions = async () => {
    try {
      const data = await listSessions();
      setSessions(data);
    } catch (e) {
      console.error("Failed to load sessions", e);
    }
  };

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 15000); // refresh list
    return () => clearInterval(interval);
  }, []);

  /* =========================
     FORM HANDLER
  ========================= */
  const updateForm = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* =========================
     CREATE SESSION
  ========================= */
  const [creating, setCreating] = useState(false);

  const handleCreateSession = async () => {
    const { dept, sem, subject, course_name, duration, start_time } = form;

    if (!dept || !sem || !subject || !course_name || !start_time || !duration) {
      alert("All fields  are required");
      return;
  }

  // ⛔ prevent double click
  if (creating) return;

  setCreating(true);

    try {
      await createSession({
        dept: form.dept,
        sem: form.sem,
        subject: form.subject,
        course_name: form.course_name,
        start_time: start_time, // ✅ FIX
        duration: Number(form.duration),
      });


      setForm({ dept: "", sem: "", subject: "", course_name: "", duration: "", start_time: "" });
      setShowCreate(false);
      loadSessions();
    } catch (e) {
      console.error(e);
       alert(e?.response?.data?.detail || "Failed to create session");
    } finally {
      setCreating(false);
  }
  };

  /* =========================
     JOIN SESSION
  ========================= */
  const joinSession = (session) => {
    setJoining(session);
    setCameraOpen(true);
    setStatus("Look at the camera");
    setFaceBox(null);
    setStudent(null);
  };

  /* =========================
     IMAGE → BLOB
  ========================= */
  const dataURLtoBlob = (dataurl) => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    const u8arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
    return new Blob([u8arr], { type: mime });
  };

  /* =========================
     CAPTURE + RECOGNIZE
  ========================= */
  const captureAndRecognize = async () => {
  if (!webcamRef.current) return;

  const imageSrc = webcamRef.current.getScreenshot();
  if (!imageSrc) {
    setStatus("Camera not detected");
    return;
  }

  const blob = dataURLtoBlob(imageSrc);

  try {
    setStatus("Recognizing...");

    // ✅ CALL ONLY THIS API (detect + recognize + attendance)
    const recog = await recognizeFace(blob, { session_id: joining.id });

    const face = recog?.faces?.[0];
    if (!face) {
      setStatus("No face detected");
      return;
    }

    // ✅ Draw bounding box
    if (face.bbox) {
      const [x1, y1, x2, y2] = face.bbox;
      setFaceBox({
        x: x1,
        y: y1,
        w: x2 - x1,
        h: y2 - y1,
      });
    }

    if (face.match?.recognized) {
      setStudent({
        id: face.match.student_id,
        name: face.match.name,
        confidence: Number(face.match.score).toFixed(2),
      });
      setStatus("Face matched");
    } else {
      setStatus("Unknown face");
    }
  } catch (e) {
    console.error(e);
    setStatus("Recognition failed");
  }
};


  /* =========================
     CONFIRM ATTENDANCE
  ========================= */
  const confirmAttendance = async () => {
    try {
      await markSessionAttendance(joining.id, {
        student_id: student.id,
        student_name: student.name,
        confidence: Number(student.confidence),
      });

      alert("Attendance marked");
      setCameraOpen(false);
      setStudent(null);
      setFaceBox(null);
    } catch (e) {
        console.error(e);

        const msg =
          e?.response?.data?.detail ||
          e?.response?.data?.message ||
          "Attendance failed";

        alert(msg);
      }

  };

  const [showExpiredOnly, setShowExpiredOnly] = useState(false);
  const filteredSessions = showExpiredOnly
  ? sessions.filter((s) => s.status === "EXPIRED")
  : sessions.filter((s) => s.status !== "EXPIRED");


  /* =========================
   UI
========================= */
return (
  <div className="p-4 md:p-6 max-w-7xl mx-auto">
    {/* PAGE TITLE */}
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
        Attendance Sessions
      </h2>

      <div className="flex gap-2">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
          onClick={() => setShowCreate(!showCreate)}
        >
          + Create Session
        </button>

        <button
          className={`px-4 py-2 rounded-lg text-sm border
            ${
              showExpiredOnly
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          onClick={() => setShowExpiredOnly(!showExpiredOnly)}
        >
          {showExpiredOnly ? "Show Live" : "Show Expired"}
        </button>
      </div>
    </div>

    {/* CREATE SESSION FORM */}
    {showCreate && (
      <div className="bg-white shadow rounded-xl p-4 md:p-6 mb-8">
        <h3 className="font-semibold text-lg mb-4">Create New Session</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input name="dept" placeholder="Department" className="border rounded p-2" onChange={updateForm} />
          <input name="sem" placeholder="Semester" className="border rounded p-2" onChange={updateForm} />
          <input name="subject" placeholder="Subject" className="border rounded p-2" onChange={updateForm} />

          <input name="course_name" placeholder="Course Name" className="border rounded p-2" onChange={updateForm} />
          <input name="start_time" type="datetime-local" className="border rounded p-2" onChange={updateForm} />
          <input name="duration" placeholder="Duration (minutes)" className="border rounded p-2" onChange={updateForm} />
        </div>

        <button
          onClick={handleCreateSession}
          disabled={creating}
          className={`mt-4 px-5 py-2 rounded-lg text-white text-sm
            ${creating ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"}`}
        >
          {creating ? "Saving..." : "Save Session"}
        </button>
      </div>
    )}

    {/* SESSION LIST */}
    <div className="grid gap-4">
      {filteredSessions.map((s) => {
        const isActive = s.status === "LIVE";

        const formatIST = (iso) =>
          new Date(iso).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Kolkata",
          });

        return (
          <div
            key={s.id}
            className="bg-white border rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-sm"
          >
            <div>
              <h4 className="font-semibold text-gray-800">{s.subject}</h4>
              <div className="text-sm text-gray-600 flex flex-wrap gap-2 mt-1">
                <span>{s.dept}</span>
                <span>• Sem {s.sem}</span>
                <span>• {formatIST(s.start_time)}</span>
                <span>• {s.duration} mins</span>
              </div>

              <span
                className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-semibold
                  ${
                    isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
              >
                {s.status}
              </span>
            </div>

            <button
              disabled={!isActive}
              onClick={() => joinSession(s)}
              className={`px-5 py-2 rounded-lg text-sm text-white
                ${
                  isActive
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
            >
              Join Session
            </button>
          </div>
        );
      })}
    </div>

    {/* CAMERA MODAL */}
    {cameraOpen && (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-4 w-full max-w-md relative">
          <h3 className="text-lg font-bold mb-2">Face Recognition</h3>

          <div className="relative rounded overflow-hidden">
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width="100%"
              height={CAMERA_HEIGHT}
              className="rounded"
            />

            {faceBox && (
              <div
                className="absolute border-4 border-blue-500"
                style={{
                  left: faceBox.x,
                  top: faceBox.y,
                  width: faceBox.w,
                  height: faceBox.h,
                }}
              />
            )}
          </div>

          <p className="text-sm mt-2 text-gray-600">{status}</p>

          <div className="flex gap-2 mt-3">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded"
              onClick={captureAndRecognize}
            >
              Capture
            </button>

            <button
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded"
              onClick={() => setCameraOpen(false)}
            >
              Close
            </button>
          </div>

          {student && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
              <div className="font-semibold">{student.name}</div>
              <div className="text-sm text-gray-700">
                Confidence: {student.confidence}
              </div>

              <button
                className="mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded"
                onClick={confirmAttendance}
              >
                Confirm Attendance
              </button>
            </div>
          )}
        </div>
      </div>
    )}
  </div>
);
}