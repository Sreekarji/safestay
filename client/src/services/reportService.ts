import api, { unwrap } from './api';
import type { Report, QueryParams } from '@/types';

export const reportService = {
  async createReport(data: any) {
    const res = await api.post('/reports', data);
    return unwrap(res);
  },

  async getReports(params?: QueryParams) {
    const res = await api.get('/reports', { params });
    return unwrap(res);
  },

  async getReport(id: string) {
    const res = await api.get(`/reports/${id}`);
    return unwrap(res);
  },

  async updateReport(id: string, data: Partial<Report>) {
    const res = await api.put(`/reports/${id}`, data);
    return unwrap(res);
  },

  async deleteReport(id: string) {
    const res = await api.delete(`/reports/${id}`);
    return unwrap(res);
  },

  async getMyReports(params?: any) {
    const res = await api.get('/reports/my-reports', { params });
    return unwrap(res);
  },

  async upvoteReport(id: string) {
    const res = await api.post(`/reports/${id}/upvote`);
    return unwrap(res);
  },
};
