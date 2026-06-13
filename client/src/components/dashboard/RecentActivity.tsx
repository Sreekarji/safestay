import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate, getSeverityColor, getStatusColor } from '@/lib/utils';

const mockReports = [
  { id: '1', title: 'Harassment near Gachibowli hostel', category: 'Harassment', severity: 'high', status: 'verified', createdAt: '2025-01-10T10:30:00Z' },
  { id: '2', title: 'Theft at Madhapur PG', category: 'Theft', severity: 'medium', status: 'pending', createdAt: '2025-01-09T15:20:00Z' },
  { id: '3', title: 'Broken street lights in Kondapur', category: 'Infrastructure', severity: 'low', status: 'resolved', createdAt: '2025-01-08T09:15:00Z' },
  { id: '4', title: 'Unsafe construction site near college', category: 'Unsafe Area', severity: 'critical', status: 'verified', createdAt: '2025-01-07T14:45:00Z' },
  { id: '5', title: 'Water contamination in hostel', category: 'Health Hazard', severity: 'high', status: 'pending', createdAt: '2025-01-06T11:00:00Z' },
];

export function RecentActivity() {
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-slate-100">
              <th className="pb-3 text-left text-xs font-medium text-slate-500 uppercase">{t('report.title')}</th>
              <th className="pb-3 text-left text-xs font-medium text-slate-500 uppercase">{t('report.category')}</th>
              <th className="pb-3 text-left text-xs font-medium text-slate-500 uppercase">{t('report.severity')}</th>
              <th className="pb-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="pb-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
            </tr></thead>
            <tbody>{mockReports.map((r, i) => (
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
      </CardContent>
    </Card>
  );
}
