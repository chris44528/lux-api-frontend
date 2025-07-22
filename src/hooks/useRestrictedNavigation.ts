import { useMemo } from 'react';
import useEcotricityUser from './useEcotricityUser';

interface NavigationItem {
  name: string;
  path: string;
  icon?: string;
}

/**
 * Hook that returns navigation items available to the current user
 * based on their group membership
 */
export const useRestrictedNavigation = () => {
  const { isEcotricityUser, loading } = useEcotricityUser();
  
  // Define all navigation items
  const allNavigationItems: NavigationItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { name: 'Sites', path: '/sites', icon: 'location' },
    { name: 'Jobs', path: '/jobs', icon: 'job' },
    { name: 'Aged Cases', path: '/aged-cases', icon: 'warning' },
    { name: 'Completed Jobs', path: '/completed-jobs', icon: 'check' },
    { name: 'Calendar', path: '/calendar', icon: 'calendar' },
    { name: 'Reports', path: '/reports', icon: 'report' },
    { name: 'Settings', path: '/settings', icon: 'settings' },
    { name: 'Bio Mass', path: '/bio-mass', icon: 'energy' },
    { name: 'Analysis', path: '/analysis', icon: 'chart' },
  ];
  
  // Ecotricity users only see Dashboard
  const ecotricityNavigationItems: NavigationItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
  ];
  
  // Return appropriate navigation items based on user's group
  const navigationItems = useMemo(() => {
    if (loading) return [];
    return isEcotricityUser ? ecotricityNavigationItems : allNavigationItems;
  }, [isEcotricityUser, loading]);
  
  return { navigationItems, loading };
};

export default useRestrictedNavigation; 