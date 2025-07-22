/**
 * Utility functions for checking user permissions
 */
import { User } from '../types/user';

/**
 * Check if a user belongs to a specific group
 * @param user The user object
 * @param groupName The name of the group to check
 * @returns Boolean indicating if the user is in the group
 */
export const isUserInGroup = (user: User | null, groupName: string): boolean => {
  if (!user || !user.groups || user.groups.length === 0) {
    return false;
  }
  
  return user.groups.some(group => group.name === groupName);
};

/**
 * Check if a user is in the Ecotricity group
 * @param user The user object
 * @returns Boolean indicating if the user is in the Ecotricity group
 */
export const isEcotricityUser = (user: User | null): boolean => {
  return isUserInGroup(user, 'Ecotricity');
};

/**
 * Check if a user is in the Manager group
 * @param user The user object
 * @returns Boolean indicating if the user is in the Manager group
 */
export const isManagerUser = (user: User | null): boolean => {
  return isUserInGroup(user, 'Manager');
}; 