import { ReactNode } from "react";

// Widget size options
export type WidgetSize = "1x1" | "1x2" | "2x1" | "2x2" | "2x3" | "3x2" | "3x3";

// Widget position in the grid
export interface WidgetPosition {
  x: number;
  y: number;
}

// Base widget configuration
export interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  size: WidgetSize;
  position?: WidgetPosition;
  refreshInterval?: number; // in milliseconds
}

// System Overview Widget
export interface SystemOverviewWidgetConfig extends WidgetConfig {
  type: "systemOverview";
}

// Recent Activity Widget
export interface RecentActivityWidgetConfig extends WidgetConfig {
  type: "recentActivity";
  limit?: number;
}

// Energy Production Widget
export interface EnergyProductionWidgetConfig extends WidgetConfig {
  type: "energyProduction";
  period?: "day" | "week" | "month" | "year";
  chartType?: "bar" | "line";
}

// Site Distribution Widget
export interface SiteDistributionWidgetConfig extends WidgetConfig {
  type: "siteDistribution";
  groupBy?: "region" | "status" | "type";
}

// Meter Readings Widget
export interface MeterReadingsWidgetConfig extends WidgetConfig {
  type: "meterReadings";
  siteId?: number;
  limit?: number;
}

// Signal Strength Widget
export interface SignalStrengthWidgetConfig extends WidgetConfig {
  type: "signalStrength";
  region?: string;
}

// Job Queue Widget
export interface JobQueueWidgetConfig extends WidgetConfig {
  type: "jobQueue";
  status?: string;
  limit?: number;
}

// Bio Boiler Status Widget
export interface BioBoilerStatusWidgetConfig extends WidgetConfig {
  type: "bioBoilerStatus";
  siteId?: number;
}

// Custom Report Widget
export interface CustomReportWidgetConfig extends WidgetConfig {
  type: "customReport";
  reportId?: string;
  query?: Record<string, unknown>;
}

// Quick Actions Widget
export interface QuickActionsWidgetConfig extends WidgetConfig {
  type: "quickActions";
  actions?: Array<{
    id: string;
    label: string;
    icon?: string;
    color?: string;
    url?: string;
    onClick?: () => void;
  }>;
}

// Recently Visited Sites Widget
export interface RecentVisitedSitesWidgetConfig extends WidgetConfig {
  type: "recentVisitedSites";
  limit?: number;
}

// Manager Dashboard Widget
export interface ManagerDashboardWidgetConfig extends WidgetConfig {
  type: "managerDashboard";
}

// Pending Approvals Widget
export interface PendingApprovalsWidgetConfig extends WidgetConfig {
  type: "pendingApprovals";
  limit?: number;
}

// Union type of all widget configurations
export type WidgetConfigUnion =
  | SystemOverviewWidgetConfig
  | RecentActivityWidgetConfig
  | EnergyProductionWidgetConfig
  | SiteDistributionWidgetConfig
  | MeterReadingsWidgetConfig
  | SignalStrengthWidgetConfig
  | JobQueueWidgetConfig
  | BioBoilerStatusWidgetConfig
  | CustomReportWidgetConfig
  | QuickActionsWidgetConfig
  | RecentVisitedSitesWidgetConfig
  | ManagerDashboardWidgetConfig
  | PendingApprovalsWidgetConfig;

// Dashboard configuration
export interface DashboardConfig {
  id: string;
  name: string;
  widgets: WidgetConfigUnion[];
  columns?: number;
  isDefault?: boolean;
}

// Widget render props for child components
export interface WidgetRenderProps {
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  isLoading: boolean;
  error: string | null;
}

// Widget component props
export interface WidgetProps {
  config: WidgetConfigUnion;
  onEdit?: (config: WidgetConfigUnion) => void;
  onRemove?: (id: string) => void;
  onResize?: (id: string, size: WidgetSize) => void;
  className?: string;
  children?: ReactNode | ((props: WidgetRenderProps) => ReactNode);
  dragHandleProps?: Record<string, any>;
}

// Dashboard state
export interface DashboardState {
  dashboards: DashboardConfig[];
  activeDashboard: string;
  isEditing: boolean;
}

// Dashboard context
export interface DashboardContextType {
  state: DashboardState;
  addWidget: (widget: WidgetConfigUnion) => void;
  removeWidget: (id: string) => void;
  updateWidget: (widget: WidgetConfigUnion) => void;
  moveWidget: (id: string, position: WidgetPosition) => void;
  resizeWidget: (id: string, size: WidgetSize) => void;
  createDashboard: (name: string) => void;
  switchDashboard: (id: string) => void;
  removeDashboard: (id: string) => void;
  toggleEditMode: () => void;
  saveDashboard: () => Promise<void>;
}
