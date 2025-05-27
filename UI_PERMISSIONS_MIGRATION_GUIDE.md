# UI Permissions Migration Guide

## Overview
This guide provides step-by-step instructions for migrating existing components to use the new UI permissions system.

## Prerequisites
1. Backend UI permissions system deployed and seeded
2. Frontend services and hooks installed
3. UIPermissionProvider wrapped around your app

## Migration Steps

### Step 1: Identify Components to Migrate

Priority order:
1. **Action Menus** (e.g., ActionsDropdown)
2. **Tab Navigation** (e.g., Site Details tabs)
3. **List Actions** (Add, Export, Bulk operations)
4. **Form Fields** (Sensitive data fields)
5. **Dashboard Widgets**

### Step 2: Basic Permission Check

#### Before:
```tsx
// No permission check
<Button onClick={handleTestMeter}>Test Meter</Button>
```

#### After:
```tsx
import { ProtectedElement } from '@/components/ProtectedElement';

<ProtectedElement permission="sites.detail.actions.test_meter">
  <Button onClick={handleTestMeter}>Test Meter</Button>
</ProtectedElement>
```

### Step 3: Conditional Rendering with Hooks

#### Before:
```tsx
const SiteActions = () => {
  return (
    <div>
      <Button onClick={handleEdit}>Edit</Button>
      <Button onClick={handleDelete}>Delete</Button>
    </div>
  );
};
```

#### After:
```tsx
import { usePermission } from '@/hooks/useUIPermissions';

const SiteActions = () => {
  const canEdit = usePermission('sites.detail.edit');
  const canDelete = usePermission('sites.detail.delete');
  
  return (
    <div>
      {canEdit && <Button onClick={handleEdit}>Edit</Button>}
      {canDelete && <Button onClick={handleDelete}>Delete</Button>}
    </div>
  );
};
```

### Step 4: Migrating Dynamic Menus

#### Before:
```tsx
const menuItems = [
  { label: 'Test Meter', onClick: handleTest },
  { label: 'Change SIM', onClick: handleSIM },
  { label: 'Export', onClick: handleExport }
];

return menuItems.map(item => (
  <MenuItem key={item.label} onClick={item.onClick}>
    {item.label}
  </MenuItem>
));
```

#### After:
```tsx
import { useUIPermissions } from '@/hooks/useUIPermissions';

const allMenuItems = [
  { label: 'Test Meter', onClick: handleTest, permission: 'sites.detail.actions.test_meter' },
  { label: 'Change SIM', onClick: handleSIM, permission: 'sites.detail.actions.change_sim' },
  { label: 'Export', onClick: handleExport, permission: 'sites.detail.actions.export' }
];

const MenuComponent = () => {
  const permissionCodes = allMenuItems.map(item => item.permission);
  const { permissions } = useUIPermissions(permissionCodes);
  
  const visibleItems = allMenuItems.filter(item => permissions[item.permission]);
  
  return visibleItems.map(item => (
    <MenuItem key={item.label} onClick={item.onClick}>
      {item.label}
    </MenuItem>
  ));
};
```

### Step 5: Migrating Tabs

#### Before:
```tsx
<Tabs>
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="meters">Meters</TabsTrigger>
    <TabsTrigger value="readings">Readings</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">...</TabsContent>
  <TabsContent value="meters">...</TabsContent>
  <TabsContent value="readings">...</TabsContent>
</Tabs>
```

#### After:
```tsx
const tabs = [
  { id: 'overview', label: 'Overview', permission: 'sites.detail.tabs.overview' },
  { id: 'meters', label: 'Meters', permission: 'sites.detail.tabs.meters' },
  { id: 'readings', label: 'Readings', permission: 'sites.detail.tabs.readings' }
];

const TabbedView = () => {
  const permissionCodes = tabs.map(tab => tab.permission);
  const { permissions } = useUIPermissions(permissionCodes);
  
  const visibleTabs = tabs.filter(tab => permissions[tab.permission]);
  const [activeTab, setActiveTab] = useState(visibleTabs[0]?.id);
  
  if (visibleTabs.length === 0) {
    return <div>No accessible tabs</div>;
  }
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        {visibleTabs.map(tab => (
          <TabsTrigger key={tab.id} value={tab.id}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {visibleTabs.map(tab => (
        <TabsContent key={tab.id} value={tab.id}>
          {/* Tab content */}
        </TabsContent>
      ))}
    </Tabs>
  );
};
```

### Step 6: Sensitive Fields

#### Before:
```tsx
<div>
  <Label>Account Number</Label>
  <Input value={accountNumber} />
</div>
```

#### After:
```tsx
<ProtectedElement permission="sites.detail.fields.account_number">
  <div>
    <Label>Account Number</Label>
    <Input value={accountNumber} />
  </div>
</ProtectedElement>
```

### Step 7: Bulk Permission Checks

For performance, check multiple permissions at once:

```tsx
const { permissions } = useUIPermissions([
  'sites.detail.actions.test_meter',
  'sites.detail.actions.change_sim',
  'sites.detail.actions.export',
  'sites.detail.fields.account_number',
  'sites.detail.fields.billing'
]);

// Use permissions object
if (permissions['sites.detail.actions.test_meter']) {
  // Show test meter button
}
```

## Testing Strategy

### 1. Create Test Groups
```javascript
// Test different permission configurations
const testGroups = {
  'Read Only': {
    'sites.list.view': true,
    'sites.detail.view': true,
    'sites.detail.tabs.overview': true
  },
  'Standard User': {
    'sites.list.view': true,
    'sites.detail.view': true,
    'sites.detail.tabs.*': true,
    'sites.detail.actions.add_note': true
  },
  'Power User': {
    'sites.*': true,
    'jobs.*': true,
    'reports.rdg.view': true
  },
  'Admin': {
    '*': true  // All permissions
  }
};
```

### 2. Test Permission Inheritance
- Grant parent permission (e.g., `sites.detail`)
- Verify child permissions are inherited (e.g., `sites.detail.tabs.overview`)

### 3. Test Edge Cases
- No permissions assigned
- Conflicting permissions
- Permission updates while user is active

## Performance Optimization

### 1. Preload Critical Permissions
```tsx
// In App initialization
import { uiPermissionService } from '@/services/uiPermissionService';

useEffect(() => {
  // Preload permissions on app start
  uiPermissionService.preload();
}, []);
```

### 2. Use Bulk Checks
Instead of multiple individual checks:
```tsx
// Bad - Multiple API calls
const canEdit = usePermission('sites.detail.edit');
const canDelete = usePermission('sites.detail.delete');
const canExport = usePermission('sites.detail.export');

// Good - Single check
const { permissions } = useUIPermissions([
  'sites.detail.edit',
  'sites.detail.delete',
  'sites.detail.export'
]);
```

### 3. Cache Component Results
```tsx
const PermissionMemoizedComponent = React.memo(({ permission, children }) => {
  const hasPermission = usePermission(permission);
  return hasPermission ? children : null;
});
```

## Common Patterns

### 1. Permission-Based Routing
```tsx
<Route 
  path="/sites/:id" 
  element={
    <ProtectedElement 
      permission="sites.detail.view"
      fallback={<Navigate to="/access-denied" />}
    >
      <SiteDetailPage />
    </ProtectedElement>
  } 
/>
```

### 2. Disabled vs Hidden
```tsx
// Option 1: Hide element
<ProtectedElement permission="sites.detail.actions.delete">
  <Button onClick={handleDelete}>Delete</Button>
</ProtectedElement>

// Option 2: Disable element
<PermissionGate permission="sites.detail.actions.delete">
  {({ hasPermission }) => (
    <Button 
      onClick={handleDelete} 
      disabled={!hasPermission}
      title={!hasPermission ? "You don't have permission" : ""}
    >
      Delete
    </Button>
  )}
</PermissionGate>
```

### 3. Loading States
```tsx
const ProtectedAction = () => {
  const { hasPermission, loading } = useUIPermission('sites.detail.actions.test_meter');
  
  if (loading) {
    return <Skeleton className="h-10 w-24" />;
  }
  
  if (!hasPermission) {
    return null;
  }
  
  return <Button onClick={handleTest}>Test Meter</Button>;
};
```

## Troubleshooting

### Permission Not Working
1. Check permission is seeded in backend
2. Verify user's group has permission
3. Check for typos in permission codename
4. Clear permission cache

### Performance Issues
1. Use bulk permission checks
2. Implement component-level caching
3. Check WebSocket connection for real-time updates

### Debug Mode
```tsx
// Add to development environment
if (process.env.NODE_ENV === 'development') {
  window.debugPermissions = () => {
    const permissions = uiPermissionService.getAllPermissions();
    console.table(permissions);
  };
}
```

## Rollback Plan

If issues arise, you can temporarily disable UI permissions:

```tsx
// Emergency override in ProtectedElement
export function ProtectedElement({ permission, children }) {
  // Emergency bypass
  if (process.env.REACT_APP_BYPASS_PERMISSIONS === 'true') {
    return <>{children}</>;
  }
  
  // Normal permission check
  const { hasPermission } = useUIPermission(permission);
  return hasPermission ? <>{children}</> : null;
}
```

## Next Steps

1. Start with high-impact, low-risk components
2. Test thoroughly with different user groups
3. Monitor performance metrics
4. Gather user feedback
5. Iterate and improve

Remember: The goal is to enhance security and user experience, not to make the system more complex. Keep it simple and user-friendly!