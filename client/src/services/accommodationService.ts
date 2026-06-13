import api from './api';
import type { Accommodation } from '@/types';

export const accommodationService = {
  async getAccommodations() {
    const response = await api.get('/accommodations');
    return response.data as Accommodation[];
  },

  async getAccommodation(id: string) {
    const response = await api.get(`/accommodations/${id}`);
    return response.data as Accommodation;
  },
};
