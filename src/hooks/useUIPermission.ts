import { useState, useEffect, useCallback } from 'react';
import { uiPermissionService } from '../services/uiPermissionService';

interface UseUIPermissionResult {
  hasPermission: boolean;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to check UI permissions
 * @param permission Single permission codename or array of codenames
 * @param requireAll If array provided, whether to require all permissions (default: true)
 */
export function useUIPermissionFull(
  permission: string | string[], 
  requireAll = true
): UseUIPermissionResult {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const checkPermission = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Ensure permissions are loaded
      if (!uiPermissionService.isLoaded()) {
        await uiPermissionService.loadPermissions();
      }

      let result = false;
      
      if (Array.isArray(permission)) {
        result = requireAll 
          ? uiPermissionService.hasAllPermissions(permission)
          : uiPermissionService.hasAnyPermission(permission);
      } else {
        result = uiPermissionService.hasPermission(permission);
      }
      
      setHasPermission(result);
    } catch (err) {
      setError(err as Error);
      setHasPermission(false);
    } finally {
      setLoading(false);
    }
  }, [permission, requireAll]);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  const refresh = useCallback(async () => {
    await uiPermissionService.loadPermissions(true);
    await checkPermission();
  }, [checkPermission]);

  return { hasPermission, loading, error, refresh };
}

/**
 * Hook to check multiple permissions with individual results
 */
export function useUIPermissions(permissions: string[]): {
  permissions: Record<string, boolean>;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} {
  const [permissionResults, setPermissionResults] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const checkPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Ensure permissions are loaded
      if (!uiPermissionService.isLoaded()) {
        await uiPermissionService.loadPermissions();
      }

      const results: Record<string, boolean> = {};
      permissions.forEach(perm => {
        results[perm] = uiPermissionService.hasPermission(perm);
      });
      
      setPermissionResults(results);
    } catch (err) {
      setError(err as Error);
      setPermissionResults({});
    } finally {
      setLoading(false);
    }
  }, [permissions]);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  const refresh = useCallback(async () => {
    await uiPermissionService.loadPermissions(true);
    await checkPermissions();
  }, [checkPermissions]);

  return { permissions: permissionResults, loading, error, refresh };
}

/**
 * Hook to get all permissions (useful for admin interfaces)
 */
export function useAllUIPermissions(): {
  permissions: Record<string, boolean>;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadAllPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await uiPermissionService.loadPermissions();
      const allPerms = uiPermissionService.getAllPermissions();
      setPermissions(allPerms);
    } catch (err) {
      setError(err as Error);
      setPermissions({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllPermissions();
  }, [loadAllPermissions]);

  const refresh = useCallback(async () => {
    await uiPermissionService.loadPermissions(true);
    await loadAllPermissions();
  }, [loadAllPermissions]);

  return { permissions, loading, error, refresh };
}

/**
 * Simplified hook that just returns the permission boolean
 * Useful when you don't need loading/error states
 */
export function useUIPermission(permission: string): boolean {
  const { hasPermission } = useUIPermissionFull(permission);
  return hasPermission;
}