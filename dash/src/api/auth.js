// src/api/auth.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',  // Change to your backend URL
});

export const loginUser = (data) => API.post('/auth/login', data);
export const registerUser = (data) => API.post('/auth/register', data);
