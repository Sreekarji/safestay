import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Users,
  FileText,
  Building2,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Eye,
  Shield,
  Search,
  Filter,
  ArrowRight,
  Brain,
  Activity,
} from 'lucide-react';
import { ScrollReveal, StaggerReveal, FadeIn } from '@/components/ParallaxEffect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelativeTime, getStatusColor } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import type { Report, Accommodation, User } from '@/types';

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

interface AdminStats {
  totalUsers: number;
  totalReports: number;
  totalAccommodations: number;
  pendingVerifications: number;
}

interface OwnerVerification {
  _id: string;
  userId: User;
  status: 'pending' | 'under_review' | 'verified' | 'rejected';
  createdAt: string;
}

export function AdminDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalReports: 0,
    totalAccommodations: 0,
    pendingVerifications: 0,
  });
  const [reports, setReports] = useState<Report[]>([]);
  const [ownerVerifications, setOwnerVerifications] = useState<OwnerVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const authHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  };

  // Fetch admin stats
  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch(`${API}/api/admin/stats`, {
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error('Failed to load stats');
        const body = await res.json();
        const data = body.data || body;
        setStats({
          totalUsers: data.totalUsers ?? 0,
          totalReports: data.totalReports ?? 0,
          totalAccommodations: data.totalAccommodations ?? 0,
          pendingVerifications: data.pendingVerifications ?? 0,
        });
      } catch (err) {
        console.error('Admin stats fetch error:', err);
      } finally {
        setStatsLoading(false);
      }
    }
    loadStats();
  }, []);

  // Fetch reports for moderation
  useEffect(() => {
    async function loadReports() {
      try {
        const res = await fetch(`${API}/api/admin/reports`, {
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error('Failed to load reports');
        const body = await res.json();
        const data = body.data || body;
        const reportsList: Report[] = Array.isArray(data) ? data : data.reports || [];
        setReports(
          reportsList
            .slice()
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
        );
      } catch (err) {
        console.error('Admin reports fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  // Fetch owner verifications
  useEffect(() => {
    async function loadVerifications() {
      try {
        const res = await fetch(`${API}/api/admin/owner-verifications`, {
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error('Failed to load verifications');
        const body = await res.json();
        const data = body.data || body;
        const list: OwnerVerification[] = Array.isArray(data)
          ? data
          : data.verifications || [];
        setOwnerVerifications(list);
      } catch (err) {
        console.error('Owner verifications fetch error:', err);
      }
    }
    loadVerifications();
  }, []);

  // Approve or reject a report
  async function handleReportAction(reportId: string, newStatus: 'approved' | 'rejected') {
    setActionLoading(reportId);
    try {
      const res = await fetch(`${API}/api/admin/reports/${reportId}/status`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update report');
      setReports((prev) =>
        prev.map((r) => (r._id === reportId ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      console.error('Report action error:', err);
    } finally {
      setActionLoading(null);
    }
  }

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      searchQuery === '' ||
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingReportsCount = reports.filter((r) => r.status === 'pending').length;

  const statCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      label: 'Total Reports',
      value: stats.totalReports,
      icon: FileText,
      color: 'text-violet-600',
      bg: 'bg-violet-100',
    },
    {
      label: 'Accommodations',
      value: stats.totalAccommodations,
      icon: Building2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      label: 'Pending Verifications',
      value: stats.pendingVerifications,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    },
  ];

  const quickLinks = [
    {
      label: 'Manage Reports',
      description: 'Review and moderate all reports',
      icon: FileText,
      to: '/admin/reports',
      color: 'text-violet-600',
      bg: 'bg-violet-100',
    },
    {
      label: 'Owner Verifications',
      description: `${stats.pendingVerifications} pending reviews`,
      icon: Shield,
      to: '/admin/owner-verifications',
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      label: 'View Accommodations',
      description: 'Browse all listed properties',
      icon: Building2,
      to: '/accommodations',
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
  ];

  // Loading skeleton
  if (loading && statsLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="animate-pulse">
          <div className="h-48 bg-gradient-to-r from-slate-800 to-indigo-900" />
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

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImVub3Zsb3kiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDE0djJoLTJ2LTJoMnptMCAyMHYyaC0ydi0yaDJ6TTIwIDM0djJoLTJ2LTJoMnpNMzQgMjB2MmgtMnYtMmgyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <ScrollReveal>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="h-8 w-8 text-white/80" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-white/70 uppercase tracking-wider">
                    SafeStay Admin
                  </span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white">
                  {greeting}, {user?.name?.split(' ')[0] || 'Admin'}
                </h1>
                <p className="mt-2 text-lg text-slate-300">
                  Platform overview and moderation controls.
                </p>
              </div>
              <div className="mt-6 sm:mt-0 flex items-center gap-3">
                <Link to="/admin/reports">
                  <Button className="bg-white text-slate-800 hover:bg-slate-100 shadow-lg">
                    <FileText className="h-4 w-4 mr-2" />
                    Review Reports
                  </Button>
                </Link>
                <Link to="/admin/owner-verifications">
                  <Button
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Verifications
                  </Button>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-12 space-y-8">
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

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Report Moderation Table */}
          <div className="lg:col-span-2">
            <ScrollReveal delay={200}>
              <Card className="bg-white shadow-sm border-0">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-slate-900">
                      Report Moderation
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      {pendingReportsCount > 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                          {pendingReportsCount} pending
                        </span>
                      )}
                      <Link
                        to="/admin/reports"
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        View All
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                  {/* Search and Filter */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search reports..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="ai_verified">AI Verified</option>
                        <option value="approved">Approved</option>
                        <option value="resolved">Resolved</option>
                        <option value="rejected">Rejected</option>
                        <option value="disputed">Disputed</option>
                      </select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {loading && (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="animate-pulse flex gap-4 p-3 rounded-lg">
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-200 rounded w-3/4" />
                            <div className="h-3 bg-slate-200 rounded w-1/2" />
                          </div>
                          <div className="h-6 w-20 bg-slate-200 rounded-full" />
                          <div className="h-8 w-16 bg-slate-200 rounded" />
                        </div>
                      ))}
                    </div>
                  )}

                  {!loading && filteredReports.length === 0 && (
                    <div className="py-12 text-center">
                      <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">No reports found</p>
                      <p className="text-sm text-slate-400 mt-1">
                        {searchQuery || statusFilter !== 'all'
                          ? 'Try adjusting your search or filter criteria.'
                          : 'All reports have been moderated.'}
                      </p>
                    </div>
                  )}

                  {!loading && filteredReports.length > 0 && (
                    <div className="divide-y divide-slate-100">
                      {filteredReports.map((report, idx) => {
                        const accommodationName =
                          typeof report.accommodationId === 'object' &&
                          report.accommodationId !== null
                            ? (report.accommodationId as Accommodation).name
                            : 'Unknown Location';

                        const aiConfidence = report.aiVerification?.overallConfidence;
                        const aiConsensus = report.aiVerification?.consensus;

                        return (
                          <motion.div
                            key={report._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                          >
                            {/* Report Info */}
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
                                <span className="text-slate-500">
                                  Severity {report.severity}/10
                                </span>
                                {aiConsensus && (
                                  <span className="inline-flex items-center gap-1 text-indigo-600 font-medium">
                                    <Brain className="h-3 w-3" />
                                    AI: {aiConsensus}
                                    {aiConfidence != null && (
                                      <span className="text-slate-400 font-normal">
                                        ({Math.round(aiConfidence * 100)}%)
                                      </span>
                                    )}
                                  </span>
                                )}
                                <span className="ml-auto">
                                  {formatRelativeTime(report.createdAt)}
                                </span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            {(report.status === 'pending' || report.status === 'ai_verified') && (
                              <div className="flex items-center gap-2 shrink-0">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                                  disabled={actionLoading === report._id}
                                  onClick={() => handleReportAction(report._id, 'approved')}
                                >
                                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                                  disabled={actionLoading === report._id}
                                  onClick={() => handleReportAction(report._id, 'rejected')}
                                >
                                  <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            )}

                            {/* View Button */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs shrink-0"
                              onClick={() => navigate(`/reports/${report._id}`)}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              View
                            </Button>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Links */}
            <ScrollReveal delay={300}>
              <Card className="bg-white shadow-sm border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-slate-900">
                    Quick Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {quickLinks.map((link) => (
                    <Link key={link.label} to={link.to}>
                      <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer">
                        <div className={`p-2.5 rounded-lg ${link.bg}`}>
                          <link.icon className={`h-5 w-5 ${link.color}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">
                            {link.label}
                          </p>
                          <p className="text-xs text-slate-500">{link.description}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* Owner Verification Queue */}
            <ScrollReveal delay={400}>
              <Card className="bg-white shadow-sm border-0">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-slate-900">
                      Verification Queue
                    </CardTitle>
                    <Link
                      to="/admin/owner-verifications"
                      className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    >
                      View All
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {ownerVerifications.filter((v) => v.status === 'pending').length === 0 ? (
                    <div className="py-8 text-center">
                      <Shield className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500 font-medium">
                        No pending verifications
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        All owner requests have been reviewed.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {ownerVerifications
                        .filter((v) => v.status === 'pending')
                        .slice(0, 5)
                        .map((verification, idx) => (
                          <motion.div
                            key={verification._id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                          >
                            <div className="p-2 bg-amber-100 rounded-lg shrink-0">
                              <Clock className="h-4 w-4 text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {verification.userId?.name || 'Unknown Owner'}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatRelativeTime(verification.createdAt)}
                              </p>
                            </div>
                            <Link to="/admin/owner-verifications">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs"
                              >
                                Review
                              </Button>
                            </Link>
                          </motion.div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* Platform Activity Summary */}
            <ScrollReveal delay={500}>
              <Card className="bg-gradient-to-br from-slate-800 to-indigo-950 border-0">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Activity className="h-5 w-5 text-white/80" />
                    </div>
                    <h3 className="font-semibold text-white">Platform Health</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">Active users</span>
                      <span className="text-sm font-bold text-white">
                        {stats.totalUsers}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">Total reports</span>
                      <span className="text-sm font-bold text-white">
                        {stats.totalReports}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">Accommodations</span>
                      <span className="text-sm font-bold text-white">
                        {stats.totalAccommodations}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">Pending reviews</span>
                      <span className="text-sm font-bold text-amber-400">
                        {stats.pendingVerifications}
                      </span>
                    </div>
                  </div>
                  {stats.totalUsers > 0 && stats.totalReports > 0 && (
                    <div className="mt-4 pt-3 border-t border-white/10">
                      <div className="flex items-center gap-2 text-xs text-white/70">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span className="font-medium">
                          {stats.totalUsers} users contributing to community safety
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
