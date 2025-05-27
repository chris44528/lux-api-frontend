# Site Detail Tab Permissions Implementation

## Summary
Updated the StaffSiteDetailPage component to use UI permissions for controlling tab visibility.

## Changes Made:

1. **Created UI Permissions Hook** (`/src/hooks/use-ui-permissions.ts`)
   - Re-exports the existing UIPermissionContext hooks for convenience
   - Provides `useUIPermissions`, `usePermission`, and `usePermissions` hooks

2. **Updated StaffSiteDetailPage Component** (`/src/components/StaffSiteDetail/StaffSiteDetailPage.tsx`)
   - Imported `useUIPermissions` hook
   - Added permission-based tab filtering
   - Implemented dynamic tab visibility based on permissions
   - Added graceful handling when no tabs are visible

## Permission Codenames:
The following permissions control tab visibility:
- `sites.detail.tabs.overview` - Controls Overview tab visibility
- `sites.detail.tabs.readings` - Controls Readings tab visibility  
- `sites.detail.tabs.meters` - Controls Meters tab visibility
- `sites.detail.tabs.jobs` - Controls Jobs tab visibility
- `sites.detail.tabs.calls` - Controls Calls tab visibility

## Implementation Details:

### Tab Configuration
```typescript
const availableTabs = [
  { key: 'overview', label: 'Overview', permission: 'sites.detail.tabs.overview' },
  { key: 'readings', label: 'Readings', permission: 'sites.detail.tabs.readings' },
  { key: 'meter-info', label: 'Meters', permission: 'sites.detail.tabs.meters' },
  { key: 'jobs', label: 'Jobs', permission: 'sites.detail.tabs.jobs' },
  { key: 'calls', label: 'Calls', permission: 'sites.detail.tabs.calls' },
];
```

### Features:
1. **Dynamic Tab Filtering**: Only tabs the user has permission to see are rendered
2. **Auto-select First Tab**: Automatically selects the first visible tab on load
3. **No Tabs Message**: Shows a message if user has no permissions for any tabs
4. **Permission-based Content**: Tab content is only rendered if user has permission

## Testing:
The implementation has been successfully built and compiled. To test:
1. Configure user/group permissions in the backend for the tab permissions
2. Log in with different users having different tab permissions
3. Verify only permitted tabs are visible

## Notes:
- The application already had UIPermissionProvider set up in main.tsx
- The existing uiPermissionService handles permission loading and caching
- Permissions are hierarchical - parent permissions can grant access to child permissions