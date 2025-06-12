import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUIPermissionContext } from '../contexts/UIPermissionContext';

interface PermissionProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requireRole?: 'staff' | 'engineer';
  fallbackPath?: string;
}

const PermissionProtectedRoute: React.FC<PermissionProtectedRouteProps> = ({ 
  children, 
  requiredPermission,
  requireRole,
  fallbackPath = '/access-denied'
}) => {
  const location = useLocation();
  const { user } = useAuth();
  const { permissions, isLoaded } = useUIPermissionContext();
  
  // If user is not authenticated, redirect to login
  if (!user) {
    localStorage.setItem('intendedRoute', location.pathname);
    return <Navigate to="/login" replace />;
  }

  // If a specific role is required and user doesn't have it
  if (requireRole && user.role !== requireRole) {
    return <Navigate to={fallbackPath} state={{ from: location.pathname }} replace />;
  }

  // Wait for permissions to load
  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1b5e20] mx-auto mb-4"></div>
          <div className="text-gray-600">Loading permissions...</div>
        </div>
      </div>
    );
  }

  // Check if user has the required permission
  if (requiredPermission && !permissions[requiredPermission]) {
    console.warn(`Access denied: User lacks permission "${requiredPermission}" for route "${location.pathname}"`);
    return <Navigate to={fallbackPath} state={{ from: location.pathname, permission: requiredPermission }} replace />;
  }

  return <>{children}</>;
};

export default PermissionProtectedRoute;