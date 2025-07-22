import { Routes, Route, Navigate } from 'react-router-dom';
import StaffLayout from './layouts/StaffLayout';
import EngineerLayout from './layouts/EngineerLayout';
import Login from './components/Login';
import Register from './components/Register';
import LandingPage from './components/LandingPage';
import ForgotPasswordPage from './pages/auth/forgot-password';
import ResetPasswordPage from './pages/auth/reset-password';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import PermissionProtectedRoute from './components/PermissionProtectedRoute';
import AccessDenied from './components/AccessDenied';
import SmartRedirect from './components/SmartRedirect';
import { useAuth } from './hooks/useAuth';

// Import all the pages that were in StaffLayout
import FixedDashboardPage from './pages/dashboard/FixedDashboardPage';
import SitesPage from './pages/sites/SitesPage';
import SiteDetailPage from './pages/sites/SiteDetailPage';
import ReportBuilder from './components/report-builder';
import { ReadingReport } from './components/report-builder';
import { RDGReportPage, FCOReportPage } from './pages/reports';
import JobEngineerReportsPage from './pages/JobEngineerReportsPage';
import LegalReportPage from './pages/reports/LegalReportPage';
import TempRemovalReportPage from './pages/reports/TempRemovalReportPage';
import { JobTable } from './components/JobManagement/job-table';
import JobDetailsPage from './pages/jobs/job-detail-page';
import CalendarPage from './pages/calendar/page';
import ModernSettingsPage from './pages/settings/modern-page';
import JobCreatePage from './pages/jobs/new';
import PostcardsManagement from './pages/postcards';
import BioMassPage from './pages/bio-mass/page';
import AnalysisPage from './pages/analysis/page';
import NotFound from './components/NotFound';
// Holiday imports
import HolidayCalendarPage from './pages/holidays/HolidayCalendarPage';
import HolidayRequestPage from './pages/holidays/HolidayRequestPage';
import MyRequestsPage from './pages/holidays/MyRequestsPage';
import EntitlementsPage from './pages/holidays/EntitlementsPage';
import ApprovalsPage from './pages/holidays/ApprovalsPage';
// Engineer imports
import RouteAllocationPage from './pages/engineer/RouteAllocationPage';
import FormBuilderPage from './pages/engineer/FormBuilderPage';
import LocationTrackerPage from './pages/engineer/LocationTrackerPage';
// Import pages
import BulkSystemNotesPage from './pages/imports/BulkSystemNotesPage';
// Aged Cases imports
import AgedCasesPage from './pages/aged-cases';
import AgedCaseDetailPage from './pages/aged-cases/[id]';
import AgedCaseSettingsPage from './pages/aged-cases/settings';
// Transfer imports
import TransfersListView from './pages/transfers/TransfersListView';
import TransferDetailView from './pages/transfers/TransferDetailView';
import PublicTransferForm from './pages/transfers/PublicTransferForm';
import TransferSuccessPage from './pages/transfers/TransferSuccessPage';
import TransferReviewDashboard from './pages/transfers/TransferReviewDashboard';
import TransferAnalytics from './pages/transfers/TransferAnalytics';

function App() {
  const { user, loading } = useAuth();

  // Don't render routes until auth is checked
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

  // Check if user should use engineer interface
  const isEngineerUser = user?.role === 'engineer';

  return (
    <ErrorBoundary>
      <Routes>
        {/* Public routes - These must come first and be outside any layout */}
        <Route path="/login" element={
          user ? (
            // If user is logged in, redirect based on role
            <Navigate to={user.role === 'engineer' ? "/engineer/dashboard" : "/dashboard"} replace />
          ) : (
            <Login />
          )
        } />
        <Route path="/register" element={user ? <Navigate to={isEngineerUser ? "/engineer/dashboard" : "/dashboard"} replace /> : <Register />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />
        
        {/* Public transfer form routes */}
        <Route path="/transfer/:token" element={<PublicTransferForm />} />
        <Route path="/transfer/success" element={<TransferSuccessPage />} />
        
        {/* Engineer routes */}
        <Route path="/engineer/*" element={
          <ProtectedRoute>
            <EngineerLayout />
          </ProtectedRoute>
        } />
        
        {/* Root redirect */}
        <Route path="/" element={
          <ProtectedRoute>
            {user ? (
              user.role === 'engineer' ? 
                <Navigate to="/engineer/dashboard" replace /> : 
                <SmartRedirect />
            ) : (
              <Navigate to="/login" replace />
            )}
          </ProtectedRoute>
        } />
        
        {/* Access Denied route */}
        <Route path="/access-denied" element={<AccessDenied />} />
        
        {/* Staff routes with layout */}
        <Route element={<ProtectedRoute><StaffLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<FixedDashboardPage />} />
          <Route path="sites" element={
            <PermissionProtectedRoute requiredPermission="sites.module.root">
              <SitesPage />
            </PermissionProtectedRoute>
          } />
          <Route path="site/:siteId" element={
            <PermissionProtectedRoute requiredPermission="sites.detail.view">
              <SiteDetailPage />
            </PermissionProtectedRoute>
          } />
          <Route path="bio-mass" element={
            <PermissionProtectedRoute requiredPermission="bio.module.root">
              <BioMassPage />
            </PermissionProtectedRoute>
          } />
          <Route path="analysis" element={
            <PermissionProtectedRoute requiredPermission="analysis.module.root">
              <AnalysisPage />
            </PermissionProtectedRoute>
          } />
          
          {/* Job Management Routes */}
          <Route path="jobs" element={
            <PermissionProtectedRoute requiredPermission="jobs.module.root">
              <JobTable />
            </PermissionProtectedRoute>
          } />
          <Route path="jobs/new" element={
            <PermissionProtectedRoute requiredPermission="jobs.list.create_button">
              <JobCreatePage />
            </PermissionProtectedRoute>
          } />
          <Route path="jobs/:id" element={
            <PermissionProtectedRoute requiredPermission="jobs.detail.view">
              <JobDetailsPage />
            </PermissionProtectedRoute>
          } />
          <Route path="completed-jobs" element={
            <PermissionProtectedRoute requiredPermission="jobs.module.root">
              <JobTable showOnlyCompleted={true} />
            </PermissionProtectedRoute>
          } />
          <Route path="calendar" element={
            <PermissionProtectedRoute requiredPermission="calendar.module.root">
              <CalendarPage />
            </PermissionProtectedRoute>
          } />
          <Route path="postcards" element={
            <PermissionProtectedRoute requiredPermission="jobs.postcards.view">
              <PostcardsManagement />
            </PermissionProtectedRoute>
          } />
          
          {/* Reports Routes */}
          <Route path="reports/builder" element={
            <PermissionProtectedRoute requiredPermission="reports.custom.create">
              <ReportBuilder />
            </PermissionProtectedRoute>
          } />
          <Route path="reports/reading" element={
            <PermissionProtectedRoute requiredPermission="reports.module.root">
              <ReadingReport />
            </PermissionProtectedRoute>
          } />
          <Route path="reports/rdg" element={
            <PermissionProtectedRoute requiredPermission="reports.rdg.view">
              <RDGReportPage />
            </PermissionProtectedRoute>
          } />
          <Route path="reports/fco" element={
            <PermissionProtectedRoute requiredPermission="reports.fco.view">
              <FCOReportPage />
            </PermissionProtectedRoute>
          } />
          <Route path="reports/job-dashboard" element={
            <PermissionProtectedRoute requiredPermission="reports.module.root">
              <JobEngineerReportsPage />
            </PermissionProtectedRoute>
          } />
          <Route path="reports/legal" element={
            <PermissionProtectedRoute requiredPermission="reports.module.root">
              <LegalReportPage />
            </PermissionProtectedRoute>
          } />
          <Route path="reports/temp-removals" element={
            <PermissionProtectedRoute requiredPermission="reports.module.root">
              <TempRemovalReportPage />
            </PermissionProtectedRoute>
          } />
          
          {/* Holiday Routes */}
          <Route path="holidays/calendar" element={
            <PermissionProtectedRoute requiredPermission="holidays.calendar.view">
              <HolidayCalendarPage />
            </PermissionProtectedRoute>
          } />
          <Route path="holidays/request/new" element={
            <PermissionProtectedRoute requiredPermission="holidays.my.request">
              <HolidayRequestPage />
            </PermissionProtectedRoute>
          } />
          <Route path="holidays/request/:id" element={
            <PermissionProtectedRoute requiredPermission="holidays.my.request">
              <HolidayRequestPage />
            </PermissionProtectedRoute>
          } />
          <Route path="holidays/my-requests" element={
            <PermissionProtectedRoute requiredPermission="holidays.my.view">
              <MyRequestsPage />
            </PermissionProtectedRoute>
          } />
          <Route path="holidays/entitlements" element={
            <PermissionProtectedRoute requiredPermission="holidays.entitlements.view">
              <EntitlementsPage />
            </PermissionProtectedRoute>
          } />
          <Route path="holidays/team" element={
            <PermissionProtectedRoute requiredPermission="holidays.module.root">
              <div>Team View Page - Coming Soon</div>
            </PermissionProtectedRoute>
          } />
          <Route path="holidays/approvals" element={
            <PermissionProtectedRoute requiredPermission="holidays.entitlements.approve">
              <ApprovalsPage />
            </PermissionProtectedRoute>
          } />
          <Route path="holidays/policies" element={
            <PermissionProtectedRoute requiredPermission="holidays.policies.view">
              <div>HR Policies Page - Coming Soon</div>
            </PermissionProtectedRoute>
          } />
          <Route path="holidays/public" element={
            <PermissionProtectedRoute requiredPermission="holidays.policies.view">
              <div>Public Holidays Page - Coming Soon</div>
            </PermissionProtectedRoute>
          } />
          
          {/* Imports Routes */}
          <Route path="imports/readings" element={
            <PermissionProtectedRoute requiredPermission="imports.csv.upload">
              <div>Import Readings Page</div>
            </PermissionProtectedRoute>
          } />
          <Route path="imports/sites" element={
            <PermissionProtectedRoute requiredPermission="imports.csv.upload">
              <div>Import Sites Page</div>
            </PermissionProtectedRoute>
          } />
          <Route path="imports/bulk-notes" element={
            <PermissionProtectedRoute requiredPermission="imports.csv.upload">
              <BulkSystemNotesPage />
            </PermissionProtectedRoute>
          } />
          
          {/* Engineer Management Routes for Admin/Management */}
          <Route path="engineer/forms/builder" element={
            <PermissionProtectedRoute requiredPermission="jobs.module.root">
              <FormBuilderPage />
            </PermissionProtectedRoute>
          } />
          <Route path="engineer/routes/builder" element={
            <PermissionProtectedRoute requiredPermission="jobs.module.root">
              <RouteAllocationPage />
            </PermissionProtectedRoute>
          } />
          <Route path="engineer/job-allocation" element={
            <PermissionProtectedRoute requiredPermission="jobs.module.root">
              <RouteAllocationPage />
            </PermissionProtectedRoute>
          } />
          <Route path="engineer/location-tracker" element={
            <PermissionProtectedRoute requiredPermission="jobs.module.root">
              <LocationTrackerPage />
            </PermissionProtectedRoute>
          } />
          
          {/* Aged Cases Routes */}
          <Route path="aged-cases" element={
            <PermissionProtectedRoute requiredPermission="jobs.module.root">
              <AgedCasesPage />
            </PermissionProtectedRoute>
          } />
          <Route path="aged-cases/settings" element={
            <PermissionProtectedRoute requiredPermission="settings.module.root">
              <AgedCaseSettingsPage />
            </PermissionProtectedRoute>
          } />
          <Route path="aged-cases/:id" element={
            <PermissionProtectedRoute requiredPermission="jobs.module.root">
              <AgedCaseDetailPage />
            </PermissionProtectedRoute>
          } />
          
          {/* Transfer Routes */}
          <Route path="transfers" element={
            <PermissionProtectedRoute requiredPermission="sites.module.root">
              <TransfersListView />
            </PermissionProtectedRoute>
          } />
          <Route path="transfers/analytics" element={
            <PermissionProtectedRoute requiredPermission="sites.module.root">
              <TransferAnalytics />
            </PermissionProtectedRoute>
          } />
          <Route path="transfers/:id" element={
            <PermissionProtectedRoute requiredPermission="sites.module.root">
              <TransferDetailView />
            </PermissionProtectedRoute>
          } />
          <Route path="transfers/:id/review" element={
            <PermissionProtectedRoute requiredPermission="sites.module.root">
              <TransferReviewDashboard />
            </PermissionProtectedRoute>
          } />
          
          {/* Settings */}
          <Route path="settings" element={
            <PermissionProtectedRoute requiredPermission="settings.module.root">
              <ModernSettingsPage />
            </PermissionProtectedRoute>
          } />
          
        </Route>
        
        {/* Global catch-all for 404s - must be last */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
