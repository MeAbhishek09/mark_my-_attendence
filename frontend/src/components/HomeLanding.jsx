import React from "react";

export default function HomeLanding({ onMarkClick }) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Welcome to the Attendance System</h2>
      <p className="mb-4">Use real-time facial recognition to mark attendance for your classes.</p>
      <div className="space-y-3">
        <button onClick={onMarkClick} className="bg-blue-600 text-white px-4 py-2 rounded">Mark Attendance</button>
      </div>

      <section className="mt-8 bg-white p-4 rounded shadow">
        <h3 className="font-semibold">How it works</h3>
        <ol className="list-decimal ml-6 mt-2">
          <li>Select Department, Semester and Subject</li>
          <li>Start Attendance — students show their face to the camera</li>
          <li>Stop when done. Download records if needed.</li>
        </ol>
      </section>
    </div>
  );
}
