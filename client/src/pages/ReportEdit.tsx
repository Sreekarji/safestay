import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Upload,
  Camera,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  FileText,
  X,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollReveal, FadeIn } from '@/components/ParallaxEffect';
import { useAuthStore } from '@/stores/authStore';
import { ReportCategory } from '@/types';
import toast from 'react-hot-toast';
import api from '@/services/api';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const reportSchema = z.object({
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

const STEPS = ['Details', 'Evidence', 'Review'] as const;

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
  if (value <= 3) return '#22c55e';
  if (value <= 5) return '#84cc16';
  if (value <= 7) return '#f59e0b';
  return '#ef4444';
}

function getSeverityGradient(): string {
  return 'linear-gradient(to right, #22c55e 0%, #84cc16 30%, #f59e0b 60%, #ef4444 100%)';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReportEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  // Wizard state
  const [step, setStep] = useState(0);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState(true);
  const [reportError, setReportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    reset,
    formState: { errors },
  } = useForm<ReportForm>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      title: '',
      category: 'other',
      severity: 5,
      description: '',
    },
  });

  const watchedCategory = watch('category');
  const watchedSeverity = watch('severity');

  // ---------------------------------------------------------------------------
  // Fetch existing report
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!id) return;

    async function loadReport() {
      setLoadingReport(true);
      setReportError(null);
      try {
        const res = await api.get(`/reports/${id}`);
        const report = res.data?.data || res.data;

        if (!report) {
          setReportError('Report not found');
          return;
        }

        if (report.status !== 'pending') {
          setReportError('Only pending reports can be edited');
          return;
        }

        reset({
          title: report.title || '',
          category: report.category || 'other',
          severity: report.severity || 5,
          description: report.description || '',
        });

        if (report.images && report.images.length > 0) {
          setExistingImages(report.images);
        }
      } catch (err: any) {
        console.error('Failed to load report:', err);
        setReportError('Failed to load report. Please try again.');
      } finally {
        setLoadingReport(false);
      }
    }

    loadReport();
  }, [id, reset]);

  // ---------------------------------------------------------------------------
  // Image handling
  // ---------------------------------------------------------------------------

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const totalAllowed = 5 - existingImages.length;
      const fileArray = Array.from(files).slice(0, totalAllowed - images.length);
      const validFiles = fileArray.filter((f) => f.size <= 5 * 1024 * 1024);
      const newImages = [...images, ...validFiles].slice(0, totalAllowed);
      setImages(newImages);
      setImagePreviews((prev) => {
        const newPreviews = validFiles.map((f) => URL.createObjectURL(f));
        return [...prev, ...newPreviews].slice(0, totalAllowed);
      });
    },
    [images, existingImages],
  );

  const removeImage = useCallback(
    (index: number) => {
      URL.revokeObjectURL(imagePreviews[index]);
      setImages((prev) => prev.filter((_, i) => i !== index));
      setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    },
    [imagePreviews],
  );

  const removeExistingImage = useCallback((index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

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
        return trigger(['title', 'category', 'severity', 'description']);
      case 1:
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
      const newUploadedUrls: string[] = [];
      if (images.length > 0) {
        for (const image of images) {
          const formData = new FormData();
          formData.append('images', image);
          const uploadRes = await fetch(`${API}/api/upload`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
          });
          if (uploadRes.ok) {
            const result = await uploadRes.json();
            const urls = result.data?.images || [];
            if (urls.length > 0) newUploadedUrls.push(urls[0]);
          }
        }
      }

      const allImages = [...existingImages, ...newUploadedUrls];

      const payload = {
        title: data.title,
        category: data.category,
        severity: data.severity,
        description: data.description,
        images: allImages,
      };

      await api.put(`/reports/${id}`, payload);
      toast.success('Report updated successfully!');
      navigate('/my-reports');
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Failed to update report';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loadingReport) {
    return (
      <div className="min-h-screen bg-canvas-soft dark:bg-[#0a0a0a] flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-ink dark:text-white" />
        <span className="text-sm text-body dark:text-[#888888]">Loading report...</span>
      </div>
    );
  }

  if (reportError) {
    return (
      <div className="min-h-screen bg-canvas-soft dark:bg-[#0a0a0a] p-6 text-center max-w-md mx-auto">
        <AlertTriangle className="h-10 w-10 text-warning mx-auto mb-3" />
        <p className="mb-4 text-ink dark:text-white">{reportError}</p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => navigate('/my-reports')}>
            Back to My Reports
          </Button>
        </div>
      </div>
    );
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
                      ? 'bg-ink dark:bg-white text-white dark:text-ink'
                      : i === step
                        ? 'bg-ink dark:bg-white text-white dark:text-ink ring-4 ring-canvas-soft dark:ring-[#1a1a1a]'
                        : 'bg-canvas-soft dark:bg-[#1a1a1a] text-mute dark:text-[#666666] border border-hairline dark:border-[#333333]'
                  }`}
                >
                  {i < step ? <CheckCircle className="w-5 h-5" /> : i + 1}
                </div>
                <span
                  className={`mt-2 text-xs font-medium hidden sm:block ${
                    i <= step ? 'text-ink dark:text-white' : 'text-mute dark:text-[#666666]'
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-3 mt-0 sm:-mt-5 transition-colors duration-300 ${
                    i < step ? 'bg-ink dark:bg-white' : 'bg-hairline dark:bg-[#333333]'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Step 0: Details
  function renderDetailsStep() {
    return (
      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-ink dark:text-white mb-1">
            Report Title
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
            <Input
              {...register('title')}
              placeholder="Brief summary of the issue"
              className="pl-10"
            />
          </div>
          {errors.title && (
            <p className="text-xs text-error mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-ink dark:text-white mb-2">
            Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setValue('category', cat.value, { shouldValidate: true })}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-center ${
                  watchedCategory === cat.value
                    ? 'border-ink dark:border-white bg-canvas-soft dark:bg-[#1a1a1a] text-ink dark:text-white'
                    : 'border-hairline dark:border-[#333333] bg-canvas dark:bg-[#111111] hover:border-hairline-strong dark:hover:border-[#555555] text-body dark:text-[#888888]'
                }`}
              >
                <span className="text-xl">{cat.icon}</span>
                <span className="text-xs font-medium">{cat.label}</span>
              </button>
            ))}
          </div>
          {errors.category && (
            <p className="text-xs text-error mt-1">{errors.category.message}</p>
          )}
        </div>

        {/* Severity */}
        <div>
          <label className="block text-sm font-medium text-ink dark:text-white mb-2">
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
              className="w-full h-2 rounded-full appearance-none cursor-pointer slider-thumb"
              style={{ background: getSeverityGradient() }}
            />
            <div className="flex justify-between mt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                <span
                  key={v}
                  className="text-[10px] font-medium"
                  style={{ color: v <= watchedSeverity ? getSeverityColor(v) : '#ebebeb' }}
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
            <span className="text-xs text-body dark:text-[#888888]">
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
          <label className="block text-sm font-medium text-ink dark:text-white mb-1">
            Description
          </label>
          <textarea
            {...register('description')}
            rows={5}
            placeholder="Describe the issue in detail: what you observed, when it occurred, any safety concerns..."
            className="w-full rounded-md border border-hairline dark:border-[#333333] bg-canvas dark:bg-[#111111] px-3 py-2 text-sm text-ink dark:text-white placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-ink/10 dark:focus:ring-white/10 focus:border-ink/20 dark:focus:border-white/20 resize-none transition-colors"
          />
          {errors.description && (
            <p className="text-xs text-error mt-1">{errors.description.message}</p>
          )}
        </div>
      </div>
    );
  }

  // Step 1: Evidence
  function renderEvidenceStep() {
    return (
      <div className="space-y-4">
        {/* Existing images */}
        {existingImages.length > 0 && (
          <div>
            <p className="text-sm font-medium text-ink dark:text-white mb-2">Current Images</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {existingImages.map((src, i) => (
                <div key={`existing-${i}`} className="relative group rounded-lg overflow-hidden border border-hairline dark:border-[#333333]">
                  <img
                    src={src}
                    alt={`Existing image ${i + 1}`}
                    className="w-full h-32 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(i)}
                    className="absolute top-2 right-2 w-6 h-6 bg-error text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                    <p className="text-[10px] text-white">Existing image</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload new images */}
        <div
          ref={dropRef}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-hairline dark:border-[#333333] rounded-lg p-8 text-center cursor-pointer hover:border-ink/20 dark:hover:border-white/20 hover:bg-canvas-soft dark:hover:bg-[#1a1a1a] transition-colors"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-canvas-soft dark:bg-[#1a1a1a] border border-hairline dark:border-[#333333] flex items-center justify-center">
              <Camera className="w-7 h-7 text-ink dark:text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink dark:text-white">
                Add more images
              </p>
              <p className="text-xs text-mute dark:text-[#666666] mt-1">
                Drag & drop or click to browse &middot; Max 5 total images &middot; 5MB each
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
          <div>
            <p className="text-sm font-medium text-ink dark:text-white mb-2">New Images to Upload</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {imagePreviews.map((src, i) => (
                <div key={src} className="relative group rounded-lg overflow-hidden border border-hairline dark:border-[#333333]">
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
                    className="absolute top-2 right-2 w-6 h-6 bg-error text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
          </div>
        )}

        <p className="text-xs text-mute dark:text-[#666666] text-center">
          {existingImages.length + images.length}/5 images total &middot; {images.length} new to upload
        </p>
      </div>
    );
  }

  // Step 2: Review
  function renderReviewStep() {
    const categoryInfo = CATEGORIES.find((c) => c.value === watchedCategory);
    return (
      <div className="space-y-4">
        {/* Details */}
        <div className="rounded-lg border border-hairline dark:border-[#333333] p-4 bg-canvas dark:bg-[#111111]">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-ink dark:text-white" />
            <span className="text-xs font-medium text-body dark:text-[#888888] uppercase tracking-wide font-mono">
              Report Details
            </span>
          </div>
          <h3 className="text-sm font-semibold text-ink dark:text-white">{watch('title')}</h3>
          <div className="flex items-center gap-3 mt-2">
            {categoryInfo && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-canvas-soft dark:bg-[#1a1a1a] text-xs font-medium text-body dark:text-[#888888] border border-hairline dark:border-[#333333]">
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
          <p className="text-sm text-body dark:text-[#888888] mt-3 whitespace-pre-wrap">
            {watch('description')}
          </p>
        </div>

        {/* Evidence */}
        <div className="rounded-lg border border-hairline dark:border-[#333333] p-4 bg-canvas dark:bg-[#111111]">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="w-4 h-4 text-ink dark:text-white" />
            <span className="text-xs font-medium text-body dark:text-[#888888] uppercase tracking-wide font-mono">
              Evidence ({existingImages.length + images.length} images)
            </span>
          </div>
          {existingImages.length === 0 && images.length === 0 ? (
            <p className="text-xs text-mute dark:text-[#666666]">No images attached</p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {existingImages.map((src, i) => (
                <img
                  key={`review-existing-${i}`}
                  src={src}
                  alt={`Existing ${i + 1}`}
                  className="w-16 h-16 rounded-lg object-cover border border-hairline dark:border-[#333333]"
                />
              ))}
              {imagePreviews.map((src, i) => (
                <img
                  key={`review-new-${i}`}
                  src={src}
                  alt={`New ${i + 1}`}
                  className="w-16 h-16 rounded-lg object-cover border-2 border-ink/20 dark:border-white/20"
                />
              ))}
            </div>
          )}
        </div>

        {submitError && (
          <div className="bg-error-soft rounded-lg p-4 border border-error/20 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
            <p className="text-sm text-error-deep">{submitError}</p>
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-canvas-soft dark:bg-[#0a0a0a] p-6 lg:p-8 max-w-3xl mx-auto">
      <ScrollReveal>
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-body dark:text-[#888888] hover:text-ink dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-warning-soft flex items-center justify-center">
              <Pencil className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-ink dark:text-white">Edit Report</h1>
              <p className="text-sm text-body dark:text-[#888888] mt-0.5">
                Update your report details before resubmission.
              </p>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <FadeIn delay={100}>
        <Card className="card-shadow-2">
          <CardContent className="p-6 sm:p-8">
            {renderStepIndicator()}

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
            >
              {step === 0 && renderDetailsStep()}
              {step === 1 && renderEvidenceStep()}
              {step === 2 && renderReviewStep()}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-hairline dark:border-[#333333]">
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
                          Updating...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
