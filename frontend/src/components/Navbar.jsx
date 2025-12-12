// frontend/src/components/Navbar.jsx
import React from "react";

export default function Navbar({ page, setPage }) {
  const tabClass = (p) =>
    `px-3 py-1 rounded ${page === p ? "bg-blue-600 text-white" : "bg-gray-200"}`;

  return (
    <header className="bg-white shadow p-4 flex items-center justify-between">
      <h1 className="text-xl font-bold">Face Attendance</h1>
      <nav className="flex gap-2">
        <button onClick={() => setPage("home")} className={tabClass("home")}>
          Home
        </button>
        <button onClick={() => setPage("mark")} className={tabClass("mark")}>
          Mark Attendance
        </button>
        <button onClick={() => setPage("add")} className={tabClass("add")}>
          Add Student
        </button>
        <button
          onClick={() => setPage("students")}
          className={tabClass("students")}
        >
          Students
        </button>
        <button onClick={() => setPage("view")} className={tabClass("view")}>
          View Records
        </button>
      </nav>
    </header>
  );
}
