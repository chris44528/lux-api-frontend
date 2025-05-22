import { useState, useEffect } from 'react';
import userService from '../services/userService';

export interface MenuPermissions {
  dashboard: boolean;
  'bio-mass': boolean;
  'job-management': boolean;
  reports: boolean;
  imports: boolean;
  settings: boolean;
  analysis: boolean;
  [key: string]: boolean;
}

const defaultPermissions: MenuPermissions = {
  dashboard: true,
  'bio-mass': true,
  'job-management': true,
  reports: true,
  imports: true,
  settings: true,
  analysis: true
};

// Helper function to normalize any permission value to a proper boolean
const normalizePermission = (value: unknown): boolean => {
  // Handle common truthy/falsy formats including strings and numbers
  return value === true || value === 'true' || value === 1 || value === '1';
};

export function useMenuPermissions(userId?: number) {
  const [permissions, setPermissions] = useState<MenuPermissions>(defaultPermissions);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPermissions = async () => {
    try {
      console.log("useMenuPermissions: Starting to fetch permissions" + (userId ? ` for user ${userId}` : ''));
      setLoading(true);
      // Check if user is logged in by looking for token
      const token = localStorage.getItem('access_token');
      console.log("useMenuPermissions: Access token present:", !!token);
      if (!token) {
        console.log("useMenuPermissions: No token, using default permissions");
        setPermissions(defaultPermissions);
        return;
      }
      
      console.log("useMenuPermissions: Calling userService.getMenuPermissions()");
      const permissionsData = await userService.getMenuPermissions(userId);
      console.log('useMenuPermissions: Fetched menu permissions:', permissionsData);
      
      // Normalize all permission values to ensure they're proper booleans
      const normalizedPermissions: MenuPermissions = { ...defaultPermissions };
      
      // For debugging: log each permission value
      Object.entries(permissionsData).forEach(([key, value]) => {
        const boolValue = normalizePermission(value);
        normalizedPermissions[key] = boolValue;
        console.log(`useMenuPermissions: Permission ${key} = ${value} (${typeof value}) → ${boolValue}`);
      });
      
      console.log('useMenuPermissions: Normalized permissions:', normalizedPermissions);
      setPermissions(normalizedPermissions);
      setError(null);
    } catch (err) {
      console.error('useMenuPermissions: Error fetching menu permissions:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch menu permissions'));
      // Use default permissions as fallback
      console.log('useMenuPermissions: Using default permissions as fallback');
      setPermissions(defaultPermissions);
    } finally {
      setLoading(false);
    }
  };

  // Function to manually refresh permissions
  const refreshPermissions = () => {
    console.log('useMenuPermissions: Manual refresh requested');
    fetchPermissions();
  };

  useEffect(() => {
    console.log('useMenuPermissions: Initial permissions fetch');
    fetchPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Re-fetch when userId changes

  return { permissions, loading, error, refreshPermissions };
}

export default useMenuPermissions; 