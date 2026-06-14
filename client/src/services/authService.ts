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

  async registerOwner(formData: FormData) {
    const response = await api.post('/auth/register-owner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async forgotPassword(email: string) {
    const response = await api.post('/otp/send-reset', { email });
    return response.data;
  },

  async verifyResetOTP(email: string, otp: string) {
    const response = await api.post('/otp/verify-reset', { email, otp });
    return response.data;
  },

  async resetPassword(email: string, otp: string, newPassword: string) {
    const response = await api.post('/auth/reset-password', { email, otp, newPassword });
    return response.data;
  },

  async updateProfile(data: { name: string; email: string; phone?: string }) {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    const response = await api.put('/auth/change-password', data);
    return response.data;
  },

  async uploadProfilePhoto(formData: FormData) {
    const response = await api.post('/auth/profile-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
