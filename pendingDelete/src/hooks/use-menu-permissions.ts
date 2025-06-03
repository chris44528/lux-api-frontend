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
      setLoading(true);
      // Check if user is logged in by looking for token
      const token = localStorage.getItem('access_token');
      if (!token) {
        setPermissions(defaultPermissions);
        return;
      }
      
      const permissionsData = await userService.getMenuPermissions(userId);
      
      // Normalize all permission values to ensure they're proper booleans
      const normalizedPermissions: MenuPermissions = { ...defaultPermissions };
      
      // For debugging: log each permission value
      Object.entries(permissionsData).forEach(([key, value]) => {
        const boolValue = normalizePermission(value);
        normalizedPermissions[key] = boolValue;
      });
      
      setPermissions(normalizedPermissions);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch menu permissions'));
      // Use default permissions as fallback
      setPermissions(defaultPermissions);
    } finally {
      setLoading(false);
    }
  };

  // Function to manually refresh permissions
  const refreshPermissions = () => {
    fetchPermissions();
  };

  useEffect(() => {
    fetchPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Re-fetch when userId changes

  return { permissions, loading, error, refreshPermissions };
}

export default useMenuPermissions; 