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

    // Check if owner is verified before fetching data
    if ((user as any).ownerVerification?.status !== 'verified') {
      setLoading(false);
      setError('verification_pending');
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

      // Handle 403 - owner not verified
      if (propsRes.status === 403 || feedbackRes.status === 403) {
        setError('verification_pending');
        setLoading(false);
        return;
      }

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
        // Server returns: { success: true, data: { images: string[], publicIds: string[] } }
        if (uploadData.success && uploadData.data?.images) {
          imageUrls = uploadData.data.images;
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
            {error === 'verification_pending' ? (
              <>
                <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiClock className="h-8 w-8 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Pending</h2>
                <p className="text-gray-600 mb-4">Your owner account is awaiting admin verification.</p>
                <p className="text-gray-500 text-sm mb-6">You'll have full access once an admin approves your account. This usually takes 24-48 hours.</p>
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                >
                  Back to Home
                </button>
              </>
            ) : (
              <>
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
              </>
            )}
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
}