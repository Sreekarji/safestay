import { create } from 'zustand';
import type { Report, QueryParams } from '@/types';
import { reportService } from '@/services/reportService';

interface ReportState {
  reports: Report[];
  currentReport: Report | null;
  loading: boolean;
  error: string | null;
  filters: QueryParams;
  pagination: { total: number; page: number; limit: number; pages: number };
  fetchReports: (params?: QueryParams) => Promise<void>;
  fetchReport: (id: string) => Promise<void>;
  createReport: (data: any) => Promise<any>;
  updateReportStatus: (id: string, status: string) => Promise<void>;
  setFilters: (filters: QueryParams) => void;
}

export const useReportStore = create<ReportState>((set, get) => ({
  reports: [],
  currentReport: null,
  loading: false,
  error: null,
  filters: {},
  pagination: { total: 0, page: 1, limit: 20, pages: 0 },

  fetchReports: async (params?) => {
    set({ loading: true, error: null });
    try {
      const result = await reportService.getReports({ ...get().filters, ...params });
      const reports = result?.reports || result || [];
      const pagination = result?.pagination || { total: reports.length, page: 1, limit: 20, pages: 1 };
      set({ reports, pagination, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchReport: async (id) => {
    set({ loading: true, error: null });
    try {
      const report = await reportService.getReport(id);
      set({ currentReport: report, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  createReport: async (data) => {
    set({ loading: true, error: null });
    try {
      const result = await reportService.createReport(data);
      set({ loading: false });
      return result;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  updateReportStatus: async (id, status) => {
    try {
      await reportService.updateReport(id, { status } as any);
      await get().fetchReports();
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  setFilters: (filters) => set({ filters }),
}));
