import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  LayoutDashboard,
  Map,
  FileText,
  Bell,
  LogOut,
  User,
  Settings,
  Menu,
  X,
  ClipboardList,
  Building2,
  Plus,
  BarChart3,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { LanguageToggle } from '@/components/common/LanguageToggle';
import { Avatar } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
}

const studentNav: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { to: '/map', icon: Map, labelKey: 'nav.map' },
  { to: '/my-reports', icon: ClipboardList, labelKey: 'nav.myReports' },
  { to: '/report/new', icon: FileText, labelKey: 'nav.report' },
];

const ownerNav: NavItem[] = [
  { to: '/owner/dashboard', icon: Building2, labelKey: 'nav.ownerDashboard' },
  { to: '/map', icon: Map, labelKey: 'nav.map' },
  { to: '/owner/add-property', icon: Plus, labelKey: 'nav.addProperty' },
];

const adminNav: NavItem[] = [
  { to: '/admin', icon: BarChart3, labelKey: 'nav.adminDashboard' },
  { to: '/map', icon: Map, labelKey: 'nav.map' },
];

function getNavItems(role?: string): NavItem[] {
  switch (role) {
    case 'owner':
      return ownerNav;
    case 'admin':
      return adminNav;
    default:
      return studentNav;
  }
}

export function Navbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = getNavItems(user?.role);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-white border-b border-slate-200 shadow-sm">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="h-7 w-7 text-primary-600" />
          <span className="text-xl font-bold text-primary-600">SafeStay</span>
        </Link>
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-primary-600 bg-primary-50 border-b-2 border-primary-600'
                      : 'text-slate-600 hover:text-primary-500 hover:bg-slate-50'
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {t(item.labelKey)}
              </NavLink>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-2">
          <LanguageToggle />
          {isAuthenticated && (
            <>
              <button className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
              </button>
              <DropdownMenu
                trigger={
                  <button>
                    <Avatar
                      fallback={user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      className="h-8 w-8 cursor-pointer"
                    />
                  </button>
                }
                align="right"
              >
                <div className="px-2 py-1.5 border-b border-slate-100 mb-1">
                  <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                  <p className="text-xs text-primary-600 capitalize mt-0.5">{user?.role}</p>
                </div>
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  {t('nav.profile')}
                </DropdownMenuItem>
                {user?.role === 'student' && (
                  <DropdownMenuItem onClick={() => navigate('/my-reports')}>
                    <ClipboardList className="mr-2 h-4 w-4" />
                    {t('nav.myReports')}
                  </DropdownMenuItem>
                )}
                {user?.role === 'owner' && (
                  <DropdownMenuItem onClick={() => navigate('/owner/dashboard')}>
                    <Building2 className="mr-2 h-4 w-4" />
                    {t('nav.ownerDashboard')}
                  </DropdownMenuItem>
                )}
                {user?.role === 'admin' && (
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    {t('nav.adminDashboard')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout} destructive>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('nav.logout')}
                </DropdownMenuItem>
              </DropdownMenu>
              <button
                className="md:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-72 bg-white shadow-xl p-6">
            <button onClick={() => setMobileOpen(false)} className="absolute right-4 top-4">
              <X className="h-5 w-5" />
            </button>
            <div className="mt-8 flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-6 px-2">
                <Shield className="h-6 w-6 text-primary-600" />
                <span className="text-lg font-bold text-primary-600">SafeStay</span>
              </div>
              {/* Role badge */}
              <div className="mb-4 px-2">
                <span className="inline-block rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 capitalize">
                  {user?.role}
                </span>
              </div>
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive ? 'text-primary-600 bg-primary-50' : 'text-slate-600 hover:bg-slate-50'
                    }`
                  }
                >
                  <item.icon className="h-5 w-5" />
                  {t(item.labelKey)}
                </NavLink>
              ))}
              <div className="mt-4 border-t border-slate-200 pt-4">
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5" />
                  {t('nav.logout')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
