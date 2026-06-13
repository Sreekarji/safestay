import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  FileText,
  ArrowRight,
  Bell,
  MapPin,
  Eye,
  ThumbsUp,
  BarChart3,
} from 'lucide-react';
import { ScrollReveal, StaggerReveal, FadeIn } from '@/components/ParallaxEffect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelativeTime, getStatusColor, getSSITailwind } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import type { Report, DashboardStats } from '@/types';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CATEGORY_LABELS: Record<string, string> = {
  fire_safety: 'Fire Safety',
  water_quality: 'Water Quality',
  structural: 'Structural',
  electrical: 'Electrical',
  hygiene: 'Hygiene',
  security: 'Security',
  food_safety: 'Food Safety',
  other: 'Other',
};

const CATEGORY_COLORS: Record<string, string> = {
  fire_safety: 'bg-red-100 text-red-700',
  water_quality: 'bg-blue-100 text-blue-700',
  structural: 'bg-orange-100 text-orange-700',
  electrical: 'bg-yellow-100 text-yellow-700',
  hygiene: 'bg-purple-100 text-purple-700',
  security: 'bg-indigo-100 text-indigo-700',
  food_safety: 'bg-emerald-100 text-emerald-700',
  other: 'bg-slate-100 text-slate-700',
};

const SEVERITY_LABELS: Record<number, { text: string; color: string }> = {
  1: { text: 'Low', color: 'text-emerald-600' },
  2: { text: 'Low', color: 'text-emerald-600' },
  3: { text: 'Low', color: 'text-emerald-600' },
  4: { text: 'Medium', color: 'text-amber-600' },
  5: { text: 'Medium', color: 'text-amber-600' },
  6: { text: 'Medium', color: 'text-amber-600' },
  7: { text: 'High', color: 'text-orange-600' },
  8: { text: 'High', color: 'text-orange-600' },
  9: { text: 'Critical', color: 'text-red-600' },
  10: { text: 'Critical', color: 'text-red-600' },
};

export function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats>({
    totalReports: 0,
    pending: 0,
    verified: 0,
    resolved: 0,
  });
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [upvotesReceived, setUpvotesReceived] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's own reports and compute stats from them
  useEffect(() => {
    async function loadReports() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API}/api/reports/my-reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load reports');
        const body = await res.json();
        const data = body.data || body;
        const reports: Report[] = Array.isArray(data) ? data : data.reports || [];
        // Sort by newest first, take last 5
        const sorted = reports
          .slice()
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        setRecentReports(sorted);
        // Compute stats from reports
        setStats({
          totalReports: reports.length,
          pending: reports.filter(r => r.status === 'pending' || r.status === 'ai_verified').length,
          verified: reports.filter(r => r.status === 'verified').length,
          resolved: reports.filter(r => r.status === 'resolved').length,
        });
        // Sum upvotes from all user reports
        const totalUpvotes = reports.reduce((sum, r) => sum + (r.upvotes || 0), 0);
        setUpvotesReceived(totalUpvotes);
      } catch (err: any) {
        console.error('Reports fetch error:', err);
        setError('Could not load your reports.');
      } finally {
        setLoading(false);
        setStatsLoading(false);
      }
    }
    loadReports();
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const statCards = [
    {
      label: 'Total Reports',
      value: stats.totalReports,
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      label: 'Pending Review',
      value: stats.pending,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    },
    {
      label: 'Resolved',
      value: stats.resolved,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      label: 'Upvotes Received',
      value: upvotesReceived,
      icon: ThumbsUp,
      color: 'text-violet-600',
      bg: 'bg-violet-100',
    },
  ];

  const quickActions = [
    {
      label: 'Report New Issue',
      description: 'Submit a safety concern',
      icon: AlertTriangle,
      to: '/report-incident',
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
    {
      label: 'View Safety Map',
      description: 'Explore area safety scores',
      icon: MapPin,
      to: '/map',
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      label: 'My Reports',
      description: 'Track your submissions',
      icon: Eye,
      to: '/my-reports',
      color: 'text-violet-600',
      bg: 'bg-violet-100',
    },
  ];

  // Loading skeleton
  if (loading && statsLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="animate-pulse">
          <div className="h-48 bg-gradient-to-r from-primary-600 to-indigo-600" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-white rounded-xl shadow-sm" />
              ))}
            </div>
            <div className="mt-8 h-64 bg-white rounded-xl shadow-sm" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImVub3Zsb3kiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0djJoLTJ2LTJoMnptMCAyMHYyaC0ydi0yaDJ6TTIwIDM0djJoLTJ2LTJoMnpNMzQgMjB2MmgtMnYtMmgyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <ScrollReveal>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="h-8 w-8 text-white/80" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-white/70 uppercase tracking-wider">
                    SafeStay Dashboard
                  </span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white">
                  {greeting}, {user?.name?.split(' ')[0] || 'Student'}
                </h1>
                <p className="mt-2 text-lg text-primary-100">
                  Here is an overview of your safety reporting activity.
                </p>
              </div>
              <div className="mt-6 sm:mt-0 flex items-center gap-3">
                <Link to="/report-incident">
                  <Button className="bg-white text-primary-700 hover:bg-primary-50 shadow-lg">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    New Report
                  </Button>
                </Link>
                <Link to="/notifications">
                  <Button
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 relative"
                  >
                    <Bell className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 -mt-8 pb-12">
        {/* Stats Cards */}
        <StaggerReveal stagger={100}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat) => (
              <Card
                key={stat.label}
                className="bg-white shadow-sm hover:shadow-md transition-shadow border-0"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                      <p className="mt-2 text-3xl font-bold text-slate-900">
                        {statsLoading ? (
                          <span className="inline-block h-8 w-16 bg-slate-200 animate-pulse rounded" />
                        ) : (
                          stat.value
                        )}
                      </p>
                    </div>
                    <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </StaggerReveal>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Recent Reports */}
          <div className="lg:col-span-2">
            <ScrollReveal delay={200}>
              <Card className="bg-white shadow-sm border-0">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-slate-900">
                      Recent Reports
                    </CardTitle>
                    <Link
                      to="/my-reports"
                      className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    >
                      View All
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {error && (
                    <div className="py-8 text-center">
                      <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">{error}</p>
                    </div>
                  )}

                  {!error && recentReports.length === 0 && !loading && (
                    <div className="py-12 text-center">
                      <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">No reports yet</p>
                      <p className="text-sm text-slate-400 mt-1">
                        Submit your first safety report to get started.
                      </p>
                      <Link to="/report/new" className="mt-4 inline-block">
                        <Button size="sm">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Report an Issue
                        </Button>
                      </Link>
                    </div>
                  )}

                  {loading && (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse flex gap-4 p-3 rounded-lg">
                          <div className="h-10 w-10 bg-slate-200 rounded-lg shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-200 rounded w-3/4" />
                            <div className="h-3 bg-slate-200 rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!loading && recentReports.length > 0 && (
                    <div className="divide-y divide-slate-100">
                      {recentReports.map((report, idx) => {
                        const severity = SEVERITY_LABELS[report.severity] || {
                          text: 'Unknown',
                          color: 'text-slate-500',
                        };
                        const accommodationName =
                          typeof report.accommodationId === 'object' &&
                          report.accommodationId !== null
                            ? (report.accommodationId as any).name
                            : 'Unknown Location';

                        return (
                          <motion.div
                            key={report._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
                            onClick={() => navigate(`/reports/${report._id}`)}
                          >
                            <div
                              className={`p-2 rounded-lg shrink-0 ${
                                CATEGORY_COLORS[report.category] || 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-sm font-semibold text-slate-900 truncate group-hover:text-primary-600 transition-colors">
                                  {report.title}
                                </h4>
                                <span
                                  className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                                    report.status
                                  )}`}
                                >
                                  {report.status.replace('_', ' ')}
                                </span>
                              </div>
                              <p className="mt-0.5 text-xs text-slate-500 truncate">
                                {accommodationName}
                              </p>
                              <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-400">
                                <span
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                    CATEGORY_COLORS[report.category] || 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {CATEGORY_LABELS[report.category] || report.category}
                                </span>
                                <span className={severity.color}>
                                  Severity {report.severity}/10
                                </span>
                                <span className="flex items-center gap-1">
                                  <ThumbsUp className="h-3 w-3" />
                                  {report.upvotes || 0}
                                </span>
                                <span className="ml-auto">
                                  {formatRelativeTime(report.createdAt)}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-6">
            <ScrollReveal delay={300}>
              <Card className="bg-white shadow-sm border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-slate-900">
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {quickActions.map((action) => (
                    <Link key={action.label} to={action.to}>
                      <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer">
                        <div className={`p-2.5 rounded-lg ${action.bg}`}>
                          <action.icon className={`h-5 w-5 ${action.color}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">
                            {action.label}
                          </p>
                          <p className="text-xs text-slate-500">{action.description}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* Activity Summary Card */}
            <ScrollReveal delay={400}>
              <Card className="bg-gradient-to-br from-primary-50 to-indigo-50 border-0">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-primary-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Your Impact</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Reports submitted</span>
                      <span className="text-sm font-bold text-slate-900">
                        {stats.totalReports}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Issues resolved</span>
                      <span className="text-sm font-bold text-emerald-600">
                        {stats.resolved}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Community upvotes</span>
                      <span className="text-sm font-bold text-violet-600">
                        {upvotesReceived}
                      </span>
                    </div>
                  </div>
                  {stats.totalReports > 0 && (
                    <div className="mt-4 pt-3 border-t border-primary-100">
                      <div className="flex items-center gap-2 text-xs text-primary-700">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span className="font-medium">
                          {stats.resolved > 0
                            ? `${Math.round((stats.resolved / stats.totalReports) * 100)}% resolution rate`
                            : 'Keep reporting to help the community'}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
}
