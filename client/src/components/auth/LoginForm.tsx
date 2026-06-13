import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { loginSchema, type LoginFormData } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/authStore';
interface Props { onSubmit: (d: LoginFormData) => Promise<void>; error?: string | null; }
export function LoginForm({ onSubmit, error }: Props) {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const { loading } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3"><p className="text-sm text-red-700">{error}</p></div>}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('auth.email')}</label>
        <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input type="email" placeholder={t('auth.enterEmail')} className="pl-10" {...register('email')} /></div>
        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('auth.password')}</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input type={show ? 'text' : 'password'} placeholder={t('auth.enterPassword')} className="pl-10 pr-10" {...register('password')} />
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
        </div>
        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="rounded border-slate-300" /><span className="text-sm text-slate-600">{t('auth.rememberMe')}</span></label>
        <button type="button" className="text-sm text-primary-600 hover:text-primary-700 font-medium">{t('auth.forgotPassword')}</button>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('auth.signingIn')}</> : t('auth.signIn')}</Button>
    </form>
  );
}
