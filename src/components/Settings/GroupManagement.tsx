import React, { useState, useEffect } from 'react';
import { User, UserGroup } from '../../types/user';
import * as userService from '../../services/userService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { useToast } from '../../hooks/use-toast';
import { Loader2, Users, Edit, Trash2, UserPlus, Search } from 'lucide-react';

export const GroupManagement: React.FC = () => {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [isViewMembersModalOpen, setIsViewMembersModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  
  // Form states
  const [newGroupForm, setNewGroupForm] = useState({
    name: '',
    description: ''
  });
  
  const [editGroupForm, setEditGroupForm] = useState({
    name: '',
    description: ''
  });
  
  const { toast } = useToast();

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const groupData = await userService.getGroups();
      setGroups(groupData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load groups",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadGroupMembers = async (groupId: number) => {
    try {
      setLoadingMembers(true);
      const members = await userService.getUsersInGroup(groupId);
      setGroupMembers(members);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load group members",
        variant: "destructive"
      });
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleCreateGroup = async () => {
    try {
      await userService.createGroup(newGroupForm.name, newGroupForm.description);
      toast({
        title: "Success",
        description: "Group created successfully"
      });
      setIsAddGroupModalOpen(false);
      setNewGroupForm({ name: '', description: '' });
      loadGroups();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create group",
        variant: "destructive"
      });
    }
  };

  const handleUpdateGroup = async () => {
    if (!selectedGroup) return;
    
    try {
      await userService.updateGroup(selectedGroup.id, editGroupForm);
      toast({
        title: "Success",
        description: "Group updated successfully"
      });
      setIsEditGroupModalOpen(false);
      loadGroups();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update group",
        variant: "destructive"
      });
    }
  };

  const handleDeleteGroup = async (group: UserGroup) => {
    if (!confirm(`Are you sure you want to delete the group "${group.name}"?`)) {
      return;
    }
    
    try {
      await userService.deleteGroup(group.id);
      toast({
        title: "Success",
        description: "Group deleted successfully"
      });
      loadGroups();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete group",
        variant: "destructive"
      });
    }
  };

  const handleViewMembers = async (group: UserGroup) => {
    setSelectedGroup(group);
    setIsViewMembersModalOpen(true);
    await loadGroupMembers(group.id);
  };

  const filteredGroups = groups.filter(group => {
    const searchLower = searchQuery.toLowerCase();
    return (
      group.name.toLowerCase().includes(searchLower) ||
      (group.description && group.description.toLowerCase().includes(searchLower))
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
        <h2 className="text-2xl font-bold">Group Management</h2>
        <Button onClick={() => setIsAddGroupModalOpen(true)}>
          <Users className="mr-2 h-4 w-4" />
          Add New Group
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 flex items-center">
          <Search className="absolute left-3 pointer-events-none z-10 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredGroups.map((group) => (
          <Card key={group.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  {group.view_type && (
                    <Badge variant="outline" className="mt-1">
                      {group.view_type}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedGroup(group);
                      setEditGroupForm({
                        name: group.name,
                        description: group.description || ''
                      });
                      setIsEditGroupModalOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteGroup(group)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {group.description && (
                <CardDescription className="mt-2">
                  {group.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Members</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewMembers(group)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    View Members
                  </Button>
                </div>
                {group.permissions && group.permissions.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500">Permissions</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {group.permissions.slice(0, 3).map((perm, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {perm}
                        </Badge>
                      ))}
                      {group.permissions.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{group.permissions.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Group Modal */}
      <Dialog open={isAddGroupModalOpen} onOpenChange={setIsAddGroupModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Group</DialogTitle>
            <DialogDescription>
              Create a new group with the details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                value={newGroupForm.name}
                onChange={(e) => setNewGroupForm({ ...newGroupForm, name: e.target.value })}
                placeholder="e.g., Administrators, Engineers"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newGroupForm.description}
                onChange={(e) => setNewGroupForm({ ...newGroupForm, description: e.target.value })}
                placeholder="Describe the purpose of this group..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddGroupModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup}>Create Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Modal */}
      <Dialog open={isEditGroupModalOpen} onOpenChange={setIsEditGroupModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>
              Update group details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">Group Name</Label>
              <Input
                id="edit_name"
                value={editGroupForm.name}
                onChange={(e) => setEditGroupForm({ ...editGroupForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                value={editGroupForm.description}
                onChange={(e) => setEditGroupForm({ ...editGroupForm, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditGroupModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateGroup}>Update Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Members Modal */}
      <Dialog open={isViewMembersModalOpen} onOpenChange={setIsViewMembersModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Members of {selectedGroup?.name}</DialogTitle>
            <DialogDescription>
              View all users in this group
            </DialogDescription>
          </DialogHeader>
          {loadingMembers ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {groupMembers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.first_name} {member.last_name}
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>{member.username}</TableCell>
                        <TableCell>
                          <Badge variant={member.is_active ? "success" : "destructive"}>
                            {member.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No members in this group
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewMembersModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};