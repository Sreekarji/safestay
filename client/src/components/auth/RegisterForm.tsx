import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, User, Phone, Eye, EyeOff, Loader2, Building2 } from 'lucide-react';
import { registerSchema, type RegisterFormData } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
interface Props { onSubmit: (d: RegisterFormData) => Promise<void>; error?: string | null; }
export function RegisterForm({ onSubmit, error }: Props) {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const { loading } = useAuthStore();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema), defaultValues: { role: 'student' } });
  const role = watch('role');
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3"><p className="text-sm text-red-700">{error}</p></div>}
      <div><label className="block text-sm font-medium text-slate-700 mb-1.5">{t('auth.name')}</label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input placeholder={t('auth.enterName')} className="pl-10" {...register('name')} /></div>{errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}</div>
      <div><label className="block text-sm font-medium text-slate-700 mb-1.5">{t('auth.email')}</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input type="email" placeholder={t('auth.enterEmail')} className="pl-10" {...register('email')} /></div>{errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}</div>
      <div><label className="block text-sm font-medium text-slate-700 mb-1.5">{t('auth.phone')}</label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input placeholder={t('auth.enterPhone')} className="pl-10" {...register('phone')} /></div>{errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}</div>
      <div><label className="block text-sm font-medium text-slate-700 mb-1.5">{t('auth.password')}</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input type={show ? 'text' : 'password'} placeholder={t('auth.createStrongPassword')} className="pl-10 pr-10" {...register('password')} /><button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>{errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}</div>
      <div><label className="block text-sm font-medium text-slate-700 mb-1.5">{t('auth.confirmPassword')}</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input type="password" placeholder={t('auth.confirmPassword')} className="pl-10" {...register('confirmPassword')} /></div>{errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}</div>
      <div><label className="block text-sm font-medium text-slate-700 mb-2">{t('auth.role')}</label><div className="grid grid-cols-2 gap-3">
        {(['student', 'owner'] as const).map((r) => (<button key={r} type="button" onClick={() => setValue('role', r)} className={cn("flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all", role === r ? "border-primary-600 bg-primary-50" : "border-slate-200 hover:border-slate-300")}>
          {r === 'student' ? <User className="h-6 w-6 text-primary-600" /> : <Building2 className="h-6 w-6 text-primary-600" />}
          <span className={cn("text-sm font-medium", role === r ? "text-primary-700" : "text-slate-600")}>{t(`auth.${r}`)}</span>
        </button>))}
      </div></div>
      <label className="flex items-start gap-2 cursor-pointer"><input type="checkbox" className="rounded border-slate-300 mt-0.5" {...register('terms' as any)} /><span className="text-sm text-slate-600">{t('auth.terms')}</span></label>
      <Button type="submit" className="w-full" disabled={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('auth.creatingAccount')}</> : t('auth.createAccount')}</Button>
    </form>
  );
}
