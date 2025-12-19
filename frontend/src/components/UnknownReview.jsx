// import React, { useEffect, useState } from "react";
// import { fetchUnknowns, unknownUrl, assignUnknown, deleteUnknown } from "../api/unknownsApi";
// import axios from "axios";

// const UnknownReview = ({ studentsApiUrl = "http://127.0.0.1:8000/api/v1/students/" }) => {
//   const [unknowns, setUnknowns] = useState([]);
//   const [students, setStudents] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [selected, setSelected] = useState({}); // filename -> student_id

//   useEffect(() => {
//     loadData();
//     // eslint-disable-next-line
//   }, []);

//   async function loadData() {
//     setLoading(true);
//     try {
//       const u = await fetchUnknowns();
//       setUnknowns(u);
//       const s = await axios.get(studentsApiUrl);
//       setStudents(s.data);
//     } catch (e) {
//       console.error(e);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function handleAssign(filename) {
//     const studentId = selected[filename];
//     if (!studentId) {
//       alert("Choose a student to assign");
//       return;
//     }
//     try {
//       await assignUnknown(filename, studentId);
//       await loadData();
//       alert("Assigned.");
//     } catch (e) {
//       console.error(e);
//       alert("Failed to assign: " + (e?.response?.data?.detail || e.message));
//     }
//   }

//   async function handleDelete(filename) {
//     if (!confirm("Delete this thumbnail?")) return;
//     try {
//       await deleteUnknown(filename);
//       await loadData();
//     } catch (e) {
//       console.error(e);
//       alert("Failed to delete");
//     }
//   }

//   return (
//     <div className="p-4">
//       <h2 className="text-2xl font-bold mb-4">Unknown Faces Review</h2>
//       {loading && <div>Loading...</div>}
//       {!loading && unknowns.length === 0 && <div>No unknown faces.</div>}

//       <div className="grid grid-cols-3 gap-4">
//         {unknowns.map((u) => (
//           <div key={u.filename} className="border rounded p-2 shadow-sm bg-white">
//             <img
//               src={unknownUrl(u.filename)}
//               alt={u.filename}
//               className="w-full h-48 object-cover mb-2"
//             />

//             <div className="mb-2">
//               <select
//                 className="w-full border px-2 py-1"
//                 value={selected[u.filename] ?? ""}
//                 onChange={(e) => setSelected({ ...selected, [u.filename]: e.target.value })}
//               >
//                 <option value="">-- Assign to student --</option>
//                 {students.map((s) => (
//                   <option key={s.id} value={s.id}>
//                     {s.name} ({s.roll_no})
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div className="flex gap-2">
//               <button
//                 className="flex-1 bg-green-600 text-white px-3 py-1 rounded"
//                 onClick={() => handleAssign(u.filename)}
//               >
//                 Assign
//               </button>
//               <button
//                 className="flex-1 bg-red-500 text-white px-3 py-1 rounded"
//                 onClick={() => handleDelete(u.filename)}
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default UnknownReview;
