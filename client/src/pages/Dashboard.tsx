import { useState, useEffect } from 'react';
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
import { fetchDashboardStats, fetchSSITrend, fetchAreaRisks, fetchCategoryBreakdown, fetchRecentReports } from '@/services/api';
import type { DashboardStats } from '@/types';

export function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [ssiTrend, setSsiTrend] = useState<any[]>([]);
  const [areaRisks, setAreaRisks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, trendData, areaData, catData, reportsData] = await Promise.allSettled([
          fetchDashboardStats(),
          fetchSSITrend(),
          fetchAreaRisks(),
          fetchCategoryBreakdown(),
          fetchRecentReports(),
        ]);
        if (statsData.status === 'fulfilled') setStats(statsData.value);
        if (trendData.status === 'fulfilled') setSsiTrend(trendData.value);
        if (areaData.status === 'fulfilled') setAreaRisks(areaData.value);
        if (catData.status === 'fulfilled') setCategories(catData.value);
        if (reportsData.status === 'fulfilled') setRecentReports(reportsData.value);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-48" />
          <div className="h-4 bg-slate-200 rounded w-64" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

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
        <StatsGrid stats={stats || { totalReports: 0, pending: 0, verified: 0, resolved: 0, weeklyTrend: 0 }} />
        <div className="grid gap-6 lg:grid-cols-2">
          <RiskChart />
          <CategoryBreakdown />
        </div>
        <RecentActivity />
      </div>
    </div>
  );
}
