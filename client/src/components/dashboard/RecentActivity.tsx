import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate, getSeverityColor, getStatusColor } from '@/lib/utils';

interface ReportItem {
  id: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  createdAt: string;
}

interface RecentActivityProps {
  reports?: ReportItem[];
}

export function RecentActivity({ reports }: RecentActivityProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('dashboard.recentReports')}</CardTitle>
        <button onClick={() => navigate('/dashboard')} className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
          {t('dashboard.viewAll')} <ExternalLink className="h-3 w-3" />
        </button>
      </CardHeader>
      <CardContent>
        {!reports || reports.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No recent reports.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-100">
                <th className="pb-3 text-left text-xs font-medium text-slate-500 uppercase">{t('report.title')}</th>
                <th className="pb-3 text-left text-xs font-medium text-slate-500 uppercase">{t('report.category')}</th>
                <th className="pb-3 text-left text-xs font-medium text-slate-500 uppercase">{t('report.severity')}</th>
                <th className="pb-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="pb-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
              </tr></thead>
              <tbody>{reports.map((r, i) => (
                <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className="border-b border-slate-50 cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/report/${r.id}`)}>
                  <td className="py-3 text-sm font-medium text-slate-900">{r.title}</td>
                  <td className="py-3"><Badge variant="secondary" className="text-xs">{r.category}</Badge></td>
                  <td className="py-3"><Badge className={cn("text-xs", getSeverityColor(r.severity))}>{r.severity}</Badge></td>
                  <td className="py-3"><Badge className={cn("text-xs", getStatusColor(r.status))}>{r.status}</Badge></td>
                  <td className="py-3 text-sm text-slate-500">{formatDate(r.createdAt)}</td>
                </motion.tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
