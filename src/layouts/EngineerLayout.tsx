import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import EngineerDashboardPage from '../pages/engineer/EngineerDashboardPage';
import SiteDetailPage from '../pages/sites/SiteDetailPage';
import ProtectedRoute from '../components/ProtectedRoute';
import NotFound from '../components/NotFound';
import BottomNav from '../components/engineer/navigation/BottomNav';
import storageService from '../services/offline/storageService';
import syncManager from '../services/sync/syncManager';
// Lazy load heavy components for better performance
const JobDetailPage = React.lazy(() => import('../pages/jobs/JobDetailPage'));
const FormBuilderPage = React.lazy(() => import('../pages/forms/FormBuilderPage'));
const FormListPage = React.lazy(() => import('../pages/forms/FormListPage'));
const RoutesPage = React.lazy(() => import('../pages/routes/RoutesPage'));
const HistoryPage = React.lazy(() => import('../pages/history/HistoryPage'));
const SettingsPage = React.lazy(() => import('../pages/settings/EngineerSettingsPage'));

function EngineerLayout() {
  useEffect(() => {
    // Initialize offline storage
    storageService.init().catch(console.error);
    
    // Store engineer ID from auth context/localStorage
    const engineerId = localStorage.getItem('currentEngineerId');
    if (!engineerId) {
      // Get from user context and store
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.engineer_id) {
        localStorage.setItem('currentEngineerId', user.engineer_id.toString());
      }
    }

    // Start auto-sync
    syncManager.startAutoSync();

    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }

    return () => {
      syncManager.stopAutoSync();
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-50 dark:bg-gray-900">
      {/* Mobile-optimized layout */}
      <main className="flex-1 pb-16"> {/* Padding bottom for bottom nav */}
        <React.Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        }>
          <Routes>
            <Route index element={<Navigate to="/engineer/dashboard" replace />} />
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
            <Route path="job/:jobId" element={
              <ProtectedRoute>
                <JobDetailPage />
              </ProtectedRoute>
            } />
            <Route path="routes" element={
              <ProtectedRoute>
                <RoutesPage />
              </ProtectedRoute>
            } />
            <Route path="forms" element={
              <ProtectedRoute>
                <FormListPage />
              </ProtectedRoute>
            } />
            <Route path="forms/new" element={
              <ProtectedRoute>
                <FormBuilderPage />
              </ProtectedRoute>
            } />
            <Route path="form/:formId" element={
              <ProtectedRoute>
                <FormBuilderPage />
              </ProtectedRoute>
            } />
            <Route path="history" element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            } />
            <Route path="settings" element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } />
            <Route path="report-issue" element={
              <ProtectedRoute>
                <FormBuilderPage isIssueReport />
              </ProtectedRoute>
            } />
            
            {/* Catch-all route for 404 within engineer area */}
            <Route path="*" element={
              <ProtectedRoute>
                <NotFound />
              </ProtectedRoute>
            } />
          </Routes>
        </React.Suspense>
      </main>
      
      {/* Bottom Navigation for mobile */}
      <BottomNav />
    </div>
  );
}

export default EngineerLayout; 