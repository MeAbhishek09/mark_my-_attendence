import React, { useEffect, useState } from "react";
import { exportAttendance, attendanceToday } from "../api/attendanceApi";
import { RefreshCw, Calendar } from "lucide-react";

export default function ViewRecords() {
  const [filters, setFilters] = useState({
    dept: "",
    sem: "",
    name: "",
    from: "",
    to: "",
  });

  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState("today"); // today | week | month | year

  /* =========================
     LOAD PREVIEW
  ========================= */
  useEffect(() => {
    loadPreview();
  }, [range]);

  async function loadPreview() {
    try {
      const data = await attendanceToday(range);
      setPreview(data);
    } catch (e) {
      console.error(e);
      setPreview([]);
    }
  }

  /* =========================
     DOWNLOAD CSV
  ========================= */
  const handleDownload = async () => {
    setLoading(true);
    try {
      const blob = await exportAttendance(filters,range);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("Failed to download CSV");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) =>
    setFilters({ ...filters, [e.target.name]: e.target.value });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">View / Export Records</h2>

      {/* FILTERS */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <input name="dept" placeholder="Department" value={filters.dept} onChange={handleChange} className="border p-2" />
        <input name="sem" placeholder="Semester" value={filters.sem} onChange={handleChange} className="border p-2" />
        <input name="name" placeholder="Student name" value={filters.name} onChange={handleChange} className="border p-2" />
        <div>
          <input name="from" type="date" value={filters.from} onChange={handleChange} className="border p-2 w-full" />
          <input name="to" type="date" value={filters.to} onChange={handleChange} className="border p-2 w-full mt-2" />
        </div>
      </div>

      {/* ACTION BAR */}
      <div className="mb-4 flex items-center gap-3">
        <button
          className="bg-blue-600 text-white px-4 py-1 rounded"
          onClick={handleDownload}
          disabled={loading}
        >
          {loading ? "Downloading..." : "Download CSV"}
        </button>

        {/* RANGE DROPDOWN */}
        <div className="flex items-center gap-2">
          <Calendar size={18} />
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="border p-1 rounded"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>

        {/* REFRESH ICON */}
        <button
          onClick={loadPreview}
          className="p-2 border rounded hover:bg-gray-100"
          title="Refresh"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* PREVIEW TABLE */}
      <div className="bg-white rounded shadow p-4">
        <h3 className="font-semibold mb-2">
          Preview ({range})
        </h3>

        {preview.length === 0 && <div>No records found</div>}

        {preview.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-1">Roll No</th>
                <th className="text-left p-1">Name</th>
                <th className="text-left p-1">Dept</th>
                <th className="text-left p-1">Sem</th>
                <th className="text-left p-1">Subject</th>
                <th className="text-left p-1">In Time</th>
                <th className="text-left p-1">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((r, i) => (
                <tr key={i}>
                  <td className="p-1">{r.roll_no}</td>
                  <td className="p-1">{r.student_name}</td>
                  <td className="p-1">{r.dept}</td>
                  <td className="p-1">{r.sem}</td>
                  <td className="p-1">{r.subject}</td>
                  <td className="p-1">
                    {r.in_time &&
                      new Date(r.in_time).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: true,
                      })}
                  </td>

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
