import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from '@/components/layout/Layout';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Landing } from '@/pages/Landing';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { OTPVerificationPage } from '@/pages/OTPVerification';
import { Dashboard } from '@/pages/Dashboard';
import { ReportSubmit } from '@/pages/ReportSubmit';
import { ReportDetail } from '@/pages/ReportDetail';
import { MapView } from '@/pages/MapView';
import { NotFound } from '@/pages/NotFound';
import { useAuthStore } from '@/stores/authStore';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '12px', background: '#1E293B', color: '#fff', fontSize: '14px' } }} />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<OTPVerificationPage />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/report/new" element={<ProtectedRoute><ReportSubmit /></ProtectedRoute>} />
            <Route path="/report/:id" element={<ProtectedRoute><ReportDetail /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
