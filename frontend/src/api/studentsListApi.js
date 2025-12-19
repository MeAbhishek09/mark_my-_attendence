// frontend/src/api/studentsListApi.js
import axios from "axios";


// const BASE_URL = "http://127.0.0.1:8000";
const BASE_URL = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export function createStudent(payload) {
  return axios.post(`${BASE_URL}/api/v1/students/`, payload);
}

export function listStudents(params = {}) {
  // params: { q, dept, roll_no, limit, skip } - sends as query params
  return axios.get(`${BASE_URL}/api/v1/students/`, { params });
}

// Bulk delete accepts array of string ids
export function deleteStudents(ids = []) {
  // axios supports sending body with DELETE
  return axios.delete(`${BASE_URL}/api/v1/students/`, { data: { ids } });
}