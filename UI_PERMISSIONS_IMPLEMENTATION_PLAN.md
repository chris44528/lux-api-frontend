# UI Permissions Implementation Plan

## Overview
This plan outlines how to integrate the backend's granular UI permissions system with the existing frontend permission controls, ensuring a smooth transition without disrupting current functionality.

## Current State Analysis

### Existing Systems
1. **Menu Permissions**: Controls visibility of main navigation items
2. **View Types**: Determines staff vs engineer UI layouts
3. **Group-based Access**: Users belong to groups with specific permissions
4. **Hard-coded Actions**: Action buttons are currently hard-coded without permission checks

### New Backend System Features
1. **Granular UI Permissions**: Control any UI element with hierarchical codenames
2. **Hierarchical Structure**: Parent permissions cascade to children
3. **Bulk Operations**: Update multiple permissions efficiently
4. **Caching**: Redis + DB caching for performance

## Implementation Phases

### Phase 1: Foundation (Week 1)
1. **Create Permission Service**
   - Extend existing permission system
   - Maintain backward compatibility
   - Add caching layer

2. **Update User Service**
   ```typescript
   // Add to userService.ts
   - getUIPermissions(): Fetch all UI permissions
   - hasUIPermission(codename): Check single permission
   - hasAnyUIPermission(codenames[]): Check any permission
   - hasAllUIPermissions(codenames[]): Check all permissions
   ```

3. **Create Permission Context**
   ```typescript
   // UIPermissionContext.tsx
   - Store UI permissions globally
   - Provide permission checking methods
   - Auto-refresh on login/logout
   ```

### Phase 2: Integration Hooks (Week 1)
1. **Create useUIPermission Hook**
   ```typescript
   // hooks/useUIPermission.ts
   - Check single permission
   - Handle loading states
   - Cache results
   ```

2. **Update Existing Hooks**
   - Modify `use-menu-permissions.ts` to use new system
   - Ensure backward compatibility

### Phase 3: Component Updates (Week 2)

#### Priority 1: Actions Menu
1. **Update ActionsDropdown.tsx**
   - Add permission checks for each action
   - Permission codenames:
     ```
     sites.detail.actions.test_meter
     sites.detail.actions.change_meter
     sites.detail.actions.change_sim
     sites.detail.actions.note
     sites.detail.actions.job
     sites.detail.actions.export
     sites.detail.actions.monitoring
     sites.detail.actions.alerts
     sites.detail.actions.compare
     sites.detail.actions.text_landlord
     ```

2. **Dynamic Action Rendering**
   ```typescript
   const actions = [
     { 
       id: 'test_meter',
       label: 'Test Meter',
       permission: 'sites.detail.actions.test_meter',
       onClick: handleTestMeter
     },
     // ... other actions
   ];
   
   const visibleActions = actions.filter(action => 
     hasUIPermission(action.permission)
   );
   ```

#### Priority 2: Site Detail Tabs
1. **Update Tab Visibility**
   - Permission codenames:
     ```
     sites.detail.tabs.overview
     sites.detail.tabs.meters
     sites.detail.tabs.readings
     sites.detail.tabs.jobs
     sites.detail.tabs.calls
     ```

#### Priority 3: List View Actions
1. **Update Site List Actions**
   - Add Site button: `sites.list.add_button`
   - Export button: `sites.list.export_button`
   - Bulk actions: `sites.list.bulk_actions`

### Phase 4: Admin UI (Week 2-3)
1. **Create UI Permission Management Component**
   - Tree view of all permissions
   - Bulk update interface
   - Copy permissions between groups
   - Search and filter capabilities

2. **Integrate into Settings Page**
   - Add new tab for UI Permissions
   - Group-based permission management
   - Visual permission tree editor

### Phase 5: Migration & Testing (Week 3)
1. **Data Migration**
   - Map existing menu permissions to new system
   - Preserve current group permissions
   - Test permission inheritance

2. **Testing Strategy**
   - Unit tests for permission hooks
   - Integration tests for components
   - E2E tests for permission flows

## Technical Implementation Details

### 1. Permission Service Extension
```typescript
// services/uiPermissionService.ts
import { api } from './api';

interface UIPermissions {
  permissions: Record<string, boolean>;
  groups: string[];
  cached_at: string;
}

class UIPermissionService {
  private permissions: Record<string, boolean> = {};
  private loaded = false;
  private loadPromise: Promise<UIPermissions> | null = null;

  async loadPermissions(force = false): Promise<UIPermissions> {
    if (this.loaded && !force && this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = api.get('/users/ui-permissions/my-permissions/')
      .then(response => {
        this.permissions = response.data.permissions;
        this.loaded = true;
        return response.data;
      });

    return this.loadPromise;
  }

  hasPermission(codename: string): boolean {
    return this.permissions[codename] === true;
  }

  hasAnyPermission(codenames: string[]): boolean {
    return codenames.some(code => this.hasPermission(code));
  }

  hasAllPermissions(codenames: string[]): boolean {
    return codenames.every(code => this.hasPermission(code));
  }

  clearCache(): void {
    this.permissions = {};
    this.loaded = false;
    this.loadPromise = null;
  }
}

export const uiPermissionService = new UIPermissionService();
```

### 2. Permission Hook
```typescript
// hooks/useUIPermission.ts
import { useState, useEffect } from 'react';
import { uiPermissionService } from '../services/uiPermissionService';

export function useUIPermission(codename: string | string[]) {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkPermission() {
      await uiPermissionService.loadPermissions();
      
      if (Array.isArray(codename)) {
        setHasPermission(uiPermissionService.hasAllPermissions(codename));
      } else {
        setHasPermission(uiPermissionService.hasPermission(codename));
      }
      setLoading(false);
    }
    
    checkPermission();
  }, [codename]);

  return { hasPermission, loading };
}
```

### 3. Protected Component Wrapper
```typescript
// components/ProtectedElement.tsx
interface ProtectedElementProps {
  permission: string | string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function ProtectedElement({ 
  permission, 
  fallback = null, 
  children 
}: ProtectedElementProps) {
  const { hasPermission, loading } = useUIPermission(permission);
  
  if (loading) return null;
  if (!hasPermission) return <>{fallback}</>;
  
  return <>{children}</>;
}
```

## Migration Strategy

### Step 1: Parallel Systems
- Run both old and new permission systems side by side
- New system falls back to old system if permissions not found
- Monitor for discrepancies

### Step 2: Gradual Migration
- Start with non-critical components
- Move to critical components after validation
- Keep rollback capability

### Step 3: Deprecation
- Remove old permission checks after full migration
- Clean up legacy code
- Update documentation

## Backend Requirements

### API Endpoints Needed
1. ✅ GET `/api/v1/users/ui-permissions/my-permissions/`
2. ✅ GET `/api/v1/users/ui-permissions/tree/`
3. ✅ POST `/api/v1/users/group-ui-permissions/bulk-update/`
4. ✅ POST `/api/v1/users/group-ui-permissions/copy-permissions/`

### Additional Backend Work
1. **Permission Seeding**
   - Ensure all UI elements have corresponding permissions
   - Run `python manage.py seed_ui_permissions`

2. **Cache Invalidation**
   - Add endpoint to clear permission cache on demand
   - Trigger cache clear on permission updates

3. **Audit Logging**
   - Log permission changes for compliance
   - Track who changed what permissions when

## Risk Mitigation

### Potential Issues
1. **Performance**: Large permission sets could slow initial load
   - Solution: Implement progressive loading
   - Cache aggressively

2. **Complexity**: Too many permissions could overwhelm admins
   - Solution: Group related permissions
   - Provide permission templates

3. **Migration Errors**: Incorrect permission mapping
   - Solution: Extensive testing
   - Gradual rollout with monitoring

## Success Metrics
1. **Performance**: Permission checks < 1ms
2. **Coverage**: 100% of UI elements have permission controls
3. **Adoption**: All user groups properly configured
4. **Reliability**: < 0.1% permission-related errors

## Timeline
- Week 1: Foundation & Hooks
- Week 2: Component Updates & Admin UI
- Week 3: Testing & Migration
- Week 4: Monitoring & Optimization

## Next Steps
1. Review and approve plan
2. Set up development environment
3. Create feature branch
4. Begin Phase 1 implementation