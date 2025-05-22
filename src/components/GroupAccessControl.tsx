import React, { useState, useEffect } from 'react';
import { GroupAccess, UserGroup } from '../types/user';
import userService from '../services/userService';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useToast } from '../hooks/use-toast';
import { Trash } from 'lucide-react';

interface GroupAccessControlProps {
  group: UserGroup;
}

// Define available access levels
const ACCESS_LEVELS = [
  { value: 'read', label: 'Read' },
  { value: 'write', label: 'Write' },
  { value: 'admin', label: 'Admin' }
];

// Define available resource types
const RESOURCE_TYPES = [
  { value: 'job', label: 'Job' },
  { value: 'task', label: 'Task' },
  { value: 'template', label: 'Template' },
  { value: 'report', label: 'Report' }
];

export function GroupAccessControl({ group }: GroupAccessControlProps) {
  const [accessRules, setAccessRules] = useState<GroupAccess[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAccess, setNewAccess] = useState({
    resourceType: '',
    resourceId: '',
    accessLevel: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (group?.id) {
      fetchAccessRules();
    }
  }, [group?.id]);

  const fetchAccessRules = async () => {
    if (!group?.id) return;
    
    setLoading(true);
    try {
      const rules = await userService.getGroupAccess(group.id);
      setAccessRules(rules);
    } catch (error) {
      console.error('Error fetching access rules:', error);
      toast({
        title: 'Error',
        description: 'Failed to load access rules',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccess = async () => {
    if (!group?.id || !newAccess.resourceType || !newAccess.resourceId || !newAccess.accessLevel) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        type: 'error'
      });
      return;
    }

    try {
      const resourceId = parseInt(newAccess.resourceId);
      if (isNaN(resourceId)) {
        toast({
          title: 'Error',
          description: 'Resource ID must be a number',
          type: 'error'
        });
        return;
      }

      const addedAccess = await userService.addGroupAccess(
        group.id,
        newAccess.resourceType,
        resourceId,
        newAccess.accessLevel
      );
      
      setAccessRules([...accessRules, addedAccess]);
      setDialogOpen(false);
      setNewAccess({
        resourceType: '',
        resourceId: '',
        accessLevel: ''
      });
      
      toast({
        title: 'Success',
        description: 'Access rule added successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error adding access rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to add access rule',
        type: 'error'
      });
    }
  };

  const handleUpdateAccess = async (accessId: number, accessLevel: string) => {
    try {
      await userService.updateGroupAccess(accessId, accessLevel);
      setAccessRules(
        accessRules.map(rule => 
          rule.id === accessId ? { ...rule, access_level: accessLevel } : rule
        )
      );
      
      toast({
        title: 'Success',
        description: 'Access level updated successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating access level:', error);
      toast({
        title: 'Error',
        description: 'Failed to update access level',
        type: 'error'
      });
    }
  };

  const handleRemoveAccess = async (accessId: number) => {
    try {
      await userService.removeGroupAccess(accessId);
      setAccessRules(accessRules.filter(rule => rule.id !== accessId));
      
      toast({
        title: 'Success',
        description: 'Access rule removed successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error removing access rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove access rule',
        type: 'error'
      });
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Access Controls for {group?.name}</CardTitle>
        <CardDescription>
          Manage what resources this group can access and their permission levels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Access Rules</h3>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add Access Rule</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Access Rule</DialogTitle>
                <DialogDescription>
                  Create a new access rule for this group
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="resourceType" className="text-right">
                    Resource Type
                  </label>
                  <Select 
                    value={newAccess.resourceType}
                    onValueChange={(value) => setNewAccess({...newAccess, resourceType: value})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select resource type" />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOURCE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="resourceId" className="text-right">
                    Resource ID
                  </label>
                  <input
                    id="resourceId"
                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newAccess.resourceId}
                    onChange={(e) => setNewAccess({...newAccess, resourceId: e.target.value})}
                    placeholder="Enter resource ID"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="accessLevel" className="text-right">
                    Access Level
                  </label>
                  <Select 
                    value={newAccess.accessLevel}
                    onValueChange={(value) => setNewAccess({...newAccess, accessLevel: value})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select access level" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCESS_LEVELS.map(level => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddAccess}>
                  Add Access
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {loading ? (
          <div className="text-center p-4">Loading access rules...</div>
        ) : accessRules.length > 0 ? (
          <div className="space-y-2">
            {accessRules.map(rule => (
              <div key={rule.id} className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <p className="font-medium">
                    {RESOURCE_TYPES.find(t => t.value === rule.resource_type)?.label || rule.resource_type}{' '}
                    #{rule.resource_id}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Added on {new Date(rule.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select 
                    value={rule.access_level}
                    onValueChange={(value) => handleUpdateAccess(rule.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Access level" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCESS_LEVELS.map(level => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleRemoveAccess(rule.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-4 border rounded-md">
            No access rules defined for this group.
          </div>
        )}
      </CardContent>
    </Card>
  );
} 