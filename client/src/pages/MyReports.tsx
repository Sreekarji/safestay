import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Edit3,
  Trash2,
  Filter,
  Search,
  ArrowLeft,
  MapPin,
  ThumbsUp,
  MessageSquare,
  X,
  Shield,
  Image,
} from 'lucide-react';
import { ScrollReveal, StaggerReveal } from '@/components/ParallaxEffect';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime, getStatusColor, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { API_URL } from '@/lib/constants';
import type { Report } from '@/types';
import toast from 'react-hot-toast';

const API = API_URL;

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

const SEVERITY_CONFIG: Record<number, { text: string; color: string }> = {
  1: { text: 'Low', color: 'text-emerald-600 bg-emerald-50' },
  2: { text: 'Low', color: 'text-emerald-600 bg-emerald-50' },
  3: { text: 'Low', color: 'text-emerald-600 bg-emerald-50' },
  4: { text: 'Medium', color: 'text-amber-600 bg-amber-50' },
  5: { text: 'Medium', color: 'text-amber-600 bg-amber-50' },
  6: { text: 'Medium', color: 'text-amber-600 bg-amber-50' },
  7: { text: 'High', color: 'text-orange-600 bg-orange-50' },
  8: { text: 'High', color: 'text-red-600 bg-red-50' },
  9: { text: 'Critical', color: 'text-red-600 bg-red-50' },
  10: { text: 'Critical', color: 'text-red-600 bg-red-50' },
};

const STATUS_TABS = [
  { key: 'all', label: 'All', icon: FileText },
  { key: 'pending', label: 'Pending', icon: Clock },
  { key: 'approved', label: 'Approved', icon: CheckCircle },
  { key: 'resolved', label: 'Resolved', icon: CheckCircle },
  { key: 'disputed', label: 'Disputed', icon: AlertTriangle },
] as const;

type TabKey = (typeof STATUS_TABS)[number]['key'];

export function MyReports() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch user's reports
  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const token = useAuthStore.getState().token;
        const res = await fetch(`${API}/api/reports/my-reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load reports');
        const body = await res.json();
        const data = body.data || body;
        const reportsList: Report[] = Array.isArray(data) ? data : data.reports || [];
        // Sort by newest first
        const sorted = reportsList.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setReports(sorted);
      } catch (err: any) {
        console.error('My reports fetch error:', err);
        setError('Could not load your reports. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  // Filter reports by tab and search
  const filteredReports = useMemo(() => {
    let result = reports;

    // Tab filter
    if (activeTab !== 'all') {
      if (activeTab === 'pending') {
        result = result.filter((r) => r.status === 'pending');
      } else if (activeTab === 'approved') {
        result = result.filter((r) => r.status === 'approved' || r.status === 'ai_verified' || r.status === 'verified');
      } else if (activeTab === 'resolved') {
        result = result.filter((r) => r.status === 'resolved');
      } else if (activeTab === 'disputed') {
        result = result.filter((r) => r.status === 'disputed' || r.status === 'rejected');
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          (CATEGORY_LABELS[r.category] || r.category).toLowerCase().includes(q)
      );
    }

    return result;
  }, [reports, activeTab, searchQuery]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<TabKey, number> = {
      all: reports.length,
      pending: 0,
      approved: 0,
      resolved: 0,
      disputed: 0,
    };
    for (const r of reports) {
      if (r.status === 'pending') counts.pending++;
      else if (r.status === 'approved' || r.status === 'ai_verified' || r.status === 'verified') counts.approved++;
      else if (r.status === 'resolved') counts.resolved++;
      else if (r.status === 'disputed' || r.status === 'rejected') counts.disputed++;
    }
    return counts;
  }, [reports]);

  // Delete handler
  const handleDelete = async (reportId: string) => {
    try {
      setDeletingId(reportId);
      const token = useAuthStore.getState().token;
      const res = await fetch(`${API}/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete report');
      setReports((prev) => prev.filter((r) => r._id !== reportId));
      setDeleteConfirmId(null);
      toast.success('Report deleted successfully');
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error('Failed to delete report. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="animate-pulse">
          <div className="h-48 bg-gradient-to-r from-primary-600 to-indigo-600" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
            <div className="h-12 bg-white rounded-xl shadow-sm mb-6" />
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-white rounded-xl shadow-sm" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImVub3Zsb3kiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0djJoLTJ2LTJoMnptMCAyMHYyaC0ydi0yaDJ6TTIwIDM0djJoLTJ2LTJoMnpNMzQgMjB2MmgtMnYtMmgyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <ScrollReveal>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white/80 hover:text-white hover:bg-white/10"
                    onClick={() => navigate('/dashboard')}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Shield className="h-7 w-7 text-white/80" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-white/70 uppercase tracking-wider">
                    My Reports
                  </span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white">
                  Your Safety Reports
                </h1>
                <p className="mt-2 text-lg text-primary-100">
                  Track, manage, and review all your submitted reports.
                </p>
              </div>
              <div className="mt-6 sm:mt-0">
                <Link to="/report/new">
                  <Button className="bg-white text-primary-700 hover:bg-primary-50 shadow-lg">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    New Report
                  </Button>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-12">
        {/* Search & Filter Bar */}
        <ScrollReveal delay={100}>
          <Card className="bg-white shadow-sm border-0 mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search reports by title or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {/* Filter indicator */}
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Filter className="h-4 w-4" />
                  <span>{filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>

        {/* Tab Filters */}
        <ScrollReveal delay={150}>
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide" role="tablist">
            {STATUS_TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  role="tab"
                  aria-selected={isActive}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tabCounts[tab.key]}
                  </span>
                </button>
              );
            })}
          </div>
        </ScrollReveal>

        {/* Error State */}
        {error && (
          <Card className="bg-white border-red-200 mb-6">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
              <p className="text-slate-700 font-medium">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!error && !loading && filteredReports.length === 0 && (
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="py-16 px-4 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-50 mx-auto mb-5">
                <FileText className="h-10 w-10 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {activeTab === 'all' && !searchQuery
                  ? 'No reports yet'
                  : 'No matching reports'}
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                {activeTab === 'all' && !searchQuery
                  ? "You haven't submitted any safety reports yet. Start by reporting an issue to help keep your accommodation safe."
                  : 'Try adjusting your filters or search query to find what you\'re looking for.'}
              </p>
              {activeTab === 'all' && !searchQuery ? (
                <Link to="/report/new">
                  <Button>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Report Your First Issue
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveTab('all');
                    setSearchQuery('');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Report Cards */}
        {!error && filteredReports.length > 0 && (
          <StaggerReveal stagger={80}>
            <div className="space-y-4">
              {filteredReports.map((report, idx) => {
                const severity = SEVERITY_CONFIG[report.severity] || {
                  text: 'Unknown',
                  color: 'text-slate-500 bg-slate-50',
                };
                const accommodation =
                  typeof report.accommodationId === 'object' && report.accommodationId !== null
                    ? (report.accommodationId as any)
                    : null;
                const isPending = report.status === 'pending';
                const isDeleting = deletingId === report._id;
                const isConfirmingDelete = deleteConfirmId === report._id;

                return (
                  <motion.div
                    key={report._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow overflow-hidden">
                      <CardContent className="p-0">
                        <div className="p-5">
                          {/* Top row: title + status */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-semibold text-slate-900 line-clamp-1">
                                {report.title}
                              </h3>
                              <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                                {report.description}
                              </p>
                            </div>
                            <Badge
                              className={`shrink-0 text-xs ml-2 ${getStatusColor(report.status)}`}
                            >
                              {report.status.replace('_', ' ')}
                            </Badge>
                          </div>

                          {/* Badges row */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                CATEGORY_COLORS[report.category] || 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {CATEGORY_LABELS[report.category] || report.category}
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${severity.color}`}
                            >
                              Severity {report.severity}/10 &middot; {severity.text}
                            </span>
                          </div>

                          {/* Image thumbnails */}
                          {report.images && report.images.length > 0 && (
                            <div className="flex items-center gap-2 mb-3">
                              <div className="flex -space-x-2">
                                {report.images.slice(0, 3).map((img, i) => (
                                  <div
                                    key={i}
                                    className="h-10 w-10 rounded-lg border-2 border-white overflow-hidden bg-slate-100"
                                  >
                                    <img
                                      src={img}
                                      alt={`Report image ${i + 1}`}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                ))}
                                {report.images.length > 3 && (
                                  <div className="h-10 w-10 rounded-lg border-2 border-white bg-slate-200 flex items-center justify-center">
                                    <span className="text-xs font-bold text-slate-600">
                                      +{report.images.length - 3}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Image className="h-3 w-3" />
                                {report.images.length} photo{report.images.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}

                          {/* Meta row */}
                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                            {accommodation && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {accommodation.name}
                                {accommodation.area ? `, ${accommodation.area}` : ''}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatRelativeTime(report.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" />
                              {report.upvotes || 0}
                            </span>
                            {report.images && report.images.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Image className="h-3 w-3" />
                                {report.images.length} photo{report.images.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action bar */}
                        <div className="flex items-center border-t border-slate-100 bg-slate-50/50 px-5 py-3 gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-600 hover:text-primary-600 hover:bg-primary-50"
                            onClick={() => navigate(`/report/${report._id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1.5" />
                            View Detail
                          </Button>

                          {isPending && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-600 hover:text-amber-600 hover:bg-amber-50"
                              onClick={() => navigate(`/report/${report._id}/edit`)}
                            >
                              <Edit3 className="h-4 w-4 mr-1.5" />
                              Edit
                            </Button>
                          )}

                          <div className="flex-1" />

                          {/* Delete with confirmation */}
                          <AnimatePresence mode="wait">
                            {isConfirmingDelete ? (
                              <motion.div
                                key="confirm"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex items-center gap-2"
                              >
                                <span className="text-xs text-red-600 font-medium">Delete?</span>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={isDeleting}
                                  onClick={() => handleDelete(report._id)}
                                  className="h-8"
                                >
                                  {isDeleting ? (
                                    <span className="flex items-center gap-1">
                                      <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                      ...
                                    </span>
                                  ) : (
                                    'Yes'
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8"
                                  onClick={() => setDeleteConfirmId(null)}
                                >
                                  No
                                </Button>
                              </motion.div>
                            ) : (
                              <motion.button
                                key="delete-btn"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                onClick={() => setDeleteConfirmId(report._id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </motion.button>
                            )}
                          </AnimatePresence>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </StaggerReveal>
        )}

        {/* Bottom summary */}
        {!error && filteredReports.length > 0 && (
          <ScrollReveal delay={300}>
            <div className="mt-8 text-center text-sm text-slate-400">
              Showing {filteredReports.length} of {reports.length} report{reports.length !== 1 ? 's' : ''}
            </div>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
}
