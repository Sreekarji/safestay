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
  const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Something went wrong';
  return Promise.reject(new Error(message));
});

export default api;

// Helper: unwrap backend { success, data } responses
function unwrap(res: any) {
  const body = res.data;
  if (body && body.success !== undefined && body.data !== undefined) return body.data;
  return body;
}

// Map fetch function
export async function fetchMapMarkersWithHistory() {
  const data = await unwrap(await api.get('/accommodations/with-location'));
  return Array.isArray(data) ? data : [];
}

// Dashboard fetch functions
export async function fetchDashboardStats() {
  try {
    return await unwrap(await api.get('/analytics/stats'));
  } catch {
    return { totalReports: 0, pending: 0, verified: 0, resolved: 0 };
  }
}

export async function fetchSSITrend() {
  try {
    return await unwrap(await api.get('/analytics/dashboard'));
  } catch {
    return { trend: [] };
  }
}

export async function fetchAreaRisks() {
  try {
    return await unwrap(await api.get('/analytics/area-risk'));
  } catch {
    return [];
  }
}

export async function fetchCategoryBreakdown() {
  try {
    return await unwrap(await api.get('/analytics/dashboard'));
  } catch {
    return { categoryBreakdown: [] };
  }
}

export async function fetchRecentReports() {
  const data = await unwrap(await api.get('/reports?limit=10'));
  return data?.reports || data || [];
}
