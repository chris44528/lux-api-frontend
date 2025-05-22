import { Routes, Route, Navigate } from 'react-router-dom';
import StaffLayout from './layouts/StaffLayout';
import EngineerLayout from './layouts/EngineerLayout';
import Login from './components/Login';
import Register from './components/Register';
import LandingPage from './components/LandingPage';
import ForgotPasswordPage from './pages/auth/forgot-password';
import ResetPasswordPage from './pages/auth/reset-password';
import NotFound from './components/NotFound';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1b5e20] mx-auto mb-4"></div>
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" replace />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:uidb64/:token" element={<ResetPasswordPage />} />
        
        {/* Protected routes for authenticated users */}
        {user && (
          <Route 
            path="/*"
            element={
              <ProtectedRoute>
                {user.role === 'engineer' ? <EngineerLayout /> : <StaffLayout />}
              </ProtectedRoute>
            } 
          />
        )}
        
        {/* Catch-all routes */}
        {user ? (
          // If user is authenticated but hits an unknown route within the app
          <Route path="*" element={<NotFound />} />
        ) : (
          // If user is not authenticated, redirect to login
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
