import React, { useState, useEffect } from 'react';
import { User, UserFormData, UserGroup } from '../../types/user';
import * as userService from '../../services/userService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { useToast } from '../../hooks/use-toast';
import { Loader2, UserPlus, Search, Edit, Trash2, Shield, UserX, UserCheck, KeyRound, CheckCircle, XCircle } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Modal states
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isManageGroupsModalOpen, setIsManageGroupsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form states
  const [newUserForm, setNewUserForm] = useState<UserFormData>({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    is_active: true,
    groups: []
  });
  
  const [editUserForm, setEditUserForm] = useState<Partial<UserFormData>>({});
  
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
    loadGroups();
  }, []);

  // Handle search with debouncing
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for search
    const timeout = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
      loadUsers(1, searchQuery);
    }, 300); // 300ms debounce

    setSearchTimeout(timeout);

    // Cleanup
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [searchQuery]);

  const loadUsers = async (page = 1, search = '') => {
    try {
      if (page === 1) {
        setLoading(true);
      }
      const response = await userService.getUsers(page, search ? { search } : undefined);
      if (page === 1) {
        setUsers(response.results);
      } else {
        setUsers(prev => [...prev, ...response.results]);
      }
      setTotalUsers(response.count);
      setCurrentPage(page);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadGroups = async () => {
    try {
      const groupData = await userService.getGroups();
      setGroups(groupData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load groups",
        variant: "destructive"
      });
    }
  };

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    loadUsers(currentPage + 1, searchQuery);
  };

  const handleCreateUser = async () => {
    try {
      await userService.createUser(newUserForm);
      toast({
        title: "Success",
        description: "User created successfully"
      });
      setIsAddUserModalOpen(false);
      setNewUserForm({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        is_active: true,
        groups: []
      });
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create user",
        variant: "destructive"
      });
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      await userService.updateUser(selectedUser.id, editUserForm as UserFormData);
      toast({
        title: "Success",
        description: "User updated successfully"
      });
      setIsEditUserModalOpen(false);
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update user",
        variant: "destructive"
      });
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      if (user.is_active) {
        await userService.deactivateUser(user.id);
        toast({
          title: "Success",
          description: "User deactivated successfully"
        });
      } else {
        await userService.activateUser(user.id);
        toast({
          title: "Success",
          description: "User activated successfully"
        });
      }
      loadUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      });
    }
  };

  const handleApproveUser = async (user: User) => {
    try {
      if (user.is_active) {
        await userService.unapproveUser(user.id);
        toast({
          title: "Success",
          description: "User unapproved successfully"
        });
      } else {
        await userService.approveUser(user.id);
        toast({
          title: "Success",
          description: "User approved successfully"
        });
      }
      loadUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve/unapprove user",
        variant: "destructive"
      });
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    
    try {
      await userService.resetPassword(selectedUser.email);
      toast({
        title: "Success",
        description: "Password reset email sent"
      });
      setIsResetPasswordModalOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset password",
        variant: "destructive"
      });
    }
  };

  const handleAddToGroup = async (groupId: number) => {
    if (!selectedUser) return;
    
    try {
      await userService.addUserToGroup(selectedUser.id, groupId);
      toast({
        title: "Success",
        description: "User added to group"
      });
      loadUsers();
      const updatedUser = await userService.getUser(selectedUser.id);
      setSelectedUser(updatedUser);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add user to group",
        variant: "destructive"
      });
    }
  };

  const handleRemoveFromGroup = async (groupId: number) => {
    if (!selectedUser) return;
    
    try {
      await userService.removeUserFromGroup(selectedUser.id, groupId);
      toast({
        title: "Success",
        description: "User removed from group"
      });
      loadUsers();
      const updatedUser = await userService.getUser(selectedUser.id);
      setSelectedUser(updatedUser);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove user from group",
        variant: "destructive"
      });
    }
  };

  // No need for client-side filtering anymore - using server-side search

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
        <h2 className="text-2xl font-bold">User Management</h2>
        <Button onClick={() => setIsAddUserModalOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add New User
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 flex items-center">
          <Search className="absolute left-3 pointer-events-none text-gray-400 h-4 w-4 z-10" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Groups</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  {searchQuery ? `No users found matching "${searchQuery}"` : 'No users found'}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.first_name} {user.last_name}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>
                  <Badge variant={user.is_active ? "success" : "destructive"}>
                    {user.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.groups.map((group) => (
                      <Badge key={group.id} variant="secondary">
                        {group.name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      title="Edit User"
                      onClick={() => {
                        setSelectedUser(user);
                        setEditUserForm({
                          username: user.username,
                          email: user.email,
                          first_name: user.first_name,
                          last_name: user.last_name,
                          is_active: user.is_active
                        });
                        setIsEditUserModalOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      title={user.is_active ? "Deactivate User" : "Activate User"}
                      onClick={() => handleToggleUserStatus(user)}
                    >
                      {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      title={user.is_active ? "Unapprove User" : "Approve User"}
                      onClick={() => handleApproveUser(user)}
                    >
                      {user.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      title="Manage Groups"
                      onClick={() => {
                        setSelectedUser(user);
                        setIsManageGroupsModalOpen(true);
                      }}
                    >
                      <Shield className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      title="Reset Password"
                      onClick={() => {
                        setSelectedUser(user);
                        setIsResetPasswordModalOpen(true);
                      }}
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoadingMore && users.length < totalUsers && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleLoadMore}>
            Load More
          </Button>
        </div>
      )}
      
      {isLoadingMore && (
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {/* Add User Modal */}
      <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with the details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={newUserForm.first_name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={newUserForm.last_name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, last_name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={newUserForm.username}
                onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={newUserForm.is_active}
                onCheckedChange={(checked) => 
                  setNewUserForm({ ...newUserForm, is_active: checked as boolean })
                }
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditUserModalOpen} onOpenChange={setIsEditUserModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_first_name">First Name</Label>
                <Input
                  id="edit_first_name"
                  value={editUserForm.first_name || ''}
                  onChange={(e) => setEditUserForm({ ...editUserForm, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_last_name">Last Name</Label>
                <Input
                  id="edit_last_name"
                  value={editUserForm.last_name || ''}
                  onChange={(e) => setEditUserForm({ ...editUserForm, last_name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_username">Username</Label>
              <Input
                id="edit_username"
                value={editUserForm.username || ''}
                onChange={(e) => setEditUserForm({ ...editUserForm, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                type="email"
                value={editUserForm.email || ''}
                onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit_is_active"
                checked={editUserForm.is_active || false}
                onCheckedChange={(checked) => 
                  setEditUserForm({ ...editUserForm, is_active: checked as boolean })
                }
              />
              <Label htmlFor="edit_is_active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>Update User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={isResetPasswordModalOpen} onOpenChange={setIsResetPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Send a password reset email to {selectedUser?.email}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword}>Send Reset Email</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Groups Modal */}
      <Dialog open={isManageGroupsModalOpen} onOpenChange={setIsManageGroupsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Groups for {selectedUser?.first_name} {selectedUser?.last_name}</DialogTitle>
            <DialogDescription>
              Add or remove user from groups
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Current Groups</h4>
              <div className="space-y-2">
                {selectedUser?.groups.map(group => (
                  <div key={group.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">{group.name}</div>
                      {group.description && (
                        <div className="text-sm text-gray-500">{group.description}</div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveFromGroup(group.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                {selectedUser?.groups.length === 0 && (
                  <p className="text-gray-500">No groups assigned</p>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Available Groups</h4>
              <div className="space-y-2">
                {groups
                  .filter(group => !selectedUser?.groups.some(g => g.id === group.id))
                  .map(group => (
                    <div key={group.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium">{group.name}</div>
                        {group.description && (
                          <div className="text-sm text-gray-500">{group.description}</div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddToGroup(group.id)}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsManageGroupsModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};