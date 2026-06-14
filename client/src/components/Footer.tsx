import React from 'react';
import { Link } from 'react-router-dom';
import { FiShield, FiTwitter, FiInstagram, FiGithub, FiMail } from 'react-icons/fi';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-16 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center space-x-2 group mb-6">
              <div className="bg-blue-600 p-2 rounded-xl">
                <FiShield className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-black tracking-tighter text-white uppercase">
                Safe<span className="text-blue-500">Stay</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400">
              The world's first student-led safety platform for verified accommodation reporting and transparency.
            </p>
            <div className="flex space-x-4 mt-8">
              <a href="#" className="p-2 bg-white/5 hover:bg-blue-600 hover:text-white rounded-lg transition-all"><FiTwitter /></a>
              <a href="#" className="p-2 bg-white/5 hover:bg-pink-600 hover:text-white rounded-lg transition-all"><FiInstagram /></a>
              <a href="#" className="p-2 bg-white/5 hover:bg-slate-700 hover:text-white rounded-lg transition-all"><FiGithub /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-[10px] mb-6">Platform</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><Link to="/accommodations" className="hover:text-blue-400 transition-colors">Find Housing</Link></li>
              <li><Link to="/report" className="hover:text-red-400 transition-colors">Report Hazard</Link></li>
              <li><Link to="/dashboard" className="hover:text-blue-400 transition-colors">Student Dashboard</Link></li>
              <li><Link to="/owner/login" className="hover:text-emerald-400 transition-colors">Owner Portal</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-[10px] mb-6">Support</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><a href="#" className="hover:text-white transition-colors">Safety Guides</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          {/* Newsletter / Contact */}
          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-[10px] mb-6">Stay Protected</h4>
            <p className="text-xs text-slate-400 mb-4 font-medium">Get weekly safety alerts for your area.</p>
            <div className="relative group">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="email" 
                placeholder="Email address"
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs outline-none focus:border-blue-500 transition-all font-bold"
              />
            </div>
            <button className="w-full mt-3 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20">
              Subscribe
            </button>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
          <p>&copy; 2024 SafeStay Platform. All rights reserved.</p>
          <div className="flex gap-8">
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> System Operational</span>
            <span>v2.4.0-pro</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
