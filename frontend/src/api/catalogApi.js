export async function fetchDepartments() {
  // simple hard-coded list; replace with API call if you have backend endpoints
  return ["CSE", "ECE", "ME", "CE"];
}

export async function fetchSubjects(dept, sem) {
  // sample mapping; in real app call backend
  const all = {
    "CSE-3": [{ code: "CS301", name: "Data Structures" }, { code: "CS302", name: "DBMS" }],
    "CSE-4": [{ code: "CS401", name: "AI" }]
  };
  return all[`${dept}-${sem}`] || [{ code: "GEN", name: "General" }];
}
