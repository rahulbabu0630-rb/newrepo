import axios from "axios";

const API_URL = "http://localhost:8080/employees"; // Backend URL

export const fetchEmployees = async (page = 0, size = 10) => {
  const response = await axios.get(`${API_URL}/list?page=${page}&size=${size}`);
  return response.data;
};

export const searchEmployee = async (name) => {
  const response = await axios.get(`${API_URL}/get`, { params: { name } });
  return response.data;
};

export const addEmployee = async (employeeData) => {
  const response = await axios.post(`${API_URL}/add`, employeeData);
  return response.data;
};

export const updateEmployee = async (id, updatedData) => {
  const response = await axios.put(`${API_URL}/update/${id}`, updatedData);
  return response.data;
};

export const deleteEmployee = async (id) => {
  await axios.delete(`${API_URL}/delete/${id}`);
};
