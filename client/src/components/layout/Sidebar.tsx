import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Map, FileText, ClipboardList, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Avatar } from '@/components/ui/avatar';

const sidebarItems = [
  { to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { to: '/map', icon: Map, labelKey: 'nav.map' },
  { to: '/report-incident', icon: FileText, labelKey: 'nav.report' },
  { to: '/my-reports', icon: ClipboardList, labelKey: 'nav.myReports' },
  { to: '/profile', icon: Settings, labelKey: 'nav.settings' },
];

export function Sidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 fixed left-0 top-16 bottom-0 bg-white border-r border-slate-200">
      <nav className="flex-1 p-4 space-y-1">
        {sidebarItems.map((item) => (
          <NavLink key={item.to + item.labelKey} to={item.to}
            className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${isActive ? 'bg-primary-50 text-primary-600 border-l-4 border-primary-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
            <item.icon className="h-5 w-5" />{t(item.labelKey)}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3">
          <Avatar fallback={user?.name?.charAt(0)?.toUpperCase() || 'U'} className="h-9 w-9" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} className="rounded-lg p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><LogOut className="h-4 w-4" /></button>
        </div>
      </div>
    </aside>
  );
}
