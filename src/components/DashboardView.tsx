import React, { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { DashboardProvider, useDashboard } from "../contexts/DashboardContext";
import { WidgetConfigUnion } from "../types/dashboard";
import { DashboardGrid } from "./dashboard/DashboardGrid";
import { DashboardTabs } from "./dashboard/DashboardTabs";

// Dashboard content component
const DashboardContent: React.FC = () => {
  const { state, addWidget } = useDashboard();
  const { dashboards, activeDashboard } = state;

  // Initialize the dashboard with default widgets if empty
  useEffect(() => {
    const dashboard = dashboards.find((d) => d.id === activeDashboard);
    if (dashboard && (!dashboard.widgets || dashboard.widgets.length === 0)) {
      // Add default widgets - now with more unique and non-duplicate widgets
      const defaultWidgets = [
        {
          id: uuidv4(),
          type: "systemOverview",
          title: "System Overview",
          size: "1x1",
        },
        {
          id: uuidv4(),
          type: "recentActivity",
          title: "Recent Activity",
          size: "1x1",
        },
        {
          id: uuidv4(),
          type: "quickActions",
          title: "Quick Actions",
          size: "2x1",
        },
        {
          id: uuidv4(),
          type: "energyProduction",
          title: "Energy Production",
          size: "2x2",
          period: "month",
          chartType: "bar",
        },
      ];

      // Add each widget to the dashboard
      defaultWidgets.forEach((widget) => {
        addWidget(widget as WidgetConfigUnion);
      });
    }
  }, [dashboards, activeDashboard, addWidget]);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Solar Dashboard</h1>
          <p className="text-sm text-gray-500">Monitoring solar installations and performance</p>
        </div>

        <DashboardTabs />
        <DashboardGrid />
      </main>
    </div>
  );
};

// Main dashboard component with provider
const DashboardView: React.FC = () => {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
};

export default DashboardView;