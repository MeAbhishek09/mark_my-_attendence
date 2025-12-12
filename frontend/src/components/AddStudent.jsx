import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import { createStudent, enrollImage } from "../api/studentsApi";

/**
 * AddStudent (13 auto-captures)
 * - centers camera and form (3-column grid on top)
 * - on Capture it takes exactly 13 snapshots in sequence (no live-face detection)
 * - shows progress, thumbnails, and then uploads images when saving
 */

const AUTO_CAPTURE_COUNT = 13;
const AUTO_CAPTURE_INTERVAL_MS = 350; // time between shots

export default function AddStudent() {
  const webcamRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    roll_no: "",
    exam_no: "",
    dept: "",
    sem: "",
    class_name: "",
  });

  const [captures, setCaptures] = useState([]); // { blob, url }
  const [capturing, setCapturing] = useState(false);
  const [captureProgress, setCaptureProgress] = useState({ current: 0, total: AUTO_CAPTURE_COUNT });
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  const dataURLtoBlob = (dataurl) => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    const u8arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
    return new Blob([u8arr], { type: mime });
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Auto-capture sequence without any live detection
  const startAutoCapture = async () => {
    if (!webcamRef.current) return alert("Camera not ready");

    // cleanup previous captures
    captures.forEach((c) => URL.revokeObjectURL(c.url));
    setCaptures([]);
    setCaptureProgress({ current: 0, total: AUTO_CAPTURE_COUNT });
    setCapturing(true);
    setStatus("Starting capture sequence...");

    for (let i = 0; i < AUTO_CAPTURE_COUNT; i++) {
      await new Promise((res) => setTimeout(res, AUTO_CAPTURE_INTERVAL_MS));

      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        const blob = dataURLtoBlob(imageSrc);
        const url = URL.createObjectURL(blob);
        setCaptures((prev) => [...prev, { blob, url }]);
        setStatus(`Captured ${i + 1} / ${AUTO_CAPTURE_COUNT}`);
      } else {
        setStatus(`Failed to capture frame ${i + 1}`);
      }

      setCaptureProgress({ current: i + 1, total: AUTO_CAPTURE_COUNT });
    }

    setCapturing(false);
    setStatus(`Capture finished: ${AUTO_CAPTURE_COUNT} images captured`);
  };

  const handleSaveStudent = async () => {
    if (!form.name || !form.roll_no) {
      alert("Please enter student name and roll number before saving.");
      return;
    }

    if (captures.length === 0) {
      if (!confirm("No images captured. Save student without images?")) return;
    }

    setSaving(true);
    setStatus("Creating student...");

    try {
      const student = await createStudent({
        roll_no: form.roll_no,
        name: form.name,
        class_name: form.class_name || `${form.dept} ${form.sem}`,
        exam_no: form.exam_no,
        dept: form.dept,
        sem: form.sem,
      });

      setStatus(`Student created (id=${student.id}). Uploading ${captures.length} images...`);
      setUploadProgress({ uploaded: 0, total: captures.length });

      for (let i = 0; i < captures.length; i++) {
        const blob = captures[i].blob;
        try {
          await enrollImage(student.id, student.name, blob);
        } catch (err) {
          console.error("upload error for image", i, err);
        }
        setUploadProgress((p) => ({ uploaded: p.uploaded + 1, total: p.total }));
      }

      setStatus("All images uploaded. Student added successfully.");
      captures.forEach((c) => URL.revokeObjectURL(c.url));
      setCaptures([]);
      setUploadProgress(null);
    } catch (err) {
      console.error(err);
      alert("Failed to create or upload images: " + (err.response?.data?.detail || err.message));
      setStatus("Error saving student");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 flex flex-col items-center">
      <h2 className="text-3xl font-bold mb-6">Add Student</h2>

      {/* FORM ABOVE, CENTERED, 3-COLUMN GRID */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-4xl mb-6">
        <input className="border p-2 rounded" name="name" placeholder="Name" value={form.name} onChange={handleChange} />
        <input className="border p-2 rounded" name="roll_no" placeholder="Roll No" value={form.roll_no} onChange={handleChange} />
        <input className="border p-2 rounded" name="exam_no" placeholder="Exam No" value={form.exam_no} onChange={handleChange} />

        <input className="border p-2 rounded" name="dept" placeholder="Department" value={form.dept} onChange={handleChange} />
        <input className="border p-2 rounded" name="sem" placeholder="Semester" value={form.sem} onChange={handleChange} />
        <input className="border p-2 rounded" name="class_name" placeholder="Class Name" value={form.class_name} onChange={handleChange} />
      </div>

      {/* CAPTURE BUTTON */}
      <button
        className={`px-5 py-2 rounded text-white mb-4 ${capturing ? "bg-gray-400" : "bg-blue-600"}`}
        onClick={startAutoCapture}
        disabled={capturing || saving}
      >
        {capturing ? `Capturing ${captureProgress.current}/${captureProgress.total}` : `Capture ${AUTO_CAPTURE_COUNT} Images`}
      </button>

      {/* STATUS */}
      <div className="text-gray-700 mb-6">{status}</div>

      {/* CENTER CAMERA */}
      <div className="flex justify-center w-full mb-6">
        <div className="border-4 border-blue-500 rounded-xl overflow-hidden shadow-lg">
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "user", width: 500, height: 380 }}
            className="w-[500px] h-[380px]"
          />
        </div>
      </div>

      {/* THUMBNAILS */}
      <div className="w-full max-w-4xl">
        <h3 className="font-semibold mb-2">Captured Thumbnails ({captures.length})</h3>

        <div className="grid grid-cols-6 gap-2">
          {captures.map((c, i) => (
            <img key={i} src={c.url} className="h-20 w-full object-cover rounded shadow" alt={`cap-${i}`} />
          ))}
        </div>
      </div>

      {/* SAVE BUTTON */}
      <button
        className={`mt-6 px-6 py-2 text-lg rounded text-white ${saving ? "bg-gray-400" : "bg-green-600"}`}
        onClick={handleSaveStudent}
        disabled={saving || captures.length === 0}
      >
        {saving ? `Saving & Uploading (${uploadProgress?.uploaded || 0}/${uploadProgress?.total || 0})` : "Save Student"}
      </button>

      <div className="mt-3 text-gray-500 text-sm">{status}</div>
    </div>
  );
}
