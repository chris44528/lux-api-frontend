import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

// DropdownMenu
export interface DropdownMenuProps {
  children: React.ReactNode;
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  return <div className="relative inline-block text-left">{children}</div>;
};

DropdownMenu.displayName = "DropdownMenu";

// DropdownMenuTrigger
export interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({ 
  children, 
  asChild = false 
}) => {
  const childElement = asChild ? React.Children.only(children) : (
    <button type="button" className="inline-flex justify-center">
      {children}
    </button>
  );

  return React.cloneElement(childElement as React.ReactElement, {
    'data-dropdown-trigger': true,
  });
};

DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

// DropdownMenuContent
export interface DropdownMenuContentProps {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'end' | 'center';
  forceMount?: boolean;
}

export const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ children, className, align = 'center', forceMount = false, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(forceMount);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      const handleTriggerClick = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        const isTrigger = target.closest('[data-dropdown-trigger="true"]');
        
        if (isTrigger) {
          setIsOpen(!isOpen);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('click', handleTriggerClick);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('click', handleTriggerClick);
      };
    }, [isOpen]);

    if (!isOpen && !forceMount) {
      return null;
    }

    const alignmentClasses = {
      start: "left-0",
      center: "left-1/2 -translate-x-1/2",
      end: "right-0",
    };

    return (
      <div
        ref={contentRef}
        className={clsx(
          "absolute z-10 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
          alignmentClasses[align],
          className
        )}
        {...props}
      >
        <div className="py-1">{children}</div>
      </div>
    );
  }
);

DropdownMenuContent.displayName = "DropdownMenuContent";

// DropdownMenuItem
export interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export const DropdownMenuItem = React.forwardRef<HTMLButtonElement, DropdownMenuItemProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "text-left w-full block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

DropdownMenuItem.displayName = "DropdownMenuItem";

// DropdownMenuLabel
export interface DropdownMenuLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const DropdownMenuLabel = React.forwardRef<HTMLDivElement, DropdownMenuLabelProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "px-4 py-2 text-sm font-medium text-gray-700",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DropdownMenuLabel.displayName = "DropdownMenuLabel";

// DropdownMenuSeparator
export interface DropdownMenuSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, DropdownMenuSeparatorProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "my-1 h-px bg-gray-200",
          className
        )}
        {...props}
      />
    );
  }
);

DropdownMenuSeparator.displayName = "DropdownMenuSeparator"; 