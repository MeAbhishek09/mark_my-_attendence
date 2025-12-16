// frontend/src/components/Navbar.jsx
import React, { useState } from "react";
import {
  Home,
  Camera,
  UserPlus,
  Users,
  FileText,
  Menu,
  X,
} from "lucide-react";

export default function Navbar({ page, setPage }) {
  const [open, setOpen] = useState(false);

  const tabClass = (p) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition
     ${
       page === p
         ? "bg-blue-600 text-white shadow"
         : "text-gray-700 hover:bg-blue-50"
     }`;

  const NavButton = ({ p, icon: Icon, label }) => (
    <button
      onClick={() => {
        setPage(p);
        setOpen(false);
      }}
      className={tabClass(p)}
    >
      <Icon size={16} /> {label}
    </button>
  );

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        
        {/* LOGO */}
        <div className="flex items-center gap-2 text-blue-600">
          <Camera size={24} />
          <h1 className="text-lg md:text-xl font-bold text-gray-800">
            Face Attendance
          </h1>
        </div>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex gap-2">
          <NavButton p="home" icon={Home} label="Home" />
          <NavButton p="mark" icon={Camera} label="Mark" />
          <NavButton p="add" icon={UserPlus} label="Add Student" />
          <NavButton p="students" icon={Users} label="Students" />
          <NavButton p="view" icon={FileText} label="Records" />
        </nav>

        {/* MOBILE MENU BUTTON */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* MOBILE DROPDOWN */}
      {open && (
        <div className="md:hidden bg-white border-t shadow-sm px-4 py-3 space-y-2">
          <NavButton p="home" icon={Home} label="Home" />
          <NavButton p="mark" icon={Camera} label="Mark Attendance" />
          <NavButton p="add" icon={UserPlus} label="Add Student" />
          <NavButton p="students" icon={Users} label="Students" />
          <NavButton p="view" icon={FileText} label="View Records" />
        </div>
      )}
    </header>
  );
}
