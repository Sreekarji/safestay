import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  MapPin,
  Shield,
  AlertTriangle,
  TrendingUp,
  Map,
  List,
  Grid,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  XCircle,
  Home,
  Wrench,
  Loader2,
} from 'lucide-react';
import { ScrollReveal, StaggerReveal, FadeIn } from '@/components/ParallaxEffect';
import { getSSITailwind } from '@/lib/utils';
import SafetyMap from '@/components/map/SafetyMap';
import type { Accommodation } from '@/types';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type SafetyFilter = 'all' | 'safe' | 'caution' | 'avoid';
type ViewMode = 'grid' | 'list';

const safetyFilters: { value: SafetyFilter; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: <Shield className="h-3.5 w-3.5" /> },
  { value: 'safe', label: 'Safe (80+)', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  { value: 'caution', label: 'Caution (50-79)', icon: <AlertCircle className="h-3.5 w-3.5" /> },
  { value: 'avoid', label: 'Avoid (<50)', icon: <XCircle className="h-3.5 w-3.5" /> },
];

function matchesSafetyFilter(ssi: number, filter: SafetyFilter): boolean {
  switch (filter) {
    case 'safe': return ssi >= 80;
    case 'caution': return ssi >= 50 && ssi < 80;
    case 'avoid': return ssi < 50;
    default: return true;
  }
}

function getScoreBadge(ssi: number) {
  if (ssi >= 80) return { bg: 'bg-emerald-100 text-emerald-700', label: 'Safe' };
  if (ssi >= 50) return { bg: 'bg-amber-100 text-amber-700', label: 'Caution' };
  return { bg: 'bg-red-100 text-red-700', label: 'Avoid' };
}

function getScoreBorderColor(ssi: number) {
  if (ssi >= 80) return 'border-emerald-200';
  if (ssi >= 50) return 'border-amber-200';
  return 'border-red-200';
}

function getScoreBarColor(ssi: number) {
  if (ssi >= 80) return 'bg-emerald-500';
  if (ssi >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

function LoadingSkeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="animate-pulse">
        <div className="h-40 rounded-2xl bg-gradient-to-r from-primary-700 to-indigo-800 mb-8" />
        <div className="flex gap-3 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 w-28 rounded-full bg-slate-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AccommodationList() {
  const navigate = useNavigate();
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [safetyFilter, setSafetyFilter] = useState<SafetyFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showMap, setShowMap] = useState(false);

  const fetchAccommodations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/accommodations`);
      if (!res.ok) throw new Error(`Failed to fetch accommodations (${res.status})`);
      const json = await res.json();
      const data = json?.data ?? json;
      setAccommodations(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load accommodations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccommodations();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return accommodations.filter((acc) => {
      const matchesSearch =
        !q ||
        acc.name?.toLowerCase().includes(q) ||
        acc.address?.toLowerCase().includes(q) ||
        acc.area?.toLowerCase().includes(q) ||
        acc.city?.toLowerCase().includes(q);
      const matchesSafety = matchesSafetyFilter(acc.ssi, safetyFilter);
      return matchesSearch && matchesSafety;
    });
  }, [accommodations, search, safetyFilter]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const safe = filtered.filter((a) => a.ssi >= 80).length;
    const caution = filtered.filter((a) => a.ssi >= 50 && a.ssi < 80).length;
    const avoid = filtered.filter((a) => a.ssi < 50).length;
    return { total, safe, caution, avoid };
  }, [filtered]);

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-red-100 p-4 mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-slate-500 mb-6 max-w-md">{error}</p>
          <button
            onClick={fetchAccommodations}
            className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Dark Gradient Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-indigo-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTRWMjhIMjR2Mmgxem0tMTItNHYySDI0di0yaDJ6bTAgNHYySDIydi0yaDJ6bTEwLThWMjJoLTJ2MmgxeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative mx-auto max-w-7xl px-6 py-12 lg:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Accommodations
            </h1>
            <p className="mt-3 text-lg text-primary-200 max-w-2xl">
              Browse verified student accommodations and check their Safety Score Index (SSI) before you move in.
            </p>
          </motion.div>

          {/* Quick Stats */}
          <FadeIn delay={0.2}>
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="rounded-lg bg-white/10 backdrop-blur-sm px-4 py-2 text-sm text-white">
                <span className="font-semibold">{stats.total}</span> results
              </div>
              <div className="rounded-lg bg-emerald-500/20 px-4 py-2 text-sm text-emerald-200">
                <span className="font-semibold">{stats.safe}</span> safe
              </div>
              <div className="rounded-lg bg-amber-500/20 px-4 py-2 text-sm text-amber-200">
                <span className="font-semibold">{stats.caution}</span> caution
              </div>
              <div className="rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-200">
                <span className="font-semibold">{stats.avoid}</span> avoid
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Toolbar: Search + Filters + View Toggle */}
      <div className="sticky top-16 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, address, or area..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Safety Filter Pills */}
              {safetyFilters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setSafetyFilter(f.value)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                    safetyFilter === f.value
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.icon}
                  {f.label}
                </button>
              ))}

              <div className="h-5 w-px bg-slate-200 mx-1 hidden md:block" />

              {/* View Mode Toggle */}
              <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${
                    viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                  title="Grid view"
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${
                    viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                  title="List view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Map Toggle */}
              <button
                onClick={() => setShowMap(!showMap)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                  showMap
                    ? 'border-primary-300 bg-primary-50 text-primary-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Map className="h-3.5 w-3.5" />
                {showMap ? 'Hide Map' : 'Show Map'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Map View */}
      {showMap && (
        <FadeIn>
          <div className="mx-auto max-w-7xl px-6 pt-6">
            <div className="h-[400px] rounded-xl overflow-hidden border border-slate-200 shadow-sm">
              <SafetyMap
                mode="timeline"
                selectedMonth=""
                selectedMarker={null}
                onMarkerSelect={() => {}}
                filter="all"
                accommodationId={null}
                collegeId={null}
                selectedHotspotId={null}
                routeComparisonMode={false}
                comparisonAccId={null}
              />
            </div>
          </div>
        </FadeIn>
      )}

      {/* Accommodation List / Grid */}
      <div className="mx-auto max-w-7xl px-6 py-6">
        {filtered.length === 0 ? (
          <ScrollReveal>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-primary-100 p-4 mb-4">
                <Home className="h-8 w-8 text-primary-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No accommodations found</h3>
              <p className="text-slate-500 mb-6 max-w-sm">
                {search
                  ? `No results match "${search}". Try a different search term.`
                  : 'No accommodations are registered yet.'}
              </p>
              {!search && (
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
                >
                  Register Your Property
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </ScrollReveal>
        ) : viewMode === 'grid' ? (
          <StaggerReveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((acc) => (
              <AccommodationGridCard key={acc._id} accommodation={acc} />
            ))}
          </StaggerReveal>
        ) : (
          <StaggerReveal className="flex flex-col gap-3">
            {filtered.map((acc) => (
              <AccommodationListRow key={acc._id} accommodation={acc} />
            ))}
          </StaggerReveal>
        )}
      </div>
    </div>
  );
}

/* ---------- Grid Card ---------- */

function AccommodationGridCard({ accommodation: acc }: { accommodation: Accommodation }) {
  const badge = getScoreBadge(acc.ssi);
  return (
    <Link
      to={`/accommodations/${acc._id}`}
      className={`group block rounded-xl border ${getScoreBorderColor(acc.ssi)} bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}
    >
      {/* Score accent bar */}
      <div className={`h-1.5 ${getScoreBarColor(acc.ssi)}`} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-slate-900 truncate group-hover:text-primary-600 transition-colors">
              {acc.name}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{acc.area}{acc.city ? `, ${acc.city}` : ''}</span>
            </div>
          </div>
          {/* SSI Score Badge */}
          <div className="shrink-0 text-center">
            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${badge.bg} font-bold text-lg`}>
              {acc.ssi}
            </div>
          </div>
        </div>

        {/* Address */}
        <p className="text-xs text-slate-400 mb-4 line-clamp-1">{acc.address}</p>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {acc.totalReports} {acc.totalReports === 1 ? 'report' : 'reports'}
          </span>
          {acc.type && (
            <span className="inline-flex items-center gap-1 capitalize">
              <Home className="h-3 w-3" />
              {acc.type}
            </span>
          )}
          {acc.monthlyRent != null && (
            <span className="inline-flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              &#8377;{acc.monthlyRent.toLocaleString('en-IN')}/mo
            </span>
          )}
        </div>

        {/* Amenities preview */}
        {acc.amenities && acc.amenities.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
            {acc.amenities.slice(0, 3).map((a) => (
              <span
                key={a}
                className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
              >
                <Wrench className="h-2.5 w-2.5" />
                {a}
              </span>
            ))}
            {acc.amenities.length > 3 && (
              <span className="text-[11px] text-slate-400 self-center">
                +{acc.amenities.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* View details link */}
        <div className="mt-4 flex items-center justify-end text-xs font-medium text-primary-600 group-hover:text-primary-700">
          View Details
          <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

/* ---------- List Row ---------- */

function AccommodationListRow({ accommodation: acc }: { accommodation: Accommodation }) {
  const badge = getScoreBadge(acc.ssi);
  return (
    <Link
      to={`/accommodations/${acc._id}`}
      className={`group flex items-center gap-4 rounded-xl border ${getScoreBorderColor(acc.ssi)} bg-white px-5 py-4 shadow-sm hover:shadow-md transition-all duration-200`}
    >
      {/* Score */}
      <div className={`shrink-0 flex items-center justify-center w-14 h-14 rounded-xl ${badge.bg} font-bold text-lg`}>
        {acc.ssi}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900 truncate group-hover:text-primary-600 transition-colors">
            {acc.name}
          </h3>
          {acc.type && (
            <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 capitalize">
              {acc.type}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{acc.address}, {acc.area}{acc.city ? `, ${acc.city}` : ''}</span>
        </div>
      </div>

      {/* Meta */}
      <div className="hidden sm:flex items-center gap-4 shrink-0 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {acc.totalReports} reports
        </span>
        {acc.monthlyRent != null && (
          <span className="inline-flex items-center gap-1">
            &#8377;{acc.monthlyRent.toLocaleString('en-IN')}/mo
          </span>
        )}
      </div>

      {/* Arrow */}
      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all shrink-0" />
    </Link>
  );
}
