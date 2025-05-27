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
  const { user } = useAuth();
  
  // If user is not authenticated, redirect to login
  if (!user) {
    // Store the current path for redirect after login
    localStorage.setItem('intendedRoute', location.pathname);
    return <Navigate to="/login" replace />;
  }

  // If a specific role is required and user doesn't have it
  if (requireRole && user.role !== requireRole) {
    return <Navigate to="/dashboard" replace />;
  }

  
  return <>{children}</>;
};

export default ProtectedRoute;
