import { api } from './api';

/**
 * Alternative bulk update format based on backend error messages
 * The backend seems to expect a different format than documented
 */
export async function bulkUpdatePermissionsAlt(groupId: number, permissions: Array<{ codename: string; is_granted: boolean }>) {
  // Convert to object format where keys are codenames and values are booleans
  const permissionMap: Record<string, boolean> = {};
  permissions.forEach(perm => {
    permissionMap[perm.codename] = perm.is_granted;
  });

  const payload = {
    group_id: groupId,
    permissions: permissionMap
  };

  console.log('Alternative payload format:', payload);
  
  return api.post('/users/group-ui-permissions/bulk-update/', payload);
}

/**
 * Another alternative format - permissions as flat list
 */
export async function bulkUpdatePermissionsFlat(groupId: number, permissions: Array<{ codename: string; is_granted: boolean }>) {
  // Send permissions at root level with group_id
  const payload = {
    group_id: groupId,
    ...permissions.reduce((acc, perm) => ({
      ...acc,
      [perm.codename]: perm.is_granted
    }), {})
  };

  console.log('Flat payload format:', payload);
  
  return api.post('/users/group-ui-permissions/bulk-update/', payload);
}