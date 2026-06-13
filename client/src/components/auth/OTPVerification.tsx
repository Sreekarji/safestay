import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
interface Props { onSubmit: (otp: string) => Promise<void>; onResend: () => void; loading?: boolean; email?: string; }
export function OTPVerification({ onSubmit, onResend, loading, email }: Props) {
  const { t } = useTranslation();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(30);
  const [success, setSuccess] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => { if (countdown > 0) { const timer = setTimeout(() => setCountdown(countdown - 1), 1000); return () => clearTimeout(timer); } }, [countdown]);
  const handleChange = (i: number, v: string) => { if (v.length > 1) return; const n = [...otp]; n[i] = v; setOtp(n); if (v && i < 5) refs.current[i + 1]?.focus(); };
  const handleKey = (i: number, e: React.KeyboardEvent) => { if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus(); };
  const handleSubmit = async () => { const code = otp.join(''); if (code.length === 6) { await onSubmit(code); setSuccess(true); } };
  if (success) return <div className="text-center py-8"><CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" /><h3 className="text-xl font-semibold">{t('common.success')}</h3></div>;
  return (
    <div className="space-y-6">
      <div className="text-center"><p className="text-sm text-slate-500">{t('auth.otpSent')}</p>{email && <p className="text-sm font-medium text-slate-700 mt-1">{email}</p>}</div>
      <div className="flex justify-center gap-2">{otp.map((d, i) => (
        <input key={i} ref={(el) => { refs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={d}
          onChange={(e) => handleChange(i, e.target.value)} onKeyDown={(e) => handleKey(i, e)}
          className="h-14 w-12 rounded-lg border-2 border-slate-200 text-center text-xl font-bold focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all" />
      ))}</div>
      <Button onClick={handleSubmit} className="w-full" disabled={loading || otp.join('').length < 6}>
        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('common.loading')}</> : t('auth.verify')}
      </Button>
      <div className="text-center"><p className="text-sm text-slate-500">{t('auth.didntReceive')}{' '}
        {countdown > 0 ? <span className="text-slate-400">{t('auth.resendIn', { seconds: String(countdown) })}</span>
          : <button onClick={() => { onResend(); setCountdown(30); }} className="text-primary-600 font-medium">{t('auth.resendOTP')}</button>}
      </p></div>
    </div>
  );
}
