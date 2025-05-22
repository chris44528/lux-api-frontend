import api from "./api";
import { DashboardConfig } from "../types/dashboard";

/**
 * Dashboard API service
 * Provides methods for interacting with the dashboard configuration API
 */
export const dashboardService = {
  /**
   * Get dashboard configurations for the current user
   * @returns Promise with dashboard configurations
   */
  getDashboards: async (): Promise<DashboardConfig[]> => {
    try {
      const response = await api.get("/dashboard-config/");
      // Extract config objects from API response
      return response.data.map((item: any) => item.config);
    } catch (error) {
      console.error("Error fetching dashboards:", error);
      throw error;
    }
  },

  /**
   * Save dashboard configurations for the current user
   * @param dashboards Dashboard configurations to save
   * @returns Promise with saved dashboard configurations
   */
  saveDashboards: async (
    dashboards: DashboardConfig[]
  ): Promise<DashboardConfig[]> => {
    try {
      const response = await api.post("/dashboard-config/", dashboards);
      // Extract config objects from API response
      return response.data.map((item: any) => item.config);
    } catch (error) {
      console.error("Error saving dashboards:", error);
      throw error;
    }
  },

  /**
   * Get a specific dashboard configuration
   * @param id Dashboard ID
   * @returns Promise with dashboard configuration
   */
  getDashboard: async (id: string): Promise<DashboardConfig> => {
    try {
      const response = await api.get(`/dashboard-config/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching dashboard ${id}:`, error);
      throw error;
    }
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
    try {
      const response = await api.put(`/dashboard-config/${id}/`, dashboard);
      return response.data;
    } catch (error) {
      console.error(`Error updating dashboard ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a specific dashboard configuration
   * @param id Dashboard ID
   * @returns Promise with success status
   */
  deleteDashboard: async (id: string): Promise<void> => {
    try {
      await api.delete(`/dashboard-config/${id}/`);
    } catch (error) {
      console.error(`Error deleting dashboard ${id}:`, error);
      throw error;
    }
  },
};

export default dashboardService;
