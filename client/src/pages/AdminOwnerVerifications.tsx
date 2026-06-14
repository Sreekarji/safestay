import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  User,
  Building2,
  ArrowLeft,
  Filter,
  Search,
  Loader2,
  Shield,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { ScrollReveal, StaggerReveal, FadeIn, ScaleIn } from '@/components/ParallaxEffect';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DocumentInfo {
  url: string;
  name: string;
  type: string;
}

interface OwnerVerification {
  _id: string;
  owner: {
    _id: string;
    name: string;
    email: string;
  };
  propertyName: string;
  documents: {
    governmentId?: DocumentInfo;
    propertyProof?: DocumentInfo;
    businessRegistration?: DocumentInfo;
  };
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminOwnerVerifications() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Data
  const [verifications, setVerifications] = useState<OwnerVerification[]>([]);
  const [filtered, setFiltered] = useState<OwnerVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Action states
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  // Document preview
  const [previewDoc, setPreviewDoc] = useState<DocumentInfo | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch verifications
  // ---------------------------------------------------------------------------

  const fetchVerifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/admin/owner-verifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed to fetch verifications');
      const body = await res.json();
      const data = body.data ?? body;
      setVerifications(Array.isArray(data) ? data : data.verifications ?? []);
    } catch (err: any) {
      console.error('Failed to load owner verifications', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  // ---------------------------------------------------------------------------
  // Filter + search
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let items = verifications;
    if (filter !== 'all') {
      items = items.filter((v) => v.status === filter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (v) =>
          v.owner.name.toLowerCase().includes(q) ||
          v.owner.email.toLowerCase().includes(q) ||
          v.propertyName.toLowerCase().includes(q),
      );
    }
    setFiltered(items);
  }, [verifications, filter, searchQuery]);

  // ---------------------------------------------------------------------------
  // Approve
  // ---------------------------------------------------------------------------

  const handleApprove = async (id: string) => {
    try {
      setApprovingId(id);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/admin/owner-verifications/${id}/approve`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Approval failed');
      setVerifications((prev) =>
        prev.map((v) => (v._id === id ? { ...v, status: 'approved' as const } : v)),
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve');
    } finally {
      setApprovingId(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Reject
  // ---------------------------------------------------------------------------

  const openRejectDialog = (id: string) => {
    setRejectingId(id);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    if (!rejectReason.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/admin/owner-verifications/${rejectingId}/reject`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      if (!res.ok) throw new Error('Rejection failed');
      setVerifications((prev) =>
        prev.map((v) =>
          v._id === rejectingId
            ? { ...v, status: 'rejected' as const, rejectionReason: rejectReason.trim() }
            : v,
        ),
      );
      setRejectDialogOpen(false);
      setRejectingId(null);
      setRejectReason('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject');
    }
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const statusConfig: Record<
    string,
    { label: string; color: string; icon: typeof Clock }
  > = {
    pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
    approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
  };

  const documentLabels: Record<string, string> = {
    governmentId: 'Government ID',
    propertyProof: 'Property Proof',
    businessRegistration: 'Business Registration',
  };

  const documentIcons: Record<string, typeof FileText> = {
    governmentId: User,
    propertyProof: Building2,
    businessRegistration: FileText,
  };

  const pendingCount = verifications.filter((v) => v.status === 'pending').length;
  const approvedCount = verifications.filter((v) => v.status === 'approved').length;
  const rejectedCount = verifications.filter((v) => v.status === 'rejected').length;

  // ---------------------------------------------------------------------------
  // Loading skeleton
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-primary-700 py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="h-8 w-64 bg-primary-600/50 rounded animate-pulse mb-4" />
            <div className="h-4 w-96 bg-primary-600/30 rounded animate-pulse" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-slate-200 rounded-full animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
                  <div className="h-3 w-56 bg-slate-100 rounded animate-pulse" />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-10 w-24 bg-slate-100 rounded-lg animate-pulse" />
                <div className="h-10 w-24 bg-slate-100 rounded-lg animate-pulse" />
                <div className="h-10 w-24 bg-slate-100 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-primary-700 py-10 px-6">
        <div className="max-w-7xl mx-auto">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-primary-200 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin Dashboard
          </Link>

          <ScrollReveal>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Shield className="h-8 w-8" />
                  Owner Verifications
                </h1>
                <p className="text-primary-200 mt-1">
                  Review and verify property owner documents
                </p>
              </div>
              {pendingCount > 0 && (
                <div className="bg-amber-500/20 border border-amber-400/30 text-amber-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {pendingCount} pending verification{pendingCount !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* Stats row */}
          <StaggerReveal stagger={80} className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Total', value: verifications.length, color: 'text-white' },
              { label: 'Pending', value: pendingCount, color: 'text-amber-300' },
              { label: 'Approved', value: approvedCount, color: 'text-emerald-300' },
              { label: 'Rejected', value: rejectedCount, color: 'text-red-300' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10"
              >
                <p className="text-primary-200 text-xs uppercase tracking-wide">{stat.label}</p>
                <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </StaggerReveal>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Filters + Search                                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <FadeIn delay={100}>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Filter tabs */}
            <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-1">
              <Filter className="h-4 w-4 text-slate-400 ml-2" />
              {(
                [
                  { key: 'all', label: 'All', count: verifications.length },
                  { key: 'pending', label: 'Pending', count: pendingCount },
                  { key: 'approved', label: 'Approved', count: approvedCount },
                  { key: 'rejected', label: 'Rejected', count: rejectedCount },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === tab.key
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`ml-1.5 text-xs ${
                      filter === tab.key ? 'text-primary-200' : 'text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, property..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </FadeIn>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Content                                                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {/* Error state */}
        {error && (
          <ScaleIn>
            <Card className="p-8 text-center border-red-200 bg-red-50/50">
              <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
              <p className="text-red-700 font-medium">{error}</p>
              <Button variant="outline" className="mt-4" onClick={fetchVerifications}>
                Try Again
              </Button>
            </Card>
          </ScaleIn>
        )}

        {/* Empty state */}
        {!error && filtered.length === 0 && (
          <ScaleIn>
            <Card className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No verifications found
              </h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                {filter === 'all' && !searchQuery
                  ? 'There are no owner verification requests to review at this time.'
                  : `No verification requests match your current filters. Try adjusting your search or filter criteria.`}
              </p>
              {(filter !== 'all' || searchQuery) && (
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => {
                    setFilter('all');
                    setSearchQuery('');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </Card>
          </ScaleIn>
        )}

        {/* Verification cards */}
        {filtered.length > 0 && (
          <StaggerReveal stagger={60} className="space-y-4">
            {filtered.map((v) => {
              const cfg = statusConfig[v.status] ?? statusConfig.pending;
              const StatusIcon = cfg.icon;
              const isActiveAction = v.status === 'pending';

              return (
                <Card
                  key={v._id}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Status bar */}
                  <div
                    className={`px-6 py-2 text-xs font-medium uppercase tracking-wider ${
                      v.status === 'pending'
                        ? 'bg-amber-50 text-amber-700'
                        : v.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {cfg.label}
                  </div>

                  <div className="p-6">
                    {/* Owner info */}
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex-shrink-0">
                        <div
                          className={`h-12 w-12 rounded-full flex items-center justify-center ${
                            v.status === 'pending'
                              ? 'bg-amber-100'
                              : v.status === 'approved'
                              ? 'bg-emerald-100'
                              : 'bg-red-100'
                          }`}
                        >
                          <StatusIcon
                            className={`h-6 w-6 ${
                              v.status === 'pending'
                                ? 'text-amber-600'
                                : v.status === 'approved'
                                ? 'text-emerald-600'
                                : 'text-red-600'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <h3 className="text-lg font-semibold text-slate-900 truncate">
                            {v.owner.name}
                          </h3>
                          <span className="text-sm text-slate-500 truncate">
                            {v.owner.email}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          {v.propertyName}
                        </div>

                        {v.rejectionReason && v.status === 'rejected' && (
                          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700">
                            <span className="font-medium">Rejection reason:</span>{' '}
                            {v.rejectionReason}
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 whitespace-nowrap">
                        {formatRelativeTime(v.createdAt)}
                      </div>
                    </div>

                    {/* Documents */}
                    <div className="mt-5">
                      <h4 className="text-sm font-medium text-slate-700 mb-3">
                        Submitted Documents
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {Object.entries(v.documents).map(([key, doc]) => {
                          if (!doc) return null;
                          const Icon = documentIcons[key] ?? FileText;
                          return (
                            <button
                              key={key}
                              onClick={() => setPreviewDoc(doc)}
                              className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-primary-300 hover:bg-primary-50/50 transition-all text-left group"
                            >
                              <div className="h-10 w-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:border-primary-300 transition-colors">
                                <Icon className="h-5 w-5 text-slate-500 group-hover:text-primary-600 transition-colors" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-slate-900 truncate">
                                  {documentLabels[key] ?? key}
                                </p>
                                <p className="text-xs text-slate-500 truncate">{doc.name}</p>
                              </div>
                              <Eye className="h-4 w-4 text-slate-400 group-hover:text-primary-600 flex-shrink-0 transition-colors" />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Actions */}
                    {isActiveAction && (
                      <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col sm:flex-row gap-3 sm:justify-end">
                        <Button
                          variant="destructive"
                          disabled={approvingId === v._id}
                          onClick={() => openRejectDialog(v._id)}
                          className="sm:w-auto w-full"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          disabled={approvingId === v._id}
                          onClick={() => handleApprove(v._id)}
                          className="sm:w-auto w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white"
                        >
                          {approvingId === v._id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          {approvingId === v._id ? 'Approving...' : 'Approve'}
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </StaggerReveal>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Document Preview Modal                                             */}
      {/* ------------------------------------------------------------------ */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setPreviewDoc(null)}
          />
          <ScaleIn scale={0.95}>
            <div className="relative z-50 bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {previewDoc.name}
                    </p>
                    <p className="text-xs text-slate-500">{previewDoc.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={previewDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-medium hover:bg-primary-700 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Preview body */}
              <div className="flex-1 overflow-auto bg-slate-50 p-6">
                {previewDoc.type?.startsWith('image/') ? (
                  <img
                    src={previewDoc.url}
                    alt={previewDoc.name}
                    className="max-w-full mx-auto rounded-lg shadow-sm"
                  />
                ) : previewDoc.type === 'application/pdf' ? (
                  <iframe
                    src={previewDoc.url}
                    title={previewDoc.name}
                    className="w-full h-full min-h-[500px] rounded-lg border border-slate-200 bg-white"
                  />
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 mb-4">
                      Preview is not available for this file type.
                    </p>
                    <a
                      href={previewDoc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Download to View
                    </a>
                  </div>
                )}
              </div>
            </div>
          </ScaleIn>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Reject Reason Dialog                                               */}
      {/* ------------------------------------------------------------------ */}
      {rejectDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setRejectDialogOpen(false)}
          />
          <ScaleIn scale={0.95}>
            <div className="relative z-50 bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Reject Verification
                  </h2>
                  <p className="text-sm text-slate-500">
                    Provide a reason for rejection
                  </p>
                </div>
              </div>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter the reason for rejecting this verification..."
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />

              <div className="flex gap-3 mt-5 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setRejectDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={!rejectReason.trim()}
                  onClick={handleReject}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </ScaleIn>
        </div>
      )}
    </div>
  );
}
