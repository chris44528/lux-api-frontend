import { Routes, Route, Navigate } from 'react-router-dom';
import StaffLayout from './layouts/StaffLayout';
// import EngineerLayout from './layouts/EngineerLayout'; // TODO: Add engineer layout support
import Login from './components/Login';
import Register from './components/Register';
import LandingPage from './components/LandingPage';
import ForgotPasswordPage from './pages/auth/forgot-password';
import ResetPasswordPage from './pages/auth/reset-password';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

// Import all the pages that were in StaffLayout
import NewDashboardPage from './pages/dashboard/NewDashboardPage';
import SitesPage from './pages/sites/SitesPage';
import SiteDetailPage from './pages/sites/SiteDetailPage';
import ReportBuilder from './components/report-builder';
import { ReadingReport } from './components/report-builder';
import { RDGReportPage, FCOReportPage } from './pages/reports';
import JobEngineerReportsPage from './pages/JobEngineerReportsPage';
import { JobTable } from './components/JobManagement/job-table';
import JobDetailsPage from './pages/jobs/job-detail-page';
import CalendarPage from './pages/calendar/page';
import ModernSettingsPage from './pages/settings/modern-page';
import JobCreatePage from './pages/jobs/new';
import BioMassPage from './pages/bio-mass/page';
import AnalysisPage from './pages/analysis/page';
import NotFound from './components/NotFound';
// Holiday imports
import HolidayCalendarPage from './pages/holidays/HolidayCalendarPage';
import HolidayRequestPage from './pages/holidays/HolidayRequestPage';
import MyRequestsPage from './pages/holidays/MyRequestsPage';
import EntitlementsPage from './pages/holidays/EntitlementsPage';
import ApprovalsPage from './pages/holidays/ApprovalsPage';

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
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:uidb64/:token" element={<ResetPasswordPage />} />
        
        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><StaffLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<NewDashboardPage />} />
          <Route path="sites" element={<SitesPage />} />
          <Route path="site/:siteId" element={<SiteDetailPage />} />
          <Route path="bio-mass" element={<BioMassPage />} />
          <Route path="analysis" element={<AnalysisPage />} />
          
          {/* Job Management Routes */}
          <Route path="jobs" element={<JobTable />} />
          <Route path="jobs/new" element={<JobCreatePage />} />
          <Route path="jobs/:id" element={<JobDetailsPage />} />
          <Route path="completed-jobs" element={<JobTable showOnlyCompleted={true} />} />
          <Route path="calendar" element={<CalendarPage />} />
          
          {/* Reports Routes */}
          <Route path="reports/builder" element={<ReportBuilder />} />
          <Route path="reports/reading" element={<ReadingReport />} />
          <Route path="reports/rdg" element={<RDGReportPage />} />
          <Route path="reports/fco" element={<FCOReportPage />} />
          <Route path="reports/job-dashboard" element={<JobEngineerReportsPage />} />
          
          {/* Holiday Routes */}
          <Route path="holidays/calendar" element={<HolidayCalendarPage />} />
          <Route path="holidays/request/new" element={<HolidayRequestPage />} />
          <Route path="holidays/request/:id" element={<HolidayRequestPage />} />
          <Route path="holidays/my-requests" element={<MyRequestsPage />} />
          <Route path="holidays/entitlements" element={<EntitlementsPage />} />
          <Route path="holidays/team" element={<div>Team View Page - Coming Soon</div>} />
          <Route path="holidays/approvals" element={<ApprovalsPage />} />
          <Route path="holidays/policies" element={<div>HR Policies Page - Coming Soon</div>} />
          <Route path="holidays/public" element={<div>Public Holidays Page - Coming Soon</div>} />
          
          {/* Imports Routes */}
          <Route path="imports/readings" element={<div>Import Readings Page</div>} />
          <Route path="imports/sites" element={<div>Import Sites Page</div>} />
          
          {/* Settings */}
          <Route path="settings" element={<ModernSettingsPage />} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
