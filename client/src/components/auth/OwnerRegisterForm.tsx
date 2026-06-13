import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, User, Eye, EyeOff, Loader2, Building2, ArrowRight, ArrowLeft, Upload, CheckCircle2 } from 'lucide-react';
import { ownerRegisterSchema, type OwnerRegisterFormData } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Props {
  onSubmit: (d: OwnerRegisterFormData & { step: number; documents?: { governmentId: File | null; propertyProof: File | null; businessRegistration: File | null } }) => Promise<void>;
  error?: string | null;
}

const propertyOptions = [
  { value: '1', label: '1 Property' },
  { value: '2-5', label: '2-5 Properties' },
  { value: '6-10', label: '6-10 Properties' },
  { value: '10+', label: '10+ Properties' },
];

export function OwnerRegisterForm({ onSubmit, error }: Props) {
  const [step, setStep] = useState(1);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<{
    governmentId: File | null;
    propertyProof: File | null;
    businessRegistration: File | null;
  }>({ governmentId: null, propertyProof: null, businessRegistration: null });

  const { register, handleSubmit, watch, setValue, formState: { errors }, trigger } = useForm<OwnerRegisterFormData>({
    resolver: zodResolver(ownerRegisterSchema),
    mode: 'onTouched',
  });

  const handleNext = async () => {
    const valid = await trigger(['name', 'email', 'phone', 'propertyName', 'propertiesManaged', 'password', 'confirmPassword']);
    if (valid) setStep(2);
  };

  const handleFormSubmit = async (data: OwnerRegisterFormData) => {
    setLoading(true);
    try {
      await onSubmit({ ...data, step: 2, documents });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (field: keyof typeof documents, file: File | null) => {
    setDocuments((prev) => ({ ...prev, [field]: file }));
  };

  return (
    <div>
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
          step === 1 ? "bg-primary-100 text-primary-700" : "bg-slate-100 text-slate-500"
        )}>
          <span className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
            step === 1 ? "bg-primary-600 text-white" : "bg-slate-300 text-white"
          )}>1</span>
          Account Info
        </div>
        <div className="w-8 h-px bg-slate-200" />
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
          step === 2 ? "bg-primary-100 text-primary-700" : "bg-slate-100 text-slate-500"
        )}>
          <span className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
            step === 2 ? "bg-primary-600 text-white" : "bg-slate-300 text-white"
          )}>2</span>
          Documents
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {step === 1 ? (
        /* Step 1: Account Info */
        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="John Doe" className="pl-10" {...register('name')} />
              </div>
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input type="email" placeholder="john@company.com" className="pl-10" {...register('email')} />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Phone Number</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 flex items-center text-xs">+91</span>
              <Input type="tel" placeholder="9876543210" className="pl-12" {...register('phone')} />
            </div>
            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Main Property Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Evergreen Apartments" className="pl-10" {...register('propertyName')} />
              </div>
              {errors.propertyName && <p className="mt-1 text-xs text-red-500">{errors.propertyName.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Properties Managed</label>
              <Select
                options={propertyOptions}
                placeholder="Select..."
                {...register('propertiesManaged')}
                className={errors.propertiesManaged ? 'border-red-300' : ''}
              />
              {errors.propertiesManaged && <p className="mt-1 text-xs text-red-500">{errors.propertiesManaged.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type={show ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input type="password" placeholder="••••••••" className="pl-10" {...register('confirmPassword')} />
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <Button type="submit" className="w-full mt-2" size="lg">
            Continue to Documents <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      ) : (
        /* Step 2: Documents */
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
          <p className="text-sm text-slate-500 text-center">
            Upload your verification documents. These will be reviewed by our team.
          </p>

          {[
            { key: 'governmentId' as const, label: 'Government ID', desc: 'Passport, Driver\'s License, or National ID' },
            { key: 'propertyProof' as const, label: 'Property Ownership Proof', desc: 'Property deed, tax receipt, or utility bill' },
            { key: 'businessRegistration' as const, label: 'Business Registration', desc: 'Company registration certificate (if applicable)' },
          ].map((doc) => (
            <div key={doc.key} className="border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-primary-300 transition-colors">
              <label className="flex items-center gap-4 cursor-pointer">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-lg",
                  documents[doc.key] ? "bg-green-100" : "bg-slate-100"
                )}>
                  {documents[doc.key] ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : (
                    <Upload className="h-6 w-6 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{doc.label}</p>
                  <p className="text-xs text-slate-500">{doc.desc}</p>
                  {documents[doc.key] && (
                    <p className="text-xs text-green-600 mt-0.5 truncate">{documents[doc.key]!.name}</p>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(doc.key, e.target.files?.[0] || null)}
                />
              </label>
            </div>
          ))}

          <div className="flex gap-3 mt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
              ) : (
                'Submit Registration'
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
