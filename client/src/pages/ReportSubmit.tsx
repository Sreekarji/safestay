import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ReportForm } from '@/components/reports/ReportForm';
import { useReportStore } from '@/stores/reportStore';
import { useAuthStore } from '@/stores/authStore';
import { API_URL } from '@/lib/constants';
import toast from 'react-hot-toast';
import type { ReportFormData } from '@/lib/validations';

export function ReportSubmit() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { createReport, loading } = useReportStore();
  const severityMap: Record<string, number> = { low: 3, medium: 5, high: 7, critical: 9 };
  const handleSubmit = async (data: ReportFormData, images: File[]) => {
    try {
      const uploadedUrls: string[] = [];
      if (images && images.length > 0) {
        const token = useAuthStore.getState().token;
        for (const image of images) {
          const formData = new FormData();
          formData.append('images', image);
          const res = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
          });
          if (res.ok) {
            const result = await res.json();
            const urls = result.data?.images || [];
            if (urls.length > 0) uploadedUrls.push(urls[0]);
          }
        }
      }

      const payload = {
        accommodationId: data.accommodationId,
        category: data.category,
        severity: severityMap[data.severity as string] || 5,
        title: data.title,
        description: data.description,
        images: uploadedUrls,
        isAnonymous: false,
      };
      await createReport(payload);
      toast.success('Report submitted!'); navigate('/dashboard');
    } catch (err: any) { toast.error(err.message); }
  };
  return (
    <div className="min-h-screen bg-canvas-soft dark:bg-[#0a0a0a] p-6 lg:p-8 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink dark:text-white">{t('report.submitTitle')}</h1>
        <p className="text-body dark:text-[#888888] mt-1">{t('report.submitSubtitle')}</p>
      </motion.div>
      <ReportForm onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
