// frontend/src/components/Navbar.jsx
import React from "react";
import {
  Home,
  Camera,
  UserPlus,
  Users,
  FileText,
} from "lucide-react";

export default function Navbar({ page, setPage }) {
  const tabClass = (p) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition
     ${
       page === p
         ? "bg-blue-600 text-white shadow"
         : "text-gray-700 hover:bg-blue-50"
     }`;

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        
        {/* LOGO */}
        <div className="flex items-center gap-2 text-blue-600">
          <Camera size={24} />
          <h1 className="text-xl font-bold text-gray-800">
            Face Attendance
          </h1>
        </div>

        {/* NAV */}
        <nav className="flex gap-2">
          <button onClick={() => setPage("home")} className={tabClass("home")}>
            <Home size={16} /> Home
          </button>

          <button onClick={() => setPage("mark")} className={tabClass("mark")}>
            <Camera size={16} /> Mark
          </button>

          <button onClick={() => setPage("add")} className={tabClass("add")}>
            <UserPlus size={16} /> Add Student
          </button>

          <button
            onClick={() => setPage("students")}
            className={tabClass("students")}
          >
            <Users size={16} /> Students
          </button>

          <button onClick={() => setPage("view")} className={tabClass("view")}>
            <FileText size={16} /> Records
          </button>
        </nav>
      </div>
    </header>
  );
}
