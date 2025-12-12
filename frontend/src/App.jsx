import React, { useState } from "react";
import Navbar from "./components/Navbar";
import HomeLanding from "./components/HomeLanding";
import MarkAttendance from "./components/MarkAttendance";
import AddStudent from "./components/AddStudent";
import ViewRecords from "./components/ViewRecords";
import StudentsList from "./components/StudentsList";

export default function App() {
  const [page, setPage] = useState("home");
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar page={page} setPage={setPage} />
      <main className="p-6">
        {page === "home" && <HomeLanding onMarkClick={() => setPage("mark")} />}
        {page === "mark" && <MarkAttendance />}
        {page === "add" && <AddStudent />}
        {page === "students" && <StudentsList />}
        {page === "view" && <ViewRecords />}
      </main>
    </div>
  );
}
