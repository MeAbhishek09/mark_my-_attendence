import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { recognizeFace } from "../api/recognizeApi";

const WebcamAttendance = () => {
  const webcamRef = useRef(null);
  const [status, setStatus] = useState("Waiting...");
  const [recognizedStudent, setRecognizedStudent] = useState(null);
  const [confidence, setConfidence] = useState(null);

  // Capture frame & send to backend every 1.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      captureFrame();
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const captureFrame = async () => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    // Convert base64 → Blob
    const byteString = atob(imageSrc.split(",")[1]);
    const buffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(buffer);
    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([buffer], { type: "image/jpeg" });

    setStatus("Recognizing...");

    const response = await recognizeFace(blob);

    if (!response || !response.faces) {
      setStatus("No face detected");
      return;
    }

    // Pick the best recognized face
    const recognized = response.faces.find((f) => f.match.recognized);

    if (recognized) {
      setRecognizedStudent(recognized.match.name);
      setConfidence(recognized.match.score.toFixed(2));
      setStatus("Attendance Marked ✔");

      // show status for 3 seconds then reset
      setTimeout(() => setStatus("Waiting..."), 3000);
    } else {
      setRecognizedStudent(null);
      setStatus("Unknown Face");
    }
  };

  return (
    <div className="flex flex-col items-center mt-10">
      <h1 className="text-3xl font-bold mb-4">Live Attendance Scanner</h1>

      <div className="border-4 border-blue-500 rounded-xl shadow-lg overflow-hidden">
        <Webcam
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: "user" }}
          className="w-[640px] h-[480px]"
        />
      </div>

      <div className="mt-6 text-center">
        <p className="text-xl font-semibold">
          Status: <span className="text-blue-600">{status}</span>
        </p>

        {recognizedStudent && (
          <div className="mt-4 text-lg">
            <p className="font-bold text-green-600">
              Recognized: {recognizedStudent}
            </p>
            <p className="text-gray-700">Confidence: {confidence}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebcamAttendance;
