import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Camera, X, MapPin, CheckCircle2, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { reportSchema, type ReportFormData } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, getSeverityColor } from '@/lib/utils';
import { accommodationService } from '@/services/accommodationService';

const STEPS = 4;

interface AccommodationOption { _id: string; name: string; area: string; type?: string; ssi?: number; }
interface Props { onSubmit: (data: ReportFormData, images: File[]) => Promise<void>; loading?: boolean; }

export function ReportForm({ onSubmit, loading }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [accommodations, setAccommodations] = useState<AccommodationOption[]>([]);
  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema), defaultValues: { severity: 'medium' as any },
  });
  const selectedSeverity = watch('severity');
  const selectedCategory = watch('category');
  const description = watch('description') || '';

  useEffect(() => {
    accommodationService.getDropdown()
      .then((data) => { if (Array.isArray(data)) setAccommodations(data); })
      .catch(() => {});
  }, []);

  // Revoke object URLs on unmount or when previews change to prevent memory leaks
  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  const onDrop = useCallback((accepted: File[]) => {
    const newImgs = [...images, ...accepted].slice(0, 5);
    setImages(newImgs);
    setPreviews([...previews, ...accepted.map((f) => URL.createObjectURL(f))].slice(0, 5));
  }, [images, previews]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] }, maxFiles: 5, maxSize: 10 * 1024 * 1024 });
  const removeImage = (i: number) => { setImages(images.filter((_, idx) => idx !== i)); setPreviews(previews.filter((_, idx) => idx !== i)); };

  const nextStep = async () => {
    let valid = false;
    if (step === 1) valid = await trigger(['title', 'category', 'severity']);
    if (step === 2) valid = await trigger(['description', 'location', 'accommodationId']);
    if (step === 3) valid = true;
    if (valid && step < STEPS) setStep(step + 1);
  };
  const prevStep = () => { if (step > 1) setStep(step - 1); };

  const categories = [
    { value: 'fire_safety', label: 'Fire Safety' },
    { value: 'water_quality', label: 'Water Quality' },
    { value: 'structural', label: 'Structural' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'hygiene', label: 'Hygiene' },
    { value: 'security', label: 'Security' },
    { value: 'food_safety', label: 'Food Safety' },
    { value: 'other', label: 'Other' },
  ];
  const severities = [
    { value: 'low', label: t('report.low'), desc: t('report.lowDesc'), color: 'border-emerald-300 bg-emerald-50' },
    { value: 'medium', label: t('report.medium'), desc: t('report.mediumDesc'), color: 'border-amber-300 bg-amber-50' },
    { value: 'high', label: t('report.high'), desc: t('report.highDesc'), color: 'border-orange-300 bg-orange-50' },
    { value: 'critical', label: t('report.critical'), desc: t('report.criticalDesc'), color: 'border-red-300 bg-red-50' },
  ];

  return (
    <div>
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold",
              s < step ? "bg-emerald-500 text-white" : s === step ? "bg-primary-600 text-white ring-4 ring-primary-100" : "bg-slate-200 text-slate-500")}>
              {s < step ? <CheckCircle2 className="h-5 w-5" /> : s}
            </div>
            {s < STEPS && <div className={cn("h-1 w-16 mx-2 rounded-full", s < step ? "bg-emerald-500" : "bg-slate-200")} />}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit((d) => onSubmit(d, images))}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">{t('report.title')}</label><Input placeholder={t('report.titlePlaceholder')} {...register('title')} />{errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}</div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">{t('report.category')}</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{categories.map((c) => (
                  <button key={c.value} type="button" onClick={() => setValue('category', c.value as any)}
                    className={cn("rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all", selectedCategory === c.value ? "border-primary-600 bg-primary-50 text-primary-700" : "border-slate-200 text-slate-600 hover:border-slate-300")}>{c.label}</button>
                ))}</div>{errors.category && <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>}</div>
              <div><label className="block text-sm font-medium text-slate-700 mb-2">{t('report.severity')}</label>
                <div className="grid grid-cols-2 gap-3">{severities.map((s) => (
                  <button key={s.value} type="button" onClick={() => setValue('severity', s.value as any)}
                    className={cn("rounded-xl border-2 p-3 text-left transition-all", selectedSeverity === s.value ? s.color : "border-slate-200 hover:border-slate-300")}>
                    <span className="text-sm font-semibold">{s.label}</span><p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                  </button>
                ))}</div></div>
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">{t('report.description')}</label>
                <textarea {...register('description')} rows={5} placeholder={t('report.descPlaceholder')} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
                <p className="text-xs text-slate-400 mt-1">{t('report.charCount', { count: description.length })}</p>{errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}</div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">{t('report.location')}</label>
                <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input placeholder={t('report.locationPlaceholder')} className="pl-10" {...register('location')} /></div>
                {errors.location && <p className="mt-1 text-xs text-red-500">{errors.location.message}</p>}</div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">{t('report.accommodation')}</label>
                <select {...register('accommodationId')} className="w-full appearance-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">{t('report.selectAccommodation')}</option>{accommodations.map((a) => <option key={a._id} value={a._id}>{a.name} - {a.area}</option>)}
                </select>{errors.accommodationId && <p className="mt-1 text-xs text-red-500">{errors.accommodationId.message}</p>}</div>
            </motion.div>
          )}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-2">{t('report.images')}</label>
                <div {...getRootProps()} className={cn("rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors", isDragActive ? "border-primary-400 bg-primary-50" : "border-slate-300 hover:border-primary-400")}>
                  <input {...getInputProps()} /><Camera className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-700">{t('report.dropImages')}</p><p className="text-xs text-slate-400 mt-1">{t('report.maxFiles')}</p>
                </div></div>
              {previews.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{previews.map((p, i) => (
                <div key={i} className="relative rounded-lg overflow-hidden aspect-square bg-slate-100">
                  <img src={p} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 rounded-full bg-red-500 text-white p-1"><X className="h-3 w-3" /></button>
                </div>
              ))}</div>}
              <Badge variant="secondary">{images.length}/5 images</Badge>
            </motion.div>
          )}
          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">{t('report.review')}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-slate-500">{t('report.title')}:</span><p className="font-medium">{watch('title')}</p></div>
                  <div><span className="text-slate-500">{t('report.category')}:</span><p className="font-medium">{categories.find(c => c.value === selectedCategory)?.label || selectedCategory}</p></div>
                  <div><span className="text-slate-500">{t('report.severity')}:</span><Badge className={getSeverityColor(selectedSeverity || '')}>{selectedSeverity}</Badge></div>
                  <div><span className="text-slate-500">{t('report.location')}:</span><p className="font-medium">{watch('location')}</p></div>
                </div>
                <div><span className="text-sm text-slate-500">{t('report.description')}:</span><p className="text-sm mt-1">{watch('description')}</p></div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex justify-between mt-8">
          {step > 1 ? <Button type="button" variant="outline" onClick={prevStep}><ArrowLeft className="mr-2 h-4 w-4" /> {t('report.back')}</Button> : <div />}
          {step < STEPS ? <Button type="button" onClick={nextStep}>{t('report.next')} <ArrowRight className="ml-2 h-4 w-4" /></Button>
            : <Button type="submit" disabled={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('common.loading')}</> : t('report.submit')}</Button>}
        </div>
      </form>
    </div>
  );
}
