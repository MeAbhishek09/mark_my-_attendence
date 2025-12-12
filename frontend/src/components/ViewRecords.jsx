import React, { useEffect, useState } from "react";
import { exportAttendance, attendanceToday } from "../api/attendanceApi";

export default function ViewRecords() {
  const [filters, setFilters] = useState({ dept: "", sem: "", name: "", from: "", to: "" });
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadToday();
  }, []);

  async function loadToday() {
    try {
      const data = await attendanceToday();
      setPreview(data);
    } catch (e) {
      console.error(e);
      setPreview([]);
    }
  }

  const handleDownload = async () => {
    setLoading(true);
    try {
      const blob = await exportAttendance(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filename = `attendance_${new Date().toISOString().slice(0,10)}.csv`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("Failed to download CSV: " + (e?.response?.data || e.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">View / Export Records</h2>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <input name="dept" placeholder="Department" value={filters.dept} onChange={handleChange} className="border p-2" />
        <input name="sem" placeholder="Semester" value={filters.sem} onChange={handleChange} className="border p-2" />
        <input name="name" placeholder="Student name" value={filters.name} onChange={handleChange} className="border p-2" />
        <div>
          <input name="from" type="date" value={filters.from} onChange={handleChange} className="border p-2 w-full" />
          <input name="to" type="date" value={filters.to} onChange={handleChange} className="border p-2 w-full mt-2" />
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={handleDownload} disabled={loading}>
          {loading ? "Downloading..." : "Download CSV"}
        </button>
        <button className="bg-gray-200 px-3 py-1 rounded" onClick={loadToday}>Refresh Preview (Today)</button>
      </div>

      <div className="bg-white rounded shadow p-4">
        <h3 className="font-semibold mb-2">Preview (today)</h3>
        {preview.length === 0 && <div>No records for today</div>}
        {preview.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-1">Student</th>
                <th className="text-left p-1">In Time</th>
                <th className="text-left p-1">Out Time</th>
                <th className="text-left p-1">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((r, i) => (
                <tr key={i}>
                  <td className="p-1">{r.student_name || r.student_id}</td>
                  <td className="p-1">{r.in_time}</td>
                  <td className="p-1">{r.out_time}</td>
                  <td className="p-1">{r.confidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
