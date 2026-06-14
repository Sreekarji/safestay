import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiLogOut, FiUser, FiAlertTriangle, 
  FiShield, FiChevronDown, FiMenu, FiX, FiActivity
} from 'react-icons/fi';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setIsProfileOpen(false);
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsProfileOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-xl shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform duration-300">
                <FiShield className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-black tracking-tighter text-slate-900 uppercase group-hover:scale-105 transition-transform duration-200">
                Safe<span className="text-blue-600">Stay</span>
              </span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            <Link 
              to="/" 
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all relative after:absolute after:bottom-1 after:left-4 after:right-4 after:h-0.5 after:bg-blue-600 after:transition-all after:duration-300 ${isActive('/') ? 'text-blue-600 bg-blue-50 after:w-auto' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 after:w-0 hover:after:w-[calc(100%-2rem)]'}`}
            >
              {t('nav.home')}
            </Link>
            <Link 
              to="/accommodations" 
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all relative after:absolute after:bottom-1 after:left-4 after:right-4 after:h-0.5 after:bg-blue-600 after:transition-all after:duration-300 ${isActive('/accommodations') ? 'text-blue-600 bg-blue-50 after:w-auto' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 after:w-0 hover:after:w-[calc(100%-2rem)]'}`}
            >
              {t('nav.explore')}
            </Link>

            {/* Auth-specific links */}
            {user?.role === 'student' && (
              <>
                <Link 
                  to="/dashboard" 
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all relative after:absolute after:bottom-1 after:left-4 after:right-4 after:h-0.5 after:bg-blue-600 after:transition-all after:duration-300 ${isActive('/dashboard') ? 'text-blue-600 bg-blue-50 after:w-auto' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 after:w-0 hover:after:w-[calc(100%-2rem)]'}`}
                >
                  {t('nav.dashboard')}
                </Link>
                <Link 
                  to="/report" 
                  className="ml-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 active:scale-95 text-red-600 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                >
                  <FiAlertTriangle /> {t('nav.reportIssue')}
                </Link>
              </>
            )}

            {user?.role === 'owner' && (
              <Link 
                to="/owner/dashboard" 
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all relative after:absolute after:bottom-1 after:left-4 after:right-4 after:h-0.5 after:bg-emerald-600 after:transition-all after:duration-300 ${isActive('/owner/dashboard') ? 'text-emerald-600 bg-emerald-50 after:w-auto' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 after:w-0 hover:after:w-[calc(100%-2rem)]'}`}
              >
                {t('nav.ownerPanel')}
              </Link>
            )}

            {user?.role === 'admin' && (
              <Link 
                to="/admin" 
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all relative after:absolute after:bottom-1 after:left-4 after:right-4 after:h-0.5 after:bg-red-600 after:transition-all after:duration-300 ${isActive('/admin') ? 'text-red-600 bg-red-50 after:w-auto' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 after:w-0 hover:after:w-[calc(100%-2rem)]'}`}
              >
                {t('nav.moderation')}
              </Link>
            )}
          </nav>

          {/* Right Section: Language Toggle + Profile */}
          <div className="flex items-center space-x-3">
            {/* Language Toggle */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-full">
              <button
                onClick={() => changeLanguage('en')}
                className={`px-2.5 py-1 rounded-full text-xs font-black transition-all ${
                  i18n.language === 'en' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => changeLanguage('hi')}
                className={`px-2.5 py-1 rounded-full text-xs font-black transition-all ${
                  i18n.language === 'hi' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                हि
              </button>
              <button
                onClick={() => changeLanguage('te')}
                className={`px-2.5 py-1 rounded-full text-xs font-black transition-all ${
                  i18n.language === 'te' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                తె
              </button>
            </div>

            {user ? (
              <>
                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 p-1.5 pl-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl hover:ring-2 hover:ring-offset-2 hover:ring-blue-500 transition-all duration-200"
                  >
                    <div className="flex flex-col items-end hidden sm:flex">
                      <span className="text-xs font-black text-slate-900 leading-none">{user.name.split(' ')[0]}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{user.role}</span>
                    </div>
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-blue-100">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <FiChevronDown className={`text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Profile Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl shadow-slate-200 border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                      <div className="px-4 py-3 border-b border-slate-50">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('nav.signedInAs')}</p>
                        <p className="text-sm font-black text-slate-900 truncate">{user.email}</p>
                      </div>
                      <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all" onClick={() => setIsProfileOpen(false)}>
                        <FiUser className="text-slate-400" /> {t('nav.myProfile')}
                      </Link>
                      {user.role === 'student' && (
                        <Link to="/my-reports" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all" onClick={() => setIsProfileOpen(false)}>
                          <FiActivity className="text-slate-400" /> {t('nav.myContributions')}
                        </Link>
                      )}
                      <div className="border-t border-slate-50 mt-2 pt-2">
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-all"
                        >
                          <FiLogOut /> {t('nav.logout')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-5 py-2.5 text-slate-600 font-bold text-sm hover:text-slate-900 transition-all"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-slate-200 transition-all"
                >
                  {t('nav.joinNow')}
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2.5 bg-slate-50 text-slate-600 rounded-xl"
            >
              {isMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-50 px-4 py-6 space-y-2 animate-in slide-in-from-top-4 duration-300">
          {/* Mobile Language Toggle */}
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Language:</span>
            <button onClick={() => changeLanguage('en')} className={`px-3 py-1 rounded-full text-xs font-black ${i18n.language === 'en' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>EN</button>
            <button onClick={() => changeLanguage('hi')} className={`px-3 py-1 rounded-full text-xs font-black ${i18n.language === 'hi' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>हि</button>
            <button onClick={() => changeLanguage('te')} className={`px-3 py-1 rounded-full text-xs font-black ${i18n.language === 'te' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>తె</button>
          </div>

          <Link to="/" className="block px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>{t('nav.home')}</Link>
          <Link to="/accommodations" className="block px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>{t('nav.explore')}</Link>
          
          {user ? (
            <>
              <div className="h-px bg-slate-50 my-4"></div>
              {user.role === 'student' && (
                <>
                  <Link to="/dashboard" className="block px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>{t('nav.dashboard')}</Link>
                  <Link to="/report" className="block px-4 py-3 rounded-xl font-bold text-red-600 hover:bg-red-50" onClick={() => setIsMenuOpen(false)}>{t('nav.reportIssue')}</Link>
                </>
              )}
              {user.role === 'owner' && (
                <Link to="/owner/dashboard" className="block px-4 py-3 rounded-xl font-bold text-emerald-600 hover:bg-emerald-50" onClick={() => setIsMenuOpen(false)}>{t('nav.ownerPanel')}</Link>
              )}
              {user.role === 'admin' && (
                <Link to="/admin" className="block px-4 py-3 rounded-xl font-bold text-red-600 hover:bg-red-50" onClick={() => setIsMenuOpen(false)}>{t('nav.moderation')}</Link>
              )}
              <Link to="/profile" className="block px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50" onClick={() => setIsMenuOpen(false)}>{t('nav.myProfile')}</Link>
              <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-xl font-bold text-red-600 hover:bg-red-50 transition-all">{t('nav.logout')}</button>
            </>
          ) : (
            <div className="pt-4 flex flex-col gap-2">
              <Link to="/login" className="block w-full text-center py-3 rounded-xl font-bold text-slate-600 border border-slate-200" onClick={() => setIsMenuOpen(false)}>{t('nav.login')}</Link>
              <Link to="/register" className="block w-full text-center py-3 rounded-xl font-bold text-white bg-blue-600 shadow-lg shadow-blue-100" onClick={() => setIsMenuOpen(false)}>{t('nav.joinNow')}</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
