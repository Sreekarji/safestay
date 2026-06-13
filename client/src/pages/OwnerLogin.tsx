import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, Building2, Shield, ArrowRight } from 'lucide-react';
import { loginSchema, type LoginFormData } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/authStore';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function OwnerLogin() {
  const navigate = useNavigate();
  const { clearError, loading } = useAuthStore();
  const [localError, setLocalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLocalError(null);
      clearError();
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Login failed');
      // Store token and user in authStore
      useAuthStore.getState().setToken(result.token);
      useAuthStore.getState().setUser(result.user);
      navigate('/owner/dashboard');
    } catch (err: any) {
      setLocalError(err.message || 'Login failed');
    }
  };

  const benefits = [
    { icon: Building2, text: 'Manage Properties', desc: 'View and update your property listings from one dashboard.' },
    { icon: Shield, text: 'Build Trust', desc: 'Respond to reviews and earn a verified safety badge.' },
    { icon: ArrowRight, text: 'Attract Tenants', desc: 'Stand out with a transparent, trusted owner profile.' },
    { icon: Mail, text: 'Direct Communication', desc: 'Connect with students and address concerns in real time.' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      {/* Left Panel - Owner Benefits */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-800 to-slate-900 text-white p-12 flex-col justify-center">
        <div className="max-w-md">
          <div className="flex items-center gap-2 mb-8">
            <Shield className="h-8 w-8 text-green-400" />
            <span className="text-2xl font-bold">SafeStay</span>
          </div>
          <h2 className="text-3xl font-extrabold leading-tight mb-4">
            Welcome Back, <span className="text-green-400">Owner.</span>
          </h2>
          <p className="text-slate-400 mb-8">
            Manage your properties and build tenant trust.
          </p>
          <div className="space-y-6">
            {benefits.map((b, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/20">
                  <b.icon className="h-5 w-5 text-green-400" />
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

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile-only logo */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <Shield className="h-7 w-7 text-green-600" />
            <span className="text-xl font-bold text-slate-900">SafeStay</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-2xl font-bold text-slate-900 text-center mb-1">
              Owner Sign In
            </h1>
            <p className="text-sm text-slate-500 text-center mb-6">
              Access your property dashboard
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {localError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-700">{localError}</p>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="pl-10 pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Don't have an account?{' '}
              <Link
                to="/owner/register"
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Register as Owner
              </Link>
            </p>
            <p className="mt-2 text-center text-sm text-slate-500">
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Sign in as Student
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
