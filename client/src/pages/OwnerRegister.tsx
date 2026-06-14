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
}