import api from './api';
import type { LoginData, RegisterData, OTPData, User } from '@/types';

export const authService = {
  async register(data: RegisterData) {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async login(data: LoginData) {
    const response = await api.post('/auth/login', data);
    return response.data as { token: string; user: User };
  },

  async verifyOTP(data: OTPData) {
    const response = await api.post('/auth/verify-otp', data);
    return response.data;
  },

  async getProfile() {
    const response = await api.get('/auth/me');
    return response.data as User;
  },
};
