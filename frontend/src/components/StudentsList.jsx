// frontend/src/components/StudentsList.jsx
import React, { useEffect, useState, useRef } from "react";
import { listStudents, deleteStudents } from "../api/studentsListApi";

/* =========================
   CSV DOWNLOAD (UNCHANGED)
========================= */
function downloadCSV(filename, rows) {
  if (!rows || !rows.length) return;
  const header = Object.keys(rows[0]);
  const csv = [
    header.join(","),
    ...rows.map((r) =>
      header
        .map((h) => `"${(r[h] ?? "").toString().replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function StudentsList() {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("");
  const [roll, setRoll] = useState("");
  const [error, setError] = useState(null);

  const [selected, setSelected] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const debounceRef = useRef(null);

  /* =========================
     FETCH STUDENTS (UNCHANGED)
  ========================= */
  const fetchStudents = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await listStudents(params);
      const data = res.data || [];
      setStudents(data);
      setFiltered(data);
      setSelected(new Set());
      setSelectAll(false);
    } catch (e) {
      console.error(e);
      setError("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  /* =========================
     SEARCH + FILTER (UNCHANGED)
  ========================= */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const params = {};
      if (query) params.q = query;
      if (dept) params.dept = dept;
      if (roll) params.roll_no = roll;

      fetchStudents(params).then(() => {
        const q = (query || "").toLowerCase();
        const d = (dept || "").toLowerCase();
        const r = (roll || "").toLowerCase();

        const newFiltered = (students || []).filter((s) => {
          const matchQ = !q || (s.name || "").toLowerCase().includes(q);
          const matchD = !d || (s.dept || "").toLowerCase().includes(d);
          const matchR =
            !r || (s.roll_no || "").toString().toLowerCase().includes(r);
          return matchQ && matchD && matchR;
        });
        setFiltered(newFiltered);
      });
    }, 350);

    return () => clearTimeout(debounceRef.current);
  }, [query, dept, roll]); // 🔥 unchanged deps

  /* =========================
     SELECTION LOGIC (UNCHANGED)
  ========================= */
  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      setSelectAll(next.size === filtered.length);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelected(new Set());
      setSelectAll(false);
    } else {
      setSelected(
        new Set((filtered.length ? filtered : students).map((s) => s.id || s._id))
      );
      setSelectAll(true);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selected.size) return;
    if (!window.confirm(`Delete ${selected.size} student(s)?`)) return;

    try {
      setLoading(true);
      await deleteStudents(Array.from(selected));
      const remaining = students.filter(
        (s) => !selected.has(s.id || s._id)
      );
      setStudents(remaining);
      setFiltered(remaining);
      setSelected(new Set());
      setSelectAll(false);
    } catch {
      alert("Failed to delete students");
    } finally {
      setLoading(false);
    }
  };

  const rows = filtered.length ? filtered : students;

  /* =========================
     UI (ENHANCED ONLY)
  ========================= */
  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow p-4 md:p-6">

        <h2 className="text-2xl md:text-3xl font-bold mb-6">
          Students
        </h2>

        {/* FILTER BAR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <input
            className="border p-2 rounded focus:ring-2 focus:ring-blue-500"
            placeholder="Search by name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <input
            className="border p-2 rounded focus:ring-2 focus:ring-blue-500"
            placeholder="Department"
            value={dept}
            onChange={(e) => setDept(e.target.value)}
          />
          <input
            className="border p-2 rounded focus:ring-2 focus:ring-blue-500"
            placeholder="Roll No"
            value={roll}
            onChange={(e) => setRoll(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                setQuery("");
                setDept("");
                setRoll("");
                fetchStudents();
              }}
              className="flex-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              Reset
            </button>
            <button
              onClick={() => downloadCSV("students.csv", rows)}
              className="flex-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              CSV
            </button>
          </div>
        </div>

        {/* ACTION BAR */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-600">
            Selected: {selected.size}
          </span>
          <button
            onClick={handleDeleteSelected}
            disabled={!selected.size || loading}
            className={`px-4 py-2 rounded text-white
              ${
                !selected.size
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700"
              }`}
          >
            Delete Selected
          </button>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                  />
                </th>
                {[
                  "Roll",
                  "Exam",
                  "Name",
                  "Dept",
                  "Sem",
                  "Course",
                  "Created",
                ].map((h) => (
                  <th key={h} className="p-3 text-left font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((s) => {
                const id = s.id || s._id;
                return (
                  <tr key={id} className="border-t hover:bg-blue-50">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selected.has(id)}
                        onChange={() => toggleSelect(id)}
                      />
                    </td>
                    <td className="p-3">{s.roll_no}</td>
                    <td className="p-3">{s.exam_no}</td>
                    <td className="p-3 font-medium">{s.name}</td>
                    <td className="p-3">{s.dept}</td>
                    <td className="p-3">{s.sem}</td>
                    <td className="p-3">{s.course_name}</td>
                    <td className="p-3 text-gray-500">
                      {s.created_at
                        ? new Date(s.created_at).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                );
              })}

              {!rows.length && !loading && (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-gray-500">
                    No students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {error && <div className="text-red-600 mt-4">{error}</div>}
      </div>
    </div>
  );
}
