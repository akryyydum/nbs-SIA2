// src/api/auth.js
import axios from 'axios';

// Use Vite env variable if set, otherwise fallback to localhost
const API = axios.create({
  baseURL: 'http://192.168.9.16:5000/api', // Replace with your API base URL
});

export const loginUser = (data) => API.post('/auth/login', data);
export const registerUser = (data) => API.post('/auth/register', data);
export const getUsers = (token) => API.get('/users', { headers: { Authorization: `Bearer ${token}` } });
export const createUser = (data, token) => API.post('/users', data, { headers: { Authorization: `Bearer ${token}` } });
export const updateUser = (id, data, token) => API.put(`/users/${id}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const deleteUser = (id, token) => API.delete(`/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
