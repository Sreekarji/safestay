import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error: any) => Promise.reject(error));

api.interceptors.response.use((response: any) => response, (error: any) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
  const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Something went wrong';
  return Promise.reject(new Error(message));
});

export default api;

// Helper: unwrap backend { success, data } responses
export function unwrap(res: any) {
  const body = res.data;
  if (body && body.success !== undefined && body.data !== undefined) return body.data;
  return body;
}
