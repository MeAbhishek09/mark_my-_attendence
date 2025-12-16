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
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-4">Attendance Sessions</h2>

      <div className="flex gap-3 mb-4">
        {/* CREATE SESSION BUTTON */}
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => setShowCreate(!showCreate)}
        >
          + Create Session
        </button>

        {/* SHOW EXPIRED ONLY BUTTON */}
        <button
          className={`px-4 py-2 rounded border
            ${
              showExpiredOnly
                ? "bg-gray-700 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          onClick={() => setShowExpiredOnly(!showExpiredOnly)}
        >
          {showExpiredOnly ? "Show Live Sessions" : "Show Expired Sessions"}
        </button>
      </div>

      {/* CREATE SESSION FORM */}
      {showCreate && (
        <div className="bg-gray-100 p-4 rounded mb-6">
          <div className="grid grid-cols-3 gap-3">
            <input name="dept" placeholder="Department" className="border p-2" onChange={updateForm} />
            <input name="sem" placeholder="Semester" className="border p-2" onChange={updateForm} />
            <input name="subject" placeholder="Subject" className="border p-2" onChange={updateForm} />

            <input name="course_name" placeholder="Course Name" className="border p-2" onChange={updateForm} />
            <input
              name="start_time"
              type="datetime-local"
              className="border p-2"
              onChange={updateForm}
            />
            <input name="duration" placeholder="Duration (minutes)" className="border p-2" onChange={updateForm} />
          </div>


          <button
            onClick={handleCreateSession}
            disabled={creating}
            className={`px-4 py-2 rounded mt-3 text-white
              ${creating ? "bg-gray-400 cursor-not-allowed" : "bg-green-600"}
            `}
          >
            {creating ? "Saving..." : "Save Session"}
          </button>

        </div>
      )}

      {/* SESSION LIST */}
      
<div className="space-y-3">
  {filteredSessions.map((s) => {
    const isActive = s.status === "LIVE";
    const formatIST = (isoString) => {
    const date = new Date(isoString);

      return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      });
    };

    return (
      <div
        key={s.id}
        className="flex justify-between items-center bg-white p-3 border rounded"
      >
        <div>
          <div className="font-semibold">{s.subject}</div>

          <div className="text-sm text-gray-600 flex flex-wrap gap-2 items-center">
            <span>{s.dept}</span>
            <span>• Sem {s.sem}</span>
            <span>• {formatIST(s.start_time)}</span>
            {/* <span>• {s.start_time}</span> */}
            <span>• {s.duration} mins</span>

            {/* STATUS BADGE */}
            <span
              className={`px-2 py-0.5 rounded text-xs font-semibold
                ${
                  isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
            >
              {s.status}
            </span>
          </div>
        </div>

        {/* JOIN BUTTON */}
        <button
          disabled={!isActive}
          onClick={() => joinSession(s)}
          className={`px-4 py-1 rounded text-white transition
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


      {/* CAMERA POPUP */}
      {cameraOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded relative">
            <h3 className="text-lg font-bold mb-2">Face Recognition</h3>

            <div className="relative">
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width={CAMERA_WIDTH}
                height={CAMERA_HEIGHT}
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

            <div className="text-sm mt-2">{status}</div>

            <div className="flex gap-3 mt-3">
              <button className="bg-blue-600 text-white px-4 py-1 rounded" onClick={captureAndRecognize}>
                Capture & Recognize
              </button>
              <button className="bg-red-500 text-white px-4 py-1 rounded" onClick={() => setCameraOpen(false)}>
                Close
              </button>
            </div>

            {student && (
              <div className="bg-green-100 p-3 rounded mt-4">
                <div className="font-bold">{student.name}</div>
                <div className="text-sm">Confidence: {student.confidence}</div>

                <button
                  className="bg-green-600 text-white px-4 py-1 rounded mt-2"
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
