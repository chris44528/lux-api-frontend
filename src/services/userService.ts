import { User, UserFormData, UserGroup, Permission, GroupPermission, PaginatedResponse, GroupAccess } from '../types/user';
import { api } from './api';

// User related functions
export const getUsers = async (page: number = 1, params?: { search?: string }): Promise<PaginatedResponse<User>> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    
    if (params?.search) {
      queryParams.append('search', params.search);
    }
    
    const response = await api.get(`/users/users/?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUser = async (id: number): Promise<User> => {
  try {
    const response = await api.get(`/users/users/${id}/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createUser = async (userData: UserFormData): Promise<User> => {
  try {
    const response = await api.post(`/users/users/`, userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateUser = async (id: number, userData: UserFormData): Promise<User> => {
  try {
    const response = await api.patch(`/users/users/${id}/`, userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteUser = async (id: number): Promise<void> => {
  try {
    await api.delete(`/users/users/${id}/`);
  } catch (error) {
    throw error;
  }
};

export const activateUser = async (id: number): Promise<User> => {
  try {
    const response = await api.patch(`/users/users/${id}/`, { is_active: true });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deactivateUser = async (id: number): Promise<User> => {
  try {
    const response = await api.patch(`/users/users/${id}/`, { is_active: false });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const approveUser = async (id: number): Promise<User> => {
  try {
    const response = await api.post(`/users/${id}/activate/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const unapproveUser = async (id: number): Promise<User> => {
  try {
    const response = await api.post(`/users/${id}/deactivate/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  try {
    await api.post(`/users/password-reset/`, { email });
  } catch (error) {
    throw error;
  }
};

// Group related functions
export const getGroups = async (): Promise<UserGroup[]> => {
  try {
    const response = await api.get(`/groups/`);
    
    // Handle paginated response format
    if (response.data && typeof response.data === 'object') {
      // Check if it's a paginated response with a results array
      if (Array.isArray(response.data.results)) {
        return response.data.results;
      } 
      // Check if it's directly an array
      else if (Array.isArray(response.data)) {
        return response.data;
      }
      // Not in expected format
      else {
        return [];
      }
    } else {
      return [];
    }
  } catch (error) {
    // Return empty array instead of throwing to prevent infinite retries
    return [];
  }
};

export const getUserGroups = async (): Promise<UserGroup[]> => {
  try {
    return getGroups();
  } catch (error) {
    throw error;
  }
};

export const getUsersInGroup = async (groupId: number): Promise<User[]> => {
  try {
    const response = await api.get(`/groups/${groupId}/users/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addUserToGroup = async (userId: number, groupId: number): Promise<User> => {
  try {
    const response = await api.post(`/users/users/${userId}/groups/`, {
      group_id: groupId
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const removeUserFromGroup = async (userId: number, groupId: number): Promise<User> => {
  try {
    const response = await api.delete(`/users/users/${userId}/groups/${groupId}/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createGroup = async (name: string, description?: string): Promise<UserGroup> => {
  try {
    const response = await api.post(`/groups/`, { name, description });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateGroup = async (id: number, groupData: Partial<UserGroup>): Promise<UserGroup> => {
  try {
    const response = await api.patch(`/groups/${id}/`, groupData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteGroup = async (id: number): Promise<void> => {
  try {
    await api.delete(`/groups/${id}/`);
  } catch (error) {
    throw error;
  }
};

// Access Control related functions
// Note: Direct access control endpoints don't exist in the backend
// Access control is managed through menu permissions and data filters
export const getGroupAccess = async (groupId: number): Promise<GroupAccess[]> => {
  // This functionality is handled through menu permissions and data filters
  return [];
};

export const addGroupAccess = async (groupId: number, resourceType: string, resourceId: number, accessLevel: string): Promise<GroupAccess> => {
  // This functionality is handled through menu permissions and data filters
  throw new Error('Direct access control is not supported. Use menu permissions and data filters instead.');
};

export const updateGroupAccess = async (accessId: number, accessLevel: string): Promise<GroupAccess> => {
  // This functionality is handled through menu permissions and data filters
  throw new Error('Direct access control is not supported. Use menu permissions and data filters instead.');
};

export const removeGroupAccess = async (accessId: number): Promise<void> => {
  // This functionality is handled through menu permissions and data filters
  throw new Error('Direct access control is not supported. Use menu permissions and data filters instead.');
};

// Permission related functions
export const getPermissions = async (): Promise<Permission[]> => {
  try {
    const response = await api.get(`/users/permissions/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getGroupPermissions = async (groupId: number): Promise<GroupPermission[]> => {
  try {
    const response = await api.get(`/groups/${groupId}/permissions/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addPermissionToGroup = async (groupId: number, permissionId: number): Promise<GroupPermission> => {
  try {
    const response = await api.post(`/groups/${groupId}/permissions/`, {
      permission: permissionId
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const removePermissionFromGroup = async (groupPermissionId: number): Promise<void> => {
  try {
    await api.delete(`/users/group-permissions/${groupPermissionId}/`);
  } catch (error) {
    throw error;
  }
};

// Password reset functions
export const requestPasswordReset = async (email: string): Promise<void> => {
  try {
    await api.post('/users/password-reset/', { email });
  } catch (error) {
    throw error;
  }
};

export const confirmPasswordReset = async (uid: string, token: string, newPassword: string): Promise<void> => {
  try {
    await api.post(`/users/password-reset/${uid}/${token}/`, {
      new_password: newPassword
    });
  } catch (error) {
    throw error;
  }
};

// Save manual permission overrides to localStorage
export const setManualPermissionOverrides = (permissions: Record<string, boolean>): void => {
  try {
    localStorage.setItem('menu_permissions_override', JSON.stringify(permissions));
  } catch (error) {
  }
};

// Get manual permission overrides from localStorage
export const getManualPermissionOverrides = (): Record<string, boolean> | null => {
  try {
    const overrides = localStorage.getItem('menu_permissions_override');
    if (overrides) {
      const parsedOverrides = JSON.parse(overrides) as Record<string, boolean>;
      return parsedOverrides;
    }
    return null;
  } catch (error) {
    return null;
  }
};

// Clear manual permission overrides
export const clearManualPermissionOverrides = (): void => {
  localStorage.removeItem('menu_permissions_override');
};

// Menu permissions with optional override support
export const getMenuPermissions = async (userId?: number): Promise<Record<string, boolean>> => {
  try {
    // Get the current username for debugging
    const username = localStorage.getItem('username');
    
    // Check for manual permission overrides first
    const overrides = getManualPermissionOverrides();
    if (overrides) {
      return overrides;
    }
    
    // Prepare API request URL with optional userId parameter
    let menuApiUrl = '/users/my-menu-permissions/';
    if (userId) {
      menuApiUrl += `?user_id=${userId}`;
    }
    
    // Call the menu permissions endpoint
    const menuResponse = await api.get(menuApiUrl);
    
    // Check if the response is already in the correct format (key-value pairs)
    if (menuResponse.data && typeof menuResponse.data === 'object' && 
        !Array.isArray(menuResponse.data) && !menuResponse.data.results) {
      
      // Make sure we have 'analysis' included (API might not include it yet)
      const permissionsData = {...menuResponse.data};
      
      // Ensure all values are explicitly boolean values
      const permissions: Record<string, boolean> = {};
      Object.entries(permissionsData).forEach(([key, value]) => {
        // Explicitly convert to boolean to handle string values like "true" or any other truthy/falsy values
        permissions[key] = value === true || value === "true" || value === 1 || value === "1";
      });
      
      // Add any missing default permissions
      if (permissions.dashboard === undefined) permissions.dashboard = true;
      if (permissions['bio-mass'] === undefined) permissions['bio-mass'] = false;
      if (permissions['job-management'] === undefined) permissions['job-management'] = false;
      if (permissions.reports === undefined) permissions.reports = false;
      if (permissions.imports === undefined) permissions.imports = false;
      if (permissions.settings === undefined) permissions.settings = false;
      if (permissions.analysis === undefined) permissions.analysis = false;
      
      return permissions;
    }
    
    // Handle paginated response format - this is now mainly used for admin views of all permissions
    if (menuResponse.data && menuResponse.data.results && Array.isArray(menuResponse.data.results)) {
      
      // Create default permissions object (all false)
      const permissions: Record<string, boolean> = {
        'dashboard': false,
        'bio-mass': false,
        'job-management': false,
        'reports': false, 
        'imports': false,
        'settings': false,
        'analysis': false
      };
      
      // Define interface for menu permission items in the API response
      interface MenuPermissionItem {
        id?: number;
        group?: number;
        menu_item: string;
        menu_item_display?: string;
        is_visible: boolean | string | number;
      }
      
      // Process each permission in the results
      menuResponse.data.results.forEach((item: MenuPermissionItem) => {
        // Check if this is a permission object with menu_item and is_visible properties
        if (item && item.menu_item) {
          // Explicitly convert to boolean
          const isVisible = item.is_visible === true || 
                           item.is_visible === "true" || 
                           item.is_visible === 1 || 
                           item.is_visible === "1";
          
          permissions[item.menu_item] = isVisible;
        }
      });
      
      return permissions;
    }
    
    // Fallback to dashboard only if response is in unexpected format
    return {
      'dashboard': true,
      'bio-mass': false,
      'job-management': false,
      'reports': false, 
      'imports': false,
      'settings': false,
      'analysis': false
    };
  } catch (error) {
    
    // Return default permissions as fallback - dashboard only
    return {
      'dashboard': true,
      'bio-mass': false,
      'job-management': false,
      'reports': false, 
      'imports': false,
      'settings': false,
      'analysis': false
    };
  }
};

// Get current user data including groups
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await api.get('/users/current-user/');
    return response.data;
  } catch (error) {
    return null;
  }
};

// Get a specific user's group memberships
export const getUserGroupMemberships = async (userId: number): Promise<UserGroup[]> => {
  try {
    // Instead of direct GET request to /users/users/${userId}/api/v1/groups/
    // which causes 405 Method Not Allowed, use getGroups()
    // This is a workaround until the backend API supports GET on that endpoint
    
    // Get all groups
    const allGroups = await getGroups();
    
    // In a real implementation, you would need a way to filter these
    // to only the ones the user belongs to. For now, returning all groups
    // as a temporary workaround.
    
    return allGroups;
  } catch (error) {
    return [];
  }
};

// Get the view type for the current user
export const getUserViewType = async (): Promise<string> => {
  try {
    // Get the user view type from the API with proper prefix
    const response = await api.get('/users/view-type/');
    
    if (response.data && response.data.view_type) {
      return response.data.view_type;
    }
    
    // Default to staff view if there's an issue with the response
    return 'staff';
  } catch (error) {
    // Default to staff view if there's an error
    return 'staff';
  }
};

// Define interface for GroupViewType
interface GroupViewTypeResponse {
  id: number;
  group: number;
  view_type: string;
  view_type_display?: string;
}

// Get view types for all groups
export const getGroupViewTypes = async (): Promise<GroupViewTypeResponse[]> => {
  try {
    const response = await api.get('/users/group-view-types/');
    return response.data.results || [];
  } catch (error) {
    return [];
  }
};

// Get view type for a specific group
export const getGroupViewType = async (groupId: number): Promise<GroupViewTypeResponse | null> => {
  try {
    const response = await api.get(`/users/group-view-types/`, {
      params: { group_id: groupId }
    });
    
    if (response.data && response.data.results && response.data.results.length > 0) {
      return response.data.results[0];
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

// Set view type for a group
export const setGroupViewType = async (groupId: number, viewType: string): Promise<GroupViewTypeResponse> => {
  try {
    // First check if the group already has a view type
    const existingViewType = await getGroupViewType(groupId);
    
    if (existingViewType) {
      // Update existing view type
      const response = await api.patch(`/users/group-view-types/${existingViewType.id}/`, {
        view_type: viewType
      });
      return response.data;
    } else {
      // Create new view type
      const response = await api.post('/users/group-view-types/', {
        group: groupId,
        view_type: viewType
      });
      return response.data;
    }
  } catch (error) {
    throw error;
  }
};

// Create a default export that includes all the functions
const userService = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getGroups,
  getUserGroups,
  getUsersInGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  getPermissions,
  getGroupPermissions,
  addPermissionToGroup,
  removePermissionFromGroup,
  addUserToGroup,
  removeUserFromGroup,
  getGroupAccess,
  addGroupAccess,
  updateGroupAccess,
  removeGroupAccess,
  activateUser,
  deactivateUser,
  approveUser,
  unapproveUser,
  resetPassword,
  requestPasswordReset,
  confirmPasswordReset,
  getMenuPermissions,
  getCurrentUser,
  getUserGroupMemberships,
  setManualPermissionOverrides,
  getManualPermissionOverrides,
  clearManualPermissionOverrides,
  getUserViewType,
  getGroupViewTypes,
  getGroupViewType,
  setGroupViewType
};

export default userService;