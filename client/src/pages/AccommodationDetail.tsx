import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Shield,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Phone,
  CheckCircle,
  Info,
  TrendingUp,
  DollarSign,
  Users,
  Map,
  Check,
  Wrench,
  AlertCircle,
  XCircle,
  ArrowRight,
  Edit3,
  BarChart3,
  X,
  Upload,
  Send,
  MessageSquare,
  Zap,
} from 'lucide-react';
import { ScrollReveal, StaggerReveal, ScaleIn } from '@/components/ParallaxEffect';
import { formatRelativeTime, getStatusColor, getSSITailwind } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Accommodation, Report } from '@/types';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ---------- helpers ----------
function getSSIGradient(ssi: number) {
  if (ssi >= 80) return 'from-emerald-500 to-green-600';
  if (ssi >= 60) return 'from-amber-400 to-yellow-500';
  if (ssi >= 40) return 'from-orange-400 to-amber-500';
  return 'from-red-500 to-rose-600';
}

function getSeverityBadgeColor(severity: number) {
  if (severity >= 8) return 'bg-red-100 text-red-700 border-red-200';
  if (severity >= 6) return 'bg-orange-100 text-orange-700 border-orange-200';
  if (severity >= 4) return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-emerald-100 text-emerald-700 border-emerald-200';
}

function getCategoryLabel(cat: string) {
  const labels: Record<string, string> = {
    fire_safety: 'Fire Safety',
    water_quality: 'Water Quality',
    structural: 'Structural',
    electrical: 'Electrical',
    hygiene: 'Hygiene',
    security: 'Security',
    food_safety: 'Food Safety',
    other: 'Other',
  };
  return labels[cat] || cat;
}

function getCategoryIcon(cat: string) {
  const icons: Record<string, React.ReactNode> = {
    fire_safety: <AlertTriangle className="h-4 w-4" />,
    water_quality: <DollarSign className="h-4 w-4" />,
    structural: <Wrench className="h-4 w-4" />,
    electrical: <Zap className="h-4 w-4" />,
    hygiene: <CheckCircle className="h-4 w-4" />,
    security: <Shield className="h-4 w-4" />,
    food_safety: <AlertCircle className="h-4 w-4" />,
    other: <Info className="h-4 w-4" />,
  };
  return icons[cat] || <Info className="h-4 w-4" />;
}

// ---------- main component ----------
export default function AccommodationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [accommodation, setAccommodation] = useState<Accommodation | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // owner resolve modal state
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolveText, setResolveText] = useState('');
  const [resolveImages, setResolveImages] = useState<File[]>([]);
  const [resolvePreviews, setResolvePreviews] = useState<string[]>([]);
  const [resolving, setResolving] = useState(false);

  const resolveFileRef = useRef<HTMLInputElement>(null);

  // ---------- fetch ----------
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`${API}/api/accommodations/${id}`).then((r) => {
        if (!r.ok) throw new Error('Accommodation not found');
        return r.json();
      }),
      fetch(`${API}/api/reports?accommodationId=${id}`).then((r) => {
        if (!r.ok) return [];
        return r.json();
      }),
    ])
      .then(([accData, reportsData]) => {
        // API may return { data: Accommodation } or the Accommodation directly
        const acc = accData.data || accData;
        setAccommodation(Array.isArray(acc) ? acc[0] : acc);
        const rptData = reportsData.data || reportsData;
        setReports(Array.isArray(rptData) ? rptData : []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // ---------- owner detection ----------
  const owner = accommodation?.ownerId as any;
  const isOwner =
    user?.role === 'owner' &&
    owner &&
    (typeof owner === 'string'
      ? owner === user._id
      : owner._id === user._id);

  // ---------- report stats ----------
  const reportStats = {
    total: reports.length,
    pending: reports.filter((r) => r.status === 'pending' || r.status === 'ai_verified' || r.status === 'approved').length,
    resolved: reports.filter((r) => r.status === 'resolved' || r.status === 'verified').length,
    disputed: reports.filter((r) => r.status === 'disputed').length,
  };

  // ---------- resolve handler ----------
  const openResolveModal = (report: Report) => {
    setSelectedReport(report);
    setResolveText('');
    setResolveImages([]);
    setResolvePreviews([]);
    setResolveModalOpen(true);
  };

  const handleResolveImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setResolveImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setResolvePreviews((prev) => [...prev, (reader.result as string)]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeResolveImage = (idx: number) => {
    setResolveImages((prev) => prev.filter((_, i) => i !== idx));
    setResolvePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const submitResolve = async () => {
    if (!selectedReport || !resolveText.trim()) return;
    setResolving(true);
    try {
      const fd = new FormData();
      fd.append('message', resolveText.trim());
      resolveImages.forEach((f) => fd.append('proofImages', f));

      const res = await fetch(`${API}/api/reports/${selectedReport._id}/resolve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        body: fd,
      });
      if (!res.ok) throw new Error('Failed to resolve report');

      const updated = await res.json();
      setReports((prev) => prev.map((r) => (r._id === selectedReport._id ? { ...r, ...updated.data } : r)));
      setResolveModalOpen(false);
      setSelectedReport(null);
    } catch (err: any) {
      alert(err.message || 'Failed to resolve report');
    } finally {
      setResolving(false);
    }
  };

  // ---------- loading ----------
  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-12 w-48 bg-slate-200 rounded-xl" />
          <div className="h-64 bg-slate-200 rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-40 bg-slate-200 rounded-xl" />
              <div className="h-60 bg-slate-200 rounded-xl" />
            </div>
            <div className="h-80 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // ---------- error ----------
  if (error || !accommodation) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <ScaleIn>
          <Card className="p-10 text-center max-w-md">
            <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Not Found</h2>
            <p className="text-slate-500 mb-6">{error || 'Accommodation not found.'}</p>
            <Button onClick={() => navigate(-1)} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
            </Button>
          </Card>
        </ScaleIn>
      </div>
    );
  }

  const ssi = accommodation.ssi ?? 0;
  const hasLocation =
    accommodation.location?.coordinates &&
    accommodation.location.coordinates[0] !== 0 &&
    accommodation.location.coordinates[1] !== 0;
  const mapLat = hasLocation ? accommodation.location!.coordinates[1] : 17.385;
  const mapLng = hasLocation ? accommodation.location!.coordinates[0] : 78.4867;

  // ---------- render ----------
  return (
    <div className="min-h-screen bg-slate-50">
      {/* ===== HERO HEADER ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10"><Shield className="h-40 w-40" strokeWidth={0.5} /></div>
          <div className="absolute bottom-10 right-10"><Shield className="h-32 w-32" strokeWidth={0.5} /></div>
        </div>
        <div className="relative mx-auto max-w-7xl px-6 py-10 lg:py-14">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-primary-100 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
          </motion.div>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex items-center gap-3 mb-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getSSITailwind(ssi)}`}>
                  <Shield className="h-3 w-3" />
                  SSI {ssi}
                </span>
                {accommodation.type && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/15 text-white/90">
                    {accommodation.type}
                  </span>
                )}
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">{accommodation.name}</h1>
              <div className="flex items-center gap-2 mt-3 text-primary-100">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{accommodation.address}, {accommodation.area}</span>
                {accommodation.city && <span className="text-sm">, {accommodation.city}</span>}
              </div>
            </motion.div>

            {/* SSI Score Circle */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex-shrink-0"
            >
              <div className={`relative w-28 h-28 rounded-full bg-gradient-to-br ${getSSIGradient(ssi)} flex items-center justify-center shadow-lg`}>
                <div className="text-center">
                  <span className="text-3xl font-extrabold text-white leading-none">{ssi}</span>
                  <span className="block text-[10px] font-medium text-white/80 uppercase tracking-wider">SSI</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== MAIN CONTENT ===== */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ---- LEFT: Main column ---- */}
          <div className="lg:col-span-2 space-y-8">
            {/* -- Owner Stats Cards -- */}
            {isOwner && (
              <ScrollReveal>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Reports', value: reportStats.total, icon: <BarChart3 className="h-5 w-5" />, color: 'bg-blue-50 text-blue-600' },
                    { label: 'Pending', value: reportStats.pending, icon: <Clock className="h-5 w-5" />, color: 'bg-amber-50 text-amber-600' },
                    { label: 'Resolved', value: reportStats.resolved, icon: <CheckCircle className="h-5 w-5" />, color: 'bg-emerald-50 text-emerald-600' },
                    { label: 'Disputed', value: reportStats.disputed, icon: <AlertTriangle className="h-5 w-5" />, color: 'bg-red-50 text-red-600' },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                    >
                      <Card className="hover:shadow-card-hover transition-shadow">
                        <CardContent className="p-5">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${stat.color}`}>
                              {stat.icon}
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                              <p className="text-xs text-slate-500">{stat.label}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </ScrollReveal>
            )}

            {/* -- Quick Info Cards -- */}
            <StaggerReveal>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {accommodation.monthlyRent != null && (
                  <Card className="hover:shadow-card-hover transition-shadow">
                    <CardContent className="p-5 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <DollarSign className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-slate-900">Rs. {accommodation.monthlyRent.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">Monthly Rent</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {accommodation.capacity != null && (
                  <Card className="hover:shadow-card-hover transition-shadow">
                    <CardContent className="p-5 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-slate-900">{accommodation.currentOccupancy ?? 0} / {accommodation.capacity}</p>
                        <p className="text-xs text-slate-500">Rooms Occupied</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                <Card className="hover:shadow-card-hover transition-shadow">
                  <CardContent className="p-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-900">{reportStats.resolved}</p>
                      <p className="text-xs text-slate-500">Issues Resolved</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </StaggerReveal>

            {/* -- Category Scores -- */}
            {accommodation.categoryScores && Object.keys(accommodation.categoryScores).length > 0 && (
              <ScrollReveal>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary-600" />
                      Category Scores
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(accommodation.categoryScores).map(([cat, score]) => {
                        const val = typeof score === 'number' ? score : 0;
                        return (
                          <div key={cat} className="flex items-center gap-3">
                            <span className="text-xs font-medium text-slate-600 w-28 truncate" title={getCategoryLabel(cat)}>
                              {getCategoryLabel(cat)}
                            </span>
                            <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${val}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className={`h-full rounded-full ${
                                  val >= 80 ? 'bg-emerald-500' : val >= 60 ? 'bg-amber-500' : val >= 40 ? 'bg-orange-500' : 'bg-red-500'
                                }`}
                              />
                            </div>
                            <span className="text-sm font-bold text-slate-900 w-10 text-right">{val}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            )}

            {/* -- Amenities -- */}
            {accommodation.amenities && accommodation.amenities.length > 0 && (
              <ScrollReveal>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                      Amenities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {accommodation.amenities.map((amenity) => (
                        <span
                          key={amenity}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          <Check className="h-3 w-3 text-emerald-500" />
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            )}

            {/* -- Reports Section -- */}
            <ScrollReveal>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary-600" />
                      Reports ({reports.length})
                    </CardTitle>
                    {!isOwner && user?.role === 'student' && (
                      <Link to={`/report?accommodationId=${accommodation._id}`}>
                        <Button size="sm">
                          <AlertTriangle className="h-4 w-4 mr-1.5" />
                          Report Issue
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {reports.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="h-12 w-12 text-emerald-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">No reports yet</p>
                      <p className="text-sm text-slate-400 mt-1">This property has a clean record.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <StaggerReveal>
                        {reports.map((report) => {
                          const reporterName =
                            typeof report.userId === 'object' && report.userId
                              ? report.userId.name
                              : 'Anonymous';
                          return (
                            <motion.div
                              key={report._id}
                              className="border border-slate-100 rounded-xl p-4 hover:bg-slate-50/50 transition-colors"
                              whileHover={{ y: -1 }}
                            >
                              {/* Report header */}
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getSeverityBadgeColor(report.severity)}`}>
                                      {getCategoryIcon(report.category)}
                                      {getCategoryLabel(report.category)}
                                    </span>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${getStatusColor(report.status)}`}>
                                      {report.status.replace('_', ' ')}
                                    </span>
                                    {report.aiVerification?.consensus && (
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                        report.aiVerification.consensus === 'accept'
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : report.aiVerification.consensus === 'reject'
                                          ? 'bg-red-50 text-red-700 border border-red-200'
                                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                                      }`}>
                                        <Shield className="h-2.5 w-2.5" />
                                        AI {report.aiVerification.consensus}
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="font-semibold text-slate-900 text-sm">{report.title}</h4>
                                  <p className="text-xs text-slate-500 mt-1">{report.description}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-xs text-slate-400">{formatRelativeTime(report.createdAt)}</p>
                                  <p className="text-xs text-slate-400">by {report.isAnonymous ? 'Anonymous' : reporterName}</p>
                                </div>
                              </div>

                              {/* Report images */}
                              {report.images && report.images.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                                  {report.images.map((img, idx) => (
                                    <img
                                      key={idx}
                                      src={img.startsWith('http') ? img : `${API}${img}`}
                                      alt={`Report evidence ${idx + 1}`}
                                      className="h-20 w-20 object-cover rounded-lg border border-slate-200 flex-shrink-0"
                                    />
                                  ))}
                                </div>
                              )}

                              {/* Owner response */}
                              {report.ownerResponse && (
                                <div className="mt-3 bg-primary-50 border border-primary-100 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <Edit3 className="h-3.5 w-3.5 text-primary-600" />
                                    <span className="text-xs font-semibold text-primary-700">Owner Response</span>
                                    <span className="text-[10px] text-primary-400">{formatRelativeTime(report.ownerResponse.respondedAt)}</span>
                                  </div>
                                  <p className="text-xs text-slate-700">{report.ownerResponse.message}</p>
                                  {report.ownerResponse.proofImages && report.ownerResponse.proofImages.length > 0 && (
                                    <div className="flex gap-2 mt-2 overflow-x-auto">
                                      {report.ownerResponse.proofImages.map((img, idx) => (
                                        <img
                                          key={idx}
                                          src={img.startsWith('http') ? img : `${API}${img}`}
                                          alt={`Proof ${idx + 1}`}
                                          className="h-16 w-16 object-cover rounded-lg border border-primary-200 flex-shrink-0"
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Owner resolve button */}
                              {isOwner && (report.status === 'pending' || report.status === 'ai_verified' || report.status === 'approved') && (
                                <div className="mt-3 pt-3 border-t border-slate-100">
                                  <Button size="sm" onClick={() => openResolveModal(report)}>
                                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                                    Respond / Resolve
                                  </Button>
                                </div>
                              )}

                              {/* Upvotes */}
                              {report.upvotes > 0 && (
                                <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                                  <TrendingUp className="h-3 w-3" />
                                  {report.upvotes} upvote{report.upvotes !== 1 ? 's' : ''}
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </StaggerReveal>
                    </div>
                  )}
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>

          {/* ---- RIGHT: Sidebar ---- */}
          <div className="space-y-6">
            {/* -- Owner Dashboard CTA -- */}
            {isOwner && (
              <ScrollReveal delay={0.1}>
                <Card className="bg-gradient-to-br from-primary-600 to-indigo-700 text-white border-0">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Owner Dashboard
                    </h3>
                    <p className="text-primary-100 text-sm mb-4">
                      View detailed analytics, manage responses, and track resolution progress.
                    </p>
                    <Link to="/owner/dashboard">
                      <Button className="w-full bg-white text-primary-700 hover:bg-primary-50">
                        Open Dashboard <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </ScrollReveal>
            )}

            {/* -- Contact Card -- */}
            <ScrollReveal delay={0.15}>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-slate-900 mb-4">Contact Information</h3>
                  {accommodation.contactPhone && (
                    <a
                      href={`tel:${accommodation.contactPhone}`}
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors mb-2"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{accommodation.contactPhone}</p>
                        <p className="text-xs text-slate-500">Call Now</p>
                      </div>
                    </a>
                  )}
                  {accommodation.contactEmail && (
                    <a
                      href={`mailto:${accommodation.contactEmail}`}
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <Info className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{accommodation.contactEmail}</p>
                        <p className="text-xs text-slate-500">Email</p>
                      </div>
                    </a>
                  )}
                  {!accommodation.contactPhone && !accommodation.contactEmail && (
                    <p className="text-sm text-slate-400 text-center py-4">No contact information available.</p>
                  )}
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* -- Map Embed -- */}
            <ScrollReveal delay={0.2}>
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 pb-2">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <Map className="h-4 w-4 text-primary-600" />
                      Location
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">{accommodation.area}{accommodation.city ? `, ${accommodation.city}` : ''}</p>
                  </div>
                  <div className="h-56 w-full">
                    <iframe
                      title="Location Map"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapLng - 0.01}%2C${mapLat - 0.01}%2C${mapLng + 0.01}%2C${mapLat + 0.01}&layer=mapnik&marker=${mapLat}%2C${mapLng}`}
                    />
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* -- Verified Owner Card -- */}
            {owner && typeof owner === 'object' && (
              <ScrollReveal delay={0.25}>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-3">
                      <Shield className="h-7 w-7 text-primary-600" />
                    </div>
                    <h4 className="font-bold text-slate-900">{owner.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">Property Owner</p>
                    {owner.isVerified && (
                      <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="h-3 w-3" />
                        Verified Owner
                      </span>
                    )}
                  </CardContent>
                </Card>
              </ScrollReveal>
            )}

            {/* -- Student CTA -- */}
            {!isOwner && user?.role === 'student' && (
              <ScrollReveal delay={0.3}>
                <Card className="border-2 border-primary-200 bg-primary-50/30">
                  <CardContent className="p-6 text-center">
                    <Shield className="h-10 w-10 text-primary-600 mx-auto mb-3" />
                    <h3 className="font-bold text-slate-900 mb-1">Found an Issue?</h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Report safety concerns and help fellow students stay safe.
                    </p>
                    <Link to={`/report?accommodationId=${accommodation._id}`}>
                      <Button className="w-full">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Report Issue
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </ScrollReveal>
            )}

            {/* -- SSI Breakdown -- */}
            <ScrollReveal delay={0.35}>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary-600" />
                    Safety Score Info
                  </h3>
                  <div className="space-y-2.5">
                    {[
                      { range: '80-100', label: 'Very Safe', color: 'bg-emerald-500' },
                      { range: '60-79', label: 'Moderate', color: 'bg-amber-500' },
                      { range: '40-59', label: 'Caution', color: 'bg-orange-500' },
                      { range: '0-39', label: 'High Risk', color: 'bg-red-500' },
                    ].map((tier) => {
                      const [lo, hi] = tier.range.split('-').map(Number);
                      const isActive = ssi >= lo && ssi <= hi;
                      return (
                        <div key={tier.range} className="flex items-center gap-3">
                          <span className={`w-3 h-3 rounded-full ${tier.color} flex-shrink-0 ${isActive ? 'ring-2 ring-offset-1 ring-slate-300' : ''}`} />
                          <span className="text-xs text-slate-600 flex-1">{tier.label}</span>
                          <span className="text-[10px] font-mono text-slate-400">{tier.range}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">This property</span>
                      <span className={`text-sm font-bold ${ssi >= 80 ? 'text-emerald-600' : ssi >= 60 ? 'text-amber-600' : ssi >= 40 ? 'text-orange-600' : 'text-red-600'}`}>
                        {ssi} / 100
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </div>

      {/* ===== RESOLVE MODAL ===== */}
      <AnimatePresence>
        {resolveModalOpen && selectedReport && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setResolveModalOpen(false)}
            />

            {/* Modal */}
            <motion.div
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 rounded-t-2xl z-10">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    Respond to Report
                  </h3>
                  <button
                    onClick={() => setResolveModalOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <X className="h-5 w-5 text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Report summary */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getSeverityBadgeColor(selectedReport.severity)}`}>
                      {getCategoryIcon(selectedReport.category)}
                      {getCategoryLabel(selectedReport.category)}
                    </span>
                    <span className="text-[10px] text-slate-400">{formatRelativeTime(selectedReport.createdAt)}</span>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900">{selectedReport.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{selectedReport.description}</p>
                </div>

                {/* Response text */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Your Response</label>
                  <textarea
                    rows={4}
                    value={resolveText}
                    onChange={(e) => setResolveText(e.target.value)}
                    placeholder="Explain how the issue has been addressed or provide your perspective..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all"
                  />
                </div>

                {/* Image upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Proof Images (optional)</label>
                  <div
                    onClick={() => resolveFileRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-primary-300 hover:bg-primary-50/30 transition-colors cursor-pointer"
                  >
                    <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-500">Click to upload images</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG up to 5MB each</p>
                  </div>
                  <input
                    ref={resolveFileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleResolveImageSelect}
                  />

                  {/* Previews */}
                  {resolvePreviews.length > 0 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto">
                      {resolvePreviews.map((src, idx) => (
                        <div key={idx} className="relative flex-shrink-0">
                          <img src={src} alt={`Proof ${idx + 1}`} className="h-16 w-16 object-cover rounded-lg border border-slate-200" />
                          <button
                            type="button"
                            onClick={() => removeResolveImage(idx)}
                            className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 rounded-b-2xl">
                <div className="flex items-center gap-3 justify-end">
                  <Button variant="outline" onClick={() => setResolveModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={submitResolve}
                    disabled={!resolveText.trim() || resolving}
                  >
                    {resolving ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Response
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
