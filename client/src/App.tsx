import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from '@/components/layout/Layout';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Landing } from '@/pages/Landing';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { OwnerRegister } from '@/pages/OwnerRegister';
import { OTPVerificationPage } from '@/pages/OTPVerification';
import ForgotPassword from '@/pages/ForgotPassword';
import { Dashboard } from '@/pages/Dashboard';
import { ReportSubmit } from '@/pages/ReportSubmit';
import { ReportDetail } from '@/pages/ReportDetail';
import MapView from '@/pages/MapView';
import AnalyticsDashboard from '@/components/dashboard/AnalyticsDashboard';
import { MyReports } from '@/pages/MyReports';
import Profile from '@/pages/Profile';
import { AccommodationList } from '@/pages/AccommodationList';
import AccommodationDetail from '@/pages/AccommodationDetail';
import { OwnerLogin } from '@/pages/OwnerLogin';
import OwnerDashboard from '@/pages/OwnerDashboard';
import AddProperty from '@/pages/AddProperty';
import { AdminDashboard } from '@/pages/AdminDashboard';
import AdminOwnerVerifications from '@/pages/AdminOwnerVerifications';
import { NotFound } from '@/pages/NotFound';
import { useAuthStore } from '@/stores/authStore';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  

  useEffect(() => {
    checkAuth();
  }, []);

  return (
      <ErrorBoundary>
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '12px', background: document.documentElement.classList.contains('dark') ? '#0f172a' : '#1E293B', color: '#fff', fontSize: '14px' } }} />
        <Routes>
          <Route element={<Layout />}>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<OTPVerificationPage />} />
            <Route path="/accommodations" element={<AccommodationList />} />
            <Route path="/accommodations/:id" element={<AccommodationDetail />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />

            {/* Owner */}
            <Route path="/owner/login" element={<OwnerLogin />} />
            <Route path="/owner/register" element={<OwnerRegister />} />
            <Route path="/owner/dashboard" element={<ProtectedRoute><OwnerDashboard /></ProtectedRoute>} />
            <Route path="/owner/add-property" element={<ProtectedRoute><AddProperty /></ProtectedRoute>} />

            {/* Student (Protected) */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/report/new" element={<ProtectedRoute><ReportSubmit /></ProtectedRoute>} />
            <Route path="/report/:id" element={<ProtectedRoute><ReportDetail /></ProtectedRoute>} />
            <Route path="/my-reports" element={<ProtectedRoute><MyReports /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* Admin (Protected) */}
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/owner-verifications" element={<ProtectedRoute><AdminOwnerVerifications /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </ErrorBoundary>
  );
}
