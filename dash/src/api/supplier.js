// src/api/supplier.js
import axios from 'axios';

const API_URL = '/api/suppliers';

export const getSuppliers = () => axios.get(API_URL);
export const createSupplier = (data) => axios.post(API_URL, data);
export const updateSupplier = (id, data) => axios.put(`${API_URL}/${id}`, data);
export const deleteSupplier = (id) => axios.delete(`${API_URL}/${id}`);
export const getSupplierProducts = (supplierId) => axios.get(`${API_URL}/${supplierId}/products`);
export const getSupplierLogs = (supplierId) => axios.get(`${API_URL}/${supplierId}/logs`);
export const getSupplierKPIs = () => axios.get(`${API_URL}/kpis`);
