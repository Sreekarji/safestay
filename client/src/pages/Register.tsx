import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Building2 } from 'lucide-react';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { useAuthStore } from '@/stores/authStore';
import type { StudentRegisterFormData } from '@/lib/validations';

export function Register() {
  const navigate = useNavigate();
  const { register: registerUser, error, clearError } = useAuthStore();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (data: StudentRegisterFormData) => {
    try {
      setLocalError(null);
      clearError();
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: '0000000000',
        role: 'student',
      });
      navigate('/verify-otp');
    } catch (err: any) {
      setLocalError(err.message || 'Registration failed');
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
            <h1 className="text-2xl font-bold text-slate-900">Create Your Account</h1>
            <p className="text-sm text-slate-500 mt-1">Join as a student to report and track safety issues</p>
          </div>

          <RegisterForm onSubmit={handleSubmit} error={localError || error} />

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Are you a property owner?{' '}
              <Link to="/owner/register" className="text-primary-600 font-medium inline-flex items-center gap-1 hover:underline">
                <Building2 className="h-3.5 w-3.5" /> Register as Owner
              </Link>
            </p>
          </div>

          <p className="mt-4 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-medium">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
