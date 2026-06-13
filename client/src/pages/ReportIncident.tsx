import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Upload,
  Camera,
  MapPin,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  FileText,
  X,
  Brain,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollReveal, FadeIn } from '@/components/ParallaxEffect';
import { useAuthStore } from '@/stores/authStore';
import { ReportCategory } from '@/types';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const reportSchema = z.object({
  accommodationId: z.string().min(1, 'Please select an accommodation'),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  category: z.enum([
    'fire_safety',
    'water_quality',
    'structural',
    'electrical',
    'hygiene',
    'security',
    'food_safety',
    'other',
  ]),
  severity: z.number().min(1).max(10),
  description: z.string().min(20, 'Description must be at least 20 characters'),
});

type ReportForm = z.infer<typeof reportSchema>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEPS = ['Accommodation', 'Details', 'Evidence', 'Review'] as const;

const CATEGORIES: { value: ReportCategory; label: string; icon: string }[] = [
  { value: 'fire_safety', label: 'Fire Safety', icon: '🔥' },
  { value: 'water_quality', label: 'Water Quality', icon: '💧' },
  { value: 'structural', label: 'Structural', icon: '🏗️' },
  { value: 'electrical', label: 'Electrical', icon: '⚡' },
  { value: 'hygiene', label: 'Hygiene', icon: '🧹' },
  { value: 'security', label: 'Security', icon: '🔒' },
  { value: 'food_safety', label: 'Food Safety', icon: '🍝' },
  { value: 'other', label: 'Other', icon: '❓' },
];

const SEVERITY_LABELS: Record<number, string> = {
  1: 'Minimal',
  2: 'Very Low',
  3: 'Low',
  4: 'Mild',
  5: 'Moderate',
  6: 'Notable',
  7: 'High',
  8: 'Severe',
  9: 'Critical',
  10: 'Emergency',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSeverityColor(value: number): string {
  if (value <= 3) return '#22c55e';   // green
  if (value <= 5) return '#84cc16';   // lime
  if (value <= 7) return '#f59e0b';   // amber
  return '#ef4444';                    // red
}

function getSeverityGradient(value: number): string {
  return `linear-gradient(to right, #22c55e 0%, #84cc16 30%, #f59e0b 60%, #ef4444 100%)`;
}

interface AccommodationOption {
  _id: string;
  name: string;
  address: string;
  area: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReportIncident() {
  const navigate = useNavigate();
  const { token } = useAuthStore();

  // Wizard state
  const [step, setStep] = useState(0);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [accommodations, setAccommodations] = useState<AccommodationOption[]>([]);
  const [accommodationSearch, setAccommodationSearch] = useState('');
  const [loadingAccommodations, setLoadingAccommodations] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<ReportForm>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      accommodationId: '',
      title: '',
      category: undefined as unknown as ReportCategory,
      severity: 5,
      description: '',
    },
  });

  const watchedCategory = watch('category');
  const watchedSeverity = watch('severity');
  const watchedAccommodationId = watch('accommodationId');

  const selectedAccommodation = accommodations.find(
    (a) => a._id === watchedAccommodationId,
  );

  // ---------------------------------------------------------------------------
  // Fetch accommodations
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingAccommodations(true);
      try {
        const res = await fetch(`${API}/api/accommodations`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.data || data?.accommodations || [];
        if (!cancelled && Array.isArray(list)) {
          setAccommodations(list);
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoadingAccommodations(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredAccommodations = accommodations.filter((a) => {
    const q = accommodationSearch.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.address.toLowerCase().includes(q) ||
      a.area.toLowerCase().includes(q)
    );
  });

  // ---------------------------------------------------------------------------
  // Image handling
  // ---------------------------------------------------------------------------

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files).slice(0, 5 - images.length);
      const validFiles = fileArray.filter((f) => f.size <= 5 * 1024 * 1024);
      const newImages = [...images, ...validFiles].slice(0, 5);
      setImages(newImages);
      setImagePreviews((prev) => {
        const newPreviews = validFiles.map((f) => URL.createObjectURL(f));
        return [...prev, ...newPreviews].slice(0, 5);
      });
    },
    [images],
  );

  const removeImage = useCallback(
    (index: number) => {
      URL.revokeObjectURL(imagePreviews[index]);
      setImages((prev) => prev.filter((_, i) => i !== index));
      setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    },
    [imagePreviews],
  );

  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drag & drop handlers
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer.files.length) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  // ---------------------------------------------------------------------------
  // Step validation
  // ---------------------------------------------------------------------------

  async function validateStep(): Promise<boolean> {
    switch (step) {
      case 0:
        return trigger('accommodationId');
      case 1:
        return trigger(['title', 'category', 'severity', 'description']);
      case 2:
        return true;
      default:
        return true;
    }
  }

  async function nextStep() {
    const valid = await validateStep();
    if (valid && step < STEPS.length - 1) {
      setStep((s) => s + 1);
    }
  }

  function prevStep() {
    if (step > 0) setStep((s) => s - 1);
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  async function onSubmit(data: ReportForm) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const formData = new FormData();
      formData.append('accommodationId', data.accommodationId);
      formData.append('title', data.title);
      formData.append('category', data.category);
      formData.append('severity', String(data.severity));
      formData.append('description', data.description);

      images.forEach((file) => {
        formData.append('images', file);
      });

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API}/api/reports`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Failed to submit report');
      }

      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  function renderStepIndicator() {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    i < step
                      ? 'bg-primary-600 text-white'
                      : i === step
                        ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                        : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {i < step ? <CheckCircle className="w-5 h-5" /> : i + 1}
                </div>
                <span
                  className={`mt-2 text-xs font-medium hidden sm:block ${
                    i <= step ? 'text-primary-700' : 'text-slate-400'
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-3 mt-0 sm:-mt-5 transition-colors duration-300 ${
                    i < step ? 'bg-primary-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Step 0: Accommodation
  function renderAccommodationStep() {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Search Accommodation
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={accommodationSearch}
              onChange={(e) => setAccommodationSearch(e.target.value)}
              placeholder="Search by name, address, or area..."
              className="pl-10"
            />
          </div>
        </div>

        <input type="hidden" {...register('accommodationId')} />

        <div className="max-h-64 overflow-y-auto space-y-2 border border-slate-200 rounded-xl">
          {loadingAccommodations ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
              <span className="ml-2 text-sm text-slate-500">Loading accommodations...</span>
            </div>
          ) : filteredAccommodations.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              No accommodations found
            </div>
          ) : (
            filteredAccommodations.map((acc) => (
              <button
                key={acc._id}
                type="button"
                onClick={() => {
                  setValue('accommodationId', acc._id, { shouldValidate: true });
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  watchedAccommodationId === acc._id
                    ? 'bg-primary-50 border border-primary-300'
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <p className="font-medium text-sm text-slate-800">{acc.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {acc.address}, {acc.area}
                </p>
              </button>
            ))
          )}
        </div>

        {errors.accommodationId && (
          <p className="text-xs text-red-500">{errors.accommodationId.message}</p>
        )}

        {selectedAccommodation && (
          <div className="bg-primary-50 rounded-xl p-4 border border-primary-200">
            <p className="text-sm font-medium text-primary-800">
              Selected: {selectedAccommodation.name}
            </p>
            <p className="text-xs text-primary-600 mt-0.5">
              {selectedAccommodation.address}, {selectedAccommodation.area}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Step 1: Details
  function renderDetailsStep() {
    return (
      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Report Title
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              {...register('title')}
              placeholder="Brief summary of the issue"
              className="pl-10"
            />
          </div>
          {errors.title && (
            <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setValue('category', cat.value, { shouldValidate: true })}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center ${
                  watchedCategory === cat.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                }`}
              >
                <span className="text-xl">{cat.icon}</span>
                <span className="text-xs font-medium">{cat.label}</span>
              </button>
            ))}
          </div>
          {errors.category && (
            <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>
          )}
        </div>

        {/* Severity */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Severity: {watchedSeverity}/10 - {SEVERITY_LABELS[watchedSeverity]}
          </label>
          <div className="relative px-1">
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={watchedSeverity}
              onChange={(e) =>
                setValue('severity', Number(e.target.value), { shouldValidate: true })
              }
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: getSeverityGradient(watchedSeverity),
              }}
            />
            <div className="flex justify-between mt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                <span
                  key={v}
                  className="text-[10px] font-medium"
                  style={{ color: v <= watchedSeverity ? getSeverityColor(v) : '#cbd5e1' }}
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getSeverityColor(watchedSeverity) }}
            />
            <span className="text-xs text-slate-500">
              {watchedSeverity <= 3
                ? 'Minor issue - not urgent'
                : watchedSeverity <= 5
                  ? 'Moderate issue - should be addressed'
                  : watchedSeverity <= 7
                    ? 'Serious issue - needs prompt attention'
                    : 'Critical issue - immediate action required'}
            </span>
          </div>
          <input type="hidden" {...register('severity')} />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Description
          </label>
          <textarea
            {...register('description')}
            rows={5}
            placeholder="Describe the issue in detail: what you observed, when it occurred, any safety concerns..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
          {errors.description && (
            <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>
          )}
        </div>
      </div>
    );
  }

  // Step 2: Evidence
  function renderEvidenceStep() {
    return (
      <div className="space-y-4">
        <div
          ref={dropRef}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center">
              <Camera className="w-7 h-7 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">
                Drag & drop images here
              </p>
              <p className="text-xs text-slate-400 mt-1">
                or click to browse &middot; Max 5 images &middot; 5MB each
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>

        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {imagePreviews.map((src, i) => (
              <div key={src} className="relative group rounded-xl overflow-hidden border border-slate-200">
                <img
                  src={src}
                  alt={`Upload ${i + 1}`}
                  className="w-full h-32 object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(i);
                  }}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                  <p className="text-[10px] text-white truncate">
                    {images[i]?.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-slate-400 text-center">
          {images.length}/5 images added &middot; Evidence helps AI verify your report
        </p>
      </div>
    );
  }

  // Step 3: Review
  function renderReviewStep() {
    const categoryInfo = CATEGORIES.find((c) => c.value === watchedCategory);
    return (
      <div className="space-y-4">
        {/* Accommodation */}
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-primary-500" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Accommodation
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-800">
            {selectedAccommodation?.name || 'Not selected'}
          </p>
          <p className="text-xs text-slate-500">
            {selectedAccommodation?.address}, {selectedAccommodation?.area}
          </p>
        </div>

        {/* Details */}
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-primary-500" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Report Details
            </span>
          </div>
          <h3 className="text-sm font-semibold text-slate-800">{watch('title')}</h3>
          <div className="flex items-center gap-3 mt-2">
            {categoryInfo && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-700">
                {categoryInfo.icon} {categoryInfo.label}
              </span>
            )}
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: getSeverityColor(watchedSeverity) }}
            >
              <AlertTriangle className="w-3 h-3" />
              {watchedSeverity}/10
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-3 whitespace-pre-wrap">
            {watch('description')}
          </p>
        </div>

        {/* Evidence */}
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="w-4 h-4 text-primary-500" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Evidence
            </span>
          </div>
          {images.length === 0 ? (
            <p className="text-xs text-slate-400">No images attached</p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {imagePreviews.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt={`Evidence ${i + 1}`}
                  className="w-16 h-16 rounded-lg object-cover border border-slate-200"
                />
              ))}
            </div>
          )}
        </div>

        {/* AI notice */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 flex gap-3">
          <Brain className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">AI Verification</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Your report will be automatically reviewed by our AI system to verify
              authenticity and help prioritize responses.
            </p>
          </div>
        </div>

        {submitError && (
          <div className="bg-red-50 rounded-xl p-4 border border-red-200 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Success screen
  // ---------------------------------------------------------------------------

  if (submitted) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        <FadeIn>
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              Report Submitted Successfully
            </h1>
            <p className="text-slate-500 mb-2 max-w-md mx-auto">
              Your safety report has been received and will be reviewed by our AI
              verification system.
            </p>
            <p className="text-xs text-slate-400 mb-8">
              You will be notified once the report has been processed.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={() => navigate('/')}>
                Go Home
              </Button>
              <Button onClick={() => navigate('/dashboard')}>
                View Dashboard
              </Button>
            </div>
          </div>
        </FadeIn>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <ScrollReveal>
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Report an Incident</h1>
          <p className="text-sm text-slate-500 mt-1">
            Help keep your community safe by reporting safety concerns.
          </p>
        </div>
      </ScrollReveal>

      <FadeIn delay={100}>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          {renderStepIndicator()}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            {step === 0 && renderAccommodationStep()}
            {step === 1 && renderDetailsStep()}
            {step === 2 && renderEvidenceStep()}
            {step === 3 && renderReviewStep()}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div>
                {step > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </Button>
                )}
              </div>
              <div>
                {step < STEPS.length - 1 ? (
                  <Button type="button" onClick={nextStep} className="gap-2">
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="gap-2 min-w-[160px]"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Submit Report
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </FadeIn>
    </div>
  );
}
