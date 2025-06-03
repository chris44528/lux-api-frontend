import React, { useState, useEffect } from 'react';
import { UserGroup, Permission, GroupPermission } from '../../types/user';
import * as userService from '../../services/userService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useToast } from '../../hooks/use-toast';
import { Loader2, Search, Plus } from 'lucide-react';

export const PermissionsManagement: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [groupPermissions, setGroupPermissions] = useState<GroupPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  
  // Modal states
  const [isAssignPermissionModalOpen, setIsAssignPermissionModalOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [permsData, groupsData] = await Promise.all([
        userService.getPermissions(),
        userService.getGroups()
      ]);
      setPermissions(permsData);
      setGroups(groupsData);
      
      // Load permissions for the first group if available
      if (groupsData.length > 0) {
        setSelectedGroup(groupsData[0]);
        await loadGroupPermissions(groupsData[0].id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load permissions data"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadGroupPermissions = async (groupId: number) => {
    try {
      const perms = await userService.getGroupPermissions(groupId);
      setGroupPermissions(perms);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load group permissions"
      });
    }
  };

  const handleGroupChange = async (groupId: string) => {
    const group = groups.find(g => g.id.toString() === groupId);
    if (group) {
      setSelectedGroup(group);
      await loadGroupPermissions(group.id);
    }
  };

  const handleAssignPermissions = async () => {
    if (!selectedGroup) return;
    
    try {
      // Remove existing permissions
      for (const perm of groupPermissions) {
        await userService.removePermissionFromGroup(perm.id);
      }
      
      // Add new permissions
      for (const permId of selectedPermissions) {
        await userService.addPermissionToGroup(selectedGroup.id, permId);
      }
      
      toast({
        title: "Success",
        description: "Permissions updated successfully"
      });
      
      setIsAssignPermissionModalOpen(false);
      await loadGroupPermissions(selectedGroup.id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update permissions"
      });
    }
  };

  const handleRemovePermission = async (groupPermissionId: number) => {
    if (!selectedGroup) return;
    
    try {
      await userService.removePermissionFromGroup(groupPermissionId);
      toast({
        title: "Success",
        description: "Permission removed successfully"
      });
      await loadGroupPermissions(selectedGroup.id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove permission"
      });
    }
  };

  const openAssignModal = () => {
    setSelectedPermissions(groupPermissions.map(p => p.permission));
    setIsAssignPermissionModalOpen(true);
  };

  const filteredPermissions = permissions.filter(perm => {
    const searchLower = searchQuery.toLowerCase();
    return (
      perm.name.toLowerCase().includes(searchLower) ||
      perm.codename.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Permissions Management</h2>
      </div>

      <Tabs defaultValue="group-permissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="group-permissions">Group Permissions</TabsTrigger>
          <TabsTrigger value="all-permissions">All Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="group-permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Group Permissions</CardTitle>
              <CardDescription>
                Assign and manage permissions for each group
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="group-select">Select Group</Label>
                  <Select
                    value={selectedGroup?.id.toString()}
                    onValueChange={handleGroupChange}
                  >
                    <SelectTrigger id="group-select">
                      <SelectValue placeholder="Select a group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map(group => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={openAssignModal}>
                  <Plus className="mr-2 h-4 w-4" />
                  Manage Permissions
                </Button>
              </div>

              {selectedGroup && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Current Permissions</h4>
                    {groupPermissions.length > 0 ? (
                      <div className="space-y-2">
                        {groupPermissions.map((groupPerm) => {
                          const permission = permissions.find(p => p.id === groupPerm.permission);
                          if (!permission) return null;
                          
                          return (
                            <div
                              key={groupPerm.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div>
                                <div className="font-medium">{permission.name}</div>
                                <div className="text-sm text-gray-500">
                                  {permission.codename}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemovePermission(groupPerm.id)}
                              >
                                Remove
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500">No permissions assigned to this group</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All System Permissions</CardTitle>
              <CardDescription>
                View all available permissions in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative flex items-center">
                  <Search className="absolute left-3 pointer-events-none z-10 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search permissions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permission Name</TableHead>
                    <TableHead>Code Name</TableHead>
                    <TableHead>Content Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPermissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell className="font-medium">
                        {permission.name}
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {permission.codename}
                        </code>
                      </TableCell>
                      <TableCell>
                        {permission.content_type}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Permissions Modal */}
      <Dialog open={isAssignPermissionModalOpen} onOpenChange={setIsAssignPermissionModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Manage Permissions for {selectedGroup?.name}</DialogTitle>
            <DialogDescription>
              Select the permissions to assign to this group
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[50vh] space-y-2 py-4">
            {permissions.map((permission) => (
              <div
                key={permission.id}
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Checkbox
                  id={`perm-${permission.id}`}
                  checked={selectedPermissions.includes(permission.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedPermissions([...selectedPermissions, permission.id]);
                    } else {
                      setSelectedPermissions(selectedPermissions.filter(id => id !== permission.id));
                    }
                  }}
                />
                <Label
                  htmlFor={`perm-${permission.id}`}
                  className="flex-1 cursor-pointer"
                >
                  <div className="font-medium">{permission.name}</div>
                  <div className="text-sm text-gray-500">{permission.codename}</div>
                </Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignPermissionModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignPermissions}>
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};