import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FileText, Map } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { RiskChart } from '@/components/dashboard/RiskChart';
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { useAuthStore } from '@/stores/authStore';
import type { DashboardStats } from '@/types';

const mockStats: DashboardStats = { totalReports: 1284, pending: 89, verified: 342, resolved: 853, weeklyTrend: 12.5 };

export function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-slate-900">{t('dashboard.title')}</h1><p className="text-slate-500 mt-1">{greet}, {user?.name || 'Student'} 👋</p></div>
        <div className="flex gap-3 mt-4 sm:mt-0">
          <Link to="/report/new"><Button className="flex items-center gap-2"><FileText className="h-4 w-4" />{t('dashboard.quickSubmit')}</Button></Link>
          <Link to="/map"><Button variant="outline" className="flex items-center gap-2"><Map className="h-4 w-4" />{t('dashboard.quickMap')}</Button></Link>
        </div>
      </motion.div>
      <div className="space-y-6">
        <StatsGrid stats={mockStats} />
        <div className="grid gap-6 lg:grid-cols-2"><RiskChart /><CategoryBreakdown /></div>
        <RecentActivity />
      </div>
    </div>
  );
}
