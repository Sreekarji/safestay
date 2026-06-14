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
};