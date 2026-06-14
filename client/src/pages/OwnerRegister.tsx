import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, Building2, Users, Star } from 'lucide-react';
import { OwnerRegisterForm } from '@/components/auth/OwnerRegisterForm';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';
import type { OwnerRegisterFormData } from '@/lib/validations';
import { useTranslation } from 'react-i18next';

export function OwnerRegister() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { error, clearError } = useAuthStore();
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const benefits = [
    { icon: CheckCircle, text: t('owner.register.publicAccountability'), desc: t('owner.register.publicAccountabilityDesc') },
    { icon: Star, text: t('owner.register.boostRating'), desc: t('owner.register.boostRatingDesc') },
    { icon: Building2, text: t('owner.register.competitiveEdge'), desc: t('owner.register.competitiveEdgeDesc') },
    { icon: Users, text: t('owner.register.qualityTenants'), desc: t('owner.register.qualityTenantsDesc') },
  ];

  const handleSubmit = async (data: OwnerRegisterFormData & { step: number; documents?: { governmentId: File | null; propertyProof: File | null; businessRegistration: File | null } }) => {
    try {
      setLocalError(null);
      clearError();

      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('phone', data.phone);
      formData.append('password', data.password);

      // Attach documents if provided
      if (data.documents) {
        if (data.documents.governmentId) formData.append('governmentId', data.documents.governmentId);
        if (data.documents.propertyProof) formData.append('propertyProof', data.documents.propertyProof);
        if (data.documents.businessRegistration) formData.append('businessRegistration', data.documents.businessRegistration);
      }

      const result = await authService.registerOwner(formData);

      // Store token and user
      const payload = result.data || result;
      if (payload.token) {
        useAuthStore.getState().setToken(payload.token);
        useAuthStore.getState().setUser(payload.user);
      }

      setSubmitted(true);
    } catch (err: any) {
      setLocalError(err.message || 'Registration failed');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('owner.register.submitted')}</h1>
            <p className="text-slate-500 mb-6">
              {t('owner.register.submittedDesc')}
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
            >
              {t('owner.register.goToSignIn')}
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      {/* Left Panel - Benefits */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-800 to-slate-900 text-white p-12 flex-col justify-center">
        <div className="max-w-md">
          <div className="flex items-center gap-2 mb-8">
            <Shield className="h-8 w-8 text-primary-400" />
            <span className="text-2xl font-bold">SafeStay</span>
          </div>
          <h2 className="text-3xl font-extrabold leading-tight mb-4">
            {t('owner.register.startBuilding')} <span className="text-primary-400">{t('owner.register.tenantTrust')}</span>
          </h2>
          <div className="space-y-6 mt-8">
            {benefits.map((b, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-500/20">
                  <b.icon className="h-5 w-5 text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{b.text}</h3>
                  <p className="text-sm text-slate-400 mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
          {/* Mobile-only logo */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <Shield className="h-7 w-7 text-primary-600" />
            <span className="text-xl font-bold text-slate-900">SafeStay</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-2xl font-bold text-slate-900 text-center mb-1">{t('owner.register.title')}</h1>
            <p className="text-sm text-slate-500 text-center mb-6">{t('owner.register.subtitle')}</p>

            <OwnerRegisterForm onSubmit={handleSubmit} error={localError || error} />

            <p className="mt-6 text-center text-sm text-slate-500">
              {t('owner.register.hasAccount')}{' '}
              <Link to="/login" className="text-primary-600 font-medium">{t('owner.register.signIn')}</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
