import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "../../contexts/DashboardContext";
import { 
  WidgetConfigUnion, 
  WidgetPosition,
  SystemOverviewWidgetConfig,
  RecentActivityWidgetConfig,
  EnergyProductionWidgetConfig,
  SiteDistributionWidgetConfig,
  QuickActionsWidgetConfig,
  RecentVisitedSitesWidgetConfig
} from "../../types/dashboard";
import { Widget } from "./Widget";
import { PlusCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { WidgetLibrary } from "./WidgetLibrary";
import { getSystemStatusSummary, getRecentActivities, getSitePerformanceMetrics, getSiteDistribution } from "../../services/api";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Line, LineChart, Tooltip
} from "recharts";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableWidget } from './SortableWidget';
import { createPortal } from 'react-dom';
import { RecentVisitedSitesWidget } from '@/pages/dashboard/RecentVisitedSitesWidget';

interface DashboardGridProps {
  dashboardId?: string;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  dashboardId,
}) => {
  const { state, addWidget, toggleEditMode, moveWidget, saveDashboard } = useDashboard();
  const { dashboards, activeDashboard, isEditing } = state;
  const [activeWidget, setActiveWidget] = useState<WidgetConfigUnion | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Get the active dashboard
  const dashboard = dashboardId
    ? dashboards.find((d) => d.id === dashboardId)
    : dashboards.find((d) => d.id === activeDashboard);

  if (!dashboard) {
    // If no dashboard is found, use the first available one or show error
    const fallbackDashboard = dashboards.length > 0 ? dashboards[0] : null;
    
    if (!fallbackDashboard) {
      return (
        <div className="p-8 text-center">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">No dashboard available</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Your dashboard could not be loaded.</p>
          <Button onClick={toggleEditMode}>Create Dashboard</Button>
        </div>
      );
    }
    
    // Use the first dashboard as fallback
    return <DashboardGrid dashboardId={fallbackDashboard.id} />;
  }

  // Get the number of columns for the grid
  const columns = dashboard.columns || 4;
  
  // Setup sensors for drag events
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8, // Require the mouse to move 8px before activating
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // Delay of 200ms before touch activates dragging
        tolerance: 5, // Allow a slight movement before activation
      },
    })
  );

  // Use sortable widget ids
  const widgetIds = useMemo(() => dashboard.widgets?.map((widget) => widget.id) || [], [dashboard.widgets]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const widgetId = active.id as string;
    const widgetConfig = dashboard.widgets?.find((widget) => widget.id === widgetId);
    if (widgetConfig) {
      setActiveWidget(widgetConfig);
    }
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveWidget(null);
    
    if (over && active.id !== over.id && dashboard.widgets) {
      const oldIndex = dashboard.widgets.findIndex((widget) => widget.id === active.id);
      const newIndex = dashboard.widgets.findIndex((widget) => widget.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newWidgets = arrayMove(dashboard.widgets, oldIndex, newIndex);
        
        // Update positions for widgets that moved
        newWidgets.forEach((widget, index) => {
          const position: WidgetPosition = {
            x: index % columns,
            y: Math.floor(index / columns)
          };
          moveWidget(widget.id, position);
        });
        
        // Save the dashboard after repositioning
        saveDashboardAfterReposition();
      }
    }
  };
  
  // Debounced function to save dashboard after repositioning
  const saveDashboardAfterReposition = () => {
    // Create a debounced function that only fires after repositioning is complete
    let timeoutId: ReturnType<typeof setTimeout>;
    
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      saveDashboard().catch(error => {
      });
    }, 1000); // 1 second delay
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">{dashboard.name}</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="text-sm"
            title="Refresh Dashboard"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
          
          {isEditing && (
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="default" 
                  className="flex items-center gap-1 text-sm"
                  disabled={(dashboard.widgets || []).length >= 10}
                  title={(dashboard.widgets || []).length >= 10 ? "Widget limit reached (10 maximum)" : "Add a new widget"}
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Widget ({(dashboard.widgets || []).length}/10)
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add Widget</DialogTitle>
                </DialogHeader>
                {(dashboard.widgets || []).length >= 10 ? (
                  <div className="text-center py-8">
                    <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Widget Limit Reached
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      You've reached the maximum of 10 widgets per dashboard. 
                      Please remove a widget or create a new dashboard to add more.
                    </p>
                  </div>
                ) : (
                  <WidgetLibrary onAddWidget={(widget) => {
                    addWidget(widget);
                    // Auto-save after adding a widget
                    setTimeout(() => {
                      saveDashboard().catch(error => {
                      });
                    }, 500);
                  }} />
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={widgetIds} strategy={rectSortingStrategy}>
          <div
            className={`grid gap-4 auto-rows-[minmax(160px,auto)]`}
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {dashboard.widgets?.map((widget) => (
              <SortableWidget key={widget.id} id={widget.id}>
                <WidgetRenderer config={widget} />
              </SortableWidget>
            )) || []}
          </div>
        </SortableContext>
        
        {activeWidget && typeof document !== 'undefined' && createPortal(
          <DragOverlay adjustScale={false}>
            <div className="opacity-70">
              <WidgetRenderer config={activeWidget} />
            </div>
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </div>
  );
};

// Widget renderer component
interface WidgetRendererProps {
  config: WidgetConfigUnion;
}

const WidgetRenderer: React.FC<WidgetRendererProps> = ({ config }) => {
  // Render the appropriate widget based on the type
  switch (config.type) {
    case "systemOverview":
      return <SystemOverviewWidget config={config} />;
    case "recentActivity":
      return <RecentActivityWidget config={config} />;
    case "energyProduction":
      return <EnergyProductionWidget config={config} />;
    case "siteDistribution":
      return <SiteDistributionWidget config={config} />;
    case "quickActions":
      return <QuickActionsWidget config={config} />;
    case "recentVisitedSites":
      return (
        <Widget config={config}>
          <RecentVisitedSitesWidget />
        </Widget>
      );
    // Add more widget types as needed
    default:
      return (
        <Widget config={config}>
          <div className="text-center text-gray-500 dark:text-gray-400">
            Unknown widget type: {config.type}
          </div>
        </Widget>
      );
  }
};

// System Status data type
interface SystemStatusData {
  status: string;
  message: string;
  lastUpdated: string;
  metrics: {
    totalSites: number;
    activeSites: number;
    sitesWithIssues: number;
    offlineSites: number;
  };
}

// System Overview Widget Component
const SystemOverviewWidget: React.FC<{ config: SystemOverviewWidgetConfig }> = ({ config }) => {
  const [data, setData] = useState<SystemStatusData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getSystemStatusSummary();
        setData(result);
      } catch (err) {
        setError("Failed to load system status");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Refresh data every 5 minutes
    const intervalId = setInterval(fetchData, 300000);
    return () => clearInterval(intervalId);
  }, []);

  if (isLoading) {
    return <Widget config={config}><div>Loading system status...</div></Widget>;
  }

  if (error) {
    return <Widget config={config}><div className="text-red-500 dark:text-red-400">{error}</div></Widget>;
  }

  if (!data) {
    return <Widget config={config}><div>No data available</div></Widget>;
  }

  // Calculate health percentage
  const healthPercentage = ((data.metrics.activeSites / data.metrics.totalSites) * 100).toFixed(1);

  return (
    <Widget config={config}>
      <div className="h-full flex flex-col">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {data.metrics.totalSites.toLocaleString()}
            </div>
            <div className="text-xs text-amber-800 dark:text-amber-300">Total Meters</div>
          </div>
          
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {data.metrics.activeSites.toLocaleString()}
            </div>
            <div className="text-xs text-green-800 dark:text-green-300">Active Meters</div>
          </div>
          
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {data.metrics.offlineSites.toLocaleString()}
            </div>
            <div className="text-xs text-red-800 dark:text-red-300">Disconnected</div>
          </div>
          
          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {data.metrics.sitesWithIssues.toLocaleString()}
            </div>
            <div className="text-xs text-orange-800 dark:text-orange-300">Zero Reads</div>
          </div>
        </div>
        
        <div className="mt-auto">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">System Health</span>
            <span className="font-bold text-green-600 dark:text-green-400">{healthPercentage}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
            <div 
              className="h-2 bg-green-500 dark:bg-green-400 rounded-full" 
              style={{ width: `${healthPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    </Widget>
  );
};

// Activity data type
interface ActivityData {
  id: string | number;
  type: string;
  description: string;
  timestamp: string;
  user?: string;
}

// Recent Activity Widget Component
const RecentActivityWidget: React.FC<{ config: RecentActivityWidgetConfig }> = ({ config }) => {
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const limit = config.limit || 5;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getRecentActivities(limit);
        setActivities(result);
      } catch (err) {
        setError("Failed to load activities");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Refresh data every 2 minutes
    const intervalId = setInterval(fetchData, 120000);
    return () => clearInterval(intervalId);
  }, [limit]);

  if (isLoading) {
    return <Widget config={config}><div>Loading activities...</div></Widget>;
  }

  if (error) {
    return <Widget config={config}><div className="text-red-500 dark:text-red-400">{error}</div></Widget>;
  }

  if (!activities.length) {
    return <Widget config={config}><div>No recent activities</div></Widget>;
  }

  return (
    <Widget config={config}>
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {activities.map((activity) => (
            <div 
              key={activity.id} 
              className="mb-3 border-b border-gray-100 dark:border-gray-700 pb-2 last:border-b-0 last:mb-0"
            >
              <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{activity.description}</div>
              <div className="flex justify-between items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                <span>{activity.user || 'System'}</span>
                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  {new Date(activity.timestamp).toLocaleString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Widget>
  );
};

// Energy production data type
interface EnergyProductionData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
  }>;
}

// Energy Production Widget Component
const EnergyProductionWidget: React.FC<{ config: EnergyProductionWidgetConfig }> = ({ config }) => {
  const [data, setData] = useState<EnergyProductionData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const period = config.period || "month";
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Call the optimized endpoint using our API service
        const result = await getSitePerformanceMetrics({ period });
        setData(result);
      } catch (err) {
        setError("Failed to load energy production data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Refresh data every hour
    const intervalId = setInterval(fetchData, 3600000);
    return () => clearInterval(intervalId);
  }, [period]);

  if (isLoading) {
    return <Widget config={config}><div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div></div></Widget>;
  }

  if (error) {
    return <Widget config={config}><div className="p-4 text-red-500 dark:text-red-400 font-bold">{error}</div></Widget>;
  }

  if (!data || !data.labels || !data.datasets || data.datasets.length === 0 || !data.datasets[0].data) {
    return <Widget config={config}><div className="p-4 font-bold text-orange-500 dark:text-orange-400">No energy production data available</div></Widget>;
  }

  // Process the data
  const labels = data.labels;
  const values = data.datasets[0].data;
  
  // Create formatted chart data - convert from Wh to kWh
  const chartData = labels.map((label, index) => ({
    name: label,
    value: +(values[index] / 1000).toFixed(2) // Convert Wh to kWh
  }));
  
  // Calculate total energy production for the period
  const totalEnergy = values.reduce((sum, val) => sum + val, 0) / 1000; // kWh
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  
  // Find peak production value and its index
  const peakValue = Math.max(...values) / 1000;
  const peakIndex = values.indexOf(peakValue * 1000);
  const peakTime = labels[peakIndex] || "12:00 PM";
  
  return (
    <Widget config={config}>
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm font-semibold text-orange-500 dark:text-orange-400">Daily Generation</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{today}</div>
        </div>
        
        <div className="h-32 -mx-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} className="dark:opacity-20" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10, fill: 'currentColor' }}
                axisLine={false}
                tickLine={false}
                className="text-gray-600 dark:text-gray-400"
              />
              <YAxis 
                hide={true}
              />
              <RechartsTooltip 
                formatter={(value) => [`${value} kWh`, 'Energy']} 
                contentStyle={{ 
                  fontSize: '12px',
                  backgroundColor: 'rgb(255, 255, 255)',
                  border: '1px solid rgb(229, 231, 235)',
                  borderRadius: '6px'
                }}
                wrapperClassName="!bg-white dark:!bg-gray-800 !border-gray-200 dark:!border-gray-700"
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#F59E0B" 
                strokeWidth={2}
                dot={{ stroke: '#F59E0B', fill: '#FEF3C7', strokeWidth: 2, r: 4 }}
                activeDot={{ stroke: '#F59E0B', fill: '#F59E0B', strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className="text-center">
            <div className="text-xs font-medium text-yellow-600 dark:text-yellow-400">Peak</div>
            <div className="text-sm font-bold">{peakValue.toFixed(1)} kW</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{peakTime}</div>
          </div>
          
          <div className="text-center border-x border-gray-100 dark:border-gray-700">
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400">Total</div>
            <div className="text-sm font-bold">{totalEnergy.toFixed(1)} kWh</div>
            <div className="text-xs text-green-500 dark:text-green-400">+5.2%</div>
          </div>
          
          <div className="text-center">
            <div className="text-xs font-medium text-green-600 dark:text-green-400">Efficiency</div>
            <div className="text-sm font-bold">92.4%</div>
            <div className="text-xs text-green-500 dark:text-green-400">+1.3%</div>
          </div>
        </div>
      </div>
    </Widget>
  );
};

// Site distribution data type
interface SiteDistributionData {
  labels: string[];
  data: number[];
  backgroundColor: string[];
}

// Site Distribution Widget Component
const SiteDistributionWidget: React.FC<{ config: SiteDistributionWidgetConfig }> = ({ config }) => {
  const [data, setData] = useState<SiteDistributionData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const groupBy = config.groupBy || "region";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getSiteDistribution(groupBy);
        setData(result);
      } catch (err) {
        setError("Failed to load site distribution data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Refresh data every day
    const intervalId = setInterval(fetchData, 86400000);
    return () => clearInterval(intervalId);
  }, [groupBy]);

  if (isLoading) {
    return <Widget config={config}><div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div></div></Widget>;
  }

  if (error) {
    return <Widget config={config}><div className="p-4 text-red-500 dark:text-red-400">{error}</div></Widget>;
  }

  if (!data || !data.labels || !data.data || data.labels.length === 0) {
    return <Widget config={config}><div className="p-4 text-orange-500 dark:text-orange-400">No distribution data available</div></Widget>;
  }

  // Transform data for Recharts
  const chartData = data.labels.map((label, index) => ({
    name: label,
    value: data.data[index]
  }));

  // If we have no data points, show a message
  const hasValidData = chartData.length > 0 && chartData.some(item => item.value > 0);
  
  if (!hasValidData) {
    return (
      <Widget config={config}>
        <div className="text-center text-gray-500 dark:text-gray-400">No site distribution data available</div>
      </Widget>
    );
  }

  // Create a more consistent color palette for the regions
  // Note: colors variable removed as it was unused

  // Create the legend items
  const legendItems = [
    { color: "#10B981", label: "Good (80-100%)" },
    { color: "#FBBF24", label: "Fair (50-79%)" },
    { color: "#EF4444", label: "Poor (0-49%)" }
  ];

  return (
    <Widget config={config}>
      <div className="h-full flex flex-col">
        <div className="text-sm font-semibold text-purple-700 dark:text-purple-400 mb-2">
          Signal Strength by Region
        </div>
        
        <div className="flex-1 flex items-center justify-center -mx-4">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 60, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" className="dark:opacity-20" />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fill: 'currentColor' }} className="text-gray-600 dark:text-gray-400" />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={60}
                tick={{ fontSize: 12, fill: 'currentColor' }}
                className="text-gray-600 dark:text-gray-400"
              />
              <Tooltip 
                formatter={(value: any) => [`${value}%`, 'Signal Strength']} 
                contentStyle={{ 
                  fontSize: '12px',
                  backgroundColor: 'rgb(255, 255, 255)',
                  border: '1px solid rgb(229, 231, 235)',
                  borderRadius: '6px'
                }}
                wrapperClassName="!bg-white dark:!bg-gray-800 !border-gray-200 dark:!border-gray-700"
              />
              <Bar 
                dataKey="value" 
                fill="#8884d8" 
                radius={[0, 4, 4, 0]}
              >
                {chartData.map((entry, index) => {
                  // Determine color based on value
                  let color = "#EF4444"; // Poor
                  if (entry.value >= 80) color = "#10B981"; // Good
                  else if (entry.value >= 50) color = "#FBBF24"; // Fair
                  
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-auto pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-center gap-4">
          {legendItems.map((item, index) => (
            <div key={index} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }}></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Widget>
  );
};

// Quick Actions Widget Component
const QuickActionsWidget: React.FC<{ config: QuickActionsWidgetConfig }> = ({ config }) => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <Widget config={config}>
      <div className="grid grid-cols-3 gap-3">
        <div 
          className="p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors rounded-lg text-center cursor-pointer"
          onClick={() => handleNavigate('/sites')}
        >
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 text-blue-500 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
          </div>
          <div className="text-xs font-medium text-blue-700 dark:text-blue-300">View Sites</div>
        </div>
        
        <div 
          className="p-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors rounded-lg text-center cursor-pointer"
          onClick={() => handleNavigate('/jobs')}
        >
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 text-purple-500 dark:text-purple-400 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-xs font-medium text-purple-700 dark:text-purple-300">Manage Jobs</div>
        </div>
        
        <div 
          className="p-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors rounded-lg text-center cursor-pointer"
          onClick={() => handleNavigate('/bio-mass')}
        >
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zM12 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zM12 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-xs font-medium text-green-700 dark:text-green-300">Bio-Mass</div>
        </div>
      </div>
    </Widget>
  );
};