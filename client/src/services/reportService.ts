import api from './api';
import type { Report, QueryParams } from '@/types';

export const reportService = {
  async createReport(formData: FormData) {
    const response = await api.post('/reports', formData);
    return response.data as Report;
  },

  async getReports(params?: QueryParams) {
    const response = await api.get('/reports', { params });
    return response.data;
  },

  async getReport(id: string) {
    const response = await api.get(`/reports/${id}`);
    return response.data as Report;
  },

  async updateReport(id: string, data: Partial<Report>) {
    const response = await api.put(`/reports/${id}`, data);
    return response.data as Report;
  },

  async deleteReport(id: string) {
    const response = await api.delete(`/reports/${id}`);
    return response.data;
  },
};
