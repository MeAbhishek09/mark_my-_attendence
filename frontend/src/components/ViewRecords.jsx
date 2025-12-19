import React, { useEffect, useState } from "react";
import { exportAttendance, attendanceToday } from "../api/attendanceApi";
import { RefreshCw, Calendar, Download } from "lucide-react";

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
     LOAD PREVIEW (UNCHANGED)
  ========================= */
  useEffect(() => {
    loadPreview();
  }, [range]);

async function loadPreview() {
  try {
    const data = await attendanceToday(range);

    // ✅ FORCE array
    if (Array.isArray(data)) {
      setPreview(data);
    } else if (Array.isArray(data?.records)) {
      setPreview(data.records);
    } else if (Array.isArray(data?.data)) {
      setPreview(data.data);
    } else {
      setPreview([]); // fallback
    }
  } catch (e) {
    console.error(e);
    setPreview([]);
  }
}

  // async function loadPreview() {
  //   try {
  //     const data = await attendanceToday(range);
  //     setPreview(data);
  //   } catch (e) {
  //     console.error(e);
  //     setPreview([]);
  //   }
  // }

  const filteredPreview = preview.filter((r) => {
  const matchDept =
    !filters.dept ||
    r.dept?.toLowerCase().includes(filters.dept.toLowerCase());

  const matchSem =
    !filters.sem ||
    String(r.sem).includes(filters.sem);

  const matchName =
    !filters.name ||
    r.student_name?.toLowerCase().includes(filters.name.toLowerCase());

  return matchDept && matchSem && matchName;
});


  /* =========================
     DOWNLOAD CSV (UNCHANGED)
  ========================= */
  const handleDownload = async () => {
    setLoading(true);
    try {
      const blob = await exportAttendance(filters, range);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
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

  /* =========================
     UI
  ========================= */
  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            View / Export Records
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Filter, preview and download attendance records
          </p>
        </div>

        {/* FILTER CARD */}
        <div className="bg-white rounded-xl shadow p-4 md:p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              name="dept"
              placeholder="Department"
              value={filters.dept}
              onChange={handleChange}
              className="border p-2 rounded focus:ring-2 focus:ring-blue-500"
            />
            <input
              name="sem"
              placeholder="Semester"
              value={filters.sem}
              onChange={handleChange}
              className="border p-2 rounded focus:ring-2 focus:ring-blue-500"
            />
            <input
              name="name"
              placeholder="Student name"
              value={filters.name}
              onChange={handleChange}
              className="border p-2 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <input
                name="from"
                type="date"
                value={filters.from}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              <input
                name="to"
                type="date"
                value={filters.to}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
            </div>
          </div>
        </div>

        {/* ACTION BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-600" />
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="border p-2 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>

            <button
              onClick={loadPreview}
              className="p-2 border rounded hover:bg-gray-100"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          <button
            onClick={handleDownload}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded text-white
              ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
          >
            <Download size={16} />
            {loading ? "Downloading..." : "Download CSV"}
          </button>
        </div>

        {/* PREVIEW TABLE */}
        <div className="bg-white rounded-xl shadow p-4 md:p-6">
          <h3 className="font-semibold mb-4 text-lg">
            Preview ({range})
          </h3>

          {filteredPreview.length === 0 && (
            <div className="text-gray-500">No records found</div>
          )}


          {preview.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">Roll No</th>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Dept</th>
                    <th className="p-2 text-left">Sem</th>
                    <th className="p-2 text-left">Subject</th>
                    <th className="p-2 text-left">In Time</th>
                    <th className="p-2 text-left">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPreview.map((r, i) => (
                    <tr
                      key={i}
                      className="border-t hover:bg-blue-50 transition"
                    >
                      <td className="p-2">{r.roll_no}</td>
                      <td className="p-2 font-medium">
                        {r.student_name}
                      </td>
                      <td className="p-2">{r.dept}</td>
                      <td className="p-2">{r.sem}</td>
                      <td className="p-2">{r.subject}</td>
                      <td className="p-2">
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
                      <td className="p-2">{r.confidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
