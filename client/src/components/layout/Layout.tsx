import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { useAuthStore } from '@/stores/authStore';

const publicPaths = ['/', '/login', '/register', '/verify-otp'];

export function Layout() {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const isPublic = publicPaths.includes(location.pathname);
  const showSidebar = isAuthenticated && !isPublic;

  return (
    <div className="min-h-screen bg-surface font-sans">
      <Navbar />
      {showSidebar && <Sidebar />}
      <main className={showSidebar ? 'pt-16 lg:pl-64' : 'pt-16'}>
        <Outlet />
      </main>
      {isPublic && <Footer />}
    </div>
  );
}
