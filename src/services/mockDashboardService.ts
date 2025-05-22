import { DashboardConfig } from "../types/dashboard";
import { v4 as uuidv4 } from "uuid";

// Mock dashboard data
const mockDashboards: DashboardConfig[] = [
  {
    id: "default",
    name: "Default Dashboard",
    widgets: [
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
      {
        id: uuidv4(),
        type: "siteDistribution",
        title: "Site Distribution",
        size: "2x2",
        groupBy: "region",
      },
    ],
    columns: 4,
    isDefault: true,
  },
  {
    id: "performance",
    name: "Performance Dashboard",
    widgets: [
      {
        id: uuidv4(),
        type: "energyProduction",
        title: "Daily Energy Production",
        size: "2x2",
        period: "day",
        chartType: "line",
      },
      {
        id: uuidv4(),
        type: "meterReadings",
        title: "Recent Meter Readings",
        size: "2x1",
        limit: 5,
      },
      {
        id: uuidv4(),
        type: "signalStrength",
        title: "Signal Strength Map",
        size: "2x2",
      },
    ],
    columns: 4,
  },
];

// Mock dashboard service
export const mockDashboardService = {
  /**
   * Get dashboard configurations for the current user
   * @returns Promise with dashboard configurations
   */
  getDashboards: async (): Promise<DashboardConfig[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Get dashboards from local storage or use mock data
    const savedDashboards = localStorage.getItem("dashboards");
    if (savedDashboards) {
      return JSON.parse(savedDashboards);
    }

    // Save mock dashboards to local storage
    localStorage.setItem("dashboards", JSON.stringify(mockDashboards));
    return mockDashboards;
  },

  /**
   * Save dashboard configurations for the current user
   * @param dashboards Dashboard configurations to save
   * @returns Promise with saved dashboard configurations
   */
  saveDashboards: async (
    dashboards: DashboardConfig[]
  ): Promise<DashboardConfig[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Save dashboards to local storage
    localStorage.setItem("dashboards", JSON.stringify(dashboards));
    return dashboards;
  },

  /**
   * Get a specific dashboard configuration
   * @param id Dashboard ID
   * @returns Promise with dashboard configuration
   */
  getDashboard: async (id: string): Promise<DashboardConfig> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Get dashboards from local storage or use mock data
    const savedDashboards = localStorage.getItem("dashboards");
    const dashboards = savedDashboards
      ? JSON.parse(savedDashboards)
      : mockDashboards;

    // Find dashboard by ID
    const dashboard = dashboards.find((d: DashboardConfig) => d.id === id);
    if (!dashboard) {
      throw new Error(`Dashboard with ID ${id} not found`);
    }

    return dashboard;
  },

  /**
   * Update a specific dashboard configuration
   * @param id Dashboard ID
   * @param dashboard Dashboard configuration to update
   * @returns Promise with updated dashboard configuration
   */
  updateDashboard: async (
    id: string,
    dashboard: DashboardConfig
  ): Promise<DashboardConfig> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Get dashboards from local storage or use mock data
    const savedDashboards = localStorage.getItem("dashboards");
    const dashboards = savedDashboards
      ? JSON.parse(savedDashboards)
      : mockDashboards;

    // Update dashboard and save to local storage
    const updatedDashboards = dashboards.map((d: DashboardConfig) =>
      d.id === id ? dashboard : d
    );
    localStorage.setItem("dashboards", JSON.stringify(updatedDashboards));

    return dashboard;
  },

  /**
   * Delete a specific dashboard configuration
   * @param id Dashboard ID
   * @returns Promise with success status
   */
  deleteDashboard: async (id: string): Promise<void> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Get dashboards from local storage or use mock data
    const savedDashboards = localStorage.getItem("dashboards");
    const dashboards = savedDashboards
      ? JSON.parse(savedDashboards)
      : mockDashboards;

    // Remove dashboard and save to local storage
    const filteredDashboards = dashboards.filter(
      (d: DashboardConfig) => d.id !== id
    );
    localStorage.setItem("dashboards", JSON.stringify(filteredDashboards));
  },
};

export default mockDashboardService;
