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
import VoicePlayer from '../components/VoicePlayer';

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
    const ownerId = accommodation.owner?._id || accommodation.owner;
    const userId = user._id;
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
                <div className="mt-4">
                  <VoicePlayer
                    accommodationName={accommodation.name}
                    ssi={accommodation.trustScore || 0}
                    topIssues={(() => {
                      const counts: Record<string, number> = {};
                      (accommodation.reports || []).forEach((r: any) => {
                        const cat = r.category || r.issueType || 'Other';
                        counts[cat] = (counts[cat] || 0) + 1;
                      });
                      return Object.entries(counts)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([k]) => k);
                    })()}
                  />
                </div>
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
};