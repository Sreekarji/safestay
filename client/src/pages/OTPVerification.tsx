import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { OTPVerification as OTPForm } from '@/components/auth/OTPVerification';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

export function OTPVerificationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading } = useAuthStore();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3"><Shield className="h-10 w-10 text-primary-600" /></div>
            <h1 className="text-2xl font-bold text-slate-900">{t('auth.verifyYourEmail')}</h1>
          </div>
          <OTPForm onSubmit={async () => { toast.success('Verified!'); navigate('/dashboard'); }} onResend={() => toast.success('OTP resent')} loading={loading} email={user?.email} />
        </div>
      </motion.div>
    </div>
  );
}
