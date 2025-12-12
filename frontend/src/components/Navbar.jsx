import React from "react";

export default function Navbar({ page, setPage }) {
  return (
    <header className="bg-white shadow p-4 flex items-center justify-between">
      <h1 className="text-xl font-bold">Face Attendance</h1>
      <nav className="flex gap-2">
        <button onClick={() => setPage("home")} className={`px-3 py-1 rounded ${page==="home" ? "bg-blue-600 text-white":"bg-gray-200"}`}>Home</button>
        <button onClick={() => setPage("mark")} className={`px-3 py-1 rounded ${page==="mark" ? "bg-blue-600 text-white":"bg-gray-200"}`}>Mark Attendance</button>
        <button onClick={() => setPage("add")} className={`px-3 py-1 rounded ${page==="add" ? "bg-blue-600 text-white":"bg-gray-200"}`}>Add Student</button>
        <button onClick={() => setPage("view")} className={`px-3 py-1 rounded ${page==="view" ? "bg-blue-600 text-white":"bg-gray-200"}`}>View Records</button>
      </nav>
    </header>
  );
}
