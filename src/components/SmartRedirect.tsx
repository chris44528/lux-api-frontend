import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIPermissionContext } from '../contexts/UIPermissionContext';

const SmartRedirect: React.FC = () => {
  const navigate = useNavigate();
  const { permissions, isLoaded } = useUIPermissionContext();

  useEffect(() => {
    if (!isLoaded) return;

    // Define routes in order of preference
    const routePermissionMap = [
      { path: '/dashboard', permission: 'dashboard.module.root' },
      { path: '/sites', permission: 'sites.module.root' },
      { path: '/bio-mass', permission: 'bio.module.root' },
      { path: '/analysis', permission: 'analysis.module.root' },
      { path: '/jobs', permission: 'jobs.module.root' },
      { path: '/reports/builder', permission: 'reports.module.root' },
      { path: '/holidays/calendar', permission: 'holidays.module.root' },
      { path: '/settings', permission: 'settings.module.root' },
    ];

    // Find the first route the user has permission for
    for (const route of routePermissionMap) {
      if (permissions[route.permission]) {
        navigate(route.path, { replace: true });
        return;
      }
    }

    // If no permissions found, redirect to access denied
    navigate('/access-denied', { replace: true });
  }, [permissions, isLoaded, navigate]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1b5e20] mx-auto mb-4"></div>
        <div className="text-gray-600">Finding your workspace...</div>
      </div>
    </div>
  );
};

export default SmartRedirect;