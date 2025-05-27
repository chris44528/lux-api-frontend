import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { uiPermissionService } from '../services/uiPermissionService';

interface UIPermissionContextValue {
  permissions: Record<string, boolean>;
  loading: boolean;
  error: Error | null;
  hasPermission: (codename: string) => boolean;
  hasAnyPermission: (codenames: string[]) => boolean;
  hasAllPermissions: (codenames: string[]) => boolean;
  refresh: () => Promise<void>;
  isLoaded: boolean;
}

const UIPermissionContext = createContext<UIPermissionContextValue | undefined>(undefined);

interface UIPermissionProviderProps {
  children: ReactNode;
}

export function UIPermissionProvider({ children }: UIPermissionProviderProps) {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load permissions on mount
  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await uiPermissionService.loadPermissions();
      setPermissions(response.permissions);
      setIsLoaded(true);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to load UI permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = useCallback((codename: string): boolean => {
    return uiPermissionService.hasPermission(codename);
  }, []);

  const hasAnyPermission = useCallback((codenames: string[]): boolean => {
    return uiPermissionService.hasAnyPermission(codenames);
  }, []);

  const hasAllPermissions = useCallback((codenames: string[]): boolean => {
    return uiPermissionService.hasAllPermissions(codenames);
  }, []);

  const refresh = useCallback(async () => {
    await loadPermissions();
  }, []);

  const value: UIPermissionContextValue = {
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refresh,
    isLoaded
  };

  return (
    <UIPermissionContext.Provider value={value}>
      {children}
    </UIPermissionContext.Provider>
  );
}

export function useUIPermissionContext() {
  const context = useContext(UIPermissionContext);
  if (!context) {
    throw new Error('useUIPermissionContext must be used within a UIPermissionProvider');
  }
  return context;
}

// Convenience hook for checking a single permission
export function usePermission(codename: string): boolean {
  const { hasPermission, isLoaded } = useUIPermissionContext();
  return isLoaded ? hasPermission(codename) : false;
}

// Convenience hook for checking multiple permissions
export function usePermissions(codenames: string[], requireAll = true): boolean {
  const { hasAllPermissions, hasAnyPermission, isLoaded } = useUIPermissionContext();
  
  if (!isLoaded) return false;
  
  return requireAll 
    ? hasAllPermissions(codenames)
    : hasAnyPermission(codenames);
}