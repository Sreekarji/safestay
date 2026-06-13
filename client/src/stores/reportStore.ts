import { create } from 'zustand';
import type { Report, QueryParams } from '@/types';
import { reportService } from '@/services/reportService';

interface ReportState {
  reports: Report[];
  currentReport: Report | null;
  loading: boolean;
  error: string | null;
  filters: QueryParams;
  fetchReports: (params?: QueryParams) => Promise<void>;
  fetchReport: (id: string) => Promise<void>;
  createReport: (formData: FormData) => Promise<void>;
  updateReportStatus: (id: string, status: string) => Promise<void>;
  setFilters: (filters: QueryParams) => void;
}

export const useReportStore = create<ReportState>((set) => ({
  reports: [],
  currentReport: null,
  loading: false,
  error: null,
  filters: {},

  fetchReports: async (params) => {
    set({ loading: true, error: null });
    try {
      const data = await reportService.getReports(params);
      set({ reports: data.reports || data, loading: false });
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

  createReport: async (formData) => {
    set({ loading: true, error: null });
    try {
      await reportService.createReport(formData);
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  updateReportStatus: async (id, status) => {
    set({ loading: true, error: null });
    try {
      const updated = await reportService.updateReport(id, { status: status as any });
      set((state) => ({
        reports: state.reports.map((r) => (r.id === id ? updated : r)),
        currentReport: state.currentReport?.id === id ? updated : state.currentReport,
        loading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  setFilters: (filters) => set({ filters }),
}));
