import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, Building2, Users, Star } from 'lucide-react';
import { OwnerRegisterForm } from '@/components/auth/OwnerRegisterForm';
import { useAuthStore } from '@/stores/authStore';
import { API_URL } from '@/lib/constants';
import type { OwnerRegisterFormData } from '@/lib/validations';

const API = API_URL;

export function OwnerRegister() {
  const navigate = useNavigate();
  const { error, clearError } = useAuthStore();
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const benefits = [
    { icon: CheckCircle, text: 'Public Accountability', desc: 'Respond to student concerns publicly and show your commitment.' },
    { icon: Star, text: 'Boost Your Rating', desc: 'Resolve issues quickly to improve your property\'s safety score.' },
    { icon: Building2, text: 'Competitive Edge', desc: 'Stand out from unverified competitors with a verified profile.' },
    { icon: Users, text: 'Quality Tenants', desc: 'Attract safety-conscious tenants who value transparency.' },
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

      const res = await fetch(`${API}/api/auth/register-owner`, {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || result.message || 'Registration failed');
      }

      // Store token and user
      if (result.data?.token) {
        useAuthStore.getState().setToken(result.data.token);
        useAuthStore.getState().setUser(result.data.user);
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
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Registration Submitted!</h1>
            <p className="text-slate-500 mb-6">
              Your owner account is under review. We'll verify your documents and email you within 24-48 hours.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
            >
              Go to Sign In
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
            Start Building <span className="text-primary-400">Tenant Trust.</span>
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
            <h1 className="text-2xl font-bold text-slate-900 text-center mb-1">Register Your Property</h1>
            <p className="text-sm text-slate-500 text-center mb-6">Join the growing platform for student safety</p>

            <OwnerRegisterForm onSubmit={handleSubmit} error={localError || error} />

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 font-medium">Sign in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
