import * as React from "react";
import { clsx } from "clsx";

interface TabsProps {
  defaultValue: string;
  className?: string;
  children: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({ defaultValue, className, children }) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue);

  // Clone children with activeTab as prop
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { activeTab, setActiveTab } as any);
    }
    return child;
  });

  return (
    <div className={clsx("w-full", className)}>
      {childrenWithProps}
    </div>
  );
};

interface TabsListProps {
  className?: string;
  children: React.ReactNode;
  activeTab?: string;
  setActiveTab?: (value: string) => void;
}

export const TabsList: React.FC<TabsListProps> = ({ 
  className, 
  children,
  activeTab,
  setActiveTab 
}) => {
  // Clone children with activeTab as prop
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { activeTab, setActiveTab } as any);
    }
    return child;
  });

  return (
    <div className={clsx("flex bg-gray-100 p-1 rounded-md", className)}>
      {childrenWithProps}
    </div>
  );
};

interface TabsTriggerProps {
  value: string;
  className?: string;
  children: React.ReactNode;
  activeTab?: string;
  setActiveTab?: (value: string) => void;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ 
  value, 
  className, 
  children,
  activeTab,
  setActiveTab 
}) => {
  const isActive = activeTab === value;

  const handleClick = () => {
    if (setActiveTab) {
      setActiveTab(value);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={clsx(
        "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors",
        isActive 
          ? "bg-white text-gray-900 shadow-sm" 
          : "text-gray-600 hover:text-gray-900",
        className
      )}
    >
      {children}
    </button>
  );
};

interface TabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
  activeTab?: string;
}

export const TabsContent: React.FC<TabsContentProps> = ({ 
  value, 
  className, 
  children,
  activeTab
}) => {
  const isActive = activeTab === value;

  if (!isActive) {
    return null;
  }

  return (
    <div className={clsx("mt-2", className)}>
      {children}
    </div>
  );
}; 