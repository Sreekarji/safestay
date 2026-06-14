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
}