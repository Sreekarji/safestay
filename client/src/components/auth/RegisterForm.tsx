import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Loader2, Phone } from 'lucide-react';
import { studentRegisterSchema, type StudentRegisterFormData } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/authStore';

interface Props {
  onSubmit: (d: StudentRegisterFormData) => Promise<void>;
  error?: string | null;
}

export function RegisterForm({ onSubmit, error }: Props) {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const { loading } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<StudentRegisterFormData>({
    resolver: zodResolver(studentRegisterSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-md bg-error-soft border border-error/20 p-3">
          <p className="text-sm text-error-deep">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-body dark:text-[#888888] mb-1.5">Full Name</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mute" />
          <Input placeholder="Enter your full name" className="pl-10" {...register('name')} />
        </div>
        {errors.name && <p className="mt-1 text-xs text-error">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-body dark:text-[#888888] mb-1.5">University Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mute" />
          <Input type="email" placeholder="name@university.edu" className="pl-10" {...register('email')} />
        </div>
        {errors.email && <p className="mt-1 text-xs text-error">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-body dark:text-[#888888] mb-1.5">Phone Number</label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mute" />
          <Input type="tel" placeholder="Enter your phone number" className="pl-10" {...register('phone')} />
        </div>
        {errors.phone && <p className="mt-1 text-xs text-error">{errors.phone.message}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-body dark:text-[#888888] mb-1.5">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mute" />
          <Input
            type={show ? 'text' : 'password'}
            placeholder="Create a strong password"
            className="pl-10 pr-10"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-ink dark:hover:text-white transition-colors"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-xs text-error">{errors.password.message}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-body dark:text-[#888888] mb-1.5">Confirm Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mute" />
          <Input type="password" placeholder="Confirm your password" className="pl-10" {...register('confirmPassword')} />
        </div>
        {errors.confirmPassword && <p className="mt-1 text-xs text-error">{errors.confirmPassword.message}</p>}
      </div>

      <label className="flex items-start gap-2 cursor-pointer">
        <input type="checkbox" className="rounded border-hairline dark:border-[#333333] mt-0.5" {...register('terms')} />
        <span className="text-sm text-body dark:text-[#888888]">
          I agree to the{' '}
          <Link to="/terms" className="text-ink dark:text-white font-medium hover:underline">Terms of Service</Link>
          {' '}and{' '}
          <Link to="/privacy" className="text-ink dark:text-white font-medium hover:underline">Privacy Policy</Link>
        </span>
      </label>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...</>
        ) : (
          'Create Account'
        )}
      </Button>
    </form>
  );
}
