import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import NewDashboardPage from "../pages/dashboard/NewDashboardPage";
import SitesPage from "../pages/sites/SitesPage";
import SiteDetailPage from "../pages/sites/SiteDetailPage";
// Import other necessary pages/components used by staff
import ReportBuilder from "../components/report-builder";
import { ReadingReport } from "../components/report-builder"; // Assuming this is staff-only or shared
import { RDGReportPage, FCOReportPage } from "../pages/reports"; // Import the new RDG and FCO Report pages
import JobEngineerReportsPage from "../pages/JobEngineerReportsPage"; // Import the new Job Report Dashboard page
import { JobTable } from "../components/JobManagement/job-table"; // Assuming this is staff-only or shared
import JobDetailsPage from "../pages/jobs/job-detail-page";
import CalendarPage from "../pages/calendar/page";
import SettingsPage from "../pages/settings/page";
import JobCreatePage from "../pages/jobs/new";
import BioMassPage from "../pages/bio-mass/page";
import AnalysisPage from "../pages/analysis/page";
import ProtectedRoute from "../components/ProtectedRoute";
import Sidebar from "../components/Sidebar";
import NotFound from "../components/NotFound";

/**
 * Main layout for staff users
 * Uses the new Sidebar for navigation and has no top header
 */
function StaffLayout() {
  return (
    <div className="flex min-h-screen w-full bg-gray-50 dark:bg-gray-900">
      <Sidebar /> {/* Use our new Sidebar component */}
      <div className="flex-1 flex flex-col">
        {/* <Header /> */} {/* Placeholder for potential common header */}
        <main className="flex-1 p-4 md:p-6">
          {" "}
          {/* Adjust padding as needed */}
          <Routes>
            {/* Redirect base path to dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* Routes from original App.tsx wrapped in ProtectedRoute */}
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <NewDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="sites"
              element={
                <ProtectedRoute>
                  <SitesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="site/:siteId"
              element={
                <ProtectedRoute>
                  <SiteDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports/builder"
              element={
                <ProtectedRoute>
                  <ReportBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports/reading"
              element={
                <ProtectedRoute>
                  <ReadingReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports/rdg"
              element={
                <ProtectedRoute>
                  <RDGReportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports/fco"
              element={
                <ProtectedRoute>
                  <FCOReportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports/job-dashboard"
              element={
                <ProtectedRoute>
                  <JobEngineerReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="jobs"
              element={
                <ProtectedRoute>
                  {/* Assuming JobTable shows pending jobs by default */}
                  <JobTable />
                </ProtectedRoute>
              }
            />
            <Route
              path="jobs/new"
              element={
                <ProtectedRoute>
                  <JobCreatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="jobs/:id"
              element={
                <ProtectedRoute>
                  <JobDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="completed-jobs"
              element={
                <ProtectedRoute>
                  <JobTable /* filter="completed" */ />
                </ProtectedRoute>
              }
            />
            <Route
              path="calendar"
              element={
                <ProtectedRoute>
                  <CalendarPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="bio-mass"
              element={
                <ProtectedRoute>
                  <BioMassPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="analysis"
              element={
                <ProtectedRoute>
                  <AnalysisPage />
                </ProtectedRoute>
              }
            />

            {/* Imports Routes can be added here */}
            <Route
              path="imports/readings"
              element={
                <ProtectedRoute>
                  {/* TODO: Create ImportReadingsPage component */}
                  <div>Import Readings Page</div>
                </ProtectedRoute>
              }
            />
            <Route
              path="imports/sites"
              element={
                <ProtectedRoute>
                  {/* TODO: Create ImportSitesPage component */}
                  <div>Import Sites Page</div>
                </ProtectedRoute>
              }
            />

            {/* Catch-all route for 404 within staff area */}
            <Route path="*" element={
              <ProtectedRoute>
                <NotFound />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default StaffLayout;
