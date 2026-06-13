import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ReportForm } from '@/components/reports/ReportForm';
import { useReportStore } from '@/stores/reportStore';
import toast from 'react-hot-toast';
import type { ReportFormData } from '@/lib/validations';

export function ReportSubmit() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { createReport, loading } = useReportStore();
  const handleSubmit = async (data: ReportFormData, images: File[]) => {
    try {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => fd.append(k, v as string));
      images.forEach((f) => fd.append('images', f));
      await createReport(fd);
      toast.success('Report submitted!'); navigate('/dashboard');
    } catch (err: any) { toast.error(err.message); }
  };
  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{t('report.submitTitle')}</h1>
        <p className="text-slate-500 mt-1">{t('report.submitSubtitle')}</p>
      </motion.div>
      <ReportForm onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
