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
    severity: 5,
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
            _id: data.data._id || data.data.id,
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
    // Clear search when accommodation is selected so the option stays visible
    if (name === 'accommodation' && value) {
      setSearchTerm('');
    }
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
      // Transform images: extract just the URLs for the Report model (which stores string[])
      const imageUrls = uploadedImages.map(img => img.url);

      // Generate a title from issue type + accommodation name
      const selectedAccommodation = accommodations.find(a => a._id === formData.accommodation);
      const autoTitle = `${formData.issueType} — ${selectedAccommodation?.name || 'Unknown Property'}`;

      const res = await fetch(`${API}/api/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          accommodationId: formData.accommodation,
          category: formData.issueType,
          severity: formData.severity,
          title: autoTitle,
          description: formData.description,
          images: imageUrls,
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
                            {/* Keep the selected accommodation in the list even if it's filtered out by search */}
                            {formData.accommodation && 
                             !(searchTerm ? filteredAccommodations : accommodations).some(a => a._id === formData.accommodation) &&
                             accommodations.filter(a => a._id === formData.accommodation).map((acc) => (
                              <option key={acc._id + '-selected'} value={acc._id}>
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

                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">4</span>
                        How severe is this issue?
                      </h3>
                      <div className="space-y-3">
                        <input
                          type="range"
                          name="severity"
                          min={1}
                          max={10}
                          value={formData.severity}
                          onChange={(e) => setFormData(prev => ({ ...prev, severity: Number(e.target.value) }))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="flex justify-between text-sm">
                          <span className={`font-bold px-3 py-1 rounded-full text-xs ${
                            formData.severity <= 3 ? 'bg-green-100 text-green-700' :
                            formData.severity <= 6 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {formData.severity <= 3 ? 'Low' : formData.severity <= 6 ? 'Medium' : 'High'} — {formData.severity}/10
                          </span>
                        </div>
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
};