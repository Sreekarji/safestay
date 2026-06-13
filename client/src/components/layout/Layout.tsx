import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useAuthStore } from '@/stores/authStore';

const publicPaths = ['/', '/login', '/register', '/verify-otp', '/forgot-password'];

export function Layout() {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const isPublic = publicPaths.includes(location.pathname);

  return (
    <div className="min-h-screen bg-surface font-sans">
      <Navbar />
      <main className="pt-16">
        <Outlet />
      </main>
      {isPublic && <Footer />}
    </div>
  );
}
