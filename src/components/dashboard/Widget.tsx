import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  WidgetProps,
  WidgetSize,
  WidgetRenderProps,
} from "../../types/dashboard";
import { MoreHorizontal, X, Maximize2, Minimize2, GripVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useDashboard } from "../../contexts/DashboardContext";
import { cn } from "../../lib/utils";

// Map widget size to grid classes
const sizeToGridClass: Record<WidgetSize, string> = {
  "1x1": "col-span-1 row-span-1",
  "1x2": "col-span-1 row-span-2",
  "2x1": "col-span-2 row-span-1",
  "2x2": "col-span-2 row-span-2",
  "2x3": "col-span-2 row-span-3",
  "3x2": "col-span-3 row-span-2",
  "3x3": "col-span-3 row-span-3",
};

export const Widget: React.FC<WidgetProps> = ({
  config,
  onEdit,
  onRemove,
  onResize,
  className,
  children,
  dragHandleProps,
}) => {
  const { state, removeWidget, resizeWidget, saveDashboard } = useDashboard();
  const { isEditing } = state;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  // Create render props for child components
  const renderProps: WidgetRenderProps = {
    setIsLoading,
    setError,
    isLoading,
    error,
  };

  // Handle widget removal
  const handleRemove = () => {
    if (onRemove) {
      onRemove(config.id);
    } else {
      removeWidget(config.id);
      // Auto-save after removing widget
      setTimeout(() => {
        saveDashboard().catch(error => {
        });
      }, 500);
    }
  };

  // Handle widget resize
  const handleResize = (newSize: WidgetSize) => {
    if (onResize) {
      onResize(config.id, newSize);
    } else {
      resizeWidget(config.id, newSize);
      // Auto-save after resizing widget
      setTimeout(() => {
        saveDashboard().catch(error => {
        });
      }, 500);
    }
  };

  // Toggle between small and large sizes
  const toggleSize = () => {
    let newSize: WidgetSize = "1x1";

    // Determine the new size based on the current size
    switch (config.size) {
      case "1x1":
        newSize = "2x1";
        break;
      case "2x1":
        newSize = "2x2";
        break;
      case "1x2":
        newSize = "2x2";
        break;
      case "2x2":
        newSize = "1x1";
        break;
      case "2x3":
        newSize = "2x2";
        break;
      case "3x2":
        newSize = "2x2";
        break;
      case "3x3":
        newSize = "2x2";
        break;
      default:
        newSize = "1x1";
    }

    handleResize(newSize);
  };

  return (
    <Card
      className={cn(
        "transition-all duration-200 ease-in-out overflow-hidden rounded-lg border border-gray-100 dark:border-gray-700 h-full",
        sizeToGridClass[config.size],
        isEditing ? "shadow-md hover:shadow-lg dark:shadow-gray-900/50" : "shadow-sm dark:shadow-gray-900/30",
        className
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 px-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {isEditing && (
            <div {...dragHandleProps}>
              <GripVertical className="h-4 w-4 text-gray-400 dark:text-gray-500 cursor-grab active:cursor-grabbing" />
            </div>
          )}
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">{config.title}</h3>
        </div>
        <div className="flex items-center space-x-1">
          {isEditing && (
            <>
              <button
                onClick={toggleSize}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title={config.size === "1x1" ? "Enlarge" : "Reduce"}
              >
                {config.size === "1x1" ? (
                  <Maximize2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                ) : (
                  <Minimize2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                )}
              </button>
              <button
                onClick={handleRemove}
                className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                title="Remove widget"
              >
                <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
            </>
          )}
          {isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <MoreHorizontal className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(config)}>
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleResize("1x1")}>
                  Small (1x1)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleResize("2x1")}>
                  Wide (2x1)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleResize("1x2")}>
                  Tall (1x2)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleResize("2x2")}>
                  Large (2x2)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleRemove} className="text-red-500 dark:text-red-400">
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 h-[calc(100%-3rem)] overflow-auto dark:bg-gray-900">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 dark:border-blue-400"></div>
          </div>
        ) : error ? (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-sm">{error}</div>
        ) : typeof children === "function" ? (
          children(renderProps)
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
};