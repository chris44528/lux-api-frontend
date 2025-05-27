import React from 'react';
import { ProtectedElement } from './ProtectedElement';
import { usePermission } from '../hooks/useUIPermissions';
import { Button } from './ui/button';
import { Plus, FileDown, Filter } from 'lucide-react';

/**
 * Example implementation of SiteList with UI permissions
 * This shows how to apply granular permissions to list views
 */
export function SiteListWithPermissions() {
  // Check permissions for various actions
  const canViewList = usePermission('sites.list.view');
  const canAddSite = usePermission('sites.list.add_button');
  const canExport = usePermission('sites.list.export_button');
  const canBulkAction = usePermission('sites.list.bulk_actions');
  const canFilter = usePermission('sites.list.filter_advanced');
  
  // If user can't view the list at all, show access denied
  if (!canViewList) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
        <p>You don't have permission to view the sites list.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Header with conditional actions */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sites</h1>
        
        <div className="flex gap-2">
          {/* Only show Add Site button if user has permission */}
          <ProtectedElement permission="sites.list.add_button">
            <Button onClick={() => console.log('Add site')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Site
            </Button>
          </ProtectedElement>
          
          {/* Only show Export button if user has permission */}
          <ProtectedElement permission="sites.list.export_button">
            <Button variant="outline" onClick={() => console.log('Export')}>
              <FileDown className="mr-2 h-4 w-4" />
              Export
            </Button>
          </ProtectedElement>
          
          {/* Advanced filters only for users with permission */}
          <ProtectedElement permission="sites.list.filter_advanced">
            <Button variant="outline" onClick={() => console.log('Advanced filters')}>
              <Filter className="mr-2 h-4 w-4" />
              Advanced Filters
            </Button>
          </ProtectedElement>
        </div>
      </div>
      
      {/* Table with conditional bulk actions */}
      <div className="border rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              {canBulkAction && (
                <th className="p-2 text-left">
                  <input type="checkbox" />
                </th>
              )}
              <th className="p-2 text-left">Site Name</th>
              <th className="p-2 text-left">Account</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Example rows */}
            {[1, 2, 3].map(i => (
              <tr key={i} className="border-b">
                {canBulkAction && (
                  <td className="p-2">
                    <input type="checkbox" />
                  </td>
                )}
                <td className="p-2">Site {i}</td>
                <td className="p-2">ACC00{i}</td>
                <td className="p-2">
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                    Active
                  </span>
                </td>
                <td className="p-2">
                  <Button size="sm" variant="outline">View</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Bulk actions only shown if user has permission */}
      <ProtectedElement permission="sites.list.bulk_actions">
        <div className="flex gap-2 items-center">
          <select className="border rounded px-2 py-1">
            <option>Bulk Actions</option>
            <option>Export Selected</option>
            <option>Update Status</option>
          </select>
          <Button size="sm">Apply</Button>
        </div>
      </ProtectedElement>
    </div>
  );
}