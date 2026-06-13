import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Plus,
  Eye,
  MessageSquare,
  Wrench,
  ArrowRight,
  FileText,
  Users,
  MapPin,
} from 'lucide-react';
import { ScrollReveal, StaggerReveal, FadeIn } from '@/components/ParallaxEffect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime, getStatusColor, getSSITailwind, getSSILabel } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import type { Accommodation, Report } from '@/types';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface OwnerStats {
  totalProperties: number;
  totalReports: number;
  pendingIssues: number;
  resolvedIssues: number;
}

export default function OwnerDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [properties, setProperties] = useState<Accommodation[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<OwnerStats>({
    totalProperties: 0,
    totalReports: 0,
    pendingIssues: 0,
    resolvedIssues: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        const [propertiesRes, reportsRes] = await Promise.allSettled([
          fetch(`${API}/api/owner/properties`, { headers }).then((r) => {
            if (!r.ok) throw new Error('Failed to fetch properties');
            return r.json();
          }),
          fetch(`${API}/api/owner/reports`, { headers }).then((r) => {
            if (!r.ok) throw new Error('Failed to fetch reports');
            return r.json();
          }),
        ]);

        const propertiesData: Accommodation[] =
          propertiesRes.status === 'fulfilled'
            ? Array.isArray(propertiesRes.value)
              ? propertiesRes.value
              : propertiesRes.value.data || propertiesRes.value.properties || []
            : [];

        const reportsData: Report[] =
          reportsRes.status === 'fulfilled'
            ? Array.isArray(reportsRes.value)
              ? reportsRes.value
              : reportsRes.value.data || reportsRes.value.reports || []
            : [];

        setProperties(propertiesData);
        setReports(reportsData);

        const pending = reportsData.filter(
          (r) => r.status === 'pending' || r.status === 'ai_verified' || r.status === 'approved'
        ).length;
        const resolved = reportsData.filter((r) => r.status === 'resolved').length;

        setStats({
          totalProperties: propertiesData.length,
          totalReports: reportsData.length,
          pendingIssues: pending,
          resolvedIssues: resolved,
        });
      } catch (err) {
        console.error('Failed to load owner dashboard:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const getPropertyForReport = (report: Report): Accommodation | undefined => {
    if (typeof report.accommodationId === 'object' && report.accommodationId !== null) {
      return report.accommodationId as Accommodation;
    }
    return properties.find((p) => p._id === report.accommodationId);
  };

  const recentReports = [...reports]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

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
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-slate-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Gradient Header */}
      <ScrollReveal>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-emerald-600 p-8 text-white shadow-xl">
          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-emerald-400/20 blur-2xl" />
          <div className="relative">
            <h1 className="text-3xl font-bold">
              {greet}, {user?.name || 'Owner'}
            </h1>
            <p className="mt-2 text-blue-100 text-lg">
              Manage your properties and respond to safety reports
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/owner/properties/new">
                <Button className="bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
              </Link>
              <Link to="/owner/reports">
                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 font-semibold"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View All Reports
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Error Banner */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertTriangle className="h-4 w-4 inline mr-2" />
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <StaggerReveal stagger={0.1}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Properties</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalProperties}</p>
                </div>
                <div className="rounded-xl bg-blue-100 p-3">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-slate-400 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Reports</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalReports}</p>
                </div>
                <div className="rounded-xl bg-slate-100 p-3">
                  <BarChart3 className="h-6 w-6 text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Pending Issues</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.pendingIssues}</p>
                </div>
                <div className="rounded-xl bg-amber-100 p-3">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Resolved Issues</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.resolvedIssues}</p>
                </div>
                <div className="rounded-xl bg-emerald-100 p-3">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </StaggerReveal>

      {/* Properties Grid */}
      <ScrollReveal>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Your Properties</h2>
          <Link
            to="/owner/properties"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {properties.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-300">
            <CardContent className="p-10 text-center">
              <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg font-medium">No properties yet</p>
              <p className="text-slate-400 mt-1 mb-4">
                Add your first property to start tracking safety scores
              </p>
              <Link to="/owner/properties/new">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Property
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {properties.map((property) => (
              <FadeIn key={property._id}>
                <Card className="hover:shadow-lg transition-all duration-200 group cursor-pointer border-slate-200 hover:border-blue-300">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                          {property.name}
                        </h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            {property.address}, {property.area}
                          </span>
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold flex-shrink-0 ml-2 ${getSSITailwind(property.ssi)}`}
                      >
                        SSI {property.ssi}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" />
                        {property.reportCount || 0} reports
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${getSSITailwind(property.ssi)}`}
                      >
                        {getSSILabel(property.ssi)}
                      </span>
                      {property.capacity && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {property.currentOccupancy || 0}/{property.capacity}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() => navigate(`/owner/properties/${property._id}`)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() =>
                          navigate(`/owner/properties/${property._id}/reports`)
                        }
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Reports
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() =>
                          navigate(`/owner/properties/${property._id}/edit`)
                        }
                      >
                        <Wrench className="h-3 w-3 mr-1" />
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        )}
      </ScrollReveal>

      {/* Recent Reports */}
      <ScrollReveal>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Recent Reports</h2>
          <Link
            to="/owner/reports"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentReports.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-300">
            <CardContent className="p-10 text-center">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg font-medium">No reports yet</p>
              <p className="text-slate-400 mt-1">
                Safety reports submitted by tenants will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0 divide-y divide-slate-100">
              {recentReports.map((report) => {
                const property = getPropertyForReport(report);
                return (
                  <div
                    key={report._id}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/owner/reports/${report._id}`)}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        {report.status === 'pending' ? (
                          <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-amber-600" />
                          </div>
                        ) : report.status === 'resolved' ? (
                          <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                          </div>
                        ) : (
                          <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4 text-blue-600" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {report.title}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {property?.name || 'Unknown property'}
                          {' · '}
                          {report.category.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${getStatusColor(
                          report.status
                        )}`}
                      >
                        {report.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {formatRelativeTime(report.createdAt)}
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-300" />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </ScrollReveal>

      {/* Summary Footer */}
      <FadeIn>
        <div className="rounded-xl bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-100 p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Safety Overview</h3>
              <p className="text-sm text-slate-600 mt-1">
                {stats.totalProperties > 0 ? (
                  <>
                    You manage {stats.totalProperties}{' '}
                    {stats.totalProperties === 1 ? 'property' : 'properties'} with{' '}
                    {stats.totalReports} total{' '}
                    {stats.totalReports === 1 ? 'report' : 'reports'}.{' '}
                    {stats.pendingIssues > 0 ? (
                      <>
                        <span className="text-amber-600 font-medium">
                          {stats.pendingIssues} pending{' '}
                          {stats.pendingIssues === 1 ? 'issue' : 'issues'}
                        </span>{' '}
                        require your attention.
                      </>
                    ) : (
                      <span className="text-emerald-600 font-medium">
                        All issues have been resolved.
                      </span>
                    )}
                  </>
                ) : (
                  'Get started by adding your first property to begin tracking safety scores.'
                )}
              </p>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
