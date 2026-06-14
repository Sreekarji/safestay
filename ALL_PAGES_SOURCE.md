# SafeStay — All Page Source Code

Total files: 18 | Total lines: 9,854

---

## AccommodationDetail.tsx (708 lines)

```tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiMapPin, FiShield, FiAlertTriangle, FiClock, 
  FiArrowLeft, FiPhone, FiCheckCircle, FiInfo, FiTrendingUp,
  FiDollarSign, FiUsers, FiMap, FiCheck, FiTool, FiAlertCircle, FiXCircle,
  FiArrowRight, FiEdit3, FiBarChart2, FiX, FiUpload, FiSend, FiMessageSquare
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { 
  ScrollReveal, 
  StaggerReveal, 
  FadeIn,
  ScaleIn 
} from '../components/ParallaxEffect';

export const AccommodationDetail: React.FC = () => {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [accommodation, setAccommodation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Resolve Modal State
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [responseText, setResponseText] = useState('');
  const [responseImages, setResponseImages] = useState<File[]>([]);
  const [responseImagePreviews, setResponseImagePreviews] = useState<string[]>([]);
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [responseSuccess, setResponseSuccess] = useState(false);

  useEffect(() => {
    fetchAccommodation();
  }, [id]);

  const fetchAccommodation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API}/api/accommodations/${id}`);
      const data = await response.json();
      if (data.success) {
        setAccommodation(data.data);
      } else {
        setError('Accommodation not found');
      }
    } catch {
      setError('Error loading accommodation');
    } finally {
      setLoading(false);
    }
  };

  // Owner detection
  const isOwner = useMemo(() => {
    if (!user || !accommodation) return false;
    if (user.role !== 'owner') return false;
    const ownerId = accommodation.owner?._id || accommodation.owner?.id || accommodation.owner;
    const userId = user.id;
    return String(userId) === String(ownerId);
  }, [user, accommodation]);

  // Report stats for owner
  const reportStats = useMemo(() => {
    if (!accommodation?.reports) return { pending: 0, resolved: 0, disputed: 0 };
    return {
      pending: accommodation.reports.filter((r: any) => r.status === 'pending' || r.status === 'approved').length,
      resolved: accommodation.reports.filter((r: any) => r.status === 'resolved' || r.status === 'verified').length,
      disputed: accommodation.reports.filter((r: any) => r.status === 'disputed').length
    };
  }, [accommodation?.reports]);

  // ========== RESOLVE MODAL FUNCTIONS ==========
  const openResolveModal = (report: any) => {
    setSelectedReport(report);
    setResponseText('');
    setResponseImages([]);
    setResponseImagePreviews([]);
    setResponseSuccess(false);
    setShowResolveModal(true);
  };

  const closeResolveModal = () => {
    setShowResolveModal(false);
    setSelectedReport(null);
    setResponseText('');
    setResponseImages([]);
    setResponseImagePreviews([]);
    setResponseSuccess(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + responseImages.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    setResponseImages(prev => [...prev, ...validFiles]);

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setResponseImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setResponseImages(prev => prev.filter((_, i) => i !== index));
    setResponseImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const submitResponse = async () => {
    if (!selectedReport || !responseText.trim()) {
      alert('Please enter a response');
      return;
    }

    setSubmittingResponse(true);

    try {
      const token = localStorage.getItem('token');
      let imageUrls: string[] = [];

      if (responseImages.length > 0) {
        const formData = new FormData();
        responseImages.forEach(file => {
          formData.append('images', file);
        });

        const uploadRes = await fetch(`${API}/api/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.urls) {
          imageUrls = uploadData.urls;
        }
      }

      const response = await fetch(`${API}/api/owner/reports/${selectedReport._id}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          resolutionDescription: responseText.trim(),
          resolutionImages: imageUrls,
          actionTaken: responseText.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResponseSuccess(true);
        setTimeout(() => {
          closeResolveModal();
          fetchAccommodation();
        }, 2000);
      } else {
        alert(data.message || 'Failed to submit response');
      }
    } catch (err) {
      console.error('Submit response error:', err);
      alert('Error submitting response. Please try again.');
    } finally {
      setSubmittingResponse(false);
    }
  };

  // ========== HELPER FUNCTIONS ==========
  const getScoreBadge = (score: number) => {
    if (score >= 80) return (
      <div className="bg-green-100 text-green-700 px-6 py-3 rounded-2xl font-black inline-flex items-center gap-2 text-xl shadow-lg shadow-green-100/50">
        <FiShield className="text-2xl" /> {score} - Safe
      </div>
    );
    if (score >= 50) return (
      <div className="bg-yellow-100 text-yellow-700 px-6 py-3 rounded-2xl font-black inline-flex items-center gap-2 text-xl shadow-lg shadow-yellow-100/50">
        <FiAlertCircle className="text-2xl" /> {score} - Caution
      </div>
    );
    return (
      <div className="bg-red-100 text-red-700 px-6 py-3 rounded-2xl font-black inline-flex items-center gap-2 text-xl shadow-lg shadow-red-100/50">
        <FiXCircle className="text-2xl" /> {score} - Unsafe
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1"><FiClock /> Under Review</span>;
      case 'approved': return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1"><FiCheck /> Published</span>;
      case 'resolved': return <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1"><FiTool /> Owner Responded</span>;
      case 'verified': return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1"><FiCheckCircle /> Verified</span>;
      case 'disputed': return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1"><FiAlertTriangle /> Disputed</span>;
      default: return null;
    }
  };

  // ========== LOADING & ERROR STATES ==========
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (error || !accommodation) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <ScaleIn scale={0.9}>
        <div className="max-w-md w-full bg-white p-8 rounded-[2.5rem] shadow-2xl text-center border border-gray-100">
          <FiAlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">{error || 'Property not found'}</h2>
          <div className="flex flex-col gap-3 mt-8">
            <button onClick={() => fetchAccommodation()} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-200">Try Again</button>
            <button onClick={() => navigate('/accommodations')} className="w-full py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold">Back to Discover</button>
          </div>
        </div>
      </ScaleIn>
    </div>
  );

  // ========== MAIN RENDER ==========
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-16 lg:py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn delay={0}>
            <Link to={isOwner ? "/owner/dashboard" : "/accommodations"} className="inline-flex items-center text-blue-300 hover:text-white mb-10 font-bold transition-all gap-2">
              <FiArrowLeft /> {isOwner ? "Back to Dashboard" : "Back to Discover"}
            </Link>
          </FadeIn>
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12">
            <div className="max-w-3xl">
              <StaggerReveal stagger={80}>
                <div className="flex flex-wrap gap-3 mb-6">
                  <span className="bg-blue-600/20 backdrop-blur-sm border border-blue-400/30 text-blue-200 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest">
                    {accommodation.type || 'Hostel/PG'}
                  </span>
                  <span className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest inline-flex items-center gap-2">
                    <FiMapPin className="text-blue-400" /> {accommodation.city}
                  </span>
                  {isOwner && (
                    <span className="bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 text-emerald-300 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest inline-flex items-center gap-2">
                      <FiCheck className="text-emerald-400" /> Your Property
                    </span>
                  )}
                </div>
              </StaggerReveal>
              
              <ScrollReveal delay={100} distance={30}>
                <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tight leading-tight mb-6">
                  {accommodation.name}
                </h1>
              </ScrollReveal>
              
              <ScrollReveal delay={150} distance={20}>
                <p className="text-xl text-blue-100/80 font-medium flex items-center gap-3">
                  <FiMapPin className="text-blue-400 flex-shrink-0" /> {accommodation.address}
                </p>
              </ScrollReveal>
            </div>
            
            <ScaleIn delay={200} scale={0.95}>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] flex flex-col items-center text-center shadow-2xl min-w-[300px]">
                {getScoreBadge(accommodation.trustScore || 0)}
                <p className="mt-4 text-blue-100/60 font-bold uppercase tracking-widest text-[10px]">Overall Trust Rating</p>
                <p className="text-white text-sm font-bold mt-1">Based on {(accommodation.reports || []).length} verified reports</p>
              </div>
            </ScaleIn>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* Property Info Cards */}
            {isOwner ? (
              /* ========== OWNER VIEW ========== */
              <>
                <StaggerReveal stagger={100} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    { label: 'Total Reports', value: (accommodation.reports || []).length, icon: <FiBarChart2 />, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Trust Score', value: `${accommodation.trustScore || 0}/100`, icon: <FiTrendingUp />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Issues Fixed', value: reportStats.resolved, icon: <FiTool />, color: 'text-purple-600', bg: 'bg-purple-50' }
                  ].map((info, i) => (
                    <div key={i} className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-xl shadow-slate-200/50 flex items-center gap-6 transition-all hover:scale-[1.02]">
                      <div className={`w-16 h-16 ${info.bg} ${info.color} rounded-2xl flex items-center justify-center text-2xl flex-shrink-0`}>{info.icon}</div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{info.label}</p>
                        <p className="text-lg font-black text-slate-900 leading-tight">{info.value}</p>
                      </div>
                    </div>
                  ))}
                </StaggerReveal>
                
                {/* Owner Quick Actions */}
                <ScrollReveal delay={100} distance={20}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Link 
                      to={`/owner/add-property?edit=${id}`}
                      className="flex items-center justify-center gap-3 py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                    >
                      <FiEdit3 /> Edit Property Details
                    </Link>
                    <Link 
                      to="/owner/dashboard"
                      className="flex items-center justify-center gap-3 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                    >
                      <FiBarChart2 /> View Full Dashboard
                    </Link>
                  </div>
                </ScrollReveal>
              </>
            ) : (
              /* ========== STUDENT VIEW ========== */
              <StaggerReveal stagger={100} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { label: 'Estimated Price', value: accommodation.priceRange || accommodation.pricePerMonth ? `₹${accommodation.pricePerMonth}/month` : 'Contact for Pricing', icon: <FiDollarSign />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Room Options', value: accommodation.roomTypes?.join(', ') || 'Single, Double', icon: <FiUsers />, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Contact Property', value: accommodation.contactPhone || 'Login to view', icon: <FiPhone />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'Issues Resolved', value: `${reportStats.resolved} Fixed`, icon: <FiTool />, color: 'text-purple-600', bg: 'bg-purple-50' }
                ].map((info, i) => (
                  <div key={i} className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-xl shadow-slate-200/50 flex items-center gap-6 transition-all hover:scale-[1.02]">
                    <div className={`w-16 h-16 ${info.bg} ${info.color} rounded-2xl flex items-center justify-center text-2xl flex-shrink-0`}>{info.icon}</div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{info.label}</p>
                      <p className="text-lg font-black text-slate-900 leading-tight">{info.value}</p>
                    </div>
                  </div>
                ))}
              </StaggerReveal>
            )}

            {/* Reports Section */}
            <ScrollReveal delay={0} distance={30}>
              <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-gray-100 overflow-hidden">
                <div className="p-8 lg:p-10 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-6">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 mb-1">
                      {isOwner ? "Reports on Your Property" : "Safety Reports & History"}
                    </h2>
                    <p className="text-slate-500 font-bold text-sm">
                      {isOwner ? "Manage and resolve student feedback" : "Documented student experiences and resolutions"}
                    </p>
                  </div>
                  
                  {isOwner ? (
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-emerald-200">
                      <FiTool /> {reportStats.pending} Needs Action
                    </div>
                  ) : (
                    <Link to="/report" className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-red-200 hover:shadow-2xl transition-all flex items-center gap-2">
                      <FiAlertTriangle /> Report an Issue
                    </Link>
                  )}
                </div>

                <div className="p-8 lg:p-10">
                  {/* Owner Stats */}
                  {isOwner && (
                    <StaggerReveal stagger={100} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                      <div className="bg-yellow-50 p-6 rounded-[1.5rem] border border-yellow-100 text-center">
                        <p className="text-[10px] font-black text-yellow-600 uppercase mb-1">Needs Action</p>
                        <p className="text-3xl font-black text-yellow-700">{reportStats.pending}</p>
                      </div>
                      <div className="bg-emerald-50 p-6 rounded-[1.5rem] border border-emerald-100 text-center">
                        <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Resolved</p>
                        <p className="text-3xl font-black text-emerald-700">{reportStats.resolved}</p>
                      </div>
                      <div className="bg-red-50 p-6 rounded-[1.5rem] border border-red-100 text-center">
                        <p className="text-[10px] font-black text-red-600 uppercase mb-1">Disputed</p>
                        <p className="text-3xl font-black text-red-700">{reportStats.disputed}</p>
                      </div>
                    </StaggerReveal>
                  )}

                  {/* Reports List */}
                  {(accommodation.reports || []).length === 0 ? (
                    <ScaleIn delay={0} scale={0.95}>
                      <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
                          <FiCheckCircle className="text-emerald-500 text-4xl opacity-20" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                          {isOwner ? "No reports on your property" : "No reports filed yet"}
                        </h3>
                        <p className="text-slate-500 font-medium max-w-sm mx-auto">
                          {isOwner ? "Great! Your property has no safety concerns reported." : "This could mean excellent conditions or simply no reviews yet."}
                        </p>
                      </div>
                    </ScaleIn>
                  ) : (
                    <StaggerReveal stagger={100} className="space-y-8">
                      {accommodation.reports.map((report: any) => (
                        <div key={report._id} className="bg-slate-50/50 rounded-[2rem] border border-slate-100 p-8 hover:bg-white hover:shadow-xl transition-all duration-300">
                          {/* Report Header */}
                          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                                report.category === 'Security' ? 'bg-red-100 text-red-700' : 
                                report.category === 'Infrastructure' ? 'bg-orange-100 text-orange-700' : 
                                report.category === 'Food' ? 'bg-yellow-100 text-yellow-700' :
                                report.category === 'Water' ? 'bg-cyan-100 text-cyan-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {report.category}
                              </span>
                              {getStatusBadge(report.status)}
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <FiClock className="text-blue-500" />
                              {formatDistanceToNow(new Date(report.createdAt))} ago
                            </p>
                          </div>

                          <p className="text-slate-700 text-lg font-medium leading-relaxed mb-6">{report.description}</p>

                          {/* Report Images */}
                          {report.images && report.images.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                              {report.images.map((img: any, idx: number) => (
                                <div key={idx} className="aspect-square rounded-2xl overflow-hidden border-2 border-white shadow-sm hover:scale-105 transition-transform">
                                  <img src={img.url || img} className="w-full h-full object-cover" alt="Evidence" />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Owner Response */}
                          {(report.ownerResponse || report.resolution) && (
                            <div className="mt-6 p-6 bg-emerald-50 rounded-[1.5rem] border border-emerald-100">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                  <FiTool className="h-4 w-4" />
                                </div>
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Owner Response</h4>
                              </div>
                              <p className="text-slate-600 font-medium">
                                {report.ownerResponse?.description || report.resolution?.description || report.resolutionDescription}
                              </p>
                            </div>
                          )}

                          {/* Owner Actions */}
                          {isOwner && (
                            <div className="mt-6 flex flex-wrap gap-3">
                              {(report.status === 'approved' || report.status === 'pending') && (
                                <button 
                                  onClick={() => openResolveModal(report)}
                                  className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs hover:bg-emerald-700 transition-all flex items-center gap-2"
                                >
                                  <FiMessageSquare /> Resolve This Issue
                                </button>
                              )}
                              {report.status === 'resolved' && (
                                <span className="px-6 py-3 bg-blue-100 text-blue-700 rounded-xl font-black text-xs flex items-center gap-2">
                                  <FiClock /> Awaiting Student Verification
                                </span>
                              )}
                              {report.status === 'verified' && (
                                <span className="px-6 py-3 bg-emerald-100 text-emerald-700 rounded-xl font-black text-xs flex items-center gap-2">
                                  <FiCheckCircle /> Successfully Resolved
                                </span>
                              )}
                              {report.status === 'disputed' && (
                                <button 
                                  onClick={() => openResolveModal(report)}
                                  className="px-6 py-3 bg-red-600 text-white rounded-xl font-black text-xs hover:bg-red-700 transition-all flex items-center gap-2"
                                >
                                  <FiAlertTriangle /> Re-resolve Issue
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </StaggerReveal>
                  )}
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Map */}
            <ScrollReveal delay={100} distance={30}>
              <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-gray-100 p-8 overflow-hidden">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                  <FiMapPin className="text-blue-600" /> Property Location
                </h3>
                <div className="h-64 bg-slate-100 rounded-[2rem] overflow-hidden mb-6 flex items-center justify-center">
                  {accommodation.latitude && accommodation.longitude ? (
                    <iframe 
                      title="Property Location" 
                      width="100%" 
                      height="100%" 
                      style={{ border: 0, borderRadius: '1.5rem' }} 
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${accommodation.longitude - 0.01}%2C${accommodation.latitude - 0.01}%2C${accommodation.longitude + 0.01}%2C${accommodation.latitude + 0.01}&layer=mapnik&marker=${accommodation.latitude}%2C${accommodation.longitude}`} 
                      loading="lazy" 
                    />
                  ) : (
                    <div className="text-center text-slate-400">
                      <FiMapPin className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="font-bold">Location not available</p>
                    </div>
                  )}
                </div>
                {accommodation.latitude && accommodation.longitude && (
                  <a href={`https://www.google.com/maps?q=${accommodation.latitude},${accommodation.longitude}`} target="_blank" rel="noopener noreferrer" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                    <FiMap /> Open in Google Maps
                  </a>
                )}
              </div>
            </ScrollReveal>

            {/* Conditional Sidebar */}
            {isOwner ? (
              <ScaleIn delay={200} scale={0.95}>
                <div className="bg-emerald-900 text-white rounded-[2.5rem] p-10 relative overflow-hidden">
                  <FiBarChart2 className="absolute -bottom-10 -right-10 w-48 h-48 text-emerald-800/50 -rotate-12" />
                  <h3 className="text-xl font-black mb-4 relative z-10">Manage Property</h3>
                  <p className="text-emerald-200 font-bold mb-8 relative z-10">Update details, respond to reports, and track performance.</p>
                  <div className="space-y-4 relative z-10">
                    <Link to="/owner/dashboard" className="w-full py-4 bg-white text-emerald-900 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-emerald-50 transition-all">
                      Go to Dashboard
                    </Link>
                    <Link to={`/owner/add-property?edit=${id}`} className="w-full py-4 bg-emerald-800 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all border border-emerald-700">
                      <FiEdit3 /> Edit Property
                    </Link>
                  </div>
                </div>
              </ScaleIn>
            ) : (
              <>
                <ScrollReveal delay={200} distance={30}>
                  <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-gray-100 p-8">
                    <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                      <FiShield className="text-emerald-600" /> Verified Owner
                    </h3>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl">
                        {accommodation.owner?.name?.charAt(0) || 'O'}
                      </div>
                      <div>
                        <p className="text-lg font-black text-slate-900 leading-tight">{accommodation.owner?.name || 'Verified Property Manager'}</p>
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-1">Platform Partner</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                        <FiCheck className="text-emerald-500" /> Identity Verified
                      </div>
                      <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                        <FiCheck className="text-emerald-500" /> Ownership Documented
                      </div>
                    </div>
                  </div>
                </ScrollReveal>

                <ScaleIn delay={300} scale={0.95}>
                  <div className="bg-indigo-900 text-white rounded-[2.5rem] p-10 relative overflow-hidden">
                    <FiTrendingUp className="absolute -bottom-10 -right-10 w-48 h-48 text-indigo-800/50 -rotate-12" />
                    <h3 className="text-xl font-black mb-4 relative z-10">Living Here?</h3>
                    <p className="text-indigo-200 font-bold mb-8 relative z-10">Your feedback helps thousands of students make safer choices.</p>
                    <Link to="/report" className="w-full py-4 bg-white text-indigo-900 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-blue-50 transition-all relative z-10">
                      Share My Experience <FiArrowRight />
                    </Link>
                  </div>
                </ScaleIn>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ========== RESOLVE MODAL ========== */}
      {showResolveModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <ScaleIn delay={0} scale={0.95}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Respond to Report</h3>
                  <p className="text-sm text-slate-500">Explain the action you've taken to resolve this issue</p>
                </div>
                <button onClick={closeResolveModal} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <FiX className="h-6 w-6 text-slate-400" />
                </button>
              </div>

              {responseSuccess ? (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiCheck className="h-10 w-10 text-emerald-600" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 mb-2">Response Submitted!</h4>
                  <p className="text-slate-500">The student will be notified to verify the resolution.</p>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {/* Report Info */}
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl ${selectedReport.status === 'disputed' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                        <FiAlertCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{selectedReport.category}</span>
                          <span className={`text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded ${selectedReport.status === 'disputed' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}`}>{selectedReport.status}</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-700">{selectedReport.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Response Text */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">Your Response / Action Taken <span className="text-red-500">*</span></label>
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-semibold resize-none"
                      placeholder="Describe what action you've taken to resolve this issue..."
                    />
                  </div>

                  {/* Proof Images */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">Proof Images (Optional)</label>
                    
                    {responseImagePreviews.length > 0 && (
                      <div className="flex gap-3 flex-wrap mb-4">
                        {responseImagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img src={preview} alt={`Proof ${index + 1}`} className="w-24 h-24 object-cover rounded-xl border-2 border-slate-200" />
                            <button type="button" onClick={() => removeImage(index)} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                              <FiX className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {responseImages.length < 5 && (
                      <label className="flex items-center justify-center gap-2 px-6 py-4 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all">
                        <FiUpload className="text-slate-400" />
                        <span className="font-semibold text-slate-500">Click to upload images</span>
                        <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                      </label>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={submitResponse}
                      disabled={submittingResponse || !responseText.trim()}
                      className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submittingResponse ? (
                        <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Submitting...</>
                      ) : (
                        <><FiSend /> Submit Response</>
                      )}
                    </button>
                    <button onClick={closeResolveModal} className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </ScaleIn>
        </div>
      )}
    </div>
  );
};```

---

## AccommodationList.tsx (299 lines)

```tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiSearch, FiMapPin, FiShield, FiAlertTriangle, FiTrendingUp, 
  FiMap, FiList, FiGrid, FiArrowRight, FiCheckCircle, FiAlertCircle, FiXCircle, FiHome, FiTool
} from 'react-icons/fi';
import AccommodationMap from '../components/AccommodationMap';
import { 
  ScrollReveal, 
  StaggerReveal, 
  FadeIn,
  ScaleIn 
} from '../components/ParallaxEffect';

export const AccommodationList: React.FC = () => {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [accommodations, setAccommodations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showMap, setShowMap] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchAccommodations();
  }, []);

  const fetchAccommodations = async () => {
    try {
      const response = await fetch(`${API}/api/accommodations`);
      const data = await response.json();
      if (data.success) {
        setAccommodations(data.data);
      } else {
        setError('Failed to load accommodations');
      }
    } catch {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const filteredAccommodations = (accommodations || []).filter(acc => {
    const matchesSearch = !searchTerm || 
      acc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    if (selectedFilter === 'safe') matchesFilter = (acc.trustScore >= 80);
    else if (selectedFilter === 'caution') matchesFilter = (acc.trustScore >= 50 && acc.trustScore < 80);
    else if (selectedFilter === 'avoid') matchesFilter = (acc.trustScore < 50);

    return matchesSearch && matchesFilter;
  });

  const getScoreBadge = (score: number) => {
    if (score >= 80) return (
      <div className="bg-green-100 text-green-700 px-3 py-1 rounded-xl font-bold inline-flex items-center gap-1.5 text-sm">
        <FiShield className="text-xs" /> {score} - Safe
      </div>
    );
    if (score >= 50) return (
      <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-xl font-bold inline-flex items-center gap-1.5 text-sm">
        <FiAlertCircle className="text-xs" /> {score} - Caution
      </div>
    );
    return (
      <div className="bg-red-100 text-red-700 px-3 py-1 rounded-xl font-bold inline-flex items-center gap-1.5 text-sm">
        <FiXCircle className="text-xs" /> {score} - Avoid
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 font-medium">Finding safe accommodations...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal delay={0} distance={30}>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-white">
              Find Safe Accommodations
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={100} distance={20}>
            <p className="mt-4 text-lg text-blue-200 max-w-2xl">
              Search verified properties with transparent safety ratings and real student feedback.
            </p>
          </ScrollReveal>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
        {/* Search and Filters Card */}
        <ScrollReveal delay={0} distance={40}>
          <div className="bg-white rounded-3xl shadow-xl p-6 lg:p-8 mb-8 border border-gray-100 relative z-10">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Search Input */}
              <div className="flex-grow relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by name, location, or city..."
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-700 placeholder-gray-400 font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filter Pills & View Toggles */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex gap-2 flex-wrap bg-gray-50 p-1 rounded-2xl border border-gray-100">
                  <StaggerReveal stagger={50}>
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'safe', label: '🟢 Safe (80+)' },
                      { id: 'caution', label: '🟡 Caution (50-79)' },
                      { id: 'avoid', label: '🔴 Avoid (<50)' }
                    ].map(filter => (
                      <button
                        key={filter.id}
                        onClick={() => setSelectedFilter(filter.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                          selectedFilter === filter.id
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </StaggerReveal>
                </div>

                <div className="h-8 w-[1px] bg-gray-200 hidden lg:block mx-2"></div>

                <FadeIn delay={200}>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                      title="Grid View"
                    >
                      <FiGrid className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                      title="List View"
                    >
                      <FiList className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setShowMap(!showMap)}
                      className={`p-3 rounded-xl transition-all ${showMap ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                      title="Map View"
                    >
                      <FiMap className="h-5 w-5" />
                    </button>
                  </div>
                </FadeIn>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-gray-50">
              <FadeIn delay={100}>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                  Showing <span className="text-blue-600">{filteredAccommodations.length}</span> verified accommodations
                </p>
              </FadeIn>
            </div>
          </div>
        </ScrollReveal>

        {/* Map Section */}
        {showMap && (
          <ScrollReveal delay={0} direction="down" distance={30}>
            <div className="mb-8 rounded-3xl shadow-xl border-4 border-white overflow-hidden h-[500px]">
              <AccommodationMap />
            </div>
          </ScrollReveal>
        )}

        {/* Error Message */}
        {error && (
          <ScaleIn delay={0} scale={0.95}>
            <div className="bg-red-50 border border-red-100 text-red-700 p-6 rounded-2xl mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiAlertTriangle className="h-6 w-6 text-red-500" />
                <p className="font-bold">{error}</p>
              </div>
              <button 
                onClick={() => { setError(""); setLoading(true); fetchAccommodations(); }}
                className="bg-white text-red-600 px-6 py-2 rounded-xl font-bold border border-red-200 hover:bg-red-50 transition-all"
              >
                Retry Search
              </button>
            </div>
          </ScaleIn>
        )}

        {/* Results */}
        {filteredAccommodations.length === 0 ? (
          <ScaleIn delay={0} scale={0.9}>
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiSearch className="text-gray-300 text-3xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No accommodations found in this area</h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto px-4">
                Know a property that should be here? Ask owners to register for free and join the safety movement.
              </p>
              <Link 
                to="/owner/register" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold inline-flex items-center gap-2 hover:shadow-xl transition-all"
              >
                Register Property <FiArrowRight />
              </Link>
            </div>
          </ScaleIn>
        ) : (
          <StaggerReveal 
            stagger={80} 
            className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" 
              : "space-y-6"
            }
          >
            {filteredAccommodations.map(accommodation => (
              <Link 
                key={accommodation._id} 
                to={`/accommodations/${accommodation._id}`}
                className={`group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden flex ${viewMode === 'list' ? 'flex-row items-center p-4' : 'flex-col'}`}
              >
                {/* Image / Thumbnail */}
                <div className={`${viewMode === 'list' ? 'w-40 h-40 rounded-2xl' : 'w-full h-56'} bg-slate-50 relative overflow-hidden flex-shrink-0`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                    <FiHome className="h-12 w-12 text-slate-200 group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="absolute top-4 left-4">
                    {getScoreBadge(accommodation.trustScore ?? 0)}
                  </div>
                  <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors duration-500"></div>
                </div>

                <div className={`${viewMode === 'list' ? 'px-8 flex-grow' : 'p-6 lg:p-8'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                      {accommodation.name}
                    </h3>
                  </div>
                  
                  <div className="flex items-center text-gray-500 mb-6 text-sm font-medium">
                    <FiMapPin className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="truncate">{accommodation.address}, {accommodation.city}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6 py-5 border-y border-gray-50">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Reports</p>
                      <p className="text-lg font-black text-gray-900 flex items-center gap-1.5">
                        <FiAlertTriangle className="text-red-500 h-4 w-4" /> {accommodation.totalReports || 0}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resolved</p>
                      <p className="text-lg font-black text-gray-900 flex items-center gap-1.5">
                        <FiCheckCircle className="text-green-500 h-4 w-4" /> {accommodation.resolvedReports || 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-400">
                      {accommodation.type || 'Hostel/PG'}
                    </span>
                    <span className="text-blue-600 font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      View Safety Profile <FiArrowRight className="text-xs" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </StaggerReveal>
        )}
      </div>
    </div>
  );
};```

---

## AddProperty.tsx (847 lines)

```tsx
import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  FiHome, FiMapPin, FiPhone, FiDollarSign, 
  FiUsers, FiArrowLeft, FiCheck,
  FiAlertCircle, FiSave, FiSearch, FiNavigation, FiX, FiEdit3
} from 'react-icons/fi';

// Fix for default marker icon in Leaflet
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

// Custom marker for selected location
const selectedIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map clicks
function LocationMarker({ 
  position, 
  setPosition 
}: { 
  position: [number, number] | null; 
  setPosition: (pos: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? (
    <Marker position={position} icon={selectedIcon} />
  ) : null;
}

// Component to fly to location
function FlyToLocation({ position }: { position: [number, number] | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, { duration: 1.5 });
    }
  }, [position, map]);
  
  return null;
}

// Component for search functionality
function SearchControl({ 
  onLocationSelect 
}: { 
  onLocationSelect: (lat: number, lng: number, address: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchLocation = async () => {
    if (!query.trim()) return;
    
    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      setResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (result: any) => {
    onLocationSelect(
      parseFloat(result.lat),
      parseFloat(result.lon),
      result.display_name
    );
    setQuery(result.display_name.split(',')[0]);
    setShowResults(false);
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
            placeholder="Search location (e.g., Hitech City, Hyderabad)"
            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-emerald-500 outline-none transition-all font-semibold text-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setResults([]); setShowResults(false); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <FiX />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={searchLocation}
          disabled={searching}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {searching ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <FiSearch />
          )}
          Search
        </button>
      </div>
      
      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute z-[1000] w-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 max-h-60 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(result)}
              className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors border-b border-slate-100 last:border-b-0"
            >
              <p className="font-semibold text-slate-900 text-sm truncate">{result.display_name.split(',')[0]}</p>
              <p className="text-xs text-slate-500 truncate">{result.display_name}</p>
            </button>
          ))}
        </div>
      )}
      
      {showResults && results.length === 0 && !searching && (
        <div className="absolute z-[1000] w-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 text-center">
          <p className="text-slate-500 text-sm">No locations found. Try a different search.</p>
        </div>
      )}
    </div>
  );
}

export default function AddProperty() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // ✅ EDIT MODE DETECTION
  const editId = searchParams.get('edit');
  const isEditMode = !!editId;

  const [loading, setLoading] = useState(false);
  const [fetchingProperty, setFetchingProperty] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Map state
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]); // India center

  const [formData, setFormData] = useState({
    name: '',
    type: 'hostel',
    address: '',
    city: '',
    state: '',
    pincode: '',
    contactPhone: '',
    description: '',
    pricePerMonth: '',
    totalRooms: '',
    amenities: [] as string[]
  });

  const amenitiesList = [
    'WiFi', 'AC', 'Parking', 'Laundry', 'Mess/Food', 
    'Gym', 'Security', 'CCTV', 'Power Backup', 'Water Supply',
    'Attached Bathroom', 'Study Room', 'Common Area'
  ];

  // ✅ FETCH EXISTING PROPERTY DATA FOR EDIT MODE
  useEffect(() => {
    if (isEditMode && editId) {
      fetchPropertyData();
    }
  }, [editId, isEditMode]);

  const fetchPropertyData = async () => {
    setFetchingProperty(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/accommodations/${editId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const property = data.data;
        
        // Pre-fill form with existing data
        setFormData({
          name: property.name || '',
          type: property.type || 'hostel',
          address: property.address || '',
          city: property.city || '',
          state: property.state || '',
          pincode: property.pincode || '',
          contactPhone: property.contactPhone || '',
          description: property.description || '',
          pricePerMonth: property.pricePerMonth?.toString() || '',
          totalRooms: property.totalRooms?.toString() || '',
          amenities: property.amenities || []
        });
        
        // Set map position if coordinates exist
        if (property.latitude && property.longitude) {
          const pos: [number, number] = [property.latitude, property.longitude];
          setSelectedPosition(pos);
          setMapCenter(pos);
        }
      } else {
        setError('Failed to load property data');
      }
    } catch (err) {
      console.error('Fetch property error:', err);
      setError('Error loading property data');
    } finally {
      setFetchingProperty(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  // Handle location selection from search
  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setSelectedPosition([lat, lng]);
    setMapCenter([lat, lng]);
    
    const parts = address.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      const possibleCity = parts[0] || parts[1];
      const possibleState = parts[parts.length - 2] || '';
      
      setFormData(prev => ({
        ...prev,
        address: parts.slice(0, -2).join(', ') || address,
        city: prev.city || possibleCity,
        state: prev.state || possibleState
      }));
    }
  };

  // Handle map position change
  const handlePositionChange = async (pos: [number, number]) => {
    setSelectedPosition(pos);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos[0]}&lon=${pos[1]}`
      );
      const data = await response.json();
      
      if (data.address) {
        setFormData(prev => ({
          ...prev,
          address: data.display_name?.split(',').slice(0, 3).join(',') || prev.address,
          city: data.address.city || data.address.town || data.address.village || prev.city,
          state: data.address.state || prev.state,
          pincode: data.address.postcode || prev.pincode
        }));
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const pos: [number, number] = [position.coords.latitude, position.coords.longitude];
        setSelectedPosition(pos);
        setMapCenter(pos);
        await handlePositionChange(pos);
        setGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to get your location. Please select manually on the map.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation for required fields
    if (!selectedPosition) {
      setError('Please select a location on the map');
      return;
    }

    if (!formData.name.trim()) {
      setError('Property name is required');
      return;
    }

    if (!formData.address.trim()) {
      setError('Address is required');
      return;
    }

    if (!formData.city.trim()) {
      setError('City is required');
      return;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    if (!formData.totalRooms || parseInt(formData.totalRooms) <= 0) {
      setError('Total rooms is required (must be greater than 0)');
      return;
    }

    if (!formData.pricePerMonth || parseInt(formData.pricePerMonth) <= 0) {
      setError('Price per month is required (must be greater than 0)');
      return;
    }

    if (!formData.contactPhone.trim()) {
      setError('Contact phone is required');
      return;
    }

    setLoading(true);

    // Prepare data matching schema exactly
    const requestData = {
      name: formData.name.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      description: formData.description.trim(),
      totalRooms: parseInt(formData.totalRooms),
      pricePerMonth: parseInt(formData.pricePerMonth),
      contactPhone: formData.contactPhone.trim(),
      amenities: formData.amenities,
      latitude: selectedPosition[0],
      longitude: selectedPosition[1],
      location: {
        type: 'Point',
        coordinates: [selectedPosition[1], selectedPosition[0]] // GeoJSON: [lng, lat]
      }
    };

    console.log('Sending data:', requestData);

    try {
      const token = localStorage.getItem('token');
      
      // ✅ USE PUT FOR EDIT, POST FOR ADD
      const url = isEditMode 
        ? `${API}/api/owner/accommodations/${editId}` 
        : `${API}/api/owner/accommodations`;
      
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      console.log('Response:', data);

      if (response.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/owner/dashboard');
        }, 2000);
      } else {
        setError(data.message || `Failed to ${isEditMode ? 'update' : 'add'} property. Please check all fields.`);
      }
    } catch (err) {
      console.error('Property error:', err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ LOADING STATE FOR EDIT MODE
  if (fetchingProperty) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading property data...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white p-12 rounded-3xl shadow-xl text-center max-w-md">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheck className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">
            {isEditMode ? 'Property Updated!' : 'Property Added!'}
          </h2>
          <p className="text-slate-500 mb-6">
            {isEditMode 
              ? 'Your property has been updated successfully.' 
              : 'Your property has been registered successfully.'
            } Redirecting to dashboard...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-slate-900 text-white pt-10 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            to="/owner/dashboard" 
            className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-bold mb-8 transition-colors"
          >
            <FiArrowLeft /> Back to Dashboard
          </Link>
          {/* ✅ DYNAMIC TITLE BASED ON MODE */}
          <h1 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-3">
            {isEditMode ? (
              <>
                <FiEdit3 className="text-emerald-400" /> Edit Property
              </>
            ) : (
              <>
                <FiHome className="text-emerald-400" /> Add New Property
              </>
            )}
          </h1>
          <p className="text-slate-400 font-medium">
            {isEditMode 
              ? 'Update your property details below' 
              : 'Register your accommodation to start building trust with students'
            }
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-8 lg:p-12">
          
          {/* Error Message */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
              <FiAlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-red-700">{error}</p>
            </div>
          )}

          {/* Edit Mode Notice */}
          {isEditMode && (
            <div className="mb-8 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3">
              <FiEdit3 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-emerald-700">
                You are editing an existing property. Changes will be saved when you click "Update Property".
              </p>
            </div>
          )}

          {/* Required Fields Notice */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-sm text-blue-700">
              <span className="font-bold">Note:</span> Fields marked with <span className="text-red-500">*</span> are required
            </p>
          </div>

          {/* Basic Information */}
          <div className="mb-10">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <FiHome className="text-emerald-600" /> Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                  Property Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-semibold"
                  placeholder="e.g., Sunshine Hostel"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                  Property Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-semibold cursor-pointer"
                >
                  <option value="hostel">Hostel</option>
                  <option value="pg">PG (Paying Guest)</option>
                  <option value="apartment">Apartment</option>
                  <option value="flat">Flat</option>
                  <option value="room">Single Room</option>
                </select>
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-semibold resize-none"
                placeholder="Describe your property, facilities, rules, nearby landmarks, etc."
              />
            </div>
          </div>

          {/* Location with Map */}
          <div className="mb-10">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <FiMapPin className="text-emerald-600" /> Select Location on Map <span className="text-red-500">*</span>
            </h2>
            
            {/* Search and GPS buttons */}
            <div className="mb-4 space-y-4">
              <SearchControl onLocationSelect={handleLocationSelect} />
              
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                >
                  {gettingLocation ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FiNavigation />
                  )}
                  Use My Location
                </button>
                
                <span className="text-sm text-slate-500">
                  Or click directly on the map to select location
                </span>
              </div>
            </div>

            {/* Map Container */}
            <div className="rounded-2xl overflow-hidden border-2 border-slate-200 shadow-lg">
              <MapContainer
                center={mapCenter}
                zoom={isEditMode && selectedPosition ? 16 : 5}
                style={{ height: '400px', width: '100%' }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker position={selectedPosition} setPosition={handlePositionChange} />
                <FlyToLocation position={selectedPosition} />
              </MapContainer>
            </div>

            {/* Selected Coordinates Display */}
            {selectedPosition && (
              <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="flex items-center gap-2 text-emerald-700 font-bold mb-2">
                  <FiCheck className="text-emerald-600" />
                  Location Selected
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Latitude:</span>
                    <span className="ml-2 font-mono font-bold text-slate-900">{selectedPosition[0].toFixed(6)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Longitude:</span>
                    <span className="ml-2 font-mono font-bold text-slate-900">{selectedPosition[1].toFixed(6)}</span>
                  </div>
                </div>
              </div>
            )}

            {!selectedPosition && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <p className="text-yellow-700 text-sm font-semibold">
                  ⚠️ Please select a location on the map by clicking or using search/GPS
                </p>
              </div>
            )}

            {/* Address Fields */}
            <div className="mt-6 space-y-6">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                  Full Address <span className="text-red-500">*</span>
                </label>
                <input
                  name="address"
                  type="text"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-semibold"
                  placeholder="Building name, street, area"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="city"
                    type="text"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-semibold"
                    placeholder="e.g., Hyderabad"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">State</label>
                  <input
                    name="state"
                    type="text"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-semibold"
                    placeholder="e.g., Telangana"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">Pincode</label>
                  <input
                    name="pincode"
                    type="text"
                    value={formData.pincode}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-semibold"
                    placeholder="e.g., 500001"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="mb-10">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <FiPhone className="text-emerald-600" /> Contact Information
            </h2>
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                Contact Phone <span className="text-red-500">*</span>
              </label>
              <input
                name="contactPhone"
                type="tel"
                required
                value={formData.contactPhone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-semibold"
                placeholder="e.g., +91 9876543210"
              />
            </div>
          </div>

          {/* Pricing & Capacity */}
          <div className="mb-10">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <FiDollarSign className="text-emerald-600" /> Pricing & Capacity
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                  Price Per Month (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  name="pricePerMonth"
                  type="number"
                  required
                  min="1"
                  value={formData.pricePerMonth}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-semibold"
                  placeholder="e.g., 5000"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                  Total Rooms <span className="text-red-500">*</span>
                </label>
                <input
                  name="totalRooms"
                  type="number"
                  required
                  min="1"
                  value={formData.totalRooms}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-semibold"
                  placeholder="e.g., 20"
                />
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="mb-10">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <FiUsers className="text-emerald-600" /> Amenities (Optional)
            </h2>
            <div className="flex flex-wrap gap-3">
              {amenitiesList.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                    formData.amenities.includes(amenity)
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {formData.amenities.includes(amenity) && <FiCheck className="inline mr-1" />}
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          {/* Submit - ✅ DYNAMIC BUTTON TEXT */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={loading || !selectedPosition}
              className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {isEditMode ? 'Updating Property...' : 'Adding Property...'}
                </>
              ) : (
                <>
                  {isEditMode ? <FiEdit3 /> : <FiSave />}
                  {isEditMode ? 'Update Property' : 'Add Property'}
                </>
              )}
            </button>
            <Link
              to="/owner/dashboard"
              className="py-4 px-8 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-lg transition-all text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}```

---

## AdminDashboard.tsx (984 lines)

```tsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // ✅ Added Link
import { useAuth } from '../contexts/AuthContext';
import { 
  FiShield, FiUsers, FiFileText, FiCheckCircle, FiAlertTriangle, 
  FiTrendingUp, FiSearch, FiEye, FiCpu, FiActivity, FiX,
  FiRefreshCw, FiDownload, FiTrash2, FiUserCheck // ✅ Added FiUserCheck
} from 'react-icons/fi';

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
        setStats(statsData.stats); // ✅ Fixed: Changed from statsData.data to statsData.stats
      }
      
      if (reportsData.success) {
        setReports(reportsData.reports || []); // ✅ Fixed: Changed from reportsData.data to reportsData.reports
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
}```

---

## AdminOwnerVerifications.tsx (884 lines)

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiUsers, 
  FiClock, 
  FiCheckCircle, 
  FiXCircle, 
  FiEye,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiFileText,
  FiImage,
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { format } from 'date-fns';

interface VerificationDocument {
  url: string;
  publicId: string;
  uploadedAt: string;
}

interface Owner {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  propertyName?: string;
  propertyCount?: string;
  businessAddress?: string;
  gstNumber?: string;
  ownerVerificationStatus: 'pending' | 'under_review' | 'verified' | 'rejected';
  verificationDocuments?: {
    governmentId?: VerificationDocument;
    propertyProof?: VerificationDocument;
    businessRegistration?: VerificationDocument;
  };
  verificationSubmittedAt?: string;
  verificationReviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

interface StatusCounts {
  pending: number;
  under_review: number;
  verified: number;
  rejected: number;
}

const AdminOwnerVerifications: React.FC = () => {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    pending: 0,
    under_review: 0,
    verified: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Fetch owner verifications
  const fetchOwners = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        status: activeFilter,
        page: currentPage.toString(),
        limit: '10'
      });

      const response = await fetch(
        `${API_URL}/api/admin/owner-verifications?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch owner verifications');
      }

      const data = await response.json();
      
      if (data.success) {
        setOwners(data.owners);
        setStatusCounts(data.statusCounts);
        setTotalPages(data.pagination.pages);
      } else {
        throw new Error(data.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [API_URL, activeFilter, currentPage]);

  useEffect(() => {
    fetchOwners();
  }, [fetchOwners]);

  // Get owner details
  const fetchOwnerDetails = async (ownerId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/admin/owner-verifications/${ownerId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch owner details');
      }

      const data = await response.json();
      if (data.success) {
        setSelectedOwner(data.owner);
        setShowModal(true);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error fetching details');
    }
  };

  // Mark as under review
  const handleMarkUnderReview = async (ownerId: string) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/admin/owner-verifications/${ownerId}/review`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        fetchOwners();
        setShowModal(false);
        setSelectedOwner(null);
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch (err) {
      alert('Error updating status');
    } finally {
      setActionLoading(false);
    }
  };

  // Approve owner
  const handleApprove = async (ownerId: string) => {
    if (!confirm('Are you sure you want to APPROVE this owner?')) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/admin/owner-verifications/${ownerId}/approve`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ notes: 'Approved via admin panel' })
        }
      );

      const data = await response.json();
      if (data.success) {
        alert('✅ Owner approved successfully!');
        fetchOwners();
        setShowModal(false);
        setSelectedOwner(null);
      } else {
        alert(data.message || 'Failed to approve');
      }
    } catch (err) {
      alert('Error approving owner');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject owner
  const handleReject = async () => {
    if (!selectedOwner) return;
    if (rejectionReason.trim().length < 10) {
      alert('Please provide a rejection reason (minimum 10 characters)');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/admin/owner-verifications/${selectedOwner._id}/reject`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reason: rejectionReason })
        }
      );

      const data = await response.json();
      if (data.success) {
        alert('❌ Owner rejected');
        fetchOwners();
        setShowModal(false);
        setShowRejectModal(false);
        setSelectedOwner(null);
        setRejectionReason('');
      } else {
        alert(data.message || 'Failed to reject');
      }
    } catch (err) {
      alert('Error rejecting owner');
    } finally {
      setActionLoading(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <FiClock className="mr-1" /> Pending
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <FiEye className="mr-1" /> Under Review
          </span>
        );
      case 'verified':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FiCheckCircle className="mr-1" /> Verified
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <FiXCircle className="mr-1" /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  // Filter tabs
  const filterTabs = [
    { key: 'pending', label: 'Pending', count: statusCounts.pending, color: 'yellow' },
    { key: 'under_review', label: 'Under Review', count: statusCounts.under_review, color: 'blue' },
    { key: 'verified', label: 'Verified', count: statusCounts.verified, color: 'green' },
    { key: 'rejected', label: 'Rejected', count: statusCounts.rejected, color: 'red' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FiUsers className="mr-3 text-indigo-600" />
            Owner Verification Management
          </h1>
          <p className="mt-2 text-gray-600">
            Review and manage property owner verification requests
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-700">{statusCounts.pending}</p>
              </div>
              <FiClock className="text-3xl text-yellow-400" />
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Under Review</p>
                <p className="text-2xl font-bold text-blue-700">{statusCounts.under_review}</p>
              </div>
              <FiEye className="text-3xl text-blue-400" />
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Verified</p>
                <p className="text-2xl font-bold text-green-700">{statusCounts.verified}</p>
              </div>
              <FiCheckCircle className="text-3xl text-green-400" />
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">Rejected</p>
                <p className="text-2xl font-bold text-red-700">{statusCounts.rejected}</p>
              </div>
              <FiXCircle className="text-3xl text-red-400" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveFilter(tab.key);
                    setCurrentPage(1);
                  }}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
                    activeFilter === tab.key
                      ? `border-${tab.color}-500 text-${tab.color}-600`
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeFilter === tab.key
                      ? `bg-${tab.color}-100 text-${tab.color}-800`
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Search & Refresh */}
          <div className="p-4 flex items-center justify-between">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              onClick={fetchOwners}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <FiAlertCircle className="text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
            <button
              onClick={fetchOwners}
              className="mt-2 text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <FiRefreshCw className="animate-spin text-4xl text-indigo-600" />
          </div>
        )}

        {/* Owners List */}
        {!loading && owners.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FiUsers className="mx-auto text-5xl text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No {activeFilter.replace('_', ' ')} verifications found</p>
          </div>
        )}

        {!loading && owners.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documents
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {owners
                  .filter(owner => 
                    searchTerm === '' || 
                    owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    owner.email.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((owner) => (
                    <tr key={owner._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-600 font-medium">
                              {owner.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{owner.name}</div>
                            <div className="text-sm text-gray-500">{owner.email}</div>
                            {owner.phone && (
                              <div className="text-xs text-gray-400">{owner.phone}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{owner.propertyName || 'Not specified'}</div>
                        <div className="text-sm text-gray-500">
                          {owner.propertyCount ? `${owner.propertyCount} properties` : 'Count not specified'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {owner.verificationSubmittedAt 
                            ? format(new Date(owner.verificationSubmittedAt), 'MMM dd, yyyy')
                            : format(new Date(owner.createdAt), 'MMM dd, yyyy')
                          }
                        </div>
                        <div className="text-xs text-gray-500">
                          {owner.verificationSubmittedAt 
                            ? format(new Date(owner.verificationSubmittedAt), 'hh:mm a')
                            : format(new Date(owner.createdAt), 'hh:mm a')
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(owner.ownerVerificationStatus)}
                        {owner.rejectionReason && (
                          <p className="text-xs text-red-500 mt-1 max-w-xs truncate" title={owner.rejectionReason}>
                            {owner.rejectionReason}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          {owner.verificationDocuments?.governmentId?.url && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600" title="Government ID">
                              <FiFileText className="mr-1" /> ID
                            </span>
                          )}
                          {owner.verificationDocuments?.propertyProof?.url && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600" title="Property Proof">
                              <FiImage className="mr-1" /> Prop
                            </span>
                          )}
                          {owner.verificationDocuments?.businessRegistration?.url && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600" title="Business Registration">
                              <FiFileText className="mr-1" /> Biz
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => fetchOwnerDetails(owner._id)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <FiEye className="inline mr-1" /> View
                        </button>
                        {owner.ownerVerificationStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(owner._id)}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              <FiCheckCircle className="inline mr-1" /> Approve
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  <FiChevronLeft className="mr-1" /> Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  Next <FiChevronRight className="ml-1" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Detail Modal */}
        {showModal && selectedOwner && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Owner Verification Details</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedOwner(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiXCircle className="text-2xl" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Owner Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-500">Full Name</label>
                        <p className="text-gray-900 font-medium">{selectedOwner.name}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Email</label>
                        <p className="text-gray-900">{selectedOwner.email}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Phone</label>
                        <p className="text-gray-900">{selectedOwner.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Status</label>
                        <div className="mt-1">{getStatusBadge(selectedOwner.ownerVerificationStatus)}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-500">Property/Business Name</label>
                        <p className="text-gray-900">{selectedOwner.propertyName || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Number of Properties</label>
                        <p className="text-gray-900">{selectedOwner.propertyCount || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Business Address</label>
                        <p className="text-gray-900">{selectedOwner.businessAddress || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">GST Number</label>
                        <p className="text-gray-900">{selectedOwner.gstNumber || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Documents */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Government ID */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                        <FiFileText className="mr-2 text-indigo-500" />
                        Government ID
                      </h4>
                      {selectedOwner.verificationDocuments?.governmentId?.url ? (
                        <div>
                          <img
                            src={selectedOwner.verificationDocuments.governmentId.url}
                            alt="Government ID"
                            className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80"
                            onClick={() => setSelectedDocument(selectedOwner.verificationDocuments?.governmentId?.url || null)}
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            Uploaded: {format(new Date(selectedOwner.verificationDocuments.governmentId.uploadedAt), 'MMM dd, yyyy')}
                          </p>
                          <a
                            href={selectedOwner.verificationDocuments.governmentId.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 text-sm mt-1 inline-block"
                          >
                            Open Full Size →
                          </a>
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">Not uploaded</p>
                      )}
                    </div>

                    {/* Property Proof */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                        <FiImage className="mr-2 text-green-500" />
                        Property Proof
                      </h4>
                      {selectedOwner.verificationDocuments?.propertyProof?.url ? (
                        <div>
                          <img
                            src={selectedOwner.verificationDocuments.propertyProof.url}
                            alt="Property Proof"
                            className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80"
                            onClick={() => setSelectedDocument(selectedOwner.verificationDocuments?.propertyProof?.url || null)}
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            Uploaded: {format(new Date(selectedOwner.verificationDocuments.propertyProof.uploadedAt), 'MMM dd, yyyy')}
                          </p>
                          <a
                            href={selectedOwner.verificationDocuments.propertyProof.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 text-sm mt-1 inline-block"
                          >
                            Open Full Size →
                          </a>
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">Not uploaded</p>
                      )}
                    </div>

                    {/* Business Registration */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                        <FiFileText className="mr-2 text-orange-500" />
                        Business Registration
                      </h4>
                      {selectedOwner.verificationDocuments?.businessRegistration?.url ? (
                        <div>
                          <img
                            src={selectedOwner.verificationDocuments.businessRegistration.url}
                            alt="Business Registration"
                            className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80"
                            onClick={() => setSelectedDocument(selectedOwner.verificationDocuments?.businessRegistration?.url || null)}
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            Uploaded: {format(new Date(selectedOwner.verificationDocuments.businessRegistration.uploadedAt), 'MMM dd, yyyy')}
                          </p>
                          <a
                            href={selectedOwner.verificationDocuments.businessRegistration.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 text-sm mt-1 inline-block"
                          >
                            Open Full Size →
                          </a>
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">Not uploaded (Optional)</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rejection Reason (if rejected) */}
                {selectedOwner.rejectionReason && (
                  <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-800 mb-2">Rejection Reason</h4>
                    <p className="text-red-700">{selectedOwner.rejectionReason}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                  {selectedOwner.ownerVerificationStatus === 'pending' && (
                    <button
                      onClick={() => handleMarkUnderReview(selectedOwner._id)}
                      disabled={actionLoading}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <FiEye className="mr-2" />
                      Mark Under Review
                    </button>
                  )}

                  {['pending', 'under_review'].includes(selectedOwner.ownerVerificationStatus) && (
                    <>
                      <button
                        onClick={() => handleApprove(selectedOwner._id)}
                        disabled={actionLoading}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        <FiCheckCircle className="mr-2" />
                        Approve Owner
                      </button>

                      <button
                        onClick={() => setShowRejectModal(true)}
                        disabled={actionLoading}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        <FiXCircle className="mr-2" />
                        Reject Owner
                      </button>
                    </>
                  )}

                  {selectedOwner.ownerVerificationStatus === 'rejected' && (
                    <button
                      onClick={() => handleApprove(selectedOwner._id)}
                      disabled={actionLoading}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <FiCheckCircle className="mr-2" />
                      Re-Approve Owner
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedOwner(null);
                    }}
                    className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reject Reason Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <FiXCircle className="mr-2 text-red-500" />
                Reject Verification
              </h3>
              <p className="text-gray-600 mb-4">
                Please provide a reason for rejecting <strong>{selectedOwner?.name}</strong>'s verification:
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason (e.g., 'Government ID is not clear', 'Property documents don't match', etc.)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 h-32"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 10 characters required</p>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading || rejectionReason.trim().length < 10}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Full Size Document Viewer */}
        {selectedDocument && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedDocument(null)}
          >
            <div className="relative max-w-4xl w-full">
              <button
                onClick={() => setSelectedDocument(null)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300"
              >
                <FiXCircle className="text-3xl" />
              </button>
              <img
                src={selectedDocument}
                alt="Document"
                className="w-full max-h-[80vh] object-contain rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOwnerVerifications;```

---

## Dashboard.tsx (548 lines)

```tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiFileText,
  FiShield,
  FiAlertTriangle,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiPlus,
  FiArrowRight,
  FiList,
  FiTrendingUp,
  FiActivity
} from 'react-icons/fi';
import UpvoteButton from '../components/UpvoteButton';
import { 
  ScrollReveal, 
  StaggerReveal, 
  FadeIn,
  ScaleIn 
} from '../components/ParallaxEffect';

interface Accommodation {
  _id: string;
  name: string;
  location: string;
  trustScore: number;
  type?: string;
}

interface Report {
  _id: string;
  accommodationName: string;
  issueType: string;
  description: string;
  createdAt: string;
  upvotes: number;
  upvotedBy: string[];
  user: string | { _id: string };
}

export const Dashboard: React.FC = () => {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const { user, token } = useAuth();
  
  const [reports, setReports] = useState<Report[]>([]);
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setCurrentUserId('');
      return;
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUserId(payload.user?.id || payload.id || payload.userId || '');
    } catch {
      setCurrentUserId('');
    }
  }, [token]);

  const fetchMyReports = async () => {
    if (!token) return;
    
    try {
      const res = await fetch(`${API}/api/reports/my-reports?page=1&limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setMyReports(data.reports || []);
      }
    } catch (err) {
      console.error('Error fetching my reports:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    
    try {
      const reportsRes = await fetch(`${API}/api/reports`);
      const reportsData = await reportsRes.json();
      
      const accommodationsRes = await fetch(`${API}/api/accommodations`);
      const accommodationsData = await accommodationsRes.json();
      
      if (reportsData.success) {
        setReports(reportsData.data || []);
      }
      
      if (accommodationsData.success) {
        setAccommodations(accommodationsData.data || []);
      } else if (Array.isArray(accommodationsData)) {
        setAccommodations(accommodationsData);
      }
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [API]);

  useEffect(() => {
    if (token) {
      fetchMyReports();
    }
  }, [token]);

  const totalAccommodations = accommodations.length;
  
  const highRiskCount = accommodations.filter(acc => {
    const score = acc.trustScore ?? 100;
    return score < 50;
  }).length;
  
  const riskyCount = accommodations.filter(acc => {
    const score = acc.trustScore ?? 100;
    return score >= 50 && score < 80;
  }).length;
  
  const safeCount = accommodations.filter(acc => {
    const score = acc.trustScore ?? 100;
    return score >= 80;
  }).length;
  
  const userImpactCount = myReports.length;

  const safetyAlerts = accommodations
    .filter(acc => {
      const score = acc.trustScore ?? 100;
      return score < 80;
    })
    .sort((a, b) => (a.trustScore ?? 100) - (b.trustScore ?? 100))
    .slice(0, 5);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center animate-fadeInUp">
        <div className="relative mb-4">
          <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping"></div>
          <div className="absolute inset-2 rounded-full bg-blue-500/10 animate-pulse"></div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 relative z-10"></div>
        </div>
        <p className="text-gray-600 font-medium">Loading your safety dashboard...</p>
        <p className="text-gray-400 text-sm mt-1">Fetching latest data</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <ScaleIn scale={0.9}>
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <FiAlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{error}</h2>
          <p className="text-gray-600 mb-6">We couldn't load your dashboard data. Please check your connection and try again.</p>
          <button 
            onClick={() => {
              fetchData();
              if (token) fetchMyReports();
            }}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 active:scale-95 transition-all duration-200 shadow-lg shadow-blue-200 hover:shadow-xl"
          >
            Try Again
          </button>
        </div>
      </ScaleIn>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header Section */}
      <div className="bg-slate-900 text-white pt-12 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <ScrollReveal delay={0} distance={30}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl font-bold shadow-lg shadow-blue-900/20 hover:scale-105 transition-transform duration-300">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Welcome back, {user?.name}! 👋</h1>
                  <p className="text-blue-200 mt-1 flex items-center gap-2">
                    <FiCheckCircle className="text-green-400" />
                    {userImpactCount > 0 
                      ? `You've filed ${userImpactCount} safety report${userImpactCount > 1 ? 's' : ''}`
                      : 'Start contributing to student safety'
                    }
                  </p>
                </div>
              </div>
            </ScrollReveal>
            
            <FadeIn delay={100}>
              <Link
                to="/report"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 font-bold rounded-xl hover:from-yellow-300 hover:to-orange-400 active:scale-95 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 shadow-lg shadow-orange-900/20"
              >
                <FiPlus className="h-5 w-5" />
                🚨 Report an Issue
              </Link>
            </FadeIn>
          </div>
        </div>
      </div>

      {/* Stats Cards - Overlapping the header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12">
        <StaggerReveal stagger={100} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Accommodations */}
          <div className="bg-white p-6 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 group hover:border-blue-200 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ease-out">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <FiShield className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Total</span>
            </div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Accommodations</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1 transition-colors duration-300">{totalAccommodations}</p>
          </div>
          
          {/* High Risk (Unsafe) */}
          <div className="bg-white p-6 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 group hover:border-red-200 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ease-out">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-50 rounded-xl text-red-600 group-hover:bg-red-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <FiAlertTriangle className="h-6 w-6" />
              </div>
              {highRiskCount > 0 ? (
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full animate-pulse">Urgent</span>
              ) : (
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">All Clear</span>
              )}
            </div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">High Risk (&lt;50)</p>
            <p className={`text-3xl font-extrabold mt-1 transition-colors duration-300 ${highRiskCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {highRiskCount}
            </p>
          </div>

          {/* Caution */}
          <div className="bg-white p-6 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 group hover:border-yellow-200 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ease-out">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-50 rounded-xl text-yellow-600 group-hover:bg-yellow-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <FiAlertCircle className="h-6 w-6" />
              </div>
              {riskyCount > 0 ? (
                <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">Caution</span>
              ) : (
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">None</span>
              )}
            </div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Caution (50-79)</p>
            <p className={`text-3xl font-extrabold mt-1 transition-colors duration-300 ${riskyCount > 0 ? 'text-yellow-600' : 'text-gray-900'}`}>
              {riskyCount}
            </p>
          </div>

          {/* Safe */}
          <div className="bg-white p-6 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 group hover:border-green-200 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ease-out">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 rounded-xl text-green-600 group-hover:bg-green-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <FiCheckCircle className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">Safe</span>
            </div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Safe (80+)</p>
            <p className="text-3xl font-extrabold text-green-600 mt-1 transition-colors duration-300">{safeCount}</p>
          </div>
        </StaggerReveal>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Quick Actions & Activity */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Quick Navigation Card */}
            <ScrollReveal delay={0} distance={20}>
              <Link 
                to="/my-reports" 
                className="flex items-center gap-4 p-6 bg-white rounded-2xl border border-gray-100 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <FiList className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">My Safety Contributions</h3>
                  <p className="text-sm text-gray-500">
                    {userImpactCount > 0 
                      ? `You have ${userImpactCount} report${userImpactCount > 1 ? 's' : ''} - track their status`
                      : 'Track your reported issues and their status'
                    }
                  </p>
                </div>
                <FiArrowRight className="ml-auto text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all duration-300" />
              </Link>
            </ScrollReveal>

            {/* Recent Activity Feed */}
            <ScrollReveal delay={100} distance={30}>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FiActivity className="h-5 w-5 text-indigo-600" />
                    <h2 className="text-xl font-bold text-gray-900">Recent Safety Reports</h2>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-semibold">
                      {reports.length} total
                    </span>
                  </div>
                  <Link 
                    to="/accommodations" 
                    className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:gap-2 transition-all duration-200"
                  >
                    View All <FiArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="divide-y divide-gray-50">
                  {reports.length === 0 ? (
                    <ScaleIn delay={0} scale={0.95}>
                      <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FiFileText className="h-8 w-8 text-gray-300 animate-bounce" />
                        </div>
                        <p className="text-gray-500 font-medium">No reports filed yet. Be the first to help!</p>
                        <Link 
                          to="/report" 
                          className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 hover:shadow-lg active:scale-95 transition-all duration-200"
                        >
                          <FiPlus /> Report an Issue
                        </Link>
                      </div>
                    </ScaleIn>
                  ) : (
                    <StaggerReveal stagger={50}>
                      {reports.slice(0, 5).map((report) => (
                        <div 
                          key={report._id} 
                          className="p-6 hover:bg-gray-50 transition-all duration-300 border-l-4 border-l-transparent hover:border-l-blue-500"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-bold text-gray-900 text-lg hover:text-blue-600 transition-colors duration-200">{report.accommodationName}</h3>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="px-3 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-full border border-red-100 hover:bg-red-100 transition-colors duration-200">
                                  {report.issueType}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                  <FiClock className="h-3 w-3" />
                                  {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Today'}
                                </span>
                              </div>
                            </div>
                            {currentUserId && (
                              <UpvoteButton
                                reportId={report._id}
                                initialUpvotes={report.upvotes || 0}
                                initialHasUpvoted={(report.upvotedBy || []).includes(currentUserId)}
                                isOwnReport={
                                  (typeof report.user === 'string' ? report.user : report.user?._id) === currentUserId
                                }
                              />
                            )}
                          </div>
                          <p className="text-gray-600 text-sm line-clamp-2 mt-3">{report.description}</p>
                        </div>
                      ))}
                    </StaggerReveal>
                  )}
                </div>
                {reports.length > 5 && (
                  <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                    <Link 
                      to="/accommodations" 
                      className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all duration-200"
                    >
                      View All {reports.length} Reports →
                    </Link>
                  </div>
                )}
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Alerts & Tips */}
          <div className="space-y-8">
            {/* Safety Alerts */}
            <ScrollReveal delay={200} distance={30}>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className={`p-6 text-white flex items-center justify-between transition-colors duration-300 ${
                  safetyAlerts.length > 0 ? 'bg-red-600' : 'bg-green-600'
                }`}>
                  <div className="flex items-center gap-2">
                    {safetyAlerts.length > 0 ? (
                      <FiAlertTriangle className="h-5 w-5 animate-pulse" />
                    ) : (
                      <FiCheckCircle className="h-5 w-5" />
                    )}
                    <h2 className="font-bold">
                      {safetyAlerts.length > 0 ? 'Properties Need Attention' : 'All Properties Safe!'}
                    </h2>
                  </div>
                  {safetyAlerts.length > 0 && (
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full font-semibold animate-pulse">
                      {safetyAlerts.length}
                    </span>
                  )}
                </div>
                <div className="p-2 divide-y divide-gray-50">
                  {safetyAlerts.length > 0 ? (
                    <StaggerReveal stagger={75}>
                      {safetyAlerts.map((accommodation) => {
                        const score = accommodation.trustScore ?? 100;
                        const isUnsafe = score < 50;
                        
                        return (
                          <Link 
                            to={`/accommodations/${accommodation._id}`} 
                            key={accommodation._id} 
                            className={`flex items-center gap-4 p-4 transition-all duration-300 rounded-xl group hover:-translate-y-0.5 ${
                              isUnsafe ? 'hover:bg-red-50' : 'hover:bg-yellow-50'
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                              isUnsafe 
                                ? 'bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white' 
                                : 'bg-yellow-100 text-yellow-600 group-hover:bg-yellow-600 group-hover:text-white'
                            }`}>
                              <FiTrendingUp className="h-6 w-6" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold text-gray-900 truncate group-hover:text-gray-700 transition-colors duration-200">{accommodation.name}</h3>
                              <p className="text-xs text-gray-500 truncate">{accommodation.location}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="h-1.5 flex-grow bg-gray-100 rounded-full overflow-hidden max-w-[100px]">
                                  <div 
                                    className={`h-full transition-all duration-500 ${isUnsafe ? 'bg-red-500' : 'bg-yellow-500'}`}
                                    style={{ width: `${score}%` }}
                                  ></div>
                                </div>
                                <span className={`text-[10px] font-bold whitespace-nowrap transition-colors duration-200 ${
                                  isUnsafe ? 'text-red-600' : 'text-yellow-600'
                                }`}>
                                  Score: {score}
                                </span>
                              </div>
                            </div>
                            <FiArrowRight className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all duration-300" />
                          </Link>
                        );
                      })}
                    </StaggerReveal>
                  ) : (
                    <ScaleIn delay={0} scale={0.95}>
                      <div className="p-8 text-center">
                        <FiCheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
                        <p className="text-gray-600 font-medium">All accommodations have good safety ratings!</p>
                        <p className="text-xs text-gray-400 mt-1">Trust scores are 80 or above</p>
                      </div>
                    </ScaleIn>
                  )}
                </div>
              </div>
            </ScrollReveal>

            {/* Safety Tips Card */}
            <ScaleIn delay={300} scale={0.95}>
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
                <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
                <FiShield className="h-12 w-12 text-blue-200/40 mb-4" />
                <h3 className="text-xl font-bold mb-2">Safety Pro Tip</h3>
                <p className="text-blue-100 text-sm leading-relaxed mb-6">
                  Always check the water quality and electrical wiring before moving into a new PG. If you spot an issue, report it here to help others.
                </p>
                <Link 
                  to="/report" 
                  className="inline-flex items-center text-sm font-bold text-yellow-400 hover:text-yellow-300 hover:gap-2 transition-all duration-200"
                >
                  File a Report <FiArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </ScaleIn>

            {/* Your Impact Card */}
            <ScrollReveal delay={400} distance={30}>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FiActivity className="text-blue-600" /> Your Impact
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <span className="text-sm text-gray-600">Reports Filed</span>
                    <span className="font-bold text-gray-900">{userImpactCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <span className="text-sm text-gray-600">Total Platform Reports</span>
                    <span className="font-bold text-blue-600">{reports.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <span className="text-sm text-gray-600">Safe Properties</span>
                    <span className="font-bold text-green-600">{safeCount} / {totalAccommodations}</span>
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Your Status</span>
                      <span className={`font-bold px-3 py-1 rounded-full text-xs transition-all duration-300 hover:scale-105 ${
                        userImpactCount >= 5 
                          ? 'bg-yellow-100 text-yellow-700' 
                          : userImpactCount >= 2 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-gray-100 text-gray-700'
                      }`}>
                        {userImpactCount >= 5 ? '🏆 Champion' : userImpactCount >= 2 ? '⭐ Contributor' : '🌱 Getting Started'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

        </div>
      </div>
    </div>
  );
};```

---

## ForgotPassword.tsx (260 lines)

```tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const navigate = useNavigate();

  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API}/api/otp/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await response.json();

      if (data.success) {
        setMessage('OTP sent to your email!');
        setStep('otp');
        setCountdown(60);
      } else {
        setError(data.message);
      }
    } catch {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API}/api/otp/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setStep('success');
        setMessage(data.message);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(data.message);
      }
    } catch {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API}/api/otp/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await response.json();

      if (data.success) {
        setMessage('New OTP sent!');
        setCountdown(60);
      } else {
        setError(data.message);
      }
    } catch {
      setError('Error connecting to server');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">{step === 'success' ? '✅' : '🔒'}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 'email' && 'Forgot Password'}
            {step === 'otp' && 'Reset Password'}
            {step === 'success' && 'Password Reset!'}
          </h1>
          <p className="text-gray-500 mt-2">
            {step === 'email' && 'Enter your email to receive a reset code.'}
            {step === 'otp' && 'Enter the code sent to your email and set a new password.'}
            {step === 'success' && 'Redirecting to login...'}
          </p>
        </div>

        {step === 'email' && (
          <form onSubmit={handleSendOTP} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Enter your registered email"
                required
              />
            </div>

            {error && <p className="text-red-600 text-sm font-medium bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
            {message && <p className="text-green-600 text-sm font-medium bg-green-50 px-4 py-2 rounded-lg">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-blue-400"
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtp(value);
                }}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center text-2xl tracking-widest font-bold"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Minimum 6 characters"
                minLength={6}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Confirm new password"
                minLength={6}
                required
              />
            </div>

            {error && <p className="text-red-600 text-sm font-medium bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
            {message && <p className="text-green-600 text-sm font-medium bg-green-50 px-4 py-2 rounded-lg">{message}</p>}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-blue-400"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={countdown > 0}
                className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
              >
                {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
              </button>
            </div>
          </form>
        )}

        {step === 'success' && (
          <div className="text-center py-4">
            <p className="text-green-600 font-medium mb-4">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-lg transition-colors"
            >
              Go to Login
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Home.tsx (703 lines)

```tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiShield, FiAlertTriangle, FiMap, FiFileText, FiUser, FiHome,
  FiCheckCircle, FiUsers, FiTrendingUp, FiSearch, FiStar, FiAward,
  FiMapPin, FiCamera, FiMessageCircle, FiArrowRight, FiPlay
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { 
  ScrollReveal, 
  StaggerReveal, 
  ParallaxContainer, 
  FadeIn,
  ScaleIn 
} from '../components/ParallaxEffect';

// Animated Counter Component
const AnimatedCounter: React.FC<{ end: number; suffix?: string; duration?: number }> = ({ 
  end, suffix = '', duration = 2000 
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    const animateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animateCount);
      }
    };
    requestAnimationFrame(animateCount);
  }, [end, duration]);

  return <span>{count.toLocaleString()}{suffix}</span>;
};

export const Home: React.FC = () => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const problemPoints = [
    { icon: <FiAlertTriangle />, text: "Fake reviews manipulated by brokers" },
    { icon: <FiAlertTriangle />, text: "Hidden safety hazards discovered too late" },
    { icon: <FiAlertTriangle />, text: "No accountability for property owners" },
    { icon: <FiAlertTriangle />, text: "Food poisoning & water quality issues" },
  ];

  const howItWorks = [
    {
      step: "1",
      icon: <FiSearch className="h-8 w-8" />,
      title: "Search Location",
      description: "Find accommodations near your college with our interactive safety map"
    },
    {
      step: "2",
      icon: <FiShield className="h-8 w-8" />,
      title: "Check Trust Score",
      description: "View verified safety ratings from 0-100 based on real student reports"
    },
    {
      step: "3",
      icon: <FiFileText className="h-8 w-8" />,
      title: "Read Reports",
      description: "Access detailed safety reports with evidence from verified residents"
    },
    {
      step: "4",
      icon: <FiCheckCircle className="h-8 w-8" />,
      title: "Decide Safely",
      description: "Make informed decisions backed by data, not fake reviews"
    }
  ];

  const features = [
    {
      icon: <FiMap className="h-10 w-10" />,
      title: "Interactive Safety Map",
      description: "Search any location and instantly see safe (🟢), caution (🟡), and unsafe (🔴) accommodations within your preferred radius.",
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: <FiShield className="h-10 w-10" />,
      title: "Dynamic Trust Scores",
      description: "Our algorithm calculates real-time safety scores (0-100) based on verified reports, resolutions, and student feedback.",
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: <FiCamera className="h-10 w-10" />,
      title: "Evidence-Based Reports",
      description: "Students upload photos and documents as proof. No more 'he said, she said' – only verified evidence.",
      color: "from-purple-500 to-violet-600"
    },
    {
      icon: <FiMessageCircle className="h-10 w-10" />,
      title: "Resolution Tracking",
      description: "Owners must resolve issues with proof. Students verify fixes. Complete accountability loop.",
      color: "from-orange-500 to-red-600"
    }
  ];

  const testimonials = [
    {
      quote: "Found water quality issues in 3 PGs near my college BEFORE signing any lease. This platform saved me from a nightmare.",
      author: "Priya S.",
      role: "Engineering Student, Hyderabad",
      rating: 5
    },
    {
      quote: "As a parent, I can now verify my daughter's accommodation safety from 500km away. Peace of mind is priceless.",
      author: "Rajesh K.",
      role: "Parent, Chennai",
      rating: 5
    },
    {
      quote: "Our trust score improved from 62 to 94 after we fixed reported issues. Good for students AND honest owners.",
      author: "Venkat R.",
      role: "PG Owner, Bangalore",
      rating: 5
    }
  ];

  const stakeholderBenefits = [
    {
      icon: <FiUsers className="h-12 w-12" />,
      title: "For Students",
      benefits: [
        "Report issues anonymously but verifiably",
        "Search safe accommodations near any location",
        "See real photos and evidence, not stock images",
        "Verify if owners actually fix problems"
      ],
      color: "blue",
      cta: "Report an Issue",
      link: "/register"
    },
    {
      icon: <FiHome className="h-12 w-12" />,
      title: "For Parents",
      benefits: [
        "Verify safety before your child moves in",
        "Compare accommodations side-by-side",
        "Track safety scores over time",
        "Real reports from real students"
      ],
      color: "green",
      cta: "Search Accommodations",
      link: "/accommodations"
    },
    {
      icon: <FiAward className="h-12 w-12" />,
      title: "For Good Owners",
      benefits: [
        "Build genuine reputation with verified reviews",
        "Respond to concerns and show improvements",
        "Stand out from low-quality competitors",
        "Attract safety-conscious tenants"
      ],
      color: "purple",
      cta: "Register Property",
      link: "/owner/register"
    }
  ];

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      
      {/* ================= HERO SECTION with PARALLAX ================= */}
      <ParallaxContainer speed={0.3} className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" style={{ animationDelay: '4s' }}></div>
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBtLTEgMGExIDEgMCAxIDAgMiAwYTEgMSAwIDEgMCAtMiAwIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L2c+PC9zdmc+')] opacity-40"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            
            {/* Trust Badge */}
            <FadeIn delay={0}>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-8">
                <FiShield className="h-4 w-4 mr-2 text-green-400" />
                <span>Trusted by 10,000+ Students Across India</span>
              </div>
            </FadeIn>

            {/* Main Headline */}
            <ScrollReveal delay={100} distance={40}>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white mb-6 leading-tight">
                Your Safety.
                <span className="block bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 text-transparent bg-clip-text">
                  Their Accountability.
                </span>
                <span className="block text-blue-300 text-3xl sm:text-4xl lg:text-5xl mt-2 font-bold">
                  Zero Compromise.
                </span>
              </h1>
            </ScrollReveal>

            {/* Subheadline */}
            <ScrollReveal delay={200} distance={30}>
              <p className="text-lg sm:text-xl lg:text-2xl text-blue-100/80 mb-10 max-w-3xl mx-auto leading-relaxed">
                Don't gamble with your living situation. See <span className="text-white font-semibold">verified safety reports</span>, 
                <span className="text-green-400 font-semibold"> real trust scores</span>, and 
                <span className="text-yellow-400 font-semibold"> evidence-backed reviews</span> before you sign that lease.
              </p>
            </ScrollReveal>
            
            {/* CTA Buttons */}
            <ScrollReveal delay={300} distance={20}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                {user ? (
                  <Link
                    to={user.role === 'owner' ? '/owner/dashboard' : user.role === 'admin' ? '/admin' : '/dashboard'}
                    className="group inline-flex items-center px-8 py-4 text-lg font-bold rounded-xl text-slate-900 bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-300 hover:to-orange-300 transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-2xl shadow-orange-500/25"
                  >
                    Go to Dashboard
                    <FiArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/accommodations"
                      className="group inline-flex items-center px-8 py-4 text-lg font-bold rounded-xl text-slate-900 bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-300 hover:to-orange-300 transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-2xl shadow-orange-500/25"
                    >
                      <FiMap className="mr-2 h-5 w-5" />
                      Search Safe Accommodations
                      <FiArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      to="/register"
                      className="group inline-flex items-center px-8 py-4 text-lg font-semibold rounded-xl text-white border-2 border-white/30 hover:bg-white/10 active:scale-95 backdrop-blur-sm transition-all duration-200"
                    >
                      Report a Safety Issue
                      <FiAlertTriangle className="ml-2 h-5 w-5" />
                    </Link>
                  </>
                )}
              </div>
            </ScrollReveal>

            {/* Trust Indicators */}
            <StaggerReveal stagger={150} className="flex flex-wrap justify-center items-center gap-8 text-white/60 text-sm">
              <div className="flex items-center">
                <FiCheckCircle className="h-5 w-5 text-green-400 mr-2" />
                <span>100% Verified Reports</span>
              </div>
              <div className="flex items-center">
                <FiShield className="h-5 w-5 text-blue-400 mr-2" />
                <span>Anonymous & Secure</span>
              </div>
              <div className="flex items-center">
                <FiMapPin className="h-5 w-5 text-red-400 mr-2" />
                <span>50+ Cities Covered</span>
              </div>
            </StaggerReveal>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </ParallaxContainer>

      {/* ================= PROBLEM SECTION ================= */}
      <div className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <FadeIn delay={0}>
              <span className="inline-block px-4 py-1 rounded-full bg-red-100 text-red-700 text-sm font-semibold mb-4">
                THE PROBLEM
              </span>
            </FadeIn>
            <ScrollReveal delay={100}>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Students Are <span className="text-red-600">Gambling</span> With Their Safety
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Every year, thousands of students face these issues — and most discover them AFTER signing the lease.
              </p>
            </ScrollReveal>
          </div>

          <StaggerReveal stagger={100} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "🎭", title: "Fake Reviews", desc: "Manipulated by brokers and paid reviewers" },
              { icon: "🦠", title: "Food Poisoning", desc: "Poor kitchen hygiene discovered too late" },
              { icon: "💧", title: "Water Issues", desc: "Contaminated or irregular water supply" },
              { icon: "🔓", title: "Security Gaps", desc: "Broken locks, no CCTV, unsafe premises" }
            ].map((problem, i) => (
              <div key={i} className="bg-red-50 border border-red-100 rounded-2xl p-6 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ease-out">
                <div className="text-4xl mb-4">{problem.icon}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{problem.title}</h3>
                <p className="text-gray-600 text-sm">{problem.desc}</p>
              </div>
            ))}
          </StaggerReveal>
        </div>
      </div>

      {/* ================= STATS SECTION ================= */}
      <div className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StaggerReveal stagger={150} className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { value: 10000, suffix: "+", label: "Students Protected", icon: <FiUsers className="h-8 w-8" /> },
              { value: 500, suffix: "+", label: "Verified PGs & Hostels", icon: <FiHome className="h-8 w-8" /> },
              { value: 2500, suffix: "+", label: "Safety Reports Filed", icon: <FiFileText className="h-8 w-8" /> },
              { value: 95, suffix: "%", label: "Issues Resolved", icon: <FiCheckCircle className="h-8 w-8" /> }
            ].map((stat, i) => (
              <div key={i} className="text-white">
                <div className="flex justify-center mb-3 opacity-80">{stat.icon}</div>
                <div className="text-4xl lg:text-5xl font-bold mb-2">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-blue-200 font-medium">{stat.label}</div>
              </div>
            ))}
          </StaggerReveal>
        </div>
      </div>

      {/* ================= HOW IT WORKS SECTION ================= */}
      <div className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <FadeIn delay={0}>
              <span className="inline-block px-4 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold mb-4">
                HOW IT WORKS
              </span>
            </FadeIn>
            <ScrollReveal delay={100}>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Find Safe Accommodation in <span className="text-blue-600">4 Simple Steps</span>
              </h2>
            </ScrollReveal>
          </div>

          <StaggerReveal stagger={120} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, i) => (
              <div key={i} className="relative">
                {/* Connector Line */}
                {i < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-blue-300 to-transparent z-0"></div>
                )}
                
                <div className="relative bg-white rounded-2xl p-6 shadow-lg hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ease-out border border-gray-100 z-10">
                  {/* Step Number */}
                  <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-lg">
                    {step.step}
                  </div>
                  
                  <div className="flex justify-center text-blue-600 mb-4 mt-2">
                    {step.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2 text-center">{step.title}</h3>
                  <p className="text-gray-600 text-sm text-center">{step.description}</p>
                </div>
              </div>
            ))}
          </StaggerReveal>

          {/* CTA */}
          <ScrollReveal delay={0}>
            <div className="text-center mt-12">
              <Link
                to="/accommodations"
                className="inline-flex items-center px-8 py-4 text-lg font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-xl"
              >
                <FiSearch className="mr-2 h-5 w-5" />
                Start Searching Now
                <FiArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* ================= FEATURES SECTION ================= */}
      <div className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <FadeIn delay={0}>
              <span className="inline-block px-4 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold mb-4">
                POWERFUL FEATURES
              </span>
            </FadeIn>
            <ScrollReveal delay={100}>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Everything You Need for <span className="text-green-600">Safe Decisions</span>
              </h2>
            </ScrollReveal>
          </div>

          <StaggerReveal stagger={120} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, i) => (
              <div 
                key={i} 
                className="group relative bg-white rounded-2xl p-8 border border-gray-200 hover:border-transparent hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ease-out overflow-hidden"
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                
                <div className="relative z-10">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 text-xl mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </StaggerReveal>
        </div>
      </div>

      {/* ================= TRUST SCORE EXPLAINER ================= */}
      <div className="py-16 lg:py-24 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <FadeIn delay={0}>
                <span className="inline-block px-4 py-1 rounded-full bg-white/10 text-white/90 text-sm font-semibold mb-4">
                  TRUST SCORE SYSTEM
                </span>
              </FadeIn>
              <ScrollReveal delay={100} direction="right">
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                  Every Accommodation Gets a
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
                    Dynamic Safety Score
                  </span>
                </h2>
                <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                  Our algorithm calculates a 0-100 trust score based on verified reports, 
                  issue severity, resolution speed, and student feedback. No manipulation. 
                  Pure data.
                </p>
              </ScrollReveal>
              
              {/* Score Legend */}
              <StaggerReveal stagger={100} className="space-y-4">
                {[
                  { range: "80-100", label: "Safe", color: "bg-green-500", desc: "Minimal issues, quick resolutions" },
                  { range: "50-79", label: "Caution", color: "bg-yellow-500", desc: "Some concerns, check reports" },
                  { range: "0-49", label: "Unsafe", color: "bg-red-500", desc: "Multiple unresolved issues" }
                ].map((score, i) => (
                  <div key={i} className="flex items-center gap-4 bg-white/5 rounded-xl p-4">
                    <div className={`w-4 h-4 rounded-full ${score.color}`}></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{score.range}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-300 font-medium">{score.label}</span>
                      </div>
                      <p className="text-gray-400 text-sm">{score.desc}</p>
                    </div>
                  </div>
                ))}
              </StaggerReveal>
            </div>

            {/* Visual Score Display */}
            <ScrollReveal delay={200} direction="left">
              <div className="flex justify-center">
                <div className="relative">
                  {/* Outer Glow */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 to-blue-500 blur-2xl opacity-30"></div>
                  
                  {/* Score Circle */}
                  <div className="relative w-64 h-64 rounded-full bg-gradient-to-br from-slate-800 to-slate-700 border-4 border-green-500/50 flex items-center justify-center shadow-2xl">
                    <div className="text-center">
                      <div className="text-6xl font-bold text-white mb-2">87</div>
                      <div className="text-green-400 font-semibold text-lg">SAFE</div>
                      <div className="text-gray-400 text-sm mt-1">Sample Score</div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>

      {/* ================= STAKEHOLDER BENEFITS ================= */}
      <div className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <FadeIn delay={0}>
              <span className="inline-block px-4 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold mb-4">
                FOR EVERYONE
              </span>
            </FadeIn>
            <ScrollReveal delay={100}>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Built for <span className="text-purple-600">Students, Parents & Owners</span>
              </h2>
            </ScrollReveal>
          </div>

          <StaggerReveal stagger={150} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {stakeholderBenefits.map((stakeholder, i) => (
              <div 
                key={i} 
                className={`bg-white rounded-2xl p-8 shadow-lg border-t-4 ${
                  stakeholder.color === 'blue' ? 'border-blue-500' :
                  stakeholder.color === 'green' ? 'border-green-500' : 'border-purple-500'
                } hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ease-out`}
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 ${
                  stakeholder.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                  stakeholder.color === 'green' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'
                }`}>
                  {stakeholder.icon}
                </div>
                
                <h3 className="font-bold text-gray-900 text-xl mb-4">{stakeholder.title}</h3>
                
                <ul className="space-y-3 mb-6">
                  {stakeholder.benefits.map((benefit, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <FiCheckCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                        stakeholder.color === 'blue' ? 'text-blue-500' :
                        stakeholder.color === 'green' ? 'text-green-500' : 'text-purple-500'
                      }`} />
                      <span className="text-gray-600 text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
                
                <Link
                  to={stakeholder.link}
                  className={`inline-flex items-center justify-center w-full px-6 py-3 rounded-xl font-semibold transition-all ${
                    stakeholder.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                    stakeholder.color === 'green' ? 'bg-green-600 hover:bg-green-700 text-white' : 
                    'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {stakeholder.cta}
                  <FiArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            ))}
          </StaggerReveal>
        </div>
      </div>

      {/* ================= TESTIMONIALS ================= */}
      <div className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <FadeIn delay={0}>
              <span className="inline-block px-4 py-1 rounded-full bg-yellow-100 text-yellow-700 text-sm font-semibold mb-4">
                TESTIMONIALS
              </span>
            </FadeIn>
            <ScrollReveal delay={100}>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Real Stories from <span className="text-yellow-600">Real Users</span>
              </h2>
            </ScrollReveal>
          </div>

          <StaggerReveal stagger={150} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <ScaleIn key={i} delay={i * 150} scale={0.9}>
                <div className="bg-gray-50 rounded-2xl p-6 relative h-full">
                  {/* Quote Mark */}
                  <div className="absolute -top-4 left-6 text-6xl text-blue-200 font-serif">"</div>
                  
                  <div className="relative z-10">
                    {/* Stars */}
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, j) => (
                        <FiStar key={j} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    
                    <p className="text-gray-700 mb-6 leading-relaxed italic">
                      "{testimonial.quote}"
                    </p>
                    
                    <div>
                      <div className="font-bold text-gray-900">{testimonial.author}</div>
                      <div className="text-gray-500 text-sm">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              </ScaleIn>
            ))}
          </StaggerReveal>
        </div>
      </div>

      {/* ================= FINAL CTA SECTION ================= */}
      <div className="py-16 lg:py-24 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal delay={0}>
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
              Don't Let Your Next Home
              <span className="block text-yellow-300">Become a Nightmare</span>
            </h2>
          </ScrollReveal>
          
          <ScrollReveal delay={100}>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Join 10,000+ students who made informed decisions. Your safety is too important to leave to chance.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/accommodations"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-xl text-indigo-700 bg-white hover:bg-gray-100 transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-xl"
              >
                <FiSearch className="mr-2 h-5 w-5" />
                Search Safe Accommodations
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-xl text-white border-2 border-white/50 hover:bg-white/10 active:scale-95 transition-all duration-200"
              >
                <FiAlertTriangle className="mr-2 h-5 w-5" />
                Report a Safety Issue
              </Link>
            </div>
          </ScrollReveal>

          <FadeIn delay={300}>
            <p className="text-blue-200 mt-8 text-sm">
              100% Free • No Hidden Charges • Verified Reports Only
            </p>
          </FadeIn>
        </div>
      </div>

      {/* ================= FOOTER ================= */}
      <footer className="bg-slate-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal delay={0}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <FiShield className="h-8 w-8 text-blue-500" />
                  <span className="text-xl font-bold text-white">Student Safety Platform</span>
                </div>
                <p className="text-gray-400 mb-4 max-w-md">
                  Empowering students to make safe accommodation choices through verified reports and transparent ratings.
                </p>
                <p className="text-sm text-gray-500">
                  Made with ❤️ for student safety and welfare
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-4">Quick Links</h4>
                <ul className="space-y-2">
                  <li><Link to="/accommodations" className="hover:text-white transition-colors">Search Accommodations</Link></li>
                  <li><Link to="/register" className="hover:text-white transition-colors">Report an Issue</Link></li>
                  <li><Link to="/login" className="hover:text-white transition-colors">Student Login</Link></li>
                  <li><Link to="/owner/login" className="hover:text-white transition-colors">Owner Login</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-4">Contact</h4>
                <ul className="space-y-2">
                  <li>support@studentsafety.in</li>
                  <li>+91 8309589175</li>
                  <li>Hyderabad, India</li>
                </ul>
              </div>
            </div>
          </ScrollReveal>
          
          <FadeIn delay={200}>
            <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
              <p>© 2024 Student Accommodation Safety Platform. All rights reserved.</p>
            </div>
          </FadeIn>
        </div>
      </footer>
    </div>
  );
};```

---

## Login.tsx (211 lines)

```tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiMail, FiLock, FiShield, FiArrowRight, FiCheckCircle } from 'react-icons/fi';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedInUser = await login(email, password);

      if (!loggedInUser) {
        setError('Login failed');
        return;
      }

      if (loggedInUser.role === 'owner'){
        setError('This login is for students only. Please use the Owner Portal.');
        return;
      }

      if (loggedInUser.role === 'admin'){
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (err.message?.includes('verify') || err.message?.includes('not verified')) {
        navigate('/verify-email', { state: { email: email } });
        return;
      }
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-4xl w-full flex bg-white rounded-3xl shadow-2xl overflow-hidden relative z-10">
        {/* Left Side: Illustration/Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-blue-600 p-12 text-white flex-col justify-between relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 opacity-90"></div>
          <div className="relative z-10">
            <Link to="/" className="flex items-center space-x-2 text-2xl font-bold mb-12">
              <FiShield className="h-8 w-8 text-yellow-400" />
              <span>SafetyFirst</span>
            </Link>
            
            <h2 className="text-4xl font-extrabold mb-6 leading-tight">
              Join the community of <span className="text-yellow-400">10,000+</span> students making safer choices.
            </h2>
            
            <div className="space-y-4">
              {[
                "Verified safety reports with evidence",
                "Real trust scores for every PG/Hostel",
                "Direct accountability from owners"
              ].map((item, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <FiCheckCircle className="text-green-400 flex-shrink-0" />
                  <span className="text-blue-50/90 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative z-10">
            <p className="text-blue-100 text-sm">
              "Found water quality issues in 3 PGs near my college BEFORE signing any lease. This platform saved me from a nightmare."
            </p>
            <p className="mt-2 font-bold text-yellow-400">— Priya S., Student</p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              Welcome Back, Safety Champion
            </h2>
            <p className="text-gray-500">
              Access your personalized safety dashboard
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center">
                <FiShield className="mr-2 h-4 w-4 rotate-180" />
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="email-address" className="block text-sm font-semibold text-gray-700 mb-1">
                  Your registered email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full pl-10 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 placeholder-gray-400"
                    placeholder="name@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-blue-600 hover:text-blue-700 text-xs font-bold"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="block w-full pl-10 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 placeholder-gray-400"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full flex justify-center items-center py-4 px-6 border border-transparent text-lg font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <>
                  Access Dashboard
                  <FiArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center space-y-4">
            <p className="text-gray-600 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 font-bold hover:underline">
                Join 10,000+ students
              </Link>
            </p>
            
            <div className="pt-6 border-t border-gray-100 flex flex-col items-center space-y-3">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold">
                <FiShield className="h-3 w-3 mr-1" />
                🔒 Your data is encrypted and secure
              </div>
              <Link to="/owner/login" className="text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors">
                Are you a property owner? <span className="text-blue-600">Login here</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## MyReports.tsx (527 lines)

```tsx
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
      setCurrentUserId(payload.user?.id || payload.id || payload.userId || '');
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
}```

---

## OwnerDashboard.tsx (691 lines)

```tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiHome, FiMessageSquare, FiTrendingUp, FiAlertCircle, FiCheckCircle, 
  FiArrowRight, FiPlus, FiClock, FiStar, FiShield, FiX, FiUpload,
  FiImage, FiSend, FiCheck
} from 'react-icons/fi';
import { 
  ScrollReveal, 
  StaggerReveal, 
  FadeIn,
  ScaleIn 
} from '../components/ParallaxEffect';

interface Property {
  _id: string;
  name: string;
  address: string;
  city: string;
  safetyScore: number;
  totalReports: number;
  trustScore?: number;
}

interface Feedback {
  _id: string;
  category: string;
  description: string;
  status: string;
  createdAt: string;
  images?: string[];
  accommodationId: {
    _id: string;
    name: string;
  };
}

export default function OwnerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Response Modal State
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responseImages, setResponseImages] = useState<File[]>([]);
  const [responseImagePreviews, setResponseImagePreviews] = useState<string[]>([]);
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [responseSuccess, setResponseSuccess] = useState(false);
  
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/owner/login');
      return;
    }
    
    if (user.role !== 'owner') {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
      return;
    }
    
    fetchDashboardData();
  }, [user, authLoading, navigate]);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/owner/login');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const [propsRes, feedbackRes] = await Promise.all([
        fetch(`${API}/api/owner/accommodations`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        }),
        fetch(`${API}/api/owner/reports`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        })
      ]);
      
      const propsData = await propsRes.json();
      const feedbackData = await feedbackRes.json();
      
      if (propsData.success) {
        setProperties(propsData.data || []);
      }
      if (feedbackData.success) {
        setFeedbacks(feedbackData.data || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const openResponseModal = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setResponseText('');
    setResponseImages([]);
    setResponseImagePreviews([]);
    setResponseSuccess(false);
    setShowResponseModal(true);
  };

  const closeResponseModal = () => {
    setShowResponseModal(false);
    setSelectedFeedback(null);
    setResponseText('');
    setResponseImages([]);
    setResponseImagePreviews([]);
    setResponseSuccess(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + responseImages.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    setResponseImages(prev => [...prev, ...validFiles]);

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setResponseImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setResponseImages(prev => prev.filter((_, i) => i !== index));
    setResponseImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const submitResponse = async () => {
    if (!selectedFeedback || !responseText.trim()) {
      alert('Please enter a response');
      return;
    }

    setSubmittingResponse(true);

    try {
      const token = localStorage.getItem('token');
      let imageUrls: string[] = [];

      if (responseImages.length > 0) {
        const formData = new FormData();
        responseImages.forEach(file => {
          formData.append('images', file);
        });

        const uploadRes = await fetch(`${API}/api/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.urls) {
          imageUrls = uploadData.urls;
        }
      }

      const response = await fetch(`${API}/api/owner/reports/${selectedFeedback._id}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          resolutionDescription: responseText.trim(),
          resolutionImages: imageUrls,
          actionTaken: responseText.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResponseSuccess(true);
        setTimeout(() => {
          closeResponseModal();
          fetchDashboardData();
        }, 2000);
      } else {
        alert(data.message || 'Failed to submit response');
      }
    } catch (err) {
      console.error('Submit response error:', err);
      alert('Error submitting response. Please try again.');
    } finally {
      setSubmittingResponse(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'owner') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your properties...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <ScaleIn scale={0.9}>
          <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiAlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{error}</h2>
            <p className="text-gray-600 mb-6">Please check your connection and try again.</p>
            <button 
              onClick={fetchDashboardData}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </ScaleIn>
      </div>
    );
  }

  const pendingReports = feedbacks.filter(f => f.status === 'pending' || f.status === 'approved' || f.status === 'disputed').length;
  const avgScore = properties.length > 0 
    ? Math.round(properties.reduce((acc, p) => acc + (p.trustScore || p.safetyScore || 0), 0) / properties.length)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-slate-900 text-white pt-10 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <ScrollReveal delay={0} distance={30}>
              <div>
                <h1 className="text-3xl font-black tracking-tight mb-2">Property Management Dashboard</h1>
                <p className="text-emerald-400 font-bold flex items-center gap-2">
                  <FiShield /> Welcome back, {user.name?.split(' ')[0] || 'Owner'}!
                </p>
              </div>
            </ScrollReveal>
            
            <FadeIn delay={100}>
              <Link 
                to="/owner/add-property" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2"
              >
                <FiPlus /> Add New Property
              </Link>
            </FadeIn>
          </div>

          {/* Top Stats */}
          <StaggerReveal stagger={100} className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400">
                  <FiHome className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Inventory</span>
              </div>
              <p className="text-3xl font-black text-white">{properties.length}</p>
              <p className="text-sm text-slate-400 font-bold mt-1">Total Properties Registered</p>
            </div>
            
            <div className={`backdrop-blur-md border p-6 rounded-3xl transition-all ${pendingReports > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-white/10'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${pendingReports > 0 ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  <FiAlertCircle className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Attention</span>
              </div>
              <p className="text-3xl font-black text-white">{pendingReports}</p>
              <p className={`text-sm font-bold mt-1 ${pendingReports > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                {pendingReports > 0 ? `🔔 ${pendingReports} reports need your attention` : 'All reports resolved'}
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-yellow-500/20 rounded-2xl text-yellow-400">
                  <FiStar className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Performance</span>
              </div>
              <p className="text-3xl font-black text-white">{avgScore || 'N/A'}</p>
              <p className="text-sm text-slate-400 font-bold mt-1">Your overall trust score</p>
            </div>
          </StaggerReveal>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content: Properties */}
          <div className="lg:col-span-2 space-y-8">
            <ScrollReveal delay={0} distance={20}>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-900">Your Properties</h2>
                <Link to="/owner/add-property" className="text-sm font-bold text-emerald-600 hover:text-emerald-700">
                  + Add New
                </Link>
              </div>
            </ScrollReveal>

            {properties.length > 0 ? (
              <StaggerReveal stagger={100} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {properties.map(property => (
                  <div key={property._id} className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 group hover:scale-[1.02] transition-all duration-300">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
                        <FiHome />
                      </div>
                      <div className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                        (property.trustScore || property.safetyScore || 0) >= 80 ? 'bg-green-50 text-green-600' :
                        (property.trustScore || property.safetyScore || 0) >= 50 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'
                      }`}>
                        Score: {property.trustScore || property.safetyScore || 0}
                      </div>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-1">{property.name}</h3>
                    <p className="text-sm text-slate-400 font-bold mb-6 flex items-center gap-1">
                      <FiClock className="inline" /> {property.city}
                    </p>
                    
                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{property.totalReports || 0} Reports</span>
                      <Link to={`/accommodations/${property._id}`} className="p-2 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        <FiArrowRight />
                      </Link>
                    </div>
                  </div>
                ))}
              </StaggerReveal>
            ) : (
              <ScaleIn delay={0} scale={0.95}>
                <div className="col-span-2 bg-white p-12 rounded-3xl border-2 border-dashed border-slate-200 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiPlus className="text-slate-300 text-3xl" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">No properties yet</h3>
                  <p className="text-slate-500 font-bold mb-8">Register your first property to start building trust with students.</p>
                  <Link to="/owner/add-property" className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all">
                    Register Property <FiArrowRight />
                  </Link>
                </div>
              </ScaleIn>
            )}

            {/* Tip section */}
            <ScrollReveal delay={100} distance={30}>
              <div className="bg-emerald-900 text-white p-8 rounded-3xl relative overflow-hidden">
                <div className="relative z-10 max-w-md">
                  <h3 className="text-xl font-black mb-2">Improve Your Trust Rating</h3>
                  <p className="text-emerald-100 font-medium mb-6">Quick tip: Responding to student feedback within 48 hours increases your trust score by up to 15%.</p>
                  <button className="bg-white text-emerald-900 px-6 py-2 rounded-xl font-bold text-sm">Learn More</button>
                </div>
                <FiTrendingUp className="absolute -bottom-4 -right-4 w-48 h-48 text-emerald-800/50 -rotate-12" />
              </div>
            </ScrollReveal>
          </div>

          {/* Sidebar: Student Feedback */}
          <div className="space-y-8">
            <ScrollReveal delay={0} distance={20}>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-900">Student Feedback</h2>
                <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
                  {feedbacks.filter(f => f.status !== 'resolved' && f.status !== 'verified').length} Pending
                </span>
              </div>
            </ScrollReveal>

            {feedbacks.length > 0 ? (
              <StaggerReveal stagger={80} className="space-y-4">
                {feedbacks.slice(0, 5).map(feedback => (
                  <div key={feedback._id} className="bg-white p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                        {feedback.category}
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                        feedback.status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                        feedback.status === 'approved' ? 'bg-blue-50 text-blue-600' :
                        feedback.status === 'resolved' ? 'bg-green-50 text-green-600' :
                        feedback.status === 'verified' ? 'bg-emerald-50 text-emerald-600' :
                        feedback.status === 'disputed' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'
                      }`}>
                        {feedback.status}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 mb-2 line-clamp-2">{feedback.description}</p>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">
                      {feedback.accommodationId?.name || 'Unknown'} • {new Date(feedback.createdAt).toLocaleDateString()}
                    </p>
                    
                    {(feedback.status === 'pending' || feedback.status === 'approved' || feedback.status === 'disputed') && (
                      <button 
                        onClick={() => openResponseModal(feedback)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
                      >
                        <FiMessageSquare /> Respond Now
                      </button>
                    )}
                    
                    {feedback.status === 'resolved' && (
                      <div className="w-full py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs text-center">
                        ⏳ Awaiting Student Verification
                      </div>
                    )}
                    
                    {feedback.status === 'verified' && (
                      <div className="w-full py-2 bg-green-50 text-green-600 rounded-xl font-bold text-xs text-center flex items-center justify-center gap-2">
                        <FiCheckCircle /> Issue Resolved
                      </div>
                    )}
                  </div>
                ))}
              </StaggerReveal>
            ) : (
              <ScaleIn delay={0} scale={0.95}>
                <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center">
                  <FiCheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4 opacity-20" />
                  <p className="text-slate-500 font-bold">No recent feedback</p>
                  <p className="text-slate-400 text-sm mt-1">Your properties have no reports yet</p>
                </div>
              </ScaleIn>
            )}

            <ScrollReveal delay={100} distance={30}>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
                <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                  <FiTrendingUp className="text-emerald-600" /> Platform Insights
                </h3>
                <StaggerReveal stagger={60} className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-bold">Total Properties</span>
                    <span className="text-slate-900 font-black">{properties.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-bold">Total Reports</span>
                    <span className="text-slate-900 font-black">{feedbacks.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-bold">Pending Response</span>
                    <span className={`font-black ${pendingReports > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {pendingReports}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-bold">Avg Trust Score</span>
                    <span className={`font-black ${
                      avgScore >= 80 ? 'text-green-600' : 
                      avgScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {avgScore || 'N/A'}
                    </span>
                  </div>
                </StaggerReveal>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>

      {/* Response Modal */}
      {showResponseModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <ScaleIn delay={0} scale={0.95}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Respond to Report</h3>
                  <p className="text-sm text-slate-500">Explain the action you've taken to resolve this issue</p>
                </div>
                <button 
                  onClick={closeResponseModal}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <FiX className="h-6 w-6 text-slate-400" />
                </button>
              </div>

              {responseSuccess ? (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiCheck className="h-10 w-10 text-emerald-600" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 mb-2">Response Submitted!</h4>
                  <p className="text-slate-500">The student will be notified to verify the resolution.</p>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl ${
                        selectedFeedback.status === 'disputed' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                      }`}>
                        <FiAlertCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                            {selectedFeedback.category}
                          </span>
                          <span className={`text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                            selectedFeedback.status === 'disputed' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'
                          }`}>
                            {selectedFeedback.status}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-700">{selectedFeedback.description}</p>
                        <p className="text-xs text-slate-400 mt-2">
                          {selectedFeedback.accommodationId?.name} • Reported on {new Date(selectedFeedback.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    {selectedFeedback.images && selectedFeedback.images.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-bold text-slate-500 mb-2">Reported Evidence:</p>
                        <div className="flex gap-2 flex-wrap">
                          {selectedFeedback.images.map((img, i) => (
                            <img 
                              key={i} 
                              src={img} 
                              alt="Report evidence" 
                              className="w-20 h-20 object-cover rounded-xl border border-slate-200"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                      Your Response / Action Taken <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-semibold resize-none"
                      placeholder="Describe what action you've taken to resolve this issue. Be specific - this will be shown to the student and helps build trust."
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                      Proof Images (Optional - Recommended)
                    </label>
                    <p className="text-xs text-slate-500 mb-3">
                      Upload photos showing the resolved issue. This increases credibility and speeds up verification.
                    </p>
                    
                    {responseImagePreviews.length > 0 && (
                      <div className="flex gap-3 flex-wrap mb-4">
                        {responseImagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={preview} 
                              alt={`Proof ${index + 1}`} 
                              className="w-24 h-24 object-cover rounded-xl border-2 border-slate-200"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <FiX className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {responseImages.length < 5 && (
                      <label className="flex items-center justify-center gap-2 px-6 py-4 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all">
                        <FiUpload className="text-slate-400" />
                        <span className="font-semibold text-slate-500">Click to upload images</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                    )}
                    <p className="text-xs text-slate-400 mt-2">Max 5 images, each up to 5MB</p>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={submitResponse}
                      disabled={submittingResponse || !responseText.trim()}
                      className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submittingResponse ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <FiSend /> Submit Response
                        </>
                      )}
                    </button>
                    <button
                      onClick={closeResponseModal}
                      className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </ScaleIn>
        </div>
      )}
    </div>
  );
}```

---

## OwnerLogin.tsx (243 lines)

```tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiMail, FiLock, FiArrowRight, FiShield, FiHome, 
  FiAlertCircle, FiEye, FiEyeOff, FiCheckCircle
} from 'react-icons/fi';

export default function OwnerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }
    
    setLoading(true);

    try {
      const user = await login(email.trim().toLowerCase(), password);
      
      console.log('Login successful:', user);

      if (user.role !== 'owner') {
        setError('This account is not registered as a property owner. Please use student login or register as an owner.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setLoading(false);
        return;
      }

      // Use full page redirect for reliable state sync
      window.location.href = '/owner/dashboard';
      
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 flex">
      
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-500 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-2xl shadow-lg shadow-emerald-900/30 group-hover:scale-105 transition-transform">
              <FiHome className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white uppercase">
              Safe<span className="text-emerald-400">Stay</span>
            </span>
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-5xl font-black text-white leading-tight">
              Property Owner<br />
              <span className="text-emerald-400">Portal</span>
            </h1>
            <p className="mt-6 text-xl text-emerald-100/80 max-w-md leading-relaxed">
              Manage your properties, respond to student feedback, and build trust through transparency.
            </p>
          </div>

          <div className="space-y-4">
            {[
              'Respond to safety reports with proof',
              'Track your property trust scores',
              'Attract safety-conscious tenants',
              'Stand out from competitors'
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-emerald-100/70">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <FiCheckCircle className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full">
            <FiShield className="text-emerald-400" />
            <span className="text-sm font-semibold text-white">Trusted by 500+ Property Owners</span>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-2xl shadow-lg">
                <FiHome className="h-8 w-8 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-white uppercase">
                Safe<span className="text-emerald-400">Stay</span>
              </span>
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-4">
                <FiHome className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900">Welcome Back, Owner</h2>
              <p className="text-gray-500 mt-2">Manage your properties and build trust</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                <FiAlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-medium text-gray-700"
                    placeholder="owner@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                  Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-medium text-gray-700"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link 
                  to="/forgot-password" 
                  className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    Access Dashboard <FiArrowRight />
                  </>
                )}
              </button>
            </form>

            <div className="my-8 flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">New here?</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            <Link
              to="/owner/register"
              className="w-full py-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-gray-200"
            >
              Register Your Property <FiArrowRight />
            </Link>

            <p className="text-center text-sm text-gray-500 mt-6">
              Are you a student?{' '}
              <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                Login here
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 text-emerald-200/60 text-sm">
              <FiLock className="h-4 w-4" />
              <span>Your data is encrypted and secure</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}```

---

## OwnerRegister.tsx (757 lines)

```tsx
import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  FiUser,
  FiMail,
  FiLock,
  FiArrowRight,
  FiShield,
  FiHome,
  FiCheck,
  FiAlertCircle,
  FiUpload,
  FiFile,
  FiX,
  FiInfo,
} from 'react-icons/fi';

// ─── Types ───────────────────────────────────────────────────────
interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  propertyName: string;
  propertyCount: string;
}

interface DocumentFile {
  file: File;
  preview: string;
}

interface Documents {
  governmentId: DocumentFile | null;
  propertyProof: DocumentFile | null;
  businessRegistration: DocumentFile | null;
}

// ─── Constants ───────────────────────────────────────────────────
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = 'JPG, PNG, WebP, PDF';

// ─── Helper ──────────────────────────────────────────────────────
function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS}`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File too large. Maximum size: 5MB (yours: ${(file.size / 1024 / 1024).toFixed(1)}MB)`;
  }
  return null;
}

function createPreview(file: File): string {
  if (file.type === 'application/pdf') {
    return 'pdf';
  }
  return URL.createObjectURL(file);
}

// ─── Component ───────────────────────────────────────────────────
export default function OwnerRegister() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    propertyName: '',
    propertyCount: '1-2',
  });

  const [documents, setDocuments] = useState<Documents>({
    governmentId: null,
    propertyProof: null,
    businessRegistration: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Info, Step 2: Documents

  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // File input refs
  const govIdRef = useRef<HTMLInputElement>(null);
  const propProofRef = useRef<HTMLInputElement>(null);
  const bizRegRef = useRef<HTMLInputElement>(null);

  // ─── Handlers ────────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    docType: keyof Documents
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      // Reset the input so user can re-select
      e.target.value = '';
      return;
    }

    setError('');
    setDocuments((prev) => ({
      ...prev,
      [docType]: {
        file,
        preview: createPreview(file),
      },
    }));
  };

  const removeDocument = (docType: keyof Documents) => {
    // Revoke the object URL to prevent memory leaks
    const doc = documents[docType];
    if (doc && doc.preview !== 'pdf') {
      URL.revokeObjectURL(doc.preview);
    }

    setDocuments((prev) => ({
      ...prev,
      [docType]: null,
    }));

    // Reset the corresponding file input
    const refMap: Record<keyof Documents, React.RefObject<HTMLInputElement>> = {
      governmentId: govIdRef,
      propertyProof: propProofRef,
      businessRegistration: bizRegRef,
    };
    const ref = refMap[docType];
    if (ref.current) {
      ref.current.value = '';
    }
  };

  // ─── Step 1 Validation ──────────────────────────────────────
  const validateStep1 = (): boolean => {
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Please fill in all required fields');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (!formData.propertyName.trim()) {
      setError('Property name is required');
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    setError('');
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleBackStep = () => {
    setError('');
    setStep(1);
  };

  // ─── Submit ──────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate required documents
    if (!documents.governmentId) {
      setError('Government-issued ID is required');
      return;
    }
    if (!documents.propertyProof) {
      setError('Property proof document is required');
      return;
    }

    setLoading(true);

    try {
      // ✅ Use FormData for file uploads (multipart/form-data)
      const submitData = new FormData();
      submitData.append('name', formData.name.trim());
      submitData.append('email', formData.email.trim().toLowerCase());
      submitData.append('password', formData.password);
      submitData.append('propertyName', formData.propertyName.trim());
      submitData.append('propertyCount', formData.propertyCount);
      submitData.append('role', 'owner');

      // ✅ Append required documents
      submitData.append('governmentId', documents.governmentId.file);
      submitData.append('propertyProof', documents.propertyProof.file);

      // ✅ Append optional document
      if (documents.businessRegistration) {
        submitData.append(
          'businessRegistration',
          documents.businessRegistration.file
        );
      }

      const response = await fetch(`${API}/api/auth/register-owner`, {
        method: 'POST',
        // ⚠️ Do NOT set Content-Type — browser sets it
        // automatically with the correct boundary for FormData
        body: submitData,
      });

      const data = await response.json();
      console.log('Registration response:', data);

      if (response.ok && data.success) {
        // ✅ Store token and user
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // ✅ Update auth context
        refreshUser();

        // ✅ Redirect to dashboard — owner will see "Pending
        //    Verification" page since status is PENDING
        setTimeout(() => {
          navigate('/owner/dashboard');
        }, 100);
      } else {
        setError(
          data.message || 'Registration failed. Please try again.'
        );
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(
        'Connection error. Make sure the backend server is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ─── Document Upload Card ───────────────────────────────────
  const DocumentUploadCard = ({
    label,
    description,
    docType,
    required,
    inputRef,
  }: {
    label: string;
    description: string;
    docType: keyof Documents;
    required: boolean;
    inputRef: React.RefObject<HTMLInputElement>;
  }) => {
    const doc = documents[docType];

    return (
      <div
        className={`border-2 border-dashed rounded-xl p-4 transition-all ${
          doc
            ? 'border-emerald-300 bg-emerald-50'
            : 'border-slate-200 bg-slate-50 hover:border-emerald-300'
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="text-sm font-bold text-slate-700">
              {label}
              {required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {description}
            </p>
          </div>
          {doc && (
            <button
              type="button"
              onClick={() => removeDocument(docType)}
              className="p-1 hover:bg-red-100 rounded-lg transition-colors"
              title="Remove document"
            >
              <FiX className="h-4 w-4 text-red-500" />
            </button>
          )}
        </div>

        {doc ? (
          // ✅ Preview selected file
          <div className="flex items-center gap-3 mt-3">
            {doc.preview === 'pdf' ? (
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <FiFile className="h-6 w-6 text-red-500" />
              </div>
            ) : (
              <img
                src={doc.preview}
                alt={label}
                className="w-12 h-12 object-cover rounded-lg border"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700 truncate">
                {doc.file.name}
              </p>
              <p className="text-xs text-slate-400">
                {(doc.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <FiCheck className="h-5 w-5 text-emerald-500 flex-shrink-0" />
          </div>
        ) : (
          // ✅ Upload button
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full mt-2 py-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-emerald-400 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-600"
          >
            <FiUpload className="h-4 w-4" />
            Choose File
          </button>
        )}

        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          onChange={(e) => handleFileSelect(e, docType)}
          className="hidden"
        />
      </div>
    );
  };

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10">
        {/* ─── Left Side: Benefits Sidebar ──────────────────── */}
        <div className="md:w-5/12 bg-slate-900 p-8 lg:p-12 flex flex-col justify-between text-white border-r border-white/5">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 mb-12 group"
            >
              <div className="bg-emerald-500 p-2 rounded-xl">
                <FiShield className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-black tracking-tighter">
                SAFE<span className="text-emerald-500">STAY</span>
              </span>
            </Link>

            <h1 className="text-3xl lg:text-4xl font-extrabold mb-8 leading-tight">
              Start Building{' '}
              <span className="text-emerald-500">Tenant Trust.</span>
            </h1>

            <div className="space-y-8">
              {[
                {
                  title: 'Public Accountability',
                  desc: 'Respond to student concerns publicly and show your commitment.',
                },
                {
                  title: 'Boost Your Rating',
                  desc: "Resolve issues quickly to improve your property's safety score.",
                },
                {
                  title: 'Competitive Edge',
                  desc: 'Stand out from unverified competitors with a verified profile.',
                },
                {
                  title: 'Quality Tenants',
                  desc: 'Attract safety-conscious tenants who value transparency.',
                },
              ].map((benefit, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mt-1">
                    <FiCheck className="h-3 w-3 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                      {benefit.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
            <p className="text-sm font-medium text-emerald-400 italic">
              "Since joining SafeStay, my property's trust rating
              increased by 40%, and my vacancy rate dropped
              significantly."
            </p>
            <p className="text-xs font-bold text-slate-300 mt-3">
              — Sarah J., Property Manager
            </p>
          </div>
        </div>

        {/* ─── Right Side: Registration Form ────────────────── */}
        <div className="md:w-7/12 p-8 lg:p-12 bg-white flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            {/* Header */}
            <div className="mb-8 text-center md:text-left">
              <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
                Register Your Property
              </h2>
              <p className="text-slate-500 font-medium">
                Join the platform trusted by 10,000+ students
              </p>

              {/* Step Indicator */}
              <div className="flex items-center gap-3 mt-6">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    step === 1
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-[10px]">
                    {step > 1 ? (
                      <FiCheck className="h-3 w-3" />
                    ) : (
                      '1'
                    )}
                  </span>
                  Account Info
                </div>
                <div className="w-8 h-0.5 bg-slate-200" />
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    step === 2
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-[10px]">
                    2
                  </span>
                  Documents
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                <FiAlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-bold text-red-700">
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* ═══ STEP 1: Account Information ═══════════════ */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 ml-1">
                        Full Name
                      </label>
                      <div className="relative group">
                        <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                          name="name"
                          type="text"
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-semibold text-sm"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 ml-1">
                        Work Email
                      </label>
                      <div className="relative group">
                        <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                          name="email"
                          type="email"
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-semibold text-sm"
                          placeholder="john@company.com"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 ml-1">
                        Main Property Name
                      </label>
                      <div className="relative group">
                        <FiHome className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                          name="propertyName"
                          type="text"
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-semibold text-sm"
                          placeholder="Evergreen Apartments"
                          value={formData.propertyName}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 ml-1">
                        Properties Managed
                      </label>
                      <select
                        name="propertyCount"
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-semibold text-sm appearance-none cursor-pointer"
                        value={formData.propertyCount}
                        onChange={handleChange}
                      >
                        <option value="1-2">1-2 Properties</option>
                        <option value="3-5">3-5 Properties</option>
                        <option value="5-10">5-10 Properties</option>
                        <option value="10+">10+ Properties</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 ml-1">
                        Password
                      </label>
                      <div className="relative group">
                        <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                          name="password"
                          type="password"
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-semibold text-sm"
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 ml-1">
                        Confirm Password
                      </label>
                      <div className="relative group">
                        <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                          name="confirmPassword"
                          type="password"
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-semibold text-sm"
                          placeholder="••••••••"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Next Step Button */}
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-emerald-200 transition-all flex items-center justify-center gap-2 group"
                    >
                      Continue to Documents
                      <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              )}

              {/* ═══ STEP 2: Document Upload ═══════════════════ */}
              {step === 2 && (
                <div className="space-y-4">
                  {/* Info Banner */}
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                    <FiInfo className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-blue-700">
                        Verification Required
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Upload the following documents for admin
                        verification. Your account will be activated
                        after review. Accepted formats:{' '}
                        {ALLOWED_EXTENSIONS} (max 5MB each).
                      </p>
                    </div>
                  </div>

                  {/* Document Upload Cards */}
                  <DocumentUploadCard
                    label="Government-Issued ID"
                    description="Aadhaar Card, PAN Card, or Driving License"
                    docType="governmentId"
                    required={true}
                    inputRef={govIdRef}
                  />

                  <DocumentUploadCard
                    label="Property Ownership Proof"
                    description="Ownership deed, Lease agreement, or Rent agreement"
                    docType="propertyProof"
                    required={true}
                    inputRef={propProofRef}
                  />

                  <DocumentUploadCard
                    label="Business Registration (Optional)"
                    description="GST Certificate, Shop & Establishment Act, or Trade License"
                    docType="businessRegistration"
                    required={false}
                    inputRef={bizRegRef}
                  />

                  {/* Upload Progress Summary */}
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Documents Ready
                    </span>
                    <span className="text-sm font-black text-slate-700">
                      {
                        Object.values(documents).filter(Boolean)
                          .length
                      }{' '}
                      / 3
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={handleBackStep}
                      className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={
                        loading ||
                        !documents.governmentId ||
                        !documents.propertyProof
                      }
                      className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-emerald-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Uploading & Creating...
                        </>
                      ) : (
                        <>
                          Submit for Verification
                          <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>

            {/* Footer Links */}
            <div className="mt-8 text-center">
              <p className="text-slate-500 font-medium">
                Already have an account?{' '}
                <Link
                  to="/owner/login"
                  className="text-emerald-600 font-bold hover:underline"
                >
                  Sign in
                </Link>
              </p>
              <p className="mt-4 text-slate-500 text-sm">
                Are you a student?{' '}
                <Link
                  to="/register"
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Register here
                </Link>
              </p>
              <p className="mt-6 text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-widest">
                By registering, you agree to our Terms of Service and
                Privacy Policy regarding property ownership
                verification.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}```

---

## Profile.tsx (971 lines)

```tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { VerifiedBadge } from '../components/VerifiedBadge';  // ✅ ADDED
import { 
  FiUser, FiMail, FiCalendar, FiShield, FiStar, FiAward, 
  FiEdit2, FiLock, FiTrash2, FiArrowLeft, FiCheckCircle, FiInfo,
  FiBell, FiChevronRight, FiCheck, FiX, FiFileText, FiThumbsUp,
  FiAlertCircle, FiCamera, FiUpload, FiHome, FiTrendingUp, FiTool,
  FiBarChart2, FiMapPin, FiPlus, FiAlertTriangle
} from 'react-icons/fi';

interface ProfileData {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  totalReports: number;
  totalUpvotes: number;
  resolvedReports?: number;
  profilePhoto?: string;
  isCollegeVerified?: boolean;  // ✅ ADDED
  collegeName?: string;  // ✅ ADDED
  // Owner-specific fields
  totalProperties?: number;
  avgTrustScore?: number;
  totalReportsOnProperties?: number;
  resolutionRate?: number;
}

interface NotificationPreferences {
  securityAlerts: boolean;
  responseUpdates: boolean;
  platformNews: boolean;
}

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameLoading, setNameLoading] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    securityAlerts: true,
    responseUpdates: true,
    platformNews: false
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsMessage, setPrefsMessage] = useState('');

  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const isOwner = user?.role === 'owner';

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.notification-container')) {
        setShowNotifications(false);
      }
    };
    
    if (showNotifications) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showNotifications]);

  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`${API}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setProfile(data.data);
        setNewName(data.data.name);
        if (data.data.notificationPrefs) {
          setNotificationPrefs(data.data.notificationPrefs);
        }
      } else {
        setError(data.message || 'Failed to load profile');
      }
    } catch {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleNameUpdate = async () => {
    if (!newName.trim() || newName.trim() === profile?.name) {
      setEditingName(false);
      return;
    }
    const token = localStorage.getItem('token');
    setNameLoading(true);
    try {
      const response = await fetch(`${API}/api/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newName.trim() })
      });
      const data = await response.json();
      if (data.success) {
        setProfile(prev => prev ? { ...prev, name: data.data.name } : null);
        setEditingName(false);
      } else {
        alert(data.message || 'Failed to update name');
      }
    } catch {
      alert('Error updating name');
    } finally {
      setNameLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');
    if (newPassword !== confirmPassword) {
      setPasswordMessage('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage('Password must be at least 6 characters');
      return;
    }
    const token = localStorage.getItem('token');
    setPasswordLoading(true);
    try {
      const response = await fetch(`${API}/api/profile/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await response.json();
      if (data.success) {
        setPasswordMessage('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setShowPasswordForm(false);
          setPasswordMessage('');
        }, 2000);
      } else {
        setPasswordMessage(data.message || 'Failed to change password');
      }
    } catch {
      setPasswordMessage('Error changing password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleNotificationToggle = async (key: keyof NotificationPreferences) => {
    const newPrefs = {
      ...notificationPrefs,
      [key]: !notificationPrefs[key]
    };
    
    setNotificationPrefs(newPrefs);
    setSavingPrefs(true);
    setPrefsMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/profile/notifications`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationPrefs: newPrefs })
      });
      
      const data = await response.json();
      if (data.success) {
        setPrefsMessage('Saved!');
        setTimeout(() => setPrefsMessage(''), 2000);
      }
    } catch {
      setPrefsMessage('Saved locally');
      setTimeout(() => setPrefsMessage(''), 2000);
    } finally {
      setSavingPrefs(false);
    }
  };

  const handlePhotoEditClick = () => {
    setShowPhotoModal(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoPreview || !fileInputRef.current?.files?.[0]) {
      alert('Please select an image first');
      return;
    }

    setUploadingPhoto(true);
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', fileInputRef.current.files[0]);

      const response = await fetch(`${API}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.success && data.urls && data.urls.length > 0) {
        const updateResponse = await fetch(`${API}/api/profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ profilePhoto: data.urls[0] })
        });

        const updateData = await updateResponse.json();
        if (updateData.success) {
          setProfile(prev => prev ? { ...prev, profilePhoto: data.urls[0] } : null);
          setShowPhotoModal(false);
          setPhotoPreview(null);
          alert('Profile photo updated successfully!');
        }
      } else {
        alert('Failed to upload image. Please try again.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Error uploading image. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!confirm('Are you sure you want to remove your profile photo?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ profilePhoto: null })
      });

      const data = await response.json();
      if (data.success) {
        setProfile(prev => prev ? { ...prev, profilePhoto: undefined } : null);
        setShowPhotoModal(false);
        alert('Profile photo removed');
      }
    } catch {
      alert('Error removing photo');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 font-medium">Loading your profile...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
        <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiInfo className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{error}</h2>
        <p className="text-gray-600 mb-6">We couldn't load your profile. Please try again.</p>
        <button 
          onClick={fetchProfile}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header - DYNAMIC GRADIENT BASED ON ROLE */}
      <div className={`pt-16 pb-32 ${isOwner ? 'bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900' : 'bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Navigation */}
          <div className="flex items-center justify-between mb-10">
            <Link 
              to={isOwner ? "/owner/dashboard" : "/dashboard"} 
              className={`inline-flex items-center ${isOwner ? 'text-emerald-300 hover:text-white' : 'text-blue-300 hover:text-white'} font-bold transition-all gap-2`}
            >
              <FiArrowLeft /> Back to Dashboard
            </Link>
            
            {/* Notification Bell */}
            <div className="relative notification-container">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNotifications(!showNotifications);
                }}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors relative"
              >
                <FiBell className="h-6 w-6 text-white" />
                <span className={`absolute top-2 right-2 w-3 h-3 ${isOwner ? 'bg-emerald-500' : 'bg-red-500'} rounded-full border-2 ${isOwner ? 'border-emerald-900' : 'border-slate-900'} animate-pulse`}></span>
              </button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                  <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Notifications</h3>
                    <span className={`text-xs ${isOwner ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'} px-2 py-1 rounded-full font-semibold`}>
                      {isOwner ? '2 New' : '3 New'}
                    </span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {isOwner ? (
                      <>
                        <div className="p-4 hover:bg-gray-50 border-b border-gray-50 cursor-pointer transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <FiAlertTriangle className="text-yellow-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">New Report Filed</p>
                              <p className="text-xs text-gray-500 mt-0.5">Water quality issue at Sunshine PG</p>
                              <p className="text-xs text-gray-400 mt-1">1 hour ago</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <FiCheckCircle className="text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">Resolution Verified</p>
                              <p className="text-xs text-gray-500 mt-0.5">Student confirmed your fix was effective</p>
                              <p className="text-xs text-gray-400 mt-1">3 hours ago</p>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-4 hover:bg-gray-50 border-b border-gray-50 cursor-pointer transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <FiCheckCircle className="text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">Report Approved</p>
                              <p className="text-xs text-gray-500 mt-0.5">Your water quality report was verified</p>
                              <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 hover:bg-gray-50 border-b border-gray-50 cursor-pointer transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <FiThumbsUp className="text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">New Confirmation</p>
                              <p className="text-xs text-gray-500 mt-0.5">Someone confirmed your safety report</p>
                              <p className="text-xs text-gray-400 mt-1">5 hours ago</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <FiAlertCircle className="text-yellow-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">Safety Alert</p>
                              <p className="text-xs text-gray-500 mt-0.5">New report filed in your area</p>
                              <p className="text-xs text-gray-400 mt-1">1 day ago</p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="p-3 bg-gray-50 border-t border-gray-100">
                    <button className={`w-full text-center text-sm font-semibold ${isOwner ? 'text-emerald-600 hover:text-emerald-700' : 'text-blue-600 hover:text-blue-700'} transition-colors`}>
                      View All Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Profile Photo */}
            <div className="relative">
              <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] ${isOwner ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'} flex items-center justify-center text-4xl sm:text-5xl font-black text-white shadow-2xl ${isOwner ? 'shadow-emerald-900/50' : 'shadow-blue-900/50'} border-4 border-white/10 overflow-hidden`}>
                {profile?.profilePhoto ? (
                  <img 
                    src={profile.profilePhoto} 
                    alt={profile.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile?.name.charAt(0).toUpperCase()
                )}
              </div>
              <button 
                onClick={handlePhotoEditClick}
                className="absolute bottom-0 right-0 p-2.5 bg-white text-slate-900 rounded-xl shadow-lg hover:bg-blue-50 hover:text-blue-600 transition-all border border-gray-100 group"
                title="Edit profile photo"
              >
                <FiCamera className="h-4 w-4 group-hover:scale-110 transition-transform" />
              </button>
            </div>
            
            <div className="text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {profile?.name}
                </h1>
                <span className={`${isOwner ? 'bg-emerald-600/30 border-emerald-400/30 text-emerald-200' : 'bg-blue-600/30 border-blue-400/30 text-blue-200'} backdrop-blur-md border px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1`}>
                  <FiShield className="h-3 w-3" />
                  {isOwner ? 'Property Owner' : profile?.role}
                </span>
                {/* ✅ VERIFIED BADGE FOR COLLEGE STUDENTS */}
                {!isOwner && profile?.isCollegeVerified && (
                  <VerifiedBadge collegeName={profile.collegeName} size="md" />
                )}
              </div>
              <p className={`${isOwner ? 'text-emerald-200' : 'text-blue-200'} text-lg flex items-center justify-center md:justify-start gap-2 font-medium`}>
                <FiMail className={isOwner ? 'text-emerald-400' : 'text-blue-400'} /> {profile?.email}
              </p>
              {/* ✅ SHOW COLLEGE NAME IF VERIFIED */}
              {!isOwner && profile?.isCollegeVerified && profile?.collegeName && (
                <p className="text-blue-300 text-sm flex items-center justify-center md:justify-start gap-2 font-medium mt-2">
                  <FiMapPin className="text-blue-400" /> {profile.collegeName}
                </p>
              )}
              <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-4">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
                  <FiCalendar className={isOwner ? 'text-emerald-400' : 'text-blue-400'} />
                  <span className="text-xs font-bold text-white uppercase tracking-widest">
                    Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '2024'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Edit Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Update Profile Photo</h3>
              <button 
                onClick={() => {
                  setShowPhotoModal(false);
                  setPhotoPreview(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <FiX className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex justify-center mb-6">
                <div className={`w-32 h-32 rounded-2xl ${isOwner ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'} flex items-center justify-center text-5xl font-black text-white overflow-hidden border-4 border-gray-100 shadow-lg`}>
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : profile?.profilePhoto ? (
                    <img src={profile.profilePhoto} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    profile?.name.charAt(0).toUpperCase()
                  )}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
              >
                <FiUpload className="h-8 w-8 text-gray-400 mx-auto mb-3 group-hover:text-blue-500 transition-colors" />
                <p className="text-sm font-semibold text-gray-700">Click to upload a photo</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
              </div>

              <div className="flex gap-3 mt-6">
                {photoPreview && (
                  <button
                    onClick={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploadingPhoto ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <FiCheck /> Save Photo
                      </>
                    )}
                  </button>
                )}
                
                {profile?.profilePhoto && !photoPreview && (
                  <button
                    onClick={handleRemovePhoto}
                    className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <FiTrash2 /> Remove Photo
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setShowPhotoModal(false);
                    setPhotoPreview(null);
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
        {/* Role-based Stats Grid */}
        {isOwner ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Properties Managed', value: profile?.totalProperties || 0, icon: <FiHome />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Avg Trust Score', value: profile?.avgTrustScore || 0, icon: <FiTrendingUp />, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Total Reports', value: profile?.totalReportsOnProperties || 0, icon: <FiFileText />, color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { label: 'Resolution Rate', value: `${profile?.resolutionRate || 0}%`, icon: <FiCheckCircle />, color: 'text-green-600', bg: 'bg-green-50' }
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 flex items-center gap-6 transition-all hover:scale-[1.02] hover:shadow-xl">
                <div className={`w-16 h-16 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center text-3xl flex-shrink-0`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { label: 'Reports Filed', value: profile?.totalReports || 0, icon: <FiFileText />, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Confirmations Received', value: profile?.totalUpvotes || 0, icon: <FiAward />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Issues Resolved', value: profile?.resolvedReports || 0, icon: <FiCheckCircle />, color: 'text-green-600', bg: 'bg-green-50' }
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 flex items-center gap-6 transition-all hover:scale-[1.02] hover:shadow-xl">
                <div className={`w-16 h-16 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center text-3xl flex-shrink-0`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            
            {/* Personal Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 ${isOwner ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'} rounded-xl`}>
                    <FiUser className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Personal Information</h2>
                </div>
                {!editingName && (
                  <button 
                    onClick={() => setEditingName(true)}
                    className={`${isOwner ? 'text-emerald-600' : 'text-blue-600'} font-bold text-sm hover:underline flex items-center gap-1`}
                  >
                    <FiEdit2 className="h-4 w-4" /> Edit Info
                  </button>
                )}
              </div>
              
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Display Name</label>
                    {editingName ? (
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          className="flex-grow px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                        />
                        <button 
                          onClick={handleNameUpdate}
                          disabled={nameLoading}
                          className={`p-3 ${isOwner ? 'bg-emerald-600 shadow-emerald-200' : 'bg-blue-600 shadow-blue-200'} text-white rounded-xl shadow-lg hover:opacity-90 disabled:opacity-50 transition-all`}
                        >
                          <FiCheck />
                        </button>
                        <button 
                          onClick={() => { setEditingName(false); setNewName(profile?.name || ''); }}
                          className="p-3 bg-gray-100 text-slate-400 rounded-xl hover:bg-gray-200 transition-all"
                        >
                          <FiX />
                        </button>
                      </div>
                    ) : (
                      <p className="px-4 py-3 bg-gray-50 rounded-xl font-bold text-slate-700 border border-transparent">{profile?.name}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
                    <div className="px-4 py-3 bg-gray-50 rounded-xl font-bold text-slate-400 border border-transparent flex items-center justify-between">
                      {profile?.email}
                      <FiLock className="h-3 w-3" />
                    </div>
                  </div>
                </div>

                {/* ✅ SHOW COLLEGE VERIFICATION STATUS */}
                {!isOwner && profile?.isCollegeVerified && (
                  <div className="p-6 bg-blue-50 border border-blue-100 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FiCheckCircle className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-blue-900">Verified College Student</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          {profile.collegeName || 'Educational institution'} • Your reports carry verified student status
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <FiLock className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Security Settings</h2>
              </div>
              
              <div className="p-8">
                {!showPasswordForm ? (
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <div>
                      <h3 className="font-bold text-slate-900">Account Password</h3>
                      <p className="text-sm text-gray-500 mt-1">Change your password to keep your account secure.</p>
                    </div>
                    <button 
                      onClick={() => setShowPasswordForm(true)}
                      className="bg-white hover:bg-gray-50 text-slate-900 px-6 py-3 rounded-xl font-bold border border-gray-200 transition-all shadow-sm whitespace-nowrap"
                    >
                      Update Password
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handlePasswordChange} className="max-w-md space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Current Password</label>
                        <input 
                          type="password" 
                          required
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">New Password</label>
                        <input 
                          type="password" 
                          required
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Confirm New Password</label>
                        <input 
                          type="password" 
                          required
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    {passwordMessage && (
                      <div className={`p-4 rounded-xl ${passwordMessage.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        <p className="text-sm font-bold flex items-center gap-2">
                          {passwordMessage.includes('success') ? <FiCheckCircle /> : <FiInfo />}
                          {passwordMessage}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button 
                        type="submit"
                        disabled={passwordLoading}
                        className={`${isOwner ? 'bg-emerald-600 shadow-emerald-200' : 'bg-blue-600 shadow-blue-200'} text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:opacity-90 transition-all disabled:opacity-50`}
                      >
                        {passwordLoading ? 'Saving...' : 'Save Password'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => { 
                          setShowPasswordForm(false); 
                          setPasswordMessage(''); 
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                        className="px-8 py-3 bg-gray-100 text-slate-600 font-bold rounded-xl hover:bg-gray-200 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {isOwner && (
              <div className="bg-gradient-to-br from-emerald-900 to-teal-900 text-white rounded-2xl shadow-lg p-8 border border-emerald-700/30">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <FiHome /> Quick Actions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link 
                    to="/owner/dashboard"
                    className="p-4 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-3 transition-all border border-white/10"
                  >
                    <FiBarChart2 className="h-6 w-6" />
                    <span className="font-bold">View Dashboard</span>
                  </Link>
                  <Link 
                    to="/owner/add-property"
                    className="p-4 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-3 transition-all border border-white/10"
                  >
                    <FiPlus className="h-6 w-6" />
                    <span className="font-bold">Add Property</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Notification Preferences */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FiBell className={isOwner ? 'text-emerald-600' : 'text-blue-600'} /> Notifications
                </h3>
                {prefsMessage && (
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    {prefsMessage}
                  </span>
                )}
              </div>
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {isOwner ? 'New Reports' : 'Security Alerts'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isOwner ? 'When students file reports on your properties' : 'Critical safety reports in your area'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleNotificationToggle('securityAlerts')}
                    disabled={savingPrefs}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 ${isOwner ? 'focus:ring-emerald-500' : 'focus:ring-blue-500'} focus:ring-offset-2 disabled:opacity-50 ${
                      notificationPrefs.securityAlerts ? (isOwner ? 'bg-emerald-600' : 'bg-blue-600') : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        notificationPrefs.securityAlerts ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Response Updates</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isOwner ? 'Student verification of your resolutions' : 'When owners reply to your reports'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleNotificationToggle('responseUpdates')}
                    disabled={savingPrefs}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 ${isOwner ? 'focus:ring-emerald-500' : 'focus:ring-blue-500'} focus:ring-offset-2 disabled:opacity-50 ${
                      notificationPrefs.responseUpdates ? (isOwner ? 'bg-emerald-600' : 'bg-blue-600') : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        notificationPrefs.responseUpdates ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Platform News</p>
                    <p className="text-xs text-gray-500 mt-0.5">New features and safety guides</p>
                  </div>
                  <button
                    onClick={() => handleNotificationToggle('platformNews')}
                    disabled={savingPrefs}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 ${isOwner ? 'focus:ring-emerald-500' : 'focus:ring-blue-500'} focus:ring-offset-2 disabled:opacity-50 ${
                      notificationPrefs.platformNews ? (isOwner ? 'bg-emerald-600' : 'bg-blue-600') : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        notificationPrefs.platformNews ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 rounded-2xl p-8 border border-red-100">
              <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
                <FiTrash2 className="h-5 w-5" /> Danger Zone
              </h3>
              <p className="text-xs text-red-700/80 mb-8 leading-relaxed font-medium">
                Once you delete your account, there is no going back. All your {isOwner ? 'properties and resolution data' : 'safety contributions and data'} will be permanently removed.
              </p>
              <button 
                onClick={() => { 
                  if(window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                    alert('Account deletion request received. Our team will contact you shortly.');
                  }
                }}
                className="w-full py-3 bg-white text-red-600 border border-red-200 rounded-xl font-bold text-sm hover:bg-red-600 hover:text-white transition-all shadow-sm"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}```

---

## Register.tsx (311 lines)

```tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiUserPlus, FiMail, FiLock, FiUser, FiShield, FiCheckCircle, FiArrowRight, FiInfo } from 'react-icons/fi';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'owner'>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Simple password strength logic
    let strength = 0;
    if (password.length > 5) strength += 1;
    if (password.length > 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    setPasswordStrength(strength);
  }, [password]);

  // ✅ Check if email is college email
  const isCollegeEmail = (email: string) => {
    const lowerEmail = email.toLowerCase();
    return lowerEmail.endsWith('.ac.in') || 
           lowerEmail.endsWith('.edu.in') || 
           lowerEmail.endsWith('.edu') ||
           lowerEmail.endsWith('.ernet.in') ||
           lowerEmail.endsWith('.res.in');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(name, email, password, role);
      navigate('/verify-email', { state: { email: email } });
    } catch (err: any) {
      if (err.message?.includes('verify') || err.message?.includes('Verification')) {
        navigate('/verify-email', { state: { email: email } });
        return;
      }
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const strengthColor = () => {
    if (passwordStrength < 2) return 'bg-red-500';
    if (passwordStrength < 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const strengthText = () => {
    if (password.length === 0) return '';
    if (passwordStrength < 2) return 'Weak';
    if (passwordStrength < 4) return 'Medium';
    return 'Strong';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="max-w-5xl w-full flex bg-white rounded-3xl shadow-2xl overflow-hidden relative z-10">
        {/* Left Side: Illustration/Branding */}
        <div className="hidden lg:flex lg:w-2/5 bg-indigo-600 p-12 text-white flex-col justify-between relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-blue-700 opacity-95"></div>
          <div className="relative z-10">
            <Link to="/" className="flex items-center space-x-2 text-2xl font-bold mb-12">
              <FiShield className="h-8 w-8 text-yellow-400" />
              <span>SafeStay</span>
            </Link>
            
            <h2 className="text-4xl font-extrabold mb-8 leading-tight">
              Join the <span className="text-yellow-400">Safety Movement</span>
            </h2>
            
            <div className="space-y-6">
              {[
                { title: "Report issues anonymously", desc: "Your identity is protected while your voice is heard." },
                { title: "Access verified safety data", desc: "See real reports from real residents before you move." },
                { title: "Get verified student badge", desc: "Use your college email to build trust in your reports." }
              ].map((benefit, i) => (
                <div key={i} className="flex space-x-4">
                  <div className="mt-1">
                    <FiCheckCircle className="text-green-400 h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{benefit.title}</h4>
                    <p className="text-indigo-100 text-sm">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative z-10 pt-8 border-t border-white/10">
            <p className="text-indigo-100 text-sm italic">
              "By signing up, you're helping make student housing safer for everyone."
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full lg:w-3/5 p-8 sm:p-12">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              Create Your Account
            </h2>
            <p className="text-gray-500">
              Start your journey towards safer student living
            </p>
          </div>

          <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
            {error && (
              <div className="col-span-full bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center">
                <FiShield className="mr-2 h-4 w-4 rotate-180" />
                {error}
              </div>
            )}
            
            <div className="space-y-4 col-span-full">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">
                  Full name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="block w-full pl-10 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-gray-900 placeholder-gray-400"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email-address" className="block text-sm font-semibold text-gray-700 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full pl-10 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-gray-900 placeholder-gray-400"
                    placeholder="name@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* ✅ COLLEGE EMAIL SUGGESTION */}
              {email && !email.includes('@') && (
                <div className="col-span-full p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <FiInfo className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-blue-900">💡 Pro Tip: Use Your College Email</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Register with your college email (e.g., yourname@vce.ac.in) to get a <strong>Verified Student</strong> badge and build more trust in your reports!
                    </p>
                  </div>
                </div>
              )}

              {email && email.includes('@') && isCollegeEmail(email) && (
                <div className="col-span-full p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <FiCheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-green-900">✅ College Email Detected!</p>
                    <p className="text-xs text-green-700 mt-1">
                      You'll receive a <strong className="text-green-800">Verified Student</strong> badge after registration. This helps build trust in your safety reports!
                    </p>
                  </div>
                </div>
              )}

              {email && email.includes('@') && !isCollegeEmail(email) && email.split('@')[1] && (
                <div className="col-span-full p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <FiInfo className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-yellow-900">ℹ️ Regular Email Detected</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      You can still register, but consider using your college email (ends with .ac.in or .edu) to get a <strong>Verified Student</strong> badge!
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      className="block w-full pl-10 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-gray-900 placeholder-gray-400"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Strength: {strengthText()}</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${strengthColor()}`} 
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-1">
                    I am a...
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'student' | 'owner')}
                    className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-gray-900 bg-white"
                  >
                    <option value="student">Student / Resident</option>
                    <option value="owner">Property Owner</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="col-span-full group w-full flex justify-center items-center py-4 px-6 border border-transparent text-lg font-bold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </span>
              ) : (
                <>
                  Start Protecting Yourself
                  <FiArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center space-y-4">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 font-bold hover:underline">
                Sign in here
              </Link>
            </p>
            
            <div className="pt-6 border-t border-gray-100">
              <p className="text-gray-400 text-xs px-8 leading-relaxed">
                By clicking "Start Protecting Yourself", you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};```

---

## ReportIncident.tsx (614 lines)

```tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiAlertTriangle, FiHome, FiDroplet, FiSearch, 
  FiShield, FiCamera, FiCheckCircle, FiArrowRight, FiArrowLeft, FiInfo,
  FiMail, FiX, FiRefreshCw, FiBook
} from 'react-icons/fi';
import { ImageUpload } from '../components/ImageUpload';

interface Image {
  url: string;
  publicId: string;
}

interface Accommodation {
  _id: string;
  name: string;
  address: string;
  city: string;
  type?: string;
}

export const ReportIncident: React.FC = () => {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const navigate = useNavigate();
  const { user, token, loading: authLoading, refreshUser } = useAuth();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    accommodation: '',
    issueType: 'Security' as 'Food Safety' | 'Water Quality' | 'Hygiene' | 'Security' | 'Infrastructure',
    description: '',
  });
  
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [accommodationsLoading, setAccommodationsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadedImages, setUploadedImages] = useState<Image[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ✅ Check if user's COLLEGE is verified (not just email)
  const isCollegeVerified = user?.isCollegeVerified === true;

  // Debug logging
  useEffect(() => {
    console.log('[ReportIncident] User:', user?.email);
    console.log('[ReportIncident] isCollegeVerified:', user?.isCollegeVerified);
    console.log('[ReportIncident] collegeName:', user?.collegeName);
    console.log('[ReportIncident] Can Report:', isCollegeVerified);
  }, [user, isCollegeVerified]);

  // ✅ Redirect if not logged in or not a student
  useEffect(() => {
    if (authLoading) return;

    if (!user || !token) {
      navigate('/login');
      return;
    }

    if (user.role !== 'student') {
      navigate('/');
      return;
    }

    fetchAccommodations();
  }, [user, token, authLoading, navigate]);

  const fetchAccommodations = async () => {
    try {
      const response = await fetch(`${API}/api/accommodations/dropdown`);
      const data = await response.json();
      if (data.success) {
        setAccommodations(data.data);
      }
    } catch (error) {
      console.error('Error fetching accommodations:', error);
    } finally {
      setAccommodationsLoading(false);
    }
  };

  // ✅ Refresh user data from server
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`${API}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const updatedUser = {
            id: data.data._id || data.data.id,
            name: data.data.name,
            email: data.data.email,
            role: data.data.role,
            isCollegeVerified: data.data.isCollegeVerified || false,
            isVerified: data.data.isVerified || false,
            collegeName: data.data.collegeName || null,
            profilePhoto: data.data.profilePhoto || null
          };
          
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          if (refreshUser) {
            refreshUser();
          }
          
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ Double-check college verification before submit
    if (!isCollegeVerified) {
      setSubmitError('You must verify your college email before submitting reports.');
      return;
    }
    
    if (!formData.accommodation) {
      alert("Please select an accommodation");
      setStep(1);
      return;
    }

    if (!formData.description.trim()) {
      alert("Please provide a description");
      setStep(2);
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      const res = await fetch(`${API}/api/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          accommodation: formData.accommodation,
          issueType: formData.issueType,
          description: formData.description,
          images: uploadedImages 
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSubmitSuccess(true);
        setUploadedImages([]);
        setTimeout(() => {
          navigate('/my-reports');
        }, 2500);
      } else {
        if (data.requiresCollegeVerification || data.requiresVerification) {
          setSubmitError('You need to verify your college email before submitting reports.');
        } else {
          setSubmitError(data.message || "Failed to submit report");
        }
      }
    } catch (error) {
      setSubmitError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { id: 'Food Safety', name: 'Food Safety', icon: <FiAlertTriangle />, desc: 'Unhygienic kitchen, food poisoning, pest issues', color: 'bg-orange-50 text-orange-600 border-orange-100' },
    { id: 'Water Quality', name: 'Water Quality', icon: <FiDroplet />, desc: 'Contaminated water, irregular supply, dirty tanks', color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { id: 'Security', name: 'Security', icon: <FiShield />, desc: 'Broken locks, no CCTV, unauthorized access', color: 'bg-red-50 text-red-600 border-red-100' },
    { id: 'Hygiene', name: 'Hygiene', icon: <FiCheckCircle />, desc: 'Dirty bathrooms, garbage issues, pest infestation', color: 'bg-green-50 text-green-600 border-green-100' },
    { id: 'Infrastructure', name: 'Infrastructure', icon: <FiHome />, desc: 'Electrical hazards, broken furniture, leaks', color: 'bg-purple-50 text-purple-600 border-purple-100' },
  ];

  const filteredAccommodations = accommodations.filter(acc =>
    acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ✅ Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  // ✅ NOT COLLEGE VERIFIED - Show verification required screen
  if (!isCollegeVerified) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-12 text-center">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiBook className="text-amber-600 text-3xl" />
            </div>
            
            <h1 className="text-3xl font-black text-slate-900 mb-4">
              College Verification Required
            </h1>
            
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              To ensure authentic reviews, only <strong>verified college students</strong> can submit safety reports. Please verify your college email first.
            </p>

            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 mb-8 text-left">
              <h3 className="font-bold text-amber-800 mb-4 flex items-center gap-2">
                <FiInfo className="text-xl" /> Why college verification?
              </h3>
              <ul className="text-amber-700 space-y-2">
                <li className="flex items-start gap-2">
                  <FiCheckCircle className="mt-1 flex-shrink-0" />
                  <span>Confirms you're a real college student</span>
                </li>
                <li className="flex items-start gap-2">
                  <FiCheckCircle className="mt-1 flex-shrink-0" />
                  <span>Prevents fake or malicious reports</span>
                </li>
                <li className="flex items-start gap-2">
                  <FiCheckCircle className="mt-1 flex-shrink-0" />
                  <span>Builds trust in the platform</span>
                </li>
                <li className="flex items-start gap-2">
                  <FiCheckCircle className="mt-1 flex-shrink-0" />
                  <span>Protects accommodation providers</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-8 text-left">
              <p className="text-sm text-blue-700">
                <strong className="text-blue-900">Your account:</strong> {user?.email}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Email Status: {user?.isVerified ? 
                  <span className="text-green-600 font-bold">✓ Verified</span> : 
                  <span className="text-red-600 font-bold">Not Verified</span>
                }
              </p>
              <p className="text-sm text-blue-700 mt-1">
                College Status: <span className="font-bold text-red-600">Not Verified</span>
              </p>
              {user?.collegeName && (
                <p className="text-sm text-blue-700 mt-1">
                  College: {user.collegeName}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/verify-college')}
                className="bg-amber-500 text-white px-8 py-4 rounded-xl font-bold hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <FiBook /> Verify College Email
              </button>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-slate-100 text-slate-700 px-8 py-4 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FiRefreshCw className={isRefreshing ? 'animate-spin' : ''} />
                {isRefreshing ? 'Refreshing...' : 'Already Verified? Refresh'}
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-slate-500 text-sm mb-4">
                Or go back to:
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Dashboard
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={() => navigate('/profile')}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Profile
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={() => navigate('/')}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ COLLEGE VERIFIED - Show report form
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-slate-900 text-white pt-12 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/dashboard" className="inline-flex items-center text-blue-300 hover:text-white mb-6 transition-colors">
            <FiArrowLeft className="mr-2" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold">Report a Safety Concern</h1>
          <p className="text-blue-200 mt-2">Help make student housing safer by sharing your experience.</p>
          
          {/* ✅ College Verified Badge */}
          <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-400/30 text-green-300 px-4 py-2 rounded-full text-sm font-bold mt-4">
            <FiCheckCircle /> College Verified: {user?.collegeName || user?.email}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          
          {/* Step Indicator */}
          <div className="bg-gray-50/50 border-b border-gray-100 px-8 py-6">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {[
                { s: 1, label: "Place" },
                { s: 2, label: "Describe" },
                { s: 3, label: "Evidence" }
              ].map((item) => (
                <div key={item.s} className="flex flex-col items-center relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    step >= item.s ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step > item.s ? <FiCheckCircle className="h-5 w-5" /> : item.s}
                  </div>
                  <span className={`text-xs mt-2 font-bold uppercase tracking-wider ${
                    step >= item.s ? 'text-blue-600' : 'text-gray-400'
                  }`}>{item.label}</span>
                  {item.s < 3 && (
                    <div className={`absolute top-5 left-10 w-[calc(100vw/4)] md:w-32 h-0.5 -z-10 ${
                      step > item.s ? 'bg-blue-600' : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 sm:p-12">
            {/* ✅ Error Alert */}
            {submitError && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-6 flex items-start gap-3">
                <FiAlertTriangle className="mt-0.5 flex-shrink-0 text-xl" />
                <div className="flex-1">
                  <p className="font-bold mb-1">Error</p>
                  <p className="text-sm">{submitError}</p>
                  {submitError.toLowerCase().includes('college') && (
                    <button
                      onClick={() => navigate('/verify-college')}
                      className="mt-3 text-sm bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 transition-all"
                    >
                      Verify College →
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => setSubmitError('')}
                  className="text-red-600 hover:text-red-800 p-1"
                >
                  <FiX />
                </button>
              </div>
            )}

            {submitSuccess ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <FiCheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Report Submitted!</h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  Your safety report has been recorded. Our AI is verifying your evidence and moderators will review it shortly. Redirecting you...
                </p>
              </div>
            ) : (
              <div className="min-h-[400px] flex flex-col">
                
                {/* Step 1: Select Place & Category */}
                {step === 1 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">1</span>
                        Which property has the issue?
                      </h3>
                      
                      {accommodationsLoading ? (
                        <div className="h-12 w-full bg-gray-50 rounded-xl animate-pulse"></div>
                      ) : (
                        <div className="space-y-3">
                          <div className="relative">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search by location, name, or city..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                          </div>
                          <select
                            name="accommodation"
                            value={formData.accommodation}
                            onChange={handleInputChange}
                            className="w-full px-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer"
                          >
                            <option value="">-- Choose Accommodation --</option>
                            {(searchTerm ? filteredAccommodations : accommodations).map((acc) => (
                              <option key={acc._id} value={acc._id}>
                                {acc.name} - {acc.address}, {acc.city}
                              </option>
                            ))}
                          </select>
                          {accommodations.length === 0 && (
                            <p className="text-sm text-orange-600 font-medium bg-orange-50 p-4 rounded-xl border border-orange-100">
                              No accommodations registered yet. Know one? Tell owners to register!
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">2</span>
                        What kind of issue is it?
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, issueType: cat.id as any }))}
                            className={`p-5 rounded-2xl border-2 text-left transition-all hover:shadow-lg ${
                              formData.issueType === cat.id
                                ? `ring-2 ring-blue-500 ${cat.color}`
                                : 'border-gray-100 bg-white text-gray-700 hover:border-gray-200'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                              formData.issueType === cat.id ? 'bg-white shadow-sm' : 'bg-gray-50'
                            }`}>
                              {React.cloneElement(cat.icon as React.ReactElement, { className: 'h-6 w-6' })}
                            </div>
                            <h4 className="font-bold mb-1">{cat.name}</h4>
                            <p className="text-[11px] leading-tight opacity-70">{cat.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Description */}
                {step === 2 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">3</span>
                        Describe what happened (be specific - it helps!)
                      </h3>
                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6 flex gap-3">
                        <FiInfo className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-700">
                          Your identity stays anonymous. Only <span className="font-bold text-blue-900">"Verified College Student"</span> is shown to others.
                        </p>
                      </div>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={8}
                        maxLength={2000}
                        placeholder="What happened? When did it occur? Have you spoken to the owner? Be as detailed as possible to help other students."
                        className="w-full p-6 bg-gray-50 border border-gray-200 rounded-3xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none text-gray-900"
                        required
                      />
                      <div className="flex justify-between mt-2 text-xs font-bold uppercase tracking-wider">
                        <span className="text-gray-400">Be objective and factual</span>
                        <span className={formData.description.length > 1800 ? 'text-red-500' : 'text-gray-400'}>
                          {formData.description.length}/2000
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Evidence */}
                {step === 3 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">4</span>
                        Add Evidence
                      </h3>
                      <div className="bg-green-50 border border-green-100 p-4 rounded-xl mb-6 flex gap-3">
                        <FiCamera className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-green-700">
                          <span className="font-bold text-green-900">📸 Photos increase report credibility by 3x.</span> Evidence helps owners resolve issues faster and AI will verify your images.
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 p-8 rounded-3xl border-2 border-dashed border-gray-200">
                        <ImageUpload 
                          onImagesChange={setUploadedImages} 
                          uploadedImages={uploadedImages}
                        />
                      </div>

                      {/* AI Verification Notice */}
                      <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl mt-4 flex gap-3">
                        <FiShield className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-purple-700">
                          <span className="font-bold text-purple-900">🤖 AI Verification:</span> Your images will be analyzed by AI to ensure they match the reported issue.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="mt-auto pt-12 flex justify-between items-center">
                  {step > 1 ? (
                    <button
                      onClick={() => setStep(step - 1)}
                      className="px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
                    >
                      <FiArrowLeft /> Back
                    </button>
                  ) : <div></div>}

                  {step < 3 ? (
                    <button
                      onClick={() => {
                        if (step === 1 && !formData.accommodation) {
                          alert("Please select an accommodation");
                          return;
                        }
                        setStep(step + 1);
                      }}
                      className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200"
                    >
                      Next Step <FiArrowRight />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 font-bold rounded-xl hover:from-yellow-300 hover:to-orange-400 transition-all flex items-center gap-2 shadow-lg shadow-orange-200 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting & Verifying...
                        </span>
                      ) : (
                        <>Submit Report <FiArrowRight /></>
                      )}
                    </button>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};```

---

## ReportSafety.tsx (127 lines)

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ReportSafety() {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    accommodationName: "",
    issueType: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    

    const token = localStorage.getItem("token");
   

    if (!token) {
      alert("Please login first");
      navigate("/login");
      return;
    }

    try {
      const res = await fetch(`${API}/api/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify(formData),
      });

     
      const data = await res.json();
      

      if (data.success) {
        alert("Report submitted successfully!");
        setFormData({
          accommodationName: "",
          issueType: "",
          description: "",
        });
        navigate("/my-reports");
      } else {
        alert(data.message || "Failed to submit report");
      }
    } catch (err) {
      alert("Error submitting report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Report Safety Issue</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Accommodation Name</label>
          <input
            name="accommodationName"
            value={formData.accommodationName}
            placeholder="Enter accommodation name"
            className="border p-2 w-full rounded"
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Issue Type</label>
          <select
            name="issueType"
            value={formData.issueType}
            className="border p-2 w-full rounded"
            onChange={handleChange}
            required
          >
            <option value="">Select issue type</option>
            <option value="Food Safety">Food Safety</option>
            <option value="Water Quality">Water Quality</option>
            <option value="Hygiene">Hygiene</option>
            <option value="Security">Security</option>
            <option value="Infrastructure">Infrastructure</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">Description</label>
          <textarea
            name="description"
            value={formData.description}
            placeholder="Describe the issue in detail"
            className="border p-2 w-full rounded"
            rows={4}
            onChange={handleChange}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
        >
          {loading ? "Submitting..." : "Submit Report"}
        </button>
      </form>
    </div>
  );
}
```

---

## VerifyEmail.tsx (169 lines)

```tsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function VerifyEmail() {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = location.state?.email || '';

  const [email, setEmail] = useState(emailFromState);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API}/api/otp/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(data.message);
      }
    } catch {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || !email.trim()) return;
    setError('');
    setMessage('');
    setResendLoading(true);

    try {
      const response = await fetch(`${API}/api/otp/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await response.json();

      if (data.success) {
        setMessage('New OTP sent to your email!');
        setCountdown(60);
      } else {
        setError(data.message);
      }
    } catch {
      setError('Error connecting to server');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📧</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Verify Your Email</h1>
          <p className="text-gray-500 mt-2">
            We sent a 6-digit code to your email.
            Enter it below to verify your account.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Enter your email"
              required
              disabled={!!emailFromState}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtp(value);
              }}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center text-2xl tracking-widest font-bold"
              placeholder="000000"
              maxLength={6}
              required
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm font-medium bg-red-50 px-4 py-2 rounded-lg">{error}</p>
          )}

          {message && (
            <p className="text-green-600 text-sm font-medium bg-green-50 px-4 py-2 rounded-lg">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-blue-400"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">Didn't receive the code?</p>
          <button
            onClick={handleResend}
            disabled={resendLoading || countdown > 0}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm mt-1 disabled:text-gray-400"
          >
            {resendLoading
              ? 'Sending...'
              : countdown > 0
                ? `Resend in ${countdown}s`
                : 'Resend Code'
            }
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

