import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useAuthStore } from '@/stores/authStore';

const publicPaths = ['/', '/login', '/register', '/verify-otp', '/forgot-password'];

export function Layout() {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const isPublic = publicPaths.some((p) => p === '/' ? location.pathname === '/' : location.pathname.startsWith(p));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans">
      <Navbar />
      <main className="pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
