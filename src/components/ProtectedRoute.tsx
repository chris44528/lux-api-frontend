import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'staff' | 'engineer';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireRole 
}) => {
  const location = useLocation();
  const { user, loading } = useAuth();
  
  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1b5e20] mx-auto mb-2"></div>
          <div className="text-gray-600 text-sm">Verifying access...</div>
        </div>
      </div>
    );
  }
  
  // If user is not authenticated, redirect to login
  if (!user) {
    console.log('ProtectedRoute - Not authenticated, redirecting to login');
    // Store the current path for redirect after login
    localStorage.setItem('intendedRoute', location.pathname);
    return <Navigate to="/login" replace />;
  }

  // If a specific role is required and user doesn't have it
  if (requireRole && user.role !== requireRole) {
    console.log(`ProtectedRoute - Access denied. Required: ${requireRole}, User has: ${user.role}`);
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this area.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-[#1b5e20] text-white px-4 py-2 rounded hover:bg-[#154a19] transition-colors mr-2"
          >
            Go Back
          </button>
          <Navigate to="/dashboard" replace />
        </div>
      </div>
    );
  }

  console.log('ProtectedRoute - Access granted', { 
    path: location.pathname, 
    user: user.username, 
    role: user.role 
  });
  
  return <>{children}</>;
};

export default ProtectedRoute;
