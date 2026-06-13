import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { useAuthStore } from '@/stores/authStore';

export function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register: registerUser, error, clearError } = useAuthStore();
  const [localError, setLocalError] = useState<string | null>(null);
  const handleSubmit = async (data: any) => {
    try { setLocalError(null); clearError(); await registerUser(data); navigate('/verify-otp'); }
    catch (err: any) { setLocalError(err.message || 'Registration failed'); }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3"><Shield className="h-10 w-10 text-primary-600" /></div>
            <h1 className="text-2xl font-bold text-slate-900">{t('auth.createAccount')}</h1>
          </div>
          <RegisterForm onSubmit={handleSubmit} error={localError || error} />
          <p className="mt-6 text-center text-sm text-slate-500">{t('auth.hasAccount')}{' '}<Link to="/login" className="text-primary-600 font-medium">{t('auth.signIn')}</Link></p>
        </div>
      </motion.div>
    </div>
  );
}
