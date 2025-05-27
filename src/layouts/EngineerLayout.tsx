import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import EngineerDashboardPage from '../pages/dashboard/EngineerDashboardPage'; // To be created
import SiteDetailPage from '../pages/sites/SiteDetailPage'; // To be created
import ProtectedRoute from '../components/ProtectedRoute';
import NotFound from '../components/NotFound';
// Import any engineer-specific layout components (e.g., BottomNav)

function EngineerLayout() {
  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-50 dark:bg-gray-900">
      {/* Engineer-specific Header? */}
      <main className="flex-1 p-4"> {/* Mobile-friendly padding */}
        <Routes>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={
            <ProtectedRoute>
              <EngineerDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="site/:siteId" element={
            <ProtectedRoute>
              <SiteDetailPage />
            </ProtectedRoute>
          } />
          {/* Add other engineer-specific routes here if any */}
          {/* e.g., maybe a dedicated route for meter reading actions? */}

          {/* Catch-all route for 404 within engineer area */}
          <Route path="*" element={
            <ProtectedRoute>
              <NotFound />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
      {/* Engineer-specific Footer or Bottom Navigation? */}
      {/* <BottomNav /> */}
    </div>
  );
}

export default EngineerLayout; 