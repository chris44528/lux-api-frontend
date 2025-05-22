import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { UserGroup } from '../../types/user';
import { api } from '../../services/api';
import { useToast } from '../../hooks/use-toast';
import useMenuPermissions from '../../hooks/use-menu-permissions';
import userService from '../../services/userService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface MenuPermission {
  id: number;
  group: number;
  menu_item: string;
  menu_item_display: string;
  is_visible: boolean;
}

// This interface is used for API responses when fetching group view types
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface GroupViewType {
  id: number;
  group: number;
  view_type: string;
  view_type_display: string;
}

interface MenuPermissionsSettingsProps {
  groups: UserGroup[] | null;
}

export default function MenuPermissionsSettings({ groups }: MenuPermissionsSettingsProps) {
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [menuPermissions, setMenuPermissions] = useState<MenuPermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewTypeLoading, setViewTypeLoading] = useState(false);
  const [updatingPermissionId, setUpdatingPermissionId] = useState<number | null>(null);
  const [groupViewType, setGroupViewType] = useState<string>('staff');
  const { toast } = useToast();
  const { refreshPermissions } = useMenuPermissions();
  
  // Ensure groups is an array
  const groupsArray = Array.isArray(groups) ? groups : [];
  
  console.log('MenuPermissionsSettings rendered with groups:', groupsArray);

  useEffect(() => {
    if (groupsArray.length > 0 && !selectedGroup) {
      console.log('Setting initial selected group to:', groupsArray[0]);
      setSelectedGroup(groupsArray[0].id);
    }
  }, [groupsArray, selectedGroup]);

  useEffect(() => {
    if (selectedGroup) {
      console.log('Fetching menu permissions for group ID:', selectedGroup);
      fetchMenuPermissions(selectedGroup);
      fetchGroupViewType(selectedGroup);
    }
  }, [selectedGroup]);

  const fetchMenuPermissions = async (groupId: number) => {
    try {
      setLoading(true);
      console.log(`Fetching menu permissions for group ${groupId}`);
      
      // Using the group_id query parameter to filter permissions
      const response = await api.get(`/users/menu-permissions/`, {
        params: { group_id: groupId }
      });
      
      console.log('Menu permissions response:', response.data);
      
      // Ensure we're setting an array
      if (Array.isArray(response.data)) {
        setMenuPermissions(response.data);
      } else if (response.data && typeof response.data === 'object') {
        // If it's an object with results property (paginated)
        if (Array.isArray(response.data.results)) {
          setMenuPermissions(response.data.results);
        } 
        // Check if it's an object with menu item keys and boolean values
        else if (Object.values(response.data).every(val => typeof val === 'boolean')) {
          console.log('Menu permissions is a menu item object, converting to array format');
          // Convert the format { dashboard: true, settings: false } to MenuPermission[] format
          const permissionsArray = Object.entries(response.data).map(([key, value], index) => ({
            id: index, // Use index as temporary id
            group: selectedGroup || 0, // Use 0 as fallback if selectedGroup is null
            menu_item: key,
            menu_item_display: key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, ' '),
            is_visible: value as boolean
          }));
          setMenuPermissions(permissionsArray);
        } else {
          // If it's a different object format, convert to array if possible
          console.warn('Menu permissions is not an array, attempting to convert:', response.data);
          const permissionsArray = Object.values(response.data)
            .filter(item => typeof item === 'object' && item !== null)
            .map(item => item as MenuPermission);
          setMenuPermissions(permissionsArray.length > 0 ? permissionsArray : []);
        }
      } else {
        console.error('Unexpected menu permissions format:', response.data);
        setMenuPermissions([]);
      }
    } catch (error) {
      console.error('Error fetching menu permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load menu permissions',
        type: 'error'
      });
      // Set empty array on error
      setMenuPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupViewType = async (groupId: number) => {
    try {
      setViewTypeLoading(true);
      console.log(`Fetching view type for group ${groupId}`);
      
      // Get the group view type
      const viewTypeData = await userService.getGroupViewType(groupId);
      console.log('Group view type response:', viewTypeData);
      
      if (viewTypeData) {
        setGroupViewType(viewTypeData.view_type);
      } else {
        // Default to staff if no view type is set
        setGroupViewType('staff');
      }
    } catch (error) {
      console.error('Error fetching group view type:', error);
      toast({
        title: 'Error',
        description: 'Failed to load group view type',
        type: 'error'
      });
      // Default to staff if there's an error
      setGroupViewType('staff');
    } finally {
      setViewTypeLoading(false);
    }
  };

  const handleCheckboxChange = async (menuPermission: MenuPermission) => {
    try {
      // Determine the current boolean value regardless of type
      const currentValue = typeof menuPermission.is_visible === 'string'
        ? (menuPermission.is_visible as string).toLowerCase() === 'true'
        : !!menuPermission.is_visible;
        
      // Set updating state to show loading indicator
      setUpdatingPermissionId(menuPermission.id);
        
      // Create updated permission with the opposite boolean value
      const updatedPermission = { 
        ...menuPermission, 
        is_visible: !currentValue 
      };
      
      console.log(`Updating menu permission ${menuPermission.id} from ${currentValue} to ${!currentValue}`);
      
      // Make the API call to update the permission
      const response = await api.patch(`/users/menu-permissions/${menuPermission.id}/`, {
        is_visible: updatedPermission.is_visible
      });
      
      console.log('Update permission response:', response.data);
      
      // Immediately refetch the permissions to ensure we have the latest data
      if (selectedGroup) {
        await fetchMenuPermissions(selectedGroup);
      }
      
      // Refresh the application's menu permissions
      refreshPermissions();
      
      toast({
        title: 'Success',
        description: `Menu permission updated successfully`,
        type: 'success'
      });
    } catch (error: unknown) {
      console.error('Error updating menu permission:', error);
      
      // Display more specific error message if available
      let errorMessage = 'Failed to update menu permission';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const responseError = error as { response?: { data?: { detail?: string, error?: string } } };
        errorMessage = responseError.response?.data?.detail || 
                       responseError.response?.data?.error || 
                       errorMessage;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        type: 'error'
      });
      
      // Refresh the data to ensure consistency
      if (selectedGroup) {
        fetchMenuPermissions(selectedGroup);
      }
    } finally {
      // Reset updating state
      setUpdatingPermissionId(null);
    }
  };

  const handleViewTypeChange = async (viewType: string) => {
    if (!selectedGroup) return;
    
    try {
      setViewTypeLoading(true);
      
      // Update the group view type
      await userService.setGroupViewType(selectedGroup, viewType);
      
      setGroupViewType(viewType);
      toast({
        title: 'Success',
        description: `Updated group view type to ${viewType === 'staff' ? 'Staff View' : 'Engineer View'}`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating group view type:', error);
      toast({
        title: 'Error',
        description: 'Failed to update group view type',
        type: 'error'
      });
      // Reset to the previous value
      fetchGroupViewType(selectedGroup);
    } finally {
      setViewTypeLoading(false);
    }
  };

  // If there are no groups, show a message
  if (groupsArray.length === 0) {
    console.log('No groups available');
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Menu Permissions & View Settings</CardTitle>
          <CardDescription>
            Control which menu items are visible to which user groups and what view they see
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">No groups available. Please create at least one user group first.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Menu Permissions & View Settings</CardTitle>
            <CardDescription>
              Control which menu items are visible to which user groups and what view they see
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <button
              className="text-sm bg-amber-500 text-white px-4 py-2 rounded-md hover:bg-amber-600"
              onClick={() => {
                // Set temporary override with all permissions enabled
                userService.setManualPermissionOverrides({
                  dashboard: true,
                  'bio-mass': true,
                  'job-management': true,
                  reports: true,
                  imports: true,
                  settings: true,
                  analysis: true
                });
                
                toast({
                  title: "Success",
                  description: "Manual permission override applied. All menu items enabled."
                });
                
                // Refresh permissions in the UI
                refreshPermissions();
              }}
            >
              Enable All (Testing)
            </button>
            <button
              className="text-sm bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
              onClick={() => {
                // Clear the override
                userService.clearManualPermissionOverrides();
                
                toast({
                  title: "Success",
                  description: "Manual permission overrides cleared"
                });
                
                // Refresh permissions in the UI
                refreshPermissions();
              }}
            >
              Clear Overrides
            </button>
            <button
              className="text-sm bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
              onClick={() => {
                refreshPermissions();
                toast({
                  title: "Success",
                  description: "Application menu permissions refreshed"
                });
              }}
            >
              Refresh App Menu
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <label htmlFor="group-select" className="block text-sm font-medium text-gray-700 mb-1">
              Select Group
            </label>
            {selectedGroup && (
              <button
                className="text-sm text-blue-600 hover:text-blue-800"
                onClick={() => {
                  if (selectedGroup) {
                    fetchMenuPermissions(selectedGroup);
                    fetchGroupViewType(selectedGroup);
                  }
                }}
              >
                Refresh Settings
              </button>
            )}
          </div>
          <select
            id="group-select"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={selectedGroup || ''}
            onChange={(e) => {
              const groupId = Number(e.target.value);
              console.log('Selected group changed to:', groupId);
              setSelectedGroup(groupId);
            }}
          >
            {groupsArray.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        <Tabs defaultValue="menu-permissions" className="mt-6">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="menu-permissions" className="flex-1">Menu Permissions</TabsTrigger>
            <TabsTrigger value="view-type" className="flex-1">Default View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="menu-permissions">
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : menuPermissions.length > 0 ? (
              <div className="space-y-4">
                {menuPermissions.map((permission) => (
                  <div key={permission.id} className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`permission-${permission.id}`}
                        checked={!!permission.is_visible}
                        disabled={updatingPermissionId === permission.id}
                        onCheckedChange={() => handleCheckboxChange(permission)}
                      />
                      <label
                        htmlFor={`permission-${permission.id}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {permission.menu_item_display}
                      </label>
                    </div>
                    {updatingPermissionId === permission.id && (
                      <div className="h-4 w-4 border-t-2 border-blue-500 rounded-full animate-spin"></div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">No menu permissions found for this group.</div>
            )}
          </TabsContent>
          
          <TabsContent value="view-type">
            {viewTypeLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              <div className="space-y-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Select which view this group should see when accessing the application.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className={`border p-4 rounded-md cursor-pointer ${
                      groupViewType === 'staff' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleViewTypeChange('staff')}
                  >
                    <h3 className="font-medium text-lg mb-2">Staff View</h3>
                    <p className="text-sm text-gray-600">
                      Full access to all staff features including reports, dashboards, and administrative tools.
                    </p>
                  </div>
                  
                  <div 
                    className={`border p-4 rounded-md cursor-pointer ${
                      groupViewType === 'engineer' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleViewTypeChange('engineer')}
                  >
                    <h3 className="font-medium text-lg mb-2">Engineer View</h3>
                    <p className="text-sm text-gray-600">
                      Simplified view focused on field operations with essentials for engineers and technicians.
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <h3 className="font-medium text-md mb-2">Current Setting</h3>
                  <p className="text-sm">
                    Group <strong>{groupsArray.find(g => g.id === selectedGroup)?.name}</strong> is 
                    set to use the <strong>{groupViewType === 'staff' ? 'Staff View' : 'Engineer View'}</strong>.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 