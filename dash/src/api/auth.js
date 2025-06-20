// src/api/auth.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://192.168.9.16:5000/api',  // LAN-accessible backend URL
});

export const loginUser = (data) => API.post('/auth/login', data);
export const registerUser = (data) => API.post('/auth/register', data);
