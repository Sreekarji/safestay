import { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Building2, FileText, Shield, AlertTriangle, MapPin, Clock, TrendingUp, Activity } from 'lucide-react';
import { fetchDashboardStats, fetchSSITrend, fetchAreaRisks, fetchCategoryBreakdown, fetchRecentReports, getRouteMetrics } from '@/services/mapData';
import type { DashboardStats, SSITrend, AreaRisk, CategoryBreakdown, RecentReport } from '@/types';
import { CATEGORY_LABELS } from '@/types';
import { getSSIColor } from '@/types';

const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1'];

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">{label}</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trend, setTrend] = useState<SSITrend[]>([]);
  const [areas, setAreas] = useState<AreaRisk[]>([]);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [recent, setRecent] = useState<RecentReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchDashboardStats(), fetchSSITrend(), fetchAreaRisks(), fetchCategoryBreakdown(), fetchRecentReports()])
      .then(([s, t, a, c, r]) => { setStats(s); setTrend(t); setAreas(a); setCategories(c); setRecent(r); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const routeMetrics = getRouteMetrics();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-900/50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Analytics Dashboard</h1>

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon={Building2} label="Total Properties" value={stats.totalAccommodations} color="#6366f1" />
            <StatCard icon={FileText} label="Total Reports" value={stats.totalReports} color="#3b82f6" />
            <StatCard icon={Shield} label="Average SSI" value={stats.averageSSI} color="#22c55e" />
            <StatCard icon={AlertTriangle} label="High Risk Count" value={stats.highRiskCount} color="#ef4444" />
          </div>
        )}

        {/* Route metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={TrendingUp} label="Avg Route SSI" value={routeMetrics.avgRouteSSI} color="#22c55e" />
          <StatCard icon={MapPin} label="Safest Route" value={routeMetrics.safestRoute.split('(')[0].trim()} color="#3b82f6" />
          <StatCard icon={AlertTriangle} label="Highest Risk Zone" value={routeMetrics.highestRiskZone} color="#f59e0b" />
          <StatCard icon={Activity} label="Active Alerts" value={routeMetrics.recentAlerts} color="#ef4444" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* SSI Trend Chart */}
          <div className="bg-white dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700/50">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" /> SSI Trend (30 days)
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} interval={4}
                  tickFormatter={(v: string) => v.slice(5)} />
                <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="averageSSI" stroke="#3b82f6" fill="#3b82f620" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Area Risk Chart */}
          <div className="bg-white dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700/50">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-500" /> Area Risk Comparison
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={areas} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="area" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="averageSSI" radius={[4, 4, 0, 0]}>
                  {areas.map((entry, i) => (
                    <Cell key={i} fill={getSSIColor(entry.averageSSI)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category Breakdown */}
          <div className="bg-white dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700/50">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Category Breakdown</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categories} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                  {categories.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-2">
              {categories.slice(0, 6).map((c, i) => (
                <div key={c.category} className="flex items-center gap-1 text-[10px] text-slate-500">
                  <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {CATEGORY_LABELS[c.category] ?? c.category}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Reports */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700/50">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" /> Recent Reports
            </h3>
            <div className="space-y-2">
              {recent.slice(0, 8).map((r) => (
                <div key={r.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm bg-slate-100 dark:bg-slate-700">
                      {CATEGORY_LABELS[r.category]?.charAt(0) ?? '?'}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-900 dark:text-white">{r.accommodationName}</p>
                      <p className="text-[10px] text-slate-400">{r.area} · {CATEGORY_LABELS[r.category] ?? r.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      r.status === 'verified' ? 'bg-green-100 text-green-700' :
                      r.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      r.status === 'resolved' ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>{r.status}</span>
                    <span className="text-[10px] text-slate-400">{new Date(r.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
