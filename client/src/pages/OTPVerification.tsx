import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { OTPVerification as OTPForm } from '@/components/auth/OTPVerification';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';
import toast from 'react-hot-toast';

export function OTPVerificationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading } = useAuthStore();
  return (
    <div className="min-h-screen bg-canvas-soft dark:bg-[#0a0a0a] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }} className="w-full max-w-md">
        <div className="bg-canvas dark:bg-[#111111] rounded-lg card-shadow-4 p-8 border border-hairline dark:border-[#333333]">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-canvas-soft dark:bg-[#1a1a1a] border border-hairline dark:border-[#333333]">
                <Shield className="h-6 w-6 text-ink dark:text-white" strokeWidth={2} />
              </div>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink dark:text-white">{t('auth.verifyYourEmail')}</h1>
          </div>
          <OTPForm
            onSubmit={async (otp: string) => {
              try {
                await authService.verifyOTP({ email: user?.email || '', otp });
                toast.success('Email verified!');
                navigate('/dashboard');
              } catch (err: any) {
                toast.error(err.message || 'Verification failed');
              }
            }}
            onResend={() => toast.success('OTP resent')}
            loading={loading}
            email={user?.email}
          />
        </div>
      </motion.div>
    </div>
  );
}
