import api from './api';

function unwrap(res: any) {
  const body = res.data;
  if (body && body.success !== undefined && body.data !== undefined) return body.data;
  return body;
}

export const accommodationService = {
  async getAccommodations(params?: any) {
    const res = await api.get('/accommodations', { params });
    return unwrap(res);
  },

  async getAccommodation(id: string) {
    const res = await api.get(`/accommodations/${id}`);
    return unwrap(res);
  },

  async getDropdown() {
    const res = await api.get('/accommodations/dropdown');
    return unwrap(res);
  },

  async getWithLocation() {
    const res = await api.get('/accommodations/with-location');
    return unwrap(res);
  },
};
