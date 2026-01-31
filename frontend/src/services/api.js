import axios from 'axios';

/*
// Determinar URL da API baseada no ambiente
const getAPIUrl = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol; // http: ou https:
  
  // Se for domínio customizado ou Render
  if (hostname === 'lojadabeth.com' || hostname === 'www.lojadabeth.com' || hostname.includes('onrender.com')) {
    // Em produção, apontar para o backend específico
    return 'https://vendas-app-dany.onrender.com/api';
  }
  
  // Se for localhost ou 127.0.0.1 (desenvolvimento local no PC)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:5000/api`;
  }
  
  // Se for um IP (celular ou outro dispositivo acessando o PC)
  if (hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    return `${protocol}//${hostname}:5000/api`;
  }
  
  // Fallback para produção (qualquer outro domínio)
  return `${protocol}//${hostname}/api`;
};

const API_URL = getAPIUrl();

const api = axios.create({
  baseURL: API_URL,
});
*/

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  register: (username, email, password) =>
    api.post('/auth/register', { username, email, password }),
  login: (username, password) =>
    api.post('/auth/login', { username, password }),
  changePassword: (username, currentPassword, newPassword) =>
    api.post('/auth/change-password', { username, currentPassword, newPassword }),
};

export const clientService = {
  getAll: () => api.get('/clients'),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
};

export const productService = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export const salesService = {
  getAll: () => api.get('/sales'),
  getById: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  getByDateRange: (startDate, endDate) =>
    api.get(`/sales/date-range?startDate=${startDate}&endDate=${endDate}`),
  deleteItem: (itemId) => api.delete(`/sales/item/${itemId}`),
  updateItemQuantity: (itemId, quantity) => api.put(`/sales/item/${itemId}`, { quantity }),
  updatePaymentMethod: (vendaId, formaPagamento) => api.put(`/sales/${vendaId}/payment-method`, { forma_pagamento: formaPagamento }),
};

export const paymentService = {
  register: (data) => api.post('/payments', data),
  getByVenda: (venda_id) => api.get(`/payments/${venda_id}`),
};

export const lotesService = {
  getAll: () => api.get('/lotes'),
  getById: (id) => api.get(`/lotes/${id}`),
  getLoteAberto: () => api.get('/lotes/aberto/atual'),
  create: (data) => api.post('/lotes', data),
  closeLote: (id) => api.put(`/lotes/${id}/fechar`),
  reopenLote: (id) => api.put(`/lotes/${id}/reabrir`),
  delete: (id) => api.delete(`/lotes/${id}`),
  deleteEmpty: (id) => api.delete(`/lotes/${id}/vazio`),
  getStats: (id) => api.get(`/lotes/${id}/stats`),
};

export const wishlistService = {
  getAll: () => api.get('/wishlist'),
  getById: (id) => api.get(`/wishlist/${id}`),
  create: (data) => api.post('/wishlist', data),
  update: (id, data) => api.put(`/wishlist/${id}`, data),
  delete: (id) => api.delete(`/wishlist/${id}`),
};

export default api;
