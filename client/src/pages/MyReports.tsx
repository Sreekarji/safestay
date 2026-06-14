import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // ✅ ADDED
import { ImageUpload } from '../components/ImageUpload';
import ReportCard from '../components/ReportCard';
import { 
  FiFileText, FiAlertTriangle, FiCheckCircle, FiClock, 
  FiEdit2, FiTrash2, FiPlus, FiArrowLeft, FiFilter, FiSearch,
  FiTool, FiCheck, FiX, FiAward,
  FiArrowRight, // ✅ ADDED - was missing!
  FiUpload      // ✅ ADDED - was missing!
} from 'react-icons/fi';

interface Image {
  url: string;
  publicId?: string;
}

interface Resolution {
  description: string;
  actionTaken: string;
  images: Array<{ url: string; publicId: string }>;
  resolvedBy?: { name: string } | string;
  resolvedAt?: string;
}

interface Verification {
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  feedback?: string;
  isDisputed: boolean;
  disputeReason?: string;
}

interface Report {
  _id: string;
  accommodationName: string;
  accommodationId?: string;
  issueType: string;
  description: string;
  images?: Image[];
  createdAt: string;
  status?: string;
  upvotes?: number;
  upvotedBy?: string[];
  user?: string;
  resolution?: Resolution;
  verification?: Verification;
}

export default function MyReports() {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const { token } = useAuth(); // ✅ ADDED - get token from context
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState(''); // ✅ ADDED - for search functionality
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [editFormData, setEditFormData] = useState({
    accommodationName: '',
    issueType: '',
    description: ''
  });
  const [editImages, setEditImages] = useState<{url: string; publicId: string}[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const navigate = useNavigate();

  // ✅ FIXED: Extract user ID with token dependency
  useEffect(() => {
    if (!token) {
      setCurrentUserId('');
      return;
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUserId(payload.user?._id || payload.user?.id || payload.id || payload.userId || '');
    } catch {
      setCurrentUserId('');
    }
  }, [token]); // ✅ Re-run when token changes

  // ✅ FIXED: Fetch reports when token is available
  useEffect(() => {
    if (token) {
      fetchMyReports();
    }
  }, [token, API]); // ✅ Added token dependency

  const fetchMyReports = async () => {
    if (!token) {
      setError('Please login to view your reports');
      setLoading(false);
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API}/api/reports/my-reports`, {
        headers: {
          'Authorization': `Bearer ${token}`, // ✅ Use token from context
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setReports(data.data || data.reports || []);
      } else {
        setError(data.message || 'Failed to fetch reports');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (report: Report) => {
    setEditingReport(report);
    setEditFormData({
      accommodationName: report.accommodationName,
      issueType: report.issueType,
      description: report.description
    });
    setEditImages((report.images || []).map(img => ({
      url: img.url,
      publicId: img.publicId || img.url
    })));
  };

  const handleCancelEdit = () => {
    setEditingReport(null);
    setEditImages([]);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReport || !token) return;
    setEditLoading(true);

    try {
      const response = await fetch(`${API}/api/reports/${editingReport._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...editFormData,
          images: editImages
        })
      });
      const data = await response.json();
      if (data.success) {
        setEditingReport(null);
        fetchMyReports();
      } else {
        alert(data.message || 'Failed to update report');
      }
    } catch (err) {
      alert('Error updating report');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!window.confirm('Delete this report? This cannot be undone.')) return;
    if (!token) return;
    
    try {
      const response = await fetch(`${API}/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        fetchMyReports();
      }
    } catch (err) {
      alert('Error deleting report');
    }
  };

  const handleVerify = async (id: string, accepted: boolean, feedbackOrReason: string) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API}/api/reports/${id}/verify`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accepted,
          feedback: accepted ? feedbackOrReason : '',
          disputeReason: !accepted ? feedbackOrReason : ''
        })
      });
      const data = await response.json();
      if (data.success) {
        fetchMyReports();
      }
    } catch (err) {
      alert('Error verifying resolution');
    }
  };

  // ✅ FIXED: Filter with search functionality
  const filteredReports = reports.filter(r => {
    // Status filter
    const statusMatch =
      activeFilter === 'all' ? true :
      activeFilter === 'pending' ? r.status === 'pending' :
      activeFilter === 'review' ? r.status === 'review' :
      activeFilter === 'ai_verified' ? r.status === 'ai_verified' :
      activeFilter === 'rejected' ? r.status === 'rejected' :
      activeFilter === 'approved' ? r.status === 'approved' :
      activeFilter === 'resolved' ? r.status === 'resolved' :
      activeFilter === 'verified' ? r.status === 'verified' :
      activeFilter === 'disputed' ? r.status === 'disputed' :
      true;
    
    // Search filter
    const searchMatch = searchQuery === '' ? true :
      r.accommodationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.issueType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return statusMatch && searchMatch;
  });

  const stats = [
    { label: 'Total Contributions', value: reports.length, icon: <FiFileText />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Review', value: reports.filter(r => r.status === 'pending').length, icon: <FiClock />, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Admin Review', value: reports.filter(r => r.status === 'review').length, icon: <FiClock />, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'AI Verified', value: reports.filter(r => r.status === 'ai_verified').length, icon: <FiCheckCircle />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Rejected', value: reports.filter(r => r.status === 'rejected').length, icon: <FiX />, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Owner Responded', value: reports.filter(r => r.status === 'resolved').length, icon: <FiTool />, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Issues Verified', value: reports.filter(r => r.status === 'verified').length, icon: <FiCheckCircle />, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  // ✅ Show loading while waiting for token
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600 font-medium">Loading your reports...</p>
      </div>
    </div>
  );

  // ✅ Show error state
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
        <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiAlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Reports</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button 
          onClick={() => {
            setError('');
            if (token) fetchMyReports();
          }}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 pt-16 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/5 mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link to="/dashboard" className="inline-flex items-center text-blue-300 hover:text-white mb-10 font-bold transition-all gap-2">
            <FiArrowLeft /> Back to Dashboard
          </Link>
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div>
              <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight mb-4">
                Your Safety Reports
              </h1>
              <p className="text-xl text-blue-200 font-medium max-w-2xl">
                Track the impact of your contributions and manage your verified safety reports.
              </p>
            </div>
            <Link
              to="/report"
              className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-blue-50 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <FiPlus className="text-xl" /> Report New Issue
            </Link>
          </div>

          {/* Header Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] flex items-center gap-4">
                <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center text-xl`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{stat.value}</p>
                  <p className="text-[10px] font-black text-blue-200/60 uppercase tracking-widest leading-none">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        {/* Filters Card */}
        <div className="bg-white rounded-3xl shadow-xl p-6 lg:p-8 mb-10 border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2 flex items-center gap-2">
                <FiFilter /> Filter By
              </span>
              {[
                { id: 'all', label: 'All Reports' },
                { id: 'pending', label: '⏳ Pending' },
                { id: 'review', label: '🔍 Admin Review' },
                { id: 'ai_verified', label: '🤖 AI Verified' },
                { id: 'rejected', label: '❌ Rejected' },
                { id: 'approved', label: '✅ Published' },
                { id: 'resolved', label: '🔧 Resolved' },
                { id: 'verified', label: '🎉 Verified' },
                { id: 'disputed', label: '⚠️ Disputed' }
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                    activeFilter === filter.id 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            
            <div className="relative w-full md:w-64">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search your reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm font-bold text-gray-700"
              />
            </div>
          </div>
        </div>

        {/* Content Section */}
        {filteredReports.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 max-w-2xl mx-auto">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <FiFileText className="text-gray-300 text-4xl" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">
              {reports.length === 0 
                ? "You haven't filed any reports yet" 
                : "No reports match your filters"
              }
            </h3>
            <p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto px-4">
              {reports.length === 0 
                ? "Spotted a safety issue? Your voice matters! Your contributions can protect thousands of other students."
                : "Try adjusting your filters or search query."
              }
            </p>
            {reports.length === 0 ? (
              <Link 
                to="/report" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-blue-500/25 hover:shadow-2xl transition-all inline-flex items-center gap-2"
              >
                Report an Issue <FiArrowRight />
              </Link>
            ) : (
              <button 
                onClick={() => {
                  setActiveFilter('all');
                  setSearchQuery('');
                }}
                className="bg-gray-100 text-gray-700 px-10 py-4 rounded-2xl font-black hover:bg-gray-200 transition-all inline-flex items-center gap-2"
              >
                Clear Filters <FiX />
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {filteredReports.map((report) => (
              <ReportCard
                key={report._id}
                report={report}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onVerify={handleVerify}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}

        {/* Impact Message */}
        <div className="mt-16 p-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-10">
            <FiAward className="w-48 h-48 text-white" />
          </div>
          <div className="relative z-10 max-w-3xl">
            <h3 className="text-3xl font-black text-white mb-4">Safety Champion Status</h3>
            <p className="text-xl text-blue-100 font-medium mb-8">
              Your verified reports have helped thousands of students make safer housing choices. Keep contributing to build a more transparent accommodation network.
            </p>
            <div className="flex items-center gap-6">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="w-12 h-12 rounded-full border-4 border-blue-600 bg-blue-100 flex items-center justify-center font-black text-blue-600 text-xs">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <p className="text-sm font-bold text-blue-100">Joined by 10,000+ students nationwide</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
            <div className="p-8 lg:p-12">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Edit Your Report</h2>
                  <p className="text-slate-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Update safety information</p>
                </div>
                <button onClick={handleCancelEdit} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all">
                  <FiX className="h-6 w-6 text-gray-400" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Accommodation Name</label>
                    <input
                      type="text"
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-bold text-slate-900"
                      value={editFormData.accommodationName}
                      onChange={(e) => setEditFormData({...editFormData, accommodationName: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Issue Category</label>
                    <select
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-bold text-slate-900 appearance-none"
                      value={editFormData.issueType}
                      onChange={(e) => setEditFormData({...editFormData, issueType: e.target.value})}
                      required
                    >
                      <option value="Food Safety">Food Safety</option>
                      <option value="Water Quality">Water Quality</option>
                      <option value="Hygiene">Hygiene</option>
                      <option value="Security">Security</option>
                      <option value="Infrastructure">Infrastructure</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Description of Issue</label>
                  <textarea
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none min-h-[160px] font-medium text-slate-700 leading-relaxed"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    rows={5}
                    required
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 flex items-center gap-2">
                    <FiUpload /> Evidence Management
                  </label>
                  <div className="bg-gray-50 p-8 rounded-[2rem] border-2 border-dashed border-gray-200">
                    <ImageUpload
                      uploadedImages={editImages}
                      onImagesChange={setEditImages}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-50">
                  <button 
                    type="submit" 
                    className="flex-grow py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl hover:shadow-2xl hover:shadow-blue-500/25 transition-all disabled:opacity-50"
                    disabled={editLoading}
                  >
                    {editLoading ? 'Processing Updates...' : 'Save & Publish Changes'}
                  </button>
                  <button 
                    type="button" 
                    onClick={handleCancelEdit} 
                    className="px-10 py-5 bg-gray-100 text-slate-600 font-black rounded-2xl hover:bg-gray-200 transition-all"
                  >
                    Discard
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}