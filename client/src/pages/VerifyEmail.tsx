import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { OTPVerification } from '@/components/auth/OTPVerification';
import { useAuthStore } from '@/stores/authStore';
import { API_URL } from '@/lib/constants';

export function VerifyEmail() {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (otp: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/otp/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Verification failed');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setError(null);
      const res = await fetch(`${API_URL}/api/otp/resend-verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to resend OTP');
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              <Shield className="h-10 w-10 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Verify Your Email</h1>
            <p className="text-sm text-slate-500 mt-1">Enter the 6-digit code sent to your email</p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <OTPVerification
            onSubmit={handleSubmit}
            onResend={handleResend}
            loading={loading}
            email={user?.email}
          />
        </div>
      </motion.div>
    </div>
  );
}
