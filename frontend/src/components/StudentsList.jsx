// frontend/src/components/StudentsList.jsx
import React, { useEffect, useState, useRef } from "react";
import { listStudents } from "../api/studentsListApi";

/*
Features:
- show all students (fetched)
- search by name / dept / roll_no (debounced)
- CSV export
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

  // client-side backup filtered list if API doesn't support server filtering
  const [filtered, setFiltered] = useState([]);

  // debounce
  const debounceRef = useRef(null);

  const fetchStudents = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      // Try to use server-side filtering if supported by backend (params can be empty)
      const res = await listStudents(params);
      const data = res.data || [];
      setStudents(data);
      setFiltered(data);
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
      // Try server-side search by providing query params (backend could ignore them)
      const params = {};
      if (query) params.q = query;
      if (dept) params.dept = dept;
      if (roll) params.roll_no = roll;

      // We call server first; if backend ignores params, we fallback to client-side filter.
      fetchStudents(params).then(() => {
        // client-side fallback filtering
        const q = (query || "").toLowerCase();
        const d = (dept || "").toLowerCase();
        const r = (roll || "").toLowerCase();

        const newFiltered = (students || []).filter((s) => {
          const matchQ = !q || (s.name || "").toLowerCase().includes(q);
          const matchD = !d || (s.dept || "").toLowerCase().includes(d);
          const matchR = !r || (s.roll_no || "").toLowerCase().includes(r);
          return matchQ && matchD && matchR;
        });
        setFiltered(newFiltered);
      });
    }, 350); // 350ms debounce

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, dept, roll]);

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
            onClick={() => downloadCSV("students.csv", filtered.length ? filtered : students)}
            className="mt-1 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Download CSV
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
                    <th className="px-4 py-2 text-left">Roll No</th>
                    <th className="px-4 py-2 text-left">Exam No</th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Dept</th>
                    <th className="px-4 py-2 text-left">Sem</th>
                    <th className="px-4 py-2 text-left">course name</th>
                    <th className="px-4 py-2 text-left">Created At</th>
                </tr>
                </thead>

                <tbody>
                {(filtered.length ? filtered : students).map((s) => (
                    <tr key={s.id || s._id} className="border-t">
                    <td className="px-4 py-2">{s.roll_no}</td>
                    <td className="px-4 py-2">{s.exam_no}</td>
                    <td className="px-4 py-2">{s.name}</td>
                    <td className="px-4 py-2">{s.dept}</td>
                    <td className="px-4 py-2">{s.sem}</td>
                    <td className="px-4 py-2">{s.course_name}</td>
                    <td className="px-4 py-2">
                        {s.created_at ? new Date(s.created_at).toLocaleString() : "-"}
                    </td>
                    </tr>
                ))}

                {(filtered.length ? filtered : students).length === 0 && (
                    <tr>
                    <td colSpan="7" className="p-4 text-center text-gray-500">
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
