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
  const [hasNotifications] = useState(false);
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = getNavItems(user?.role);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-canvas/80 backdrop-blur-xl border-b border-hairline dark:bg-[#0a0a0a]/80 dark:border-[#333333]">
      <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <Shield className="h-6 w-6 text-ink dark:text-white" strokeWidth={2} />
          <span className="text-lg font-semibold tracking-tight text-ink dark:text-white">SafeStay</span>
        </Link>
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                    isActive
                      ? 'text-ink bg-canvas-soft dark:text-white dark:bg-[#1a1a1a]'
                      : 'text-body hover:text-ink hover:bg-canvas-soft dark:hover:text-white dark:hover:bg-[#1a1a1a]'
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
          {isAuthenticated ? (
            <>
              <button
                onClick={() => navigate('/my-reports')}
                className="relative rounded-full p-2 text-body hover:text-ink hover:bg-canvas-soft dark:text-[#888888] dark:hover:text-white dark:hover:bg-[#1a1a1a] transition-colors"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                {hasNotifications && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-error" />
                )}
              </button>
              <DropdownMenu
                trigger={
                  <button className="flex items-center gap-2 rounded-full p-1 hover:bg-canvas-soft dark:hover:bg-[#1a1a1a] transition-colors">
                    <Avatar
                      fallback={user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      className="h-7 w-7"
                    />
                  </button>
                }
                align="right"
              >
                <div className="px-3 py-2 border-b border-hairline dark:border-[#333333] mb-1">
                  <p className="text-sm font-medium text-ink dark:text-white">{user?.name}</p>
                  <p className="text-xs text-body dark:text-[#888888]">{user?.email}</p>
                  <span className="inline-block mt-1 rounded-full bg-canvas-soft dark:bg-[#1a1a1a] px-2 py-0.5 text-[10px] font-medium text-body dark:text-[#888888] uppercase tracking-wider">
                    {user?.role}
                  </span>
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
                className="md:hidden rounded-full p-2 text-body hover:text-ink hover:bg-canvas-soft dark:text-[#888888] dark:hover:text-white dark:hover:bg-[#1a1a1a]"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center h-8 rounded-md px-3 text-sm font-medium text-ink hover:bg-canvas-soft dark:text-white dark:hover:bg-[#1a1a1a] transition-colors"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center h-8 rounded-md bg-ink text-white px-3 text-sm font-medium hover:bg-black dark:bg-white dark:text-ink dark:hover:bg-gray-100 transition-colors"
              >
                {t('nav.signUp')}
              </Link>
            </div>
          )}
        </div>
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-72 bg-canvas dark:bg-[#0a0a0a] border-l border-hairline dark:border-[#333333] p-6 card-shadow-5">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-body hover:text-ink hover:bg-canvas-soft dark:text-[#888888] dark:hover:text-white dark:hover:bg-[#1a1a1a]"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mt-8 flex flex-col gap-1">
              <div className="flex items-center gap-2.5 mb-6 px-2">
                <Shield className="h-5 w-5 text-ink dark:text-white" strokeWidth={2} />
                <span className="text-base font-semibold text-ink dark:text-white">SafeStay</span>
              </div>
              <span className="inline-block w-fit rounded-full bg-canvas-soft dark:bg-[#1a1a1a] px-2.5 py-0.5 text-[10px] font-medium text-body dark:text-[#888888] uppercase tracking-wider mb-3 mx-2">
                {user?.role}
              </span>
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-ink bg-canvas-soft dark:text-white dark:bg-[#1a1a1a]'
                        : 'text-body hover:bg-canvas-soft dark:text-[#888888] dark:hover:bg-[#1a1a1a]'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {t(item.labelKey)}
                </NavLink>
              ))}
              <div className="mt-4 border-t border-hairline dark:border-[#333333] pt-4">
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-error hover:bg-error-soft dark:hover:bg-[rgba(238,0,0,0.1)]"
                >
                  <LogOut className="h-4 w-4" />
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
