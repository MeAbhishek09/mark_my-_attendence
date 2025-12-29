import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import { createStudent, enrollImage, finalizeEnrollment  } from "../api/studentsApi";

/**
 * AddStudent (13 auto-captures)
 * - All fields mandatory
 * - types: roll_no:number, exam_no:number, sem:number (1-10), course_name:string
 * - course_name replaces class_name
 * - check duplicate (backend returns 400 if exists)
 * - if camera not available or capture fails -> show error
 */

const AUTO_CAPTURE_COUNT = 21;
const AUTO_CAPTURE_INTERVAL_MS = 350; // ms between shots

export default function AddStudent() {
  const webcamRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    roll_no: "",
    exam_no: "",
    dept: "",
    sem: "",
    course_name: "",
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

  const checkCameraAvailable = () => {
    // quick detection: webcamRef exists and video stream active
    try {
      const video = webcamRef.current && webcamRef.current.video;
      if (!video) return false;
      // videoWidth/videoHeight are 0 if no stream
      if (video.videoWidth === 0 || video.videoHeight === 0) return false;
      return true;
    } catch (e) {
      return false;
    }
  };

  // Auto-capture sequence without face detection
  const startAutoCapture = async () => {
    if (capturing || saving) return;
    // ensure camera available
    if (!checkCameraAvailable()) {
      alert("Camera not detected or not accessible. Please enable the camera and try again.");
      return;
    }

    // cleanup previous captures
    captures.forEach((c) => URL.revokeObjectURL(c.url));
    setCaptures([]);
    setCaptureProgress({ current: 0, total: AUTO_CAPTURE_COUNT });
    setCapturing(true);
    setStatus("Starting capture sequence...");

    for (let i = 0; i < AUTO_CAPTURE_COUNT; i++) {
      await new Promise((res) => setTimeout(res, AUTO_CAPTURE_INTERVAL_MS));

      // attempt to take screenshot
      let imageSrc = null;
      try {
        imageSrc = webcamRef.current?.getScreenshot();
      } catch (err) {
        console.error("screenshot error", err);
        imageSrc = null;
      }

      if (imageSrc) {
        const blob = dataURLtoBlob(imageSrc);
        const url = URL.createObjectURL(blob);
        setCaptures((prev) => [...prev, { blob, url }]);
        setStatus(`Captured ${i + 1} / ${AUTO_CAPTURE_COUNT}`);
      } else {
        setStatus(`Failed to capture frame ${i + 1}.`);
        // If capture returns null, stop early and report to user
        setCapturing(false);
        alert("Failed to capture from camera. Please ensure camera is enabled and try again.");
        return;
      }

      setCaptureProgress({ current: i + 1, total: AUTO_CAPTURE_COUNT });
    }

    setCapturing(false);
    setStatus(`Capture finished: ${AUTO_CAPTURE_COUNT} images captured`);
  };

  const [trainingLog, setTrainingLog] = useState([]);
  let enrollmentFailed = false;
  const handleSaveStudent = async () => {
    // Validate mandatory fields
    if (
      !form.name ||
      !form.roll_no ||
      !form.exam_no ||
      !form.dept ||
      !form.sem ||
      !form.course_name
    ) {
      alert("All fields are required. Please fill all fields.");
      return;
    }

    // validate numeric fields
    const rollNoNum = Number(form.roll_no);
    const examNoNum = Number(form.exam_no);
    const semNum = Number(form.sem);

    if (!Number.isInteger(rollNoNum) || rollNoNum <= 0) {
      alert("Roll No must be a positive integer.");
      return;
    }
    if (!Number.isInteger(examNoNum) || examNoNum <= 0) {
      alert("Exam No must be a positive integer.");
      return;
    }
    if (!Number.isInteger(semNum) || semNum < 1 || semNum > 10) {
      alert("Semester (sem) must be an integer between 1 and 10.");
      return;
    }

    // require captures (per your earlier change you removed live detection for add)
    if (captures.length < AUTO_CAPTURE_COUNT) {
      const ok = window.confirm(
        `You have captured ${captures.length} images (required ${AUTO_CAPTURE_COUNT}). Do you want to continue saving?`
      );
      if (!ok) return;
    }

    // ensure camera was available at capture time
    if (!checkCameraAvailable() && captures.length === 0) {
      alert("Camera not available and no captures taken. Enable camera and try again.");
      return;
    }

    setSaving(true);
    setStatus("Creating student...");

    try {
      const payload = {
        roll_no: rollNoNum,
        name: form.name.trim(),
        exam_no: examNoNum,
        dept: form.dept.trim(),
        sem: semNum,
        course_name: form.course_name.trim(),
      };

      const student = await createStudent(payload); // expects {id, ...}

      setStatus(`Student created (id=${student.id}). Uploading ${captures.length} images...`);
      setUploadProgress({ uploaded: 0, total: captures.length });
      

      for (let i = 0; i < captures.length; i++) {
        const blob = captures[i].blob;

        try {
          const res = await enrollImage(student.id, student.name, blob);

          if (res.status !== "trained") {
            throw new Error("Training failed");
          }
        } catch (err) {
          // 🚨 NETWORK ERROR (NO RESPONSE)
          if (!err.response) {
            alert(
              "Network error detected.\n" +
              "Please check your internet connection.\n\n" +
              "Enrollment is paused. You can retry."
            );

            setStatus("Network error. Enrollment paused.");
            break; // ⛔ STOP loop, DO NOT mark failure
          }
          const msg =
            err?.response?.data?.detail ||
            err?.response?.data?.error ||
            err.message ||
            "";

          console.error("Enroll error:", msg);

          // 🚨 BACKEND ROLLBACK OR FAILURE
          if (msg === "ENROLLMENT_FAILED_STUDENT_REMOVED") {
            enrollmentFailed = true;

            alert(
              "Enrollment failed due to bad images.\n" +
              "Student record was removed.\n\n" +
              "Please restart the process."
            );

            setStatus("Enrollment failed. Please retry.");
            break; // ⛔ STOP uploading immediately
          }
        }

        setUploadProgress((p) => ({
          uploaded: p.uploaded + 1,
          total: p.total,
        }));
      }


        if (!enrollmentFailed) {
        try {
        await finalizeEnrollment(student.id);
        } catch (err) {
        alert(
          "Enrollment completed but finalization failed.\n" +
          "Please retry finalization."
        );
        setStatus("Finalization failed. Please retry.");
        return; // ⛔ DO NOT show success UI
        }

        // ✅ success UI only after finalize succeeds
        setStatus("All images uploaded. Student added successfully.");
        alert("Student enrolled successfully");

        captures.forEach((c) => URL.revokeObjectURL(c.url));
        setCaptures([]);
        setUploadProgress(null);
        setForm({
        name: "",
        roll_no: "",
        exam_no: "",
        dept: "",
        sem: "",
        course_name: "",
        });
        }

      // if (!enrollmentFailed) {
      //   await finalizeEnrollment(student.id);

      //   setStatus("All images uploaded. Student added successfully.");
      //   alert("Student enrolled successfully");

      //   captures.forEach((c) => URL.revokeObjectURL(c.url));
      //   setCaptures([]);
      //   setUploadProgress(null);
      //   setForm({
      //     name: "",
      //     roll_no: "",
      //     exam_no: "",
      //     dept: "",
      //     sem: "",
      //     course_name: "",
      //   });
      // }


      

      captures.forEach((c) => URL.revokeObjectURL(c.url));
      setCaptures([]);
      setUploadProgress(null);
      // reset form optionally
      setForm({ name: "", roll_no: "", exam_no: "", dept: "", sem: "", course_name: "" });
    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.detail || err?.response?.data?.error || err.message || "Unknown error";
      alert("Failed to create or upload images: " + message);
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
        <input
          className="border p-2 rounded"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
        />
        <input
          className="border p-2 rounded"
          name="roll_no"
          placeholder="Roll No (number)"
          value={form.roll_no}
          onChange={handleChange}
        />
        <input
          className="border p-2 rounded"
          name="exam_no"
          placeholder="Exam No (number)"
          value={form.exam_no}
          onChange={handleChange}
        />

        <input
          className="border p-2 rounded"
          name="dept"
          placeholder="Department"
          value={form.dept}
          onChange={handleChange}
        />
        <input
          className="border p-2 rounded"
          name="sem"
          placeholder="Semester (1-10)"
          value={form.sem}
          onChange={handleChange}
        />
        <input
          className="border p-2 rounded"
          name="course_name"
          placeholder="Course Name"
          value={form.course_name}
          onChange={handleChange}
        />
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

      {/* TRAINING STATUS */}
      {trainingLog.length > 0 && (
        <div className="mt-4 text-sm w-full max-w-4xl">
          <h4 className="font-semibold mb-1">Training Status</h4>

          {trainingLog.map((t, i) => (
            <div key={i} className="text-gray-600">
              Image {t.image}: {t.status} (faces: {t.faces})
            </div>
          ))}
        </div>
      )}


      {/* SAVE BUTTON */}
      <button
        className={`mt-6 px-6 py-2 text-lg rounded text-white ${saving ? "bg-gray-400" : "bg-green-600"}`}
        onClick={handleSaveStudent}
        disabled={saving}
      >
        {saving ? `Saving & Uploading (${uploadProgress?.uploaded || 0}/${uploadProgress?.total || 0})` : "Save Student"}
      </button>

      <div className="mt-3 text-gray-500 text-sm">{status}</div>
    </div>
  );
}
