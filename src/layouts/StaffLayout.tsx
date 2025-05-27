import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { DebugPermissions } from "../components/DebugPermissions";

/**
 * Main layout for staff users
 * Uses the new Sidebar for navigation and has no top header
 */
function StaffLayout() {
  return (
    <div className="flex min-h-screen w-full bg-gray-50 dark:bg-gray-900">
      <DebugPermissions />
      <Sidebar /> {/* Use our new Sidebar component */}
      <div className="flex-1 flex flex-col">
        {/* <Header /> */} {/* Placeholder for potential common header */}
        <main className="flex-1 p-4 md:p-6">
          {/* Use Outlet to render child routes */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default React.memo(StaffLayout);
