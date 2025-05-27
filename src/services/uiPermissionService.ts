import { api } from './api';

interface UIPermissionsResponse {
  permissions: Record<string, boolean>;
  groups: string[];
  cached_at: string;
}

interface PermissionNode {
  id: number;
  codename: string;
  name: string;
  description: string;
  is_granted?: boolean;
  children?: PermissionNode[];
}

class UIPermissionService {
  private permissions: Record<string, boolean> = {};
  private loaded = false;
  private loadPromise: Promise<UIPermissionsResponse> | null = null;
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private lastFetch: number = 0;

  /**
   * Load permissions from the API
   * @param force Force reload even if cached
   */
  async loadPermissions(force = false): Promise<UIPermissionsResponse> {
    const now = Date.now();
    const cacheValid = now - this.lastFetch < this.cacheExpiry;

    if (this.loaded && !force && cacheValid && this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = api.get('/users/ui-permissions/my-permissions/')
      .then(response => {
        this.permissions = response.data.permissions || {};
        this.loaded = true;
        this.lastFetch = now;
        
        // Store in session storage for quick access
        try {
          sessionStorage.setItem('ui_permissions', JSON.stringify(response.data));
          sessionStorage.setItem('ui_permissions_timestamp', now.toString());
        } catch (e) {
          console.warn('Failed to cache permissions in session storage');
        }
        
        return response.data;
      })
      .catch(error => {
        // Try to load from session storage as fallback
        try {
          const cached = sessionStorage.getItem('ui_permissions');
          const timestamp = sessionStorage.getItem('ui_permissions_timestamp');
          
          if (cached && timestamp) {
            const cachedTime = parseInt(timestamp, 10);
            if (now - cachedTime < this.cacheExpiry) {
              const data = JSON.parse(cached) as UIPermissionsResponse;
              this.permissions = data.permissions || {};
              this.loaded = true;
              return data;
            }
          }
        } catch (e) {
          console.warn('Failed to load cached permissions');
        }
        
        throw error;
      });

    return this.loadPromise;
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(codename: string): boolean {
    if (!this.loaded) {
      console.warn('Permissions not loaded. Call loadPermissions() first.');
      return false;
    }
    
    // Check direct permission
    if (this.permissions[codename] !== undefined) {
      return this.permissions[codename];
    }
    
    // Check parent permissions (hierarchical)
    const parts = codename.split('.');
    for (let i = parts.length - 1; i > 0; i--) {
      const parentCode = parts.slice(0, i).join('.');
      const parentPermission = this.permissions[parentCode];
      
      if (parentPermission !== undefined) {
        return parentPermission;
      }
    }
    
    return false;
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(codenames: string[]): boolean {
    return codenames.some(code => this.hasPermission(code));
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(codenames: string[]): boolean {
    return codenames.every(code => this.hasPermission(code));
  }

  /**
   * Get all permissions
   */
  getAllPermissions(): Record<string, boolean> {
    return { ...this.permissions };
  }

  /**
   * Clear the permission cache
   */
  clearCache(): void {
    this.permissions = {};
    this.loaded = false;
    this.loadPromise = null;
    this.lastFetch = 0;
    
    try {
      sessionStorage.removeItem('ui_permissions');
      sessionStorage.removeItem('ui_permissions_timestamp');
    } catch (e) {
      console.warn('Failed to clear session storage');
    }
  }

  /**
   * Get permission tree for admin UI
   */
  async getPermissionTree(groupId?: number): Promise<PermissionNode[]> {
    const params = groupId ? { group_id: groupId } : {};
    const response = await api.get('/users/ui-permissions/tree/', { params });
    return response.data;
  }

  /**
   * Bulk update group permissions
   */
  async bulkUpdateGroupPermissions(
    groupId: number, 
    permissions: Array<{ codename: string; is_granted: boolean }>
  ): Promise<void> {
    // The backend expects permissions as a direct array in the body
    const payload = {
      group_id: groupId,
      permissions: permissions
    };
    
    console.log('Sending bulk update:', payload);
    
    await api.post('/users/group-ui-permissions/bulk-update/', payload);
    
    // Clear cache to force reload
    this.clearCache();
  }

  /**
   * Copy permissions from one group to another
   */
  async copyPermissions(fromGroupId: number, toGroupId: number): Promise<void> {
    await api.post('/users/group-ui-permissions/copy-permissions/', {
      from_group_id: fromGroupId,
      to_group_id: toGroupId
    });
    
    // Clear cache to force reload
    this.clearCache();
  }

  /**
   * Check if the service is initialized
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Preload permissions (useful for app initialization)
   */
  async preload(): Promise<void> {
    try {
      await this.loadPermissions();
    } catch (error) {
      console.error('Failed to preload UI permissions:', error);
    }
  }

  /**
   * Bulk check multiple permissions
   */
  async checkBulk(codenames: string[], checkAll = false): Promise<{
    permissions: Record<string, boolean>;
    hasAll?: boolean;
    hasAny?: boolean;
  }> {
    try {
      const response = await api.post('/users/ui-permissions/check-bulk/', {
        codenames,
        check_all: checkAll
      });
      return response.data;
    } catch (error) {
      // Fallback to local check
      const permissions: Record<string, boolean> = {};
      codenames.forEach(codename => {
        permissions[codename] = this.hasPermission(codename);
      });
      
      if (checkAll) {
        return {
          permissions,
          hasAll: Object.values(permissions).every(v => v)
        };
      } else {
        return {
          permissions,
          hasAny: Object.values(permissions).some(v => v)
        };
      }
    }
  }

  /**
   * Get permission dependencies
   */
  async getPermissionDependencies(codename: string): Promise<{
    depends_on: Array<{ codename: string; name: string; is_granted: boolean }>;
    required_by: Array<{ codename: string; name: string; is_granted: boolean }>;
  }> {
    const response = await api.get(`/users/ui-permissions/${codename}/dependencies/`);
    return response.data;
  }
}

// Export singleton instance
export const uiPermissionService = new UIPermissionService();

// Export type for use in components
export type { UIPermissionsResponse, PermissionNode };