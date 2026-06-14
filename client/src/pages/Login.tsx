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
