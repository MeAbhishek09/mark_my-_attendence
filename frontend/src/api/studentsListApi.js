// frontend/src/api/studentsListApi.js
import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";

export function createStudent(payload) {
  return axios.post(`${BASE_URL}/api/v1/students/`, payload);
}

export function listStudents(params = {}) {
  // params: { q, dept, roll_no, limit, skip } - sends as query params
  return axios.get(`${BASE_URL}/api/v1/students/`, { params });
}
