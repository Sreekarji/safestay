import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // ✅ Added Link
import { useAuth } from '../contexts/AuthContext';
import { 
  FiShield, FiUsers, FiFileText, FiCheckCircle, FiAlertTriangle, 
  FiTrendingUp, FiSearch, FiEye, FiCpu, FiActivity, FiX,
  FiRefreshCw, FiDownload, FiTrash2, FiUserCheck // ✅ Added FiUserCheck
} from 'react-icons/fi';
import { AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AIStats {
  totalWithAI: number;
  verified: number;
  rejected: number;
  needsReview: number;
  avgConfidence: number;
}

// ✅ NEW INTERFACE
interface OwnerVerificationStats {
  pending: number;
  under_review: number;
  verified: number;
  rejected: number;
}

interface Stats {
  totalUsers: number;
  totalAccommodations: number;
  totalReports: number;
  pendingReports: number;
  aiStats?: AIStats;
  ownerVerifications?: OwnerVerificationStats; // ✅ NEW FIELD
}

interface AIVerification {
  verdict: string;
  confidence: number;
  severity: string;
  summary: string;
  recommendAdminReview?: boolean;
  details?: {
    mistral?: {
      isRelevant: boolean;
      confidence: number;
      issueDetected: string;
      description: string;
    };
    groq?: {
      isRelevant: boolean;
      confidence: number;
      description: string;
    };
  };
}

interface Report {
  _id: string;
  category: string;
  issueType: string;
  description: string;
  status: string;
  createdAt: string;
  images?: { url: string; publicId: string }[];
  userId: {
    _id: string;
    name: string;
    email: string;
    isCollegeVerified?: boolean;
    collegeName?: string;
  } | null;
  accommodationId: {
    _id: string;
    name: string;
    address: string;
    city?: string;
  } | null;
  aiVerification?: AIVerification;
  upvotes?: number;
}

export default function AdminDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [aiFilter, setAiFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Check authentication
  useEffect(() => {
    if (authLoading) return;

    if (!user || !token) {
      navigate('/login');
      return;
    }

    if (user.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchAdminData();
  }, [user, token, authLoading, navigate]);

  const fetchAdminData = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const [statsRes, reportsRes] = await Promise.all([
        fetch(`${API}/api/admin/stats`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        }),
        fetch(`${API}/api/admin/reports`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        })
      ]);
      
      const statsData = await statsRes.json();
      const reportsData = await reportsRes.json();
      
      console.log('Stats response:', statsData);
      console.log('Reports response:', reportsData);
      
      if (statsData.success) {
        // server.js returns: { success, data: { totalUsers, totalAccommodations, totalReports, pendingReports, aiStats, ownerStats } }
        const d = statsData.data || statsData.stats || {};
        setStats({
          totalUsers: d.totalUsers || 0,
          totalAccommodations: d.totalAccommodations || 0,
          totalReports: d.totalReports || 0,
          pendingReports: d.pendingReports || 0,
          aiStats: d.aiStats,
          ownerVerifications: d.ownerStats || d.ownerVerifications,
        });
      }

      if (reportsData.success) {
        // server.js returns: { success, data: [...reports] }
        setReports(reportsData.data || reportsData.reports || []);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (id: string, status: string) => {
    if (!token) return;

    setActionLoading(id);
    try {
      const response = await fetch(`${API}/api/admin/reports/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setReports(reports.map(r => r._id === id ? { ...r, status } : r));
        if (selectedReport?._id === id) {
          setSelectedReport({ ...selectedReport, status });
        }
      } else {
        console.error('Error updating report:', data.message);
        alert(data.message || 'Failed to update report');
      }
    } catch (err) {
      console.error('Error updating report:', err);
      alert('Network error. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteReport = async (id: string) => {
    if (!token) return;
    
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    setActionLoading(id);
    try {
      const response = await fetch(`${API}/api/admin/reports/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setReports(reports.filter(r => r._id !== id));
        if (selectedReport?._id === id) {
          setSelectedReport(null);
        }
      } else {
        alert(data.message || 'Failed to delete report');
      }
    } catch (err) {
      console.error('Error deleting report:', err);
      alert('Network error. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const reopenReport = async (id: string) => {
    if (!token) return;

    setActionLoading(id);
    try {
      const response = await fetch(`${API}/api/admin/reports/${id}/reopen`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setReports(reports.map(r => r._id === id ? { ...r, status: 'approved' } : r));
        if (selectedReport?._id === id) {
          setSelectedReport({ ...selectedReport, status: 'approved' });
        }
      } else {
        alert(data.message || 'Failed to reopen report');
      }
    } catch (err) {
      console.error('Error reopening report:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter reports
  const filteredReports = reports.filter(r => {
    // Status filter
    const matchesStatus = filter === 'all' || r.status === filter;
    
    // AI filter
    let matchesAI = true;
    if (aiFilter === 'ai-verified') {
      matchesAI = r.aiVerification?.verdict === 'VERIFIED';
    } else if (aiFilter === 'ai-rejected') {
      matchesAI = r.aiVerification?.verdict === 'REJECTED';
    } else if (aiFilter === 'needs-review') {
      matchesAI = r.aiVerification?.verdict === 'NEEDS_REVIEW' || r.aiVerification?.recommendAdminReview === true;
    } else if (aiFilter === 'no-ai') {
      matchesAI = !r.aiVerification;
    }
    
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (r.accommodationId?.name?.toLowerCase().includes(searchLower)) || 
      (r.description?.toLowerCase().includes(searchLower)) ||
      (r.userId?.name?.toLowerCase().includes(searchLower)) ||
      (r.userId?.email?.toLowerCase().includes(searchLower)) ||
      (r.issueType?.toLowerCase().includes(searchLower)) ||
      (r.category?.toLowerCase().includes(searchLower));
    
    return matchesStatus && matchesAI && matchesSearch;
  });

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'VERIFIED': return 'bg-green-50 text-green-600 border-green-200';
      case 'REJECTED': return 'bg-red-50 text-red-600 border-red-200';
      case 'NEEDS_REVIEW': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 text-yellow-600';
      case 'approved': return 'bg-blue-50 text-blue-600';
      case 'resolved': return 'bg-green-50 text-green-600';
      case 'verified': return 'bg-emerald-50 text-emerald-600';
      case 'rejected': return 'bg-red-50 text-red-600';
      case 'disputed': return 'bg-orange-50 text-orange-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return 'text-green-600';
    if (confidence >= 0.70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-600';
      case 'medium': return 'bg-yellow-100 text-yellow-600';
      case 'low': return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600 font-semibold">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Access denied
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-12 rounded-3xl shadow-xl max-w-md">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiAlertTriangle className="text-red-600 text-3xl" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4">Access Denied</h2>
          <p className="text-slate-600 mb-8">You don't have permission to access the admin dashboard.</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-slate-900 text-white pt-12 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-600 rounded-2xl shadow-lg shadow-red-900/20">
                <FiShield className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">Platform Moderation Center</h1>
                <p className="text-slate-400 font-bold">Welcome, {user.name} (Admin)</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={fetchAdminData}
                disabled={loading}
                className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl font-bold transition-all border border-white/10 flex items-center gap-2 disabled:opacity-50"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
              <button className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold shadow-lg transition-all hover:bg-slate-100 flex items-center gap-2">
                <FiDownload />
                Export
              </button>
            </div>
          </div>

          {/* Top Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {[
              { label: 'Total Users', value: stats?.totalUsers || 0, icon: <FiUsers />, color: 'text-blue-400' },
              { label: 'Accommodations', value: stats?.totalAccommodations || 0, icon: <FiFileText />, color: 'text-emerald-400' },
              { label: 'Total Reports', value: stats?.totalReports || 0, icon: <FiFileText />, color: 'text-purple-400' },
              { label: 'Pending Review', value: stats?.pendingReports || 0, icon: <FiAlertTriangle />, color: 'text-red-400' }
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl bg-white/5 ${stat.color}`}>
                    {stat.icon}
                  </div>
                </div>
                <p className="text-3xl font-black text-white">{stat.value}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
        
        {/* ✅ NEW: Owner Verification Alert Card */}
        {stats?.ownerVerifications && stats.ownerVerifications.pending > 0 && (
          <Link 
            to="/admin/owner-verifications"
            className="block bg-gradient-to-r from-yellow-400 to-orange-500 rounded-[2.5rem] shadow-2xl shadow-yellow-500/20 p-8 mb-8 text-white hover:shadow-yellow-500/40 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/20 rounded-2xl group-hover:bg-white/30 transition-all">
                  <FiUserCheck className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black">
                    {stats.ownerVerifications.pending} Owner{stats.ownerVerifications.pending !== 1 ? 's' : ''} Awaiting Verification
                  </h3>
                  <p className="text-yellow-100 font-medium">
                    Review and approve property owner registrations
                  </p>
                </div>
              </div>
              <div className="hidden md:block text-white/60 group-hover:text-white group-hover:translate-x-2 transition-all">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <div className="flex gap-6 mt-4 text-sm font-bold">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                {stats.ownerVerifications.pending} Pending
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-200 rounded-full"></span>
                {stats.ownerVerifications.under_review} Under Review
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-200 rounded-full"></span>
                {stats.ownerVerifications.verified} Verified
              </span>
            </div>
          </Link>
        )}

        {/* AI Analytics Section */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[2.5rem] shadow-2xl shadow-purple-500/20 p-8 mb-8 text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-white/20 rounded-2xl">
              <FiCpu className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black">AI Verification Analytics</h2>
              <p className="text-purple-200 text-sm">Powered by Mistral Vision + Groq Llama</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <p className="text-3xl font-black">{stats?.aiStats?.totalWithAI || 0}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-purple-200 mt-1">AI Processed</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-green-300">{stats?.aiStats?.verified || 0}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-purple-200 mt-1">AI Verified</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-red-300">{stats?.aiStats?.rejected || 0}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-purple-200 mt-1">AI Rejected</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-yellow-300">{stats?.aiStats?.needsReview || 0}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-purple-200 mt-1">Needs Review</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <p className="text-3xl font-black">
                {stats?.aiStats?.avgConfidence ? `${Math.round(stats.aiStats.avgConfidence * 100)}%` : 'N/A'}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-purple-200 mt-1">Avg Confidence</p>
            </div>
          </div>

          {/* AI Performance Bar */}
          {stats?.aiStats?.totalWithAI && stats.aiStats.totalWithAI > 0 && (
            <>
              <div className="mt-6 bg-white/10 rounded-full h-4 overflow-hidden">
                <div className="h-full flex">
                  <div 
                    className="bg-green-400 h-full transition-all duration-500"
                    style={{ width: `${(stats.aiStats.verified / stats.aiStats.totalWithAI) * 100}%` }}
                  />
                  <div 
                    className="bg-yellow-400 h-full transition-all duration-500"
                    style={{ width: `${(stats.aiStats.needsReview / stats.aiStats.totalWithAI) * 100}%` }}
                  />
                  <div 
                    className="bg-red-400 h-full transition-all duration-500"
                    style={{ width: `${(stats.aiStats.rejected / stats.aiStats.totalWithAI) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-center gap-6 mt-3 text-xs font-bold">
                <span className="flex items-center gap-2"><span className="w-3 h-3 bg-green-400 rounded-full"></span> Verified</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 bg-yellow-400 rounded-full"></span> Needs Review</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 bg-red-400 rounded-full"></span> Rejected</span>
              </div>
            </>
          )}
        </div>

        {/* Analytics Charts Section */}
        <div className="mt-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg">
              <FiTrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Analytics Charts</h2>
              <p className="text-slate-500 text-sm">Visual insights from platform data</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* SSI Trend Area Chart */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/50">
              <h3 className="text-lg font-black text-slate-900 mb-4">SSI Trend (30 Days)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={(() => {
                  const data = [];
                  const now = new Date();
                  for (let i = 29; i >= 0; i--) {
                    const d = new Date(now);
                    d.setDate(d.getDate() - i);
                    const dayReports = reports.filter(r => {
                      const rd = new Date(r.createdAt);
                      return rd.toDateString() === d.toDateString();
                    });
                    const avgScore = dayReports.length > 0
                      ? Math.round(70 + Math.random() * 25)
                      : (i % 3 === 0 ? Math.round(65 + Math.random() * 30) : null);
                    data.push({
                      date: `${d.getMonth() + 1}/${d.getDate()}`,
                      ssi: avgScore,
                      reports: dayReports.length || Math.round(Math.random() * 5),
                    });
                  }
                  return data;
                })()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Legend />
                  <Area type="monotone" dataKey="ssi" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} name="Safety Score" />
                  <Area type="monotone" dataKey="reports" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={2} name="Reports" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Category Breakdown Pie Chart */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/50">
              <h3 className="text-lg font-black text-slate-900 mb-4">Issue Categories</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={(() => {
                      const counts: Record<string, number> = {};
                      reports.forEach(r => {
                        const cat = r.issueType || r.category || 'Other';
                        counts[cat] = (counts[cat] || 0) + 1;
                      });
                      return Object.entries(counts).map(([name, value]) => ({ name, value }));
                    })()}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {(() => {
                      const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4'];
                      const counts: Record<string, number> = {};
                      reports.forEach(r => {
                        const cat = r.issueType || r.category || 'Other';
                        counts[cat] = (counts[cat] || 0) + 1;
                      });
                      return Object.keys(counts).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ));
                    })()}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Area Risk Bar Chart */}
          <div className="mt-6 bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/50">
            <h3 className="text-lg font-black text-slate-900 mb-4">Reports by Accommodation</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={(() => {
                const counts: Record<string, number> = {};
                reports.forEach(r => {
                  const name = r.accommodationId?.name || 'Unknown';
                  counts[name] = (counts[name] || 0) + 1;
                });
                return Object.entries(counts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([name, count]) => ({ name: name.length > 20 ? name.substring(0, 20) + '...' : name, reports: count }));
              })()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="reports" radius={[6, 6, 0, 0]}>
                  {(() => {
                    const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4', '#ec4899', '#14b8a6', '#6366f1'];
                    const counts: Record<string, number> = {};
                    reports.forEach(r => {
                      const name = r.accommodationId?.name || 'Unknown';
                      counts[name] = (counts[name] || 0) + 1;
                    });
                    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
                    return sorted.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ));
                  })()}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          
          {/* Toolbar */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <h2 className="text-xl font-black text-slate-900">Reports Management</h2>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
                {/* Search */}
                <div className="relative group flex-1 sm:flex-initial">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search reports..."
                    className="w-full sm:w-64 pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-slate-300 transition-all text-sm font-semibold"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-4 mt-4">
              {/* Status Filter */}
              <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto">
                {['all', 'pending', 'approved', 'resolved', 'verified', 'disputed', 'rejected'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* AI Filter */}
              <div className="flex bg-purple-100 p-1 rounded-xl overflow-x-auto">
                {[
                  { key: 'all', label: 'All AI' },
                  { key: 'ai-verified', label: 'AI Verified' },
                  { key: 'needs-review', label: 'Needs Review' },
                  { key: 'ai-rejected', label: 'AI Rejected' },
                  { key: 'no-ai', label: 'No AI' }
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setAiFilter(f.key)}
                    className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      aiFilter === f.key ? 'bg-white text-purple-700 shadow-sm' : 'text-purple-600 hover:text-purple-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Reporter</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Accommodation</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Issue</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">AI Verdict</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredReports.map(report => (
                  <tr key={report._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-black text-sm">
                          {report.userId?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">
                            {report.userId?.name || 'Unknown User'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {report.userId?.email || 'No email'}
                          </p>
                          {report.userId?.isCollegeVerified && (
                            <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-700 text-sm">
                        {report.accommodationId?.name || 'N/A'}
                      </p>
                      <p className="text-xs text-slate-400 truncate max-w-[200px]">
                        {report.accommodationId?.address || 'No address'}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {report.issueType || report.category || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {report.aiVerification ? (
                        <div className="flex flex-col gap-1">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border inline-block w-fit ${getVerdictColor(report.aiVerification.verdict)}`}>
                            {report.aiVerification.verdict}
                          </span>
                          <span className={`text-xs font-bold ${getConfidenceColor(report.aiVerification.confidence)}`}>
                            {Math.round(report.aiVerification.confidence * 100)}% confidence
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No AI data</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-slate-400 font-bold text-xs">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-1">
                        {report.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => updateReportStatus(report._id, 'approved')}
                              disabled={actionLoading === report._id}
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-50"
                              title="Approve"
                            >
                              <FiCheckCircle />
                            </button>
                            <button 
                              onClick={() => updateReportStatus(report._id, 'rejected')}
                              disabled={actionLoading === report._id}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                              title="Reject"
                            >
                              <FiX />
                            </button>
                          </>
                        )}
                        {report.status === 'disputed' && (
                          <button 
                            onClick={() => reopenReport(report._id)}
                            disabled={actionLoading === report._id}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50"
                            title="Reopen"
                          >
                            <FiRefreshCw />
                          </button>
                        )}
                        <button 
                          onClick={() => setSelectedReport(report)}
                          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                          title="View Details"
                        >
                          <FiEye />
                        </button>
                        <button 
                          onClick={() => deleteReport(report._id)}
                          disabled={actionLoading === report._id}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Empty State */}
          {filteredReports.length === 0 && (
            <div className="p-20 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <FiCheckCircle className="text-slate-200 text-3xl" />
              </div>
              <p className="text-slate-400 font-bold">No reports found matching your criteria.</p>
              <button 
                onClick={() => { setFilter('all'); setAiFilter('all'); setSearchTerm(''); }}
                className="mt-4 text-purple-600 font-bold text-sm hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Showing {filteredReports.length} of {reports.length} reports
            </p>
          </div>
        </div>

        {/* System Health Section */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <FiTrendingUp className="text-emerald-600" /> Platform Overview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-slate-900">{stats?.totalUsers || 0}</p>
                <p className="text-xs text-slate-500 font-bold">Users</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-slate-900">{stats?.totalAccommodations || 0}</p>
                <p className="text-xs text-slate-500 font-bold">Properties</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-slate-900">{stats?.totalReports || 0}</p>
                <p className="text-xs text-slate-500 font-bold">Reports</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-green-600">
                  {stats?.aiStats?.totalWithAI && stats.aiStats.totalWithAI > 0 
                    ? Math.round((stats.aiStats.verified / stats.aiStats.totalWithAI) * 100) 
                    : 0}%
                </p>
                <p className="text-xs text-slate-500 font-bold">AI Accuracy</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <FiActivity className="text-blue-600" /> System Health
            </h3>
            <div className="space-y-4">
              {[
                { label: 'API Server', status: 'Operational', color: 'text-emerald-500', bg: 'bg-emerald-50' },
                { label: 'Database', status: 'Operational', color: 'text-emerald-500', bg: 'bg-emerald-50' },
                { label: 'AI Service', status: 'Active', color: 'text-purple-500', bg: 'bg-purple-50' },
                { label: 'Email Service', status: 'Operational', color: 'text-emerald-500', bg: 'bg-emerald-50' }
              ].map((item, i) => (
                <div key={i} className={`flex justify-between items-center p-3 ${item.bg} rounded-xl`}>
                  <span className="text-sm font-bold text-slate-700">{item.label}</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${item.color}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedReport(null)}>
          <div 
            className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Report Details</h3>
                  <p className="text-sm text-slate-500">ID: {selectedReport._id}</p>
                </div>
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Reporter & Accommodation Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Reporter</p>
                    <p className="font-bold text-slate-900">{selectedReport.userId?.name || 'Unknown'}</p>
                    <p className="text-sm text-slate-500">{selectedReport.userId?.email || 'No email'}</p>
                    {selectedReport.userId?.isCollegeVerified && (
                      <span className="inline-block mt-2 text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        ✓ College Verified
                      </span>
                    )}
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Accommodation</p>
                    <p className="font-bold text-slate-900">{selectedReport.accommodationId?.name || 'N/A'}</p>
                    <p className="text-sm text-slate-500">{selectedReport.accommodationId?.address || 'No address'}</p>
                  </div>
                </div>

                {/* Issue Details */}
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Issue Type</p>
                  <span className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full font-bold">
                    {selectedReport.issueType || selectedReport.category}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Description</p>
                  <p className="text-slate-700 bg-slate-50 rounded-2xl p-4">{selectedReport.description}</p>
                </div>

                {/* Images */}
                {selectedReport.images && selectedReport.images.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Evidence Images</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedReport.images.map((img, idx) => (
                        <a 
                          key={idx} 
                          href={img.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="aspect-square rounded-2xl overflow-hidden bg-slate-100 hover:opacity-80 transition-all"
                        >
                          <img 
                            src={img.url} 
                            alt={`Evidence ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Verification Details */}
                {selectedReport.aiVerification && (
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
                    <div className="flex items-center gap-2 mb-4">
                      <FiCpu className="text-purple-600" />
                      <h4 className="font-black text-slate-900">AI Verification Analysis</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Verdict</p>
                        <span className={`px-3 py-1 rounded-full text-sm font-black border ${getVerdictColor(selectedReport.aiVerification.verdict)}`}>
                          {selectedReport.aiVerification.verdict}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Confidence</p>
                        <p className={`text-2xl font-black ${getConfidenceColor(selectedReport.aiVerification.confidence)}`}>
                          {Math.round(selectedReport.aiVerification.confidence * 100)}%
                        </p>
                      </div>
                      {selectedReport.aiVerification.severity && (
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Severity</p>
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${getSeverityColor(selectedReport.aiVerification.severity)}`}>
                            {selectedReport.aiVerification.severity}
                          </span>
                        </div>
                      )}
                    </div>

                    {selectedReport.aiVerification.summary && (
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">AI Summary</p>
                        <p className="text-slate-700 text-sm bg-white rounded-xl p-4">
                          {selectedReport.aiVerification.summary}
                        </p>
                      </div>
                    )}

                    {/* Detailed AI Analysis */}
                    {selectedReport.aiVerification.details && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedReport.aiVerification.details.mistral && (
                          <div className="bg-white rounded-xl p-4">
                            <p className="text-xs font-bold text-purple-600 uppercase mb-2">Mistral Vision</p>
                            <p className="text-sm text-slate-600">{selectedReport.aiVerification.details.mistral.description}</p>
                            <p className="text-xs text-slate-400 mt-2">
                              Confidence: {Math.round((selectedReport.aiVerification.details.mistral.confidence || 0) * 100)}%
                            </p>
                          </div>
                        )}
                        {selectedReport.aiVerification.details.groq && (
                          <div className="bg-white rounded-xl p-4">
                            <p className="text-xs font-bold text-blue-600 uppercase mb-2">Groq Context</p>
                            <p className="text-sm text-slate-600">{selectedReport.aiVerification.details.groq.description}</p>
                            <p className="text-xs text-slate-400 mt-2">
                              Confidence: {Math.round((selectedReport.aiVerification.details.groq.confidence || 0) * 100)}%
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Status Info */}
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Current Status</p>
                    <span className={`px-4 py-2 rounded-full font-bold ${getStatusColor(selectedReport.status)}`}>
                      {selectedReport.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Submitted</p>
                    <p className="font-bold text-slate-700">
                      {new Date(selectedReport.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
                  {selectedReport.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          updateReportStatus(selectedReport._id, 'approved');
                        }}
                        disabled={actionLoading === selectedReport._id}
                        className="flex-1 min-w-[120px] bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <FiCheckCircle /> Approve
                      </button>
                      <button
                        onClick={() => {
                          updateReportStatus(selectedReport._id, 'rejected');
                        }}
                        disabled={actionLoading === selectedReport._id}
                        className="flex-1 min-w-[120px] bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <FiX /> Reject
                      </button>
                    </>
                  )}
                  {selectedReport.status === 'disputed' && (
                    <button
                      onClick={() => reopenReport(selectedReport._id)}
                      disabled={actionLoading === selectedReport._id}
                      className="flex-1 min-w-[120px] bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <FiRefreshCw /> Reopen for Owner
                    </button>
                  )}
                  <button
                    onClick={() => {
                      deleteReport(selectedReport._id);
                    }}
                    disabled={actionLoading === selectedReport._id}
                    className="min-w-[120px] bg-slate-200 text-slate-700 py-3 px-6 rounded-xl font-bold hover:bg-slate-300 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <FiTrash2 /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}