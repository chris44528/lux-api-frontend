// This is a placeholder component that does nothing
// It exists only to prevent import errors after dashboard-header was removed
// This file should be deleted once all imports are properly removed

import React from "react";

export const DashboardHeader: React.FC = () => {
  console.warn("DashboardHeader component is deprecated. Please remove it from your imports.");
  return null;
}; 