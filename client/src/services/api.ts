import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api',
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
  const message = error.response?.data?.message || error.message || 'Something went wrong';
  return Promise.reject(new Error(message));
});

export default api;

// Map fetch function
export async function fetchMapMarkersWithHistory() {
  const { data } = await api.get('/map/markers/history');
  return data.markers ?? data;
}

// Dashboard fetch functions
export async function fetchDashboardStats() {
  const { data } = await api.get('/analytics/dashboard');
  return data;
}

export async function fetchSSITrend() {
  const { data } = await api.get('/analytics/ssi-trend');
  return data.trend ?? data;
}

export async function fetchAreaRisks() {
  const { data } = await api.get('/analytics/area-risk');
  return data.areas ?? data;
}

export async function fetchCategoryBreakdown() {
  const { data } = await api.get('/analytics/categories');
  return data.categories ?? data;
}

export async function fetchRecentReports() {
  const { data } = await api.get('/reports?limit=10&sort=-createdAt');
  return data.reports ?? data;
}
