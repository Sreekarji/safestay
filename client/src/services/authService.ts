import api from './api';
import type { LoginData, RegisterData, OTPData, User } from '@/types';

export const authService = {
  async register(data: RegisterData) {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },

  async login(data: LoginData) {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  async verifyOTP(data: OTPData) {
    const response = await api.post('/otp/verify-email', data);
    return response.data;
  },

  async getProfile() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async sendVerificationOTP(email: string) {
    const response = await api.post('/otp/send-verification', { email });
    return response.data;
  },
};
