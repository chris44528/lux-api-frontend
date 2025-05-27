import React from 'react';
import { useUIPermission } from '../hooks/useUIPermission';

interface ProtectedElementProps {
  /**
   * Permission codename(s) required to view the element
   */
  permission: string | string[];
  
  /**
   * Children to render if permission is granted
   */
  children: React.ReactNode;
  
  /**
   * Optional fallback to render if permission is denied
   */
  fallback?: React.ReactNode;
  
  /**
   * If permission is an array, require all permissions (default: true)
   */
  requireAll?: boolean;
  
  /**
   * Show loading state while checking permissions
   */
  showLoading?: boolean;
  
  /**
   * Custom loading component
   */
  loadingComponent?: React.ReactNode;
}

/**
 * Component that conditionally renders children based on UI permissions
 * 
 * @example
 * ```tsx
 * <ProtectedElement permission="sites.detail.actions.test_meter">
 *   <Button onClick={handleTestMeter}>Test Meter</Button>
 * </ProtectedElement>
 * 
 * <ProtectedElement 
 *   permission={["sites.list.view", "sites.list.export"]} 
 *   requireAll={false}
 * >
 *   <ExportButton />
 * </ProtectedElement>
 * ```
 */
export function ProtectedElement({
  permission,
  children,
  fallback = null,
  requireAll = true,
  showLoading = false,
  loadingComponent = null
}: ProtectedElementProps) {
  const { hasPermission, loading } = useUIPermission(permission, requireAll);

  if (loading && showLoading) {
    return <>{loadingComponent || <span className="animate-pulse">...</span>}</>;
  }

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface ConditionalWrapperProps extends ProtectedElementProps {
  /**
   * Wrapper component to use if permission is granted
   */
  wrapper: React.ComponentType<{ children: React.ReactNode }>;
}

/**
 * Conditionally wraps children with a component based on permissions
 * 
 * @example
 * ```tsx
 * <ConditionalWrapper 
 *   permission="sites.detail.fields.sensitive_data"
 *   wrapper={({ children }) => <div className="border-2 border-red-500">{children}</div>}
 * >
 *   <SensitiveDataField />
 * </ConditionalWrapper>
 * ```
 */
export function ConditionalWrapper({
  permission,
  wrapper: Wrapper,
  children,
  requireAll = true,
  showLoading = false,
  loadingComponent = null
}: ConditionalWrapperProps) {
  const { hasPermission, loading } = useUIPermission(permission, requireAll);

  if (loading && showLoading) {
    return <>{loadingComponent || <span className="animate-pulse">...</span>}</>;
  }

  if (hasPermission) {
    return <Wrapper>{children}</Wrapper>;
  }

  return <>{children}</>;
}

interface PermissionGateProps {
  /**
   * Permission codename(s) required
   */
  permission: string | string[];
  
  /**
   * Render function that receives permission state
   */
  children: (props: { hasPermission: boolean; loading: boolean }) => React.ReactNode;
  
  /**
   * If permission is an array, require all permissions (default: true)
   */
  requireAll?: boolean;
}

/**
 * Render prop component for more complex permission-based rendering
 * 
 * @example
 * ```tsx
 * <PermissionGate permission="sites.detail.actions.export">
 *   {({ hasPermission, loading }) => (
 *     <Button 
 *       disabled={!hasPermission || loading}
 *       title={!hasPermission ? "You don't have permission to export" : ""}
 *     >
 *       Export
 *     </Button>
 *   )}
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  permission,
  children,
  requireAll = true
}: PermissionGateProps) {
  const { hasPermission, loading } = useUIPermission(permission, requireAll);
  
  return <>{children({ hasPermission, loading })}</>;
}