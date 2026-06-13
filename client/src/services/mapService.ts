import api from './api';
import type { MapMarker } from '@/types';

export const mapService = {
  async getMarkers() {
    const response = await api.get('/map/markers');
    return response.data as MapMarker[];
  },

  async getAreaAnalytics(areaId: string) {
    const response = await api.get(`/analytics/area/${areaId}`);
    return response.data;
  },
};
