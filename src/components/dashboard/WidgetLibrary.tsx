import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { WidgetConfigUnion, WidgetSize } from "../../types/dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  PieChart,
  LineChart,
  Activity,
  Gauge,
  Signal,
  Briefcase,
  Flame,
  FileText,
  Zap,
} from "lucide-react";

interface WidgetLibraryProps {
  onAddWidget: (widget: WidgetConfigUnion) => void;
}

interface WidgetTemplate {
  type: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  defaultSize: WidgetSize;
  category: "metrics" | "charts" | "operations" | "bio" | "custom";
}

export const WidgetLibrary: React.FC<WidgetLibraryProps> = ({
  onAddWidget,
}) => {
  const [widgetTitle, setWidgetTitle] = useState("");
  const [selectedWidget, setSelectedWidget] = useState<WidgetTemplate | null>(
    null
  );

  // Widget templates
  const widgetTemplates: WidgetTemplate[] = [
    {
      type: "systemOverview",
      title: "System Overview",
      description: "Shows the overall system status and health",
      icon: <Activity className="h-8 w-8 text-blue-500" />,
      defaultSize: "1x1",
      category: "metrics",
    },
    {
      type: "recentActivity",
      title: "Recent Activity",
      description: "Displays recent system activities",
      icon: <LineChart className="h-8 w-8 text-green-500" />,
      defaultSize: "1x1",
      category: "metrics",
    },
    {
      type: "energyProduction",
      title: "Energy Production",
      description: "Chart showing energy production over time",
      icon: <BarChart className="h-8 w-8 text-yellow-500" />,
      defaultSize: "2x2",
      category: "charts",
    },
    {
      type: "siteDistribution",
      title: "Site Distribution",
      description: "Pie chart showing distribution of sites",
      icon: <PieChart className="h-8 w-8 text-purple-500" />,
      defaultSize: "2x2",
      category: "charts",
    },
    {
      type: "meterReadings",
      title: "Meter Readings",
      description: "Shows recent meter readings",
      icon: <Gauge className="h-8 w-8 text-blue-500" />,
      defaultSize: "2x1",
      category: "metrics",
    },
    {
      type: "signalStrength",
      title: "Signal Strength",
      description: "Map of signal strength by region",
      icon: <Signal className="h-8 w-8 text-green-500" />,
      defaultSize: "2x2",
      category: "charts",
    },
    {
      type: "jobQueue",
      title: "Job Queue",
      description: "Shows jobs in the queue",
      icon: <Briefcase className="h-8 w-8 text-orange-500" />,
      defaultSize: "2x1",
      category: "operations",
    },
    {
      type: "bioBoilerStatus",
      title: "Bio Boiler Status",
      description: "Status of bio-mass boilers",
      icon: <Flame className="h-8 w-8 text-red-500" />,
      defaultSize: "1x1",
      category: "bio",
    },
    {
      type: "customReport",
      title: "Custom Report",
      description: "Display results from a custom report",
      icon: <FileText className="h-8 w-8 text-gray-500" />,
      defaultSize: "2x2",
      category: "custom",
    },
    {
      type: "quickActions",
      title: "Quick Actions",
      description: "Buttons for common actions",
      icon: <Zap className="h-8 w-8 text-yellow-500" />,
      defaultSize: "2x1",
      category: "operations",
    },
  ];

  // Handle widget selection
  const handleWidgetSelect = (widget: WidgetTemplate) => {
    setSelectedWidget(widget);
    setWidgetTitle(widget.title);
  };

  // Handle widget addition
  const handleAddWidget = () => {
    if (!selectedWidget) return;

    // Create a new widget configuration based on the selected type
    let newWidget: WidgetConfigUnion;

    // Create the appropriate widget type
    switch (selectedWidget.type) {
      case "systemOverview":
        newWidget = {
          id: uuidv4(),
          type: "systemOverview",
          title: widgetTitle || selectedWidget.title,
          size: selectedWidget.defaultSize,
        };
        break;
      case "recentActivity":
        newWidget = {
          id: uuidv4(),
          type: "recentActivity",
          title: widgetTitle || selectedWidget.title,
          size: selectedWidget.defaultSize,
          limit: 10, // Default limit
        };
        break;
      case "energyProduction":
        newWidget = {
          id: uuidv4(),
          type: "energyProduction",
          title: widgetTitle || selectedWidget.title,
          size: selectedWidget.defaultSize,
          period: "month", // Default period
          chartType: "bar", // Default chart type
        };
        break;
      case "siteDistribution":
        newWidget = {
          id: uuidv4(),
          type: "siteDistribution",
          title: widgetTitle || selectedWidget.title,
          size: selectedWidget.defaultSize,
          groupBy: "region", // Default grouping
        };
        break;
      case "meterReadings":
        newWidget = {
          id: uuidv4(),
          type: "meterReadings",
          title: widgetTitle || selectedWidget.title,
          size: selectedWidget.defaultSize,
          limit: 5, // Default limit
        };
        break;
      case "signalStrength":
        newWidget = {
          id: uuidv4(),
          type: "signalStrength",
          title: widgetTitle || selectedWidget.title,
          size: selectedWidget.defaultSize,
        };
        break;
      case "jobQueue":
        newWidget = {
          id: uuidv4(),
          type: "jobQueue",
          title: widgetTitle || selectedWidget.title,
          size: selectedWidget.defaultSize,
          limit: 5, // Default limit
        };
        break;
      case "bioBoilerStatus":
        newWidget = {
          id: uuidv4(),
          type: "bioBoilerStatus",
          title: widgetTitle || selectedWidget.title,
          size: selectedWidget.defaultSize,
        };
        break;
      case "customReport":
        newWidget = {
          id: uuidv4(),
          type: "customReport",
          title: widgetTitle || selectedWidget.title,
          size: selectedWidget.defaultSize,
          query: {}, // Empty query by default
        };
        break;
      case "quickActions":
        newWidget = {
          id: uuidv4(),
          type: "quickActions",
          title: widgetTitle || selectedWidget.title,
          size: selectedWidget.defaultSize,
          actions: [
            {
              id: "view-sites",
              label: "View Sites",
              color: "green",
              url: "/sites",
            },
            {
              id: "manage-jobs",
              label: "Manage Jobs",
              color: "blue",
              url: "/jobs",
            },
            {
              id: "generate-reports",
              label: "Generate Reports",
              color: "purple",
              url: "/reports",
            },
          ],
        };
        break;
      default:
        // Fallback for unknown types
        newWidget = {
          id: uuidv4(),
          type: "systemOverview",
          title: widgetTitle || selectedWidget.title,
          size: selectedWidget.defaultSize,
        };
    }

    // Add the widget
    onAddWidget(newWidget);

    // Reset the form
    setSelectedWidget(null);
    setWidgetTitle("");
  };

  return (
    <div className="space-y-6 py-4">
      <Tabs defaultValue="metrics">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="bio">Bio-mass</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>

        {["metrics", "charts", "operations", "bio", "custom"].map(
          (category) => (
            <TabsContent key={category} value={category} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {widgetTemplates
                  .filter((widget) => widget.category === category)
                  .map((widget) => (
                    <div
                      key={widget.type}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedWidget?.type === widget.type
                          ? "border-blue-500 bg-blue-50"
                          : "hover:border-gray-300"
                      }`}
                      onClick={() => handleWidgetSelect(widget)}
                    >
                      <div className="flex items-center gap-3">
                        {widget.icon}
                        <div>
                          <h3 className="font-medium">{widget.title}</h3>
                          <p className="text-sm text-gray-500">
                            {widget.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </TabsContent>
          )
        )}
      </Tabs>

      {selectedWidget && (
        <div className="space-y-4 border-t pt-4">
          <div className="space-y-2">
            <Label htmlFor="widget-title">Widget Title</Label>
            <Input
              id="widget-title"
              value={widgetTitle}
              onChange={(e) => setWidgetTitle(e.target.value)}
              placeholder="Enter widget title"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleAddWidget}>Add Widget</Button>
          </div>
        </div>
      )}
    </div>
  );
};
