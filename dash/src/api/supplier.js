// src/api/supplier.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/suppliers`
  : `${window.location.origin}/api/suppliers` || 'https://nbs-sia-serverr.vercel.app/api/suppliers'; 

// Accepts optional config for headers (e.g., Authorization)
export const getSuppliers = (config) => axios.get(API_URL, config);
export const createSupplier = (data, config) => axios.post(API_URL, data, config);
export const updateSupplier = (id, data, config) => axios.put(`${API_URL}/${id}`, data, config);
export const deleteSupplier = (id, config) => axios.delete(`${API_URL}/${id}`, config);
export const getSupplierProducts = (supplierId, config) => axios.get(`${API_URL}/${supplierId}/products`, config);
export const getSupplierLogs = (supplierId, config) => axios.get(`${API_URL}/${supplierId}/logs`, config);
export const getSupplierKPIs = (config) => axios.get(`${API_URL}/kpis`, config);
// New: Get books for a supplier
export const getBooksBySupplier = (supplierId, config) => axios.get(`${API_URL}/${supplierId}/books`, config);
