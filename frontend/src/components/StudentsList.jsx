// frontend/src/components/StudentsList.jsx
import React, { useEffect, useState, useRef } from "react";
import { listStudents, deleteStudents } from "../api/studentsListApi";

/*
Features:
- show all students (fetched)
- search by name / dept / roll_no (debounced)
- CSV export
- select rows + bulk delete
*/

function downloadCSV(filename, rows) {
  if (!rows || !rows.length) return;
  const header = Object.keys(rows[0]);
  const csv = [
    header.join(","),
    ...rows.map((r) => header.map((h) => `"${(r[h] ?? "").toString().replace(/"/g, '""')}"`).join(",")),
  ].join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function StudentsList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("");
  const [roll, setRoll] = useState("");
  const [error, setError] = useState(null);

  // selection state: Set of selected student ids
  const [selected, setSelected] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // client-side backup filtered list if API doesn't support server filtering
  const [filtered, setFiltered] = useState([]);

  // debounce
  const debounceRef = useRef(null);

  const fetchStudents = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await listStudents(params);
      const data = res.data || [];
      setStudents(data);
      setFiltered(data);
      // reset selection when list changes
      setSelected(new Set());
      setSelectAll(false);
    } catch (e) {
      console.error("Failed to fetch students", e);
      setError("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // apply debounce and filtering
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = {};
      if (query) params.q = query;
      if (dept) params.dept = dept;
      if (roll) params.roll_no = roll;

      fetchStudents(params).then(() => {
        // client-side fallback filtering (in case server ignores params)
        const q = (query || "").toLowerCase();
        const d = (dept || "").toLowerCase();
        const r = (roll || "").toLowerCase();

        const newFiltered = (students || []).filter((s) => {
          const matchQ = !q || (s.name || "").toLowerCase().includes(q);
          const matchD = !d || (s.dept || "").toLowerCase().includes(d);
          const matchR = !r || (s.roll_no || "").toString().toLowerCase().includes(r);
          return matchQ && matchD && matchR;
        });
        setFiltered(newFiltered);
      });
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, dept, roll]);

  // selection helpers
  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      // update selectAll flag
      setSelectAll(next.size > 0 && next.size === (filtered.length || students.length));
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelected(new Set());
      setSelectAll(false);
    } else {
      const ids = (filtered.length ? filtered : students).map((s) => s.id || s._id).filter(Boolean);
      setSelected(new Set(ids));
      setSelectAll(true);
    }
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} selected student(s)? This action cannot be undone.`)) return;

    const ids = Array.from(selected);
    try {
      setLoading(true);
      await deleteStudents(ids); // call API
      // optimistic update: remove deleted ids from local state
      const remaining = (students || []).filter((s) => !ids.includes(s.id || s._id));
      setStudents(remaining);
      setFiltered((prev) => prev.filter((s) => !ids.includes(s.id || s._id)));
      setSelected(new Set());
      setSelectAll(false);
    } catch (err) {
      console.error("Failed to delete students", err);
      alert("Failed to delete selected students: " + (err.response?.data?.detail || err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const rows = filtered.length ? filtered : students;

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-col md:flex-row md:items-end md:space-x-4 gap-4">
        <div>
          <label className="block text-sm font-medium">Search by name</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter name..."
            className="mt-1 p-2 border rounded w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Department</label>
          <input
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            placeholder="CSE / ECE / etc"
            className="mt-1 p-2 border rounded w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Roll No</label>
          <input
            value={roll}
            onChange={(e) => setRoll(e.target.value)}
            placeholder="445"
            className="mt-1 p-2 border rounded w-full"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              // reset filters
              setQuery("");
              setDept("");
              setRoll("");
              fetchStudents();
            }}
            className="mt-1 px-4 py-2 bg-gray-200 rounded"
          >
            Reset
          </button>

          <button
            onClick={() => downloadCSV("students.csv", rows)}
            className="mt-1 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Download CSV
          </button>

          <button
            onClick={handleDeleteSelected}
            disabled={selected.size === 0 || loading}
            className={`mt-1 px-4 py-2 rounded ${selected.size === 0 ? "bg-gray-300 text-gray-600" : "bg-red-600 text-white"}`}
          >
            {loading ? "Please wait..." : `Delete Selected (${selected.size})`}
          </button>
        </div>
      </div>

      {loading ? (
        <div>Loading students...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">
                  <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />
                </th>
                <th className="px-4 py-2 text-left">Roll No</th>
                <th className="px-4 py-2 text-left">Exam No</th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Dept</th>
                <th className="px-4 py-2 text-left">Sem</th>
                <th className="px-4 py-2 text-left">Course name</th>
                <th className="px-4 py-2 text-left">Created At</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((s) => {
                const id = s.id || s._id;
                const checked = selected.has(id);
                return (
                  <tr key={id || Math.random()} className="border-t">
                    <td className="px-4 py-2">
                      <input type="checkbox" checked={checked} onChange={() => toggleSelect(id)} />
                    </td>
                    <td className="px-4 py-2">{s.roll_no}</td>
                    <td className="px-4 py-2">{s.exam_no}</td>
                    <td className="px-4 py-2">{s.name}</td>
                    <td className="px-4 py-2">{s.dept}</td>
                    <td className="px-4 py-2">{s.sem}</td>
                    <td className="px-4 py-2">{s.course_name}</td>
                    <td className="px-4 py-2">{s.created_at ? new Date(s.created_at).toLocaleString() : "-"}</td>
                  </tr>
                );
              })}

              {rows.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-4 text-center text-gray-500">
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
