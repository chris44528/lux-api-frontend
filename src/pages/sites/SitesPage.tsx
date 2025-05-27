import React from "react";
import SitesView from "../../components/SitesView";

function SitesPage() {
  // This page component might handle data fetching or context provisioning
  // specific to the sites page, if needed.
  // For now, it just renders the view component.
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SitesView />
    </div>
  );
}

export default SitesPage;
