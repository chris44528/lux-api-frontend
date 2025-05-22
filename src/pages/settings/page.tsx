"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "@/components/JobManagement/dashboard-header"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import jobService, { JobStatus, JobQueue, TaskTemplate, JobType, JobTag, JobCategory } from "../../services/jobService"
import userService from "@/services/userService"
import { User, UserFormData, UserGroup } from '@/types/user'
import { JobStatuses, JobTypes, JobCategories, JobTags, TaskTemplates, GroupDataFilters } from "@/components/Settings"
import { GroupAccessControl } from '@/components/GroupAccessControl'
import MenuPermissionsSettings from '../../components/Settings/MenuPermissionsSettings'
import DepartmentsSettings from '../../components/Settings/departments'
import CannedMessagesSettings from '../../components/Settings/CannedMessagesSettings'

export default function SettingsPage() {
  const { toast } = useToast();
  const [newItemName, setNewItemName] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newQueueName, setNewQueueName] = useState("");
  const [newQueueDescription, setNewQueueDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedJobTypeQueue] = useState<string | null>(null);
  const [selectedTagQueue] = useState<string | null>(null);
  const [selectedCategoryQueue, setSelectedCategoryQueue] = useState<string | null>(null);
  
  // Replace mock data with state variables for real data
  const [jobQueues, setJobQueues] = useState<JobQueue[]>([]);
  const [jobStatuses, setJobStatuses] = useState<JobStatus[]>([]);
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [jobTags, setJobTags] = useState<JobTag[]>([]);
  const [jobCategories, setJobCategories] = useState<JobCategory[]>([]);
  
  // Add user management state
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [usersInGroup, setUsersInGroup] = useState<User[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<UserGroup[]>([]);
  
  // Add back variables needed for modals
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isAddUserToGroupModalOpen, setIsAddUserToGroupModalOpen] = useState(false);
  
  // Create refs outside of the useEffect
  const fetchingRef = React.useRef(false);
  const isMountedRef = React.useRef(true);
  
  // Create additional refs for group user fetching
  const groupLoadingRef = React.useRef(false);
  const groupMountedRef = React.useRef(true);
  
  // Add refs to track user fetching state
  const userFetchingRef = React.useRef(false);
  const userPageRef = React.useRef(1);
  const hasMoreUsersRef = React.useRef(true);
  const initialFetchRef = React.useRef(false);

  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editUserForm, setEditUserForm] = useState<Partial<UserFormData>>({});
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Add handlers for task templates at the top of the component
  const handleTaskTemplateUpdate = useCallback((template: TaskTemplate) => {
    setTaskTemplates(prev => prev.map(t => t.id === template.id ? template : t));
  }, []);

  const handleTaskTemplateDelete = useCallback((id: number) => {
    setTaskTemplates(prev => prev.filter(t => t.id !== id));
  }, []);

  // Add state for template props
  const [templateProps, setTemplateProps] = useState({
    jobTypes: [] as JobType[],
    jobQueues: [] as JobQueue[],
    taskTemplates: [] as TaskTemplate[],
    onUpdate: handleTaskTemplateUpdate,
    onDelete: handleTaskTemplateDelete
  });

  // Create memoized template props
  const memoizedTemplateProps = useMemo(() => ({
    jobTypes,
    jobQueues,
    taskTemplates,
    onUpdate: handleTaskTemplateUpdate,
    onDelete: handleTaskTemplateDelete
  }), [jobTypes, jobQueues, taskTemplates, handleTaskTemplateUpdate, handleTaskTemplateDelete]);

  // Create a stable reference for the fetch function
  const fetchUsers = useCallback(async (page: number = 1, search?: string) => {
    if (userFetchingRef.current || !isMountedRef.current) return;
    
    userFetchingRef.current = true;
    setIsLoadingMore(true);
    
    try {
      const response = await userService.getUsers(page);
      if (!isMountedRef.current) return;

      const fetchedUsers = response.results;
      setTotalUsers(response.count);
      
      // Batch state updates
      if (isMountedRef.current) {
        // Update users state
        setUsers(prevUsers => {
          if (page === 1) {
            return fetchedUsers;
          }
          // Create a map of existing users by ID to avoid duplicates
          const existingUserIds = new Set(prevUsers.map(user => user.id));
          const newUsers = fetchedUsers.filter(user => !existingUserIds.has(user.id));
          return [...prevUsers, ...newUsers];
        });
        
        // Update filtered users state
        setFilteredUsers(prevFiltered => {
          if (page === 1) {
            return fetchedUsers;
          }
          // Create a map of existing users by ID to avoid duplicates
          const existingUserIds = new Set(prevFiltered.map(user => user.id));
          const newUsers = fetchedUsers.filter(user => !existingUserIds.has(user.id));
          return [...prevFiltered, ...newUsers];
        });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      if (isMountedRef.current) {
        toast({
          title: "Error",
          description: "Failed to load users"
        });
      }
    } finally {
      if (isMountedRef.current) {
        userFetchingRef.current = false;
        setIsLoadingMore(false);
      }
    }
  }, []);

  // Handle search with debounce
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout
    const timeout = setTimeout(() => {
      fetchUsers(1, query);
    }, 500);
    
    setSearchTimeout(timeout);
  }, [searchTimeout, fetchUsers]);

  // Handle user status toggle
  const handleUserStatusToggle = async (user: User) => {
    try {
      if (user.is_active) {
        await userService.deactivateUser(user.id);
      } else {
        await userService.activateUser(user.id);
      }
      
      // Refresh users list
      fetchUsers(currentPage, searchQuery);
      
      toast({
        title: "Success",
        description: `User ${user.is_active ? 'deactivated' : 'activated'} successfully`
      });
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast({
        title: "Error",
        description: "Failed to update user status"
      });
    }
  };

  // Handle user edit
  const handleUserEdit = async (user: User) => {
    setSelectedUser(user);
    setEditUserForm({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      is_active: user.is_active
    });
    setIsEditingUser(true);
  };

  // Handle user update
  const handleUserUpdate = async () => {
    if (!selectedUser) return;
    
    try {
      await userService.updateUser(selectedUser.id, editUserForm);
      
      // Refresh users list
      fetchUsers(currentPage, searchQuery);
      
      setIsEditingUser(false);
      setSelectedUser(null);
      setEditUserForm({});
      
      toast({
        title: "Success",
        description: "User updated successfully"
      });
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "Failed to update user"
      });
    }
  };

  // Handle load more
  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchUsers(nextPage, searchQuery);
  };

  // Add back the initial fetch effect for users
  useEffect(() => {
    // Only fetch on initial mount
    if (!initialFetchRef.current && !userFetchingRef.current && isMountedRef.current) {
      initialFetchRef.current = true;
      fetchUsers(1); // Start with page 1
    }
  }, [fetchUsers]);

  // Reset user fetching state when component unmounts
  useEffect(() => {
    // Set mounted ref to true on mount
    isMountedRef.current = true;
    
    return () => {
      userPageRef.current = 1;
      hasMoreUsersRef.current = true;
      userFetchingRef.current = false;
      initialFetchRef.current = false;
      // Set mounted ref to false on unmount to prevent setState after unmount
      isMountedRef.current = false;
    };
  }, []);

  // Modify the fetchAllData function to handle user data separately
  const fetchAllData = useCallback(async () => {
    if (fetchingRef.current || !isMountedRef.current) return;
    
    fetchingRef.current = true;
    setLoading(true);
    
    try {
      // Fetch settings data one by one with error handling for each
      let jobStatusesResponse: JobStatus[] = [];
      let jobTypesResponse: JobType[] = [];
      let jobCategoriesResponse: JobCategory[] = [];
      let jobTagsResponse: JobTag[] = [];
      let jobQueuesResponse: JobQueue[] = [];
      let taskTemplatesResponse: TaskTemplate[] = [];
      let groupsResponse: UserGroup[] = [];
      
      try {
        jobStatusesResponse = await jobService.getJobStatuses();
      } catch (e) {
        console.error("Failed to fetch job statuses:", e);
      }
      
      try {
        jobTypesResponse = await jobService.getJobTypes();
      } catch (e) {
        console.error("Failed to fetch job types:", e);
      }
      
      try {
        jobCategoriesResponse = await jobService.getJobCategories();
      } catch (e) {
        console.error("Failed to fetch job categories:", e);
      }
      
      try {
        jobTagsResponse = await jobService.getJobTags();
      } catch (e) {
        console.error("Failed to fetch job tags:", e);
      }
      
      try {
        jobQueuesResponse = await jobService.getJobQueues();
      } catch (e) {
        console.error("Failed to fetch job queues:", e);
      }
      
      try {
        taskTemplatesResponse = await jobService.getTaskTemplates();
      } catch (e) {
        console.error("Failed to fetch task templates:", e);
      }
      
      try {
        groupsResponse = await userService.getGroups();
        console.log('Fetched groups:', groupsResponse);
      } catch (e) {
        console.error("Failed to fetch groups:", e);
        // Continue with empty groups rather than failing the entire process
        groupsResponse = [];
      }

      // Critical: Check if component is still mounted before updating state
      if (!isMountedRef.current) return;
      
      // Batch state updates
      setJobStatuses(jobStatusesResponse);
      setJobTypes(jobTypesResponse);
      setJobCategories(jobCategoriesResponse);
      setJobTags(jobTagsResponse);
      setJobQueues(jobQueuesResponse);
      setTaskTemplates(taskTemplatesResponse);
      setGroups(Array.isArray(groupsResponse) ? groupsResponse : []);
      setFilteredGroups(Array.isArray(groupsResponse) ? groupsResponse : []);
      
      // Create stable props for TaskTemplates
      const stableTemplateProps = {
        jobTypes: jobTypesResponse,
        jobQueues: jobQueuesResponse,
        taskTemplates: taskTemplatesResponse,
        onUpdate: handleTaskTemplateUpdate,
        onDelete: handleTaskTemplateDelete
      };
      setTemplateProps(stableTemplateProps);
      
      toast({
        title: "Success",
        description: "Settings data loaded successfully"
      });
    } catch (error) {
      console.error("Error fetching settings data:", error);
      if (isMountedRef.current) {
        toast({
          title: "Error",
          description: "Failed to load some settings data"
        });
      }
    } finally {
      if (isMountedRef.current) {
        fetchingRef.current = false;
        setLoading(false);
      }
    }
  }, [handleTaskTemplateUpdate, handleTaskTemplateDelete, toast]);

  // Add effect to fetch all settings data on mount with cleanup
  useEffect(() => {
    fetchAllData();
    
    // Return cleanup function to prevent memory leaks
    return () => {
      // Set flags to prevent additional fetches or state updates
      fetchingRef.current = true;
    };
  }, [fetchAllData]);

  // Add search functionality for users and groups
  const handleUserSearch = (query: string) => {
    setSearchQuery(query);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    const timeout = setTimeout(() => {
      setFilteredUsers(users.filter(user => 
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(query.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(query.toLowerCase())
      ));
    }, 300);
    setSearchTimeout(timeout);
  };

  const handleGroupSearch = (query: string) => {
    setSearchQuery(query);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    const timeout = setTimeout(() => {
      setFilteredGroups(groups.filter(group => 
        group.name.toLowerCase().includes(query.toLowerCase()) ||
        group.description?.toLowerCase().includes(query.toLowerCase())
      ));
    }, 300);
    setSearchTimeout(timeout);
  };

  // Add handler for adding user to group
  const handleAddUserToGroup = async (userId: number, groupId: number) => {
    try {
      await userService.addUserToGroup(userId, groupId);
      toast({
        title: "Success",
        description: "User added to group successfully"
      });
      // Refresh the user list
      fetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add user to group"
      });
    }
  };

  // Add a function to handle adding a new job type
  const addJobType = () => {
    if (!newItemName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a job type name"
      });
      return;
    }

    // Create a new job type through the API
    const createJobType = async () => {
      try {
        // Prepare the job type data
        const jobTypeData = {
          name: newItemName.trim(),
          queue: selectedJobTypeQueue ? parseInt(selectedJobTypeQueue) : null
        };

        // Send the API request using jobService
        const newJobType = await jobService.createJobType(jobTypeData);
        
        // Add to the local state
        setJobTypes([...jobTypes, newJobType]);
        
        // Clear the input
        setNewItemName("");
        
        // Show success message
        toast({
          title: "Success",
          description: `Job type "${newItemName}" has been added`
        });
      } catch (error) {
        console.error('Error creating job type:', error);
        toast({
          title: "Error",
          description: "Failed to create job type. Please try again."
        });
      }
    };

    createJobType();
  };

  // Add a function to handle deleting a queue
  const deleteQueue = (id: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this queue? This will affect all items associated with this queue.");
    if (!confirmDelete) return;

    const handleDelete = async () => {
      try {
        await jobService.deleteJobQueue(id);
        
        // Remove from the local state
        setJobQueues(jobQueues.filter(queue => queue.id !== id));
        
        // Show success message
        toast({
          title: "Success",
          description: "Queue has been deleted"
        });
      } catch (error) {
        console.error('Error deleting queue:', error);
        toast({
          title: "Error",
          description: "Failed to delete queue. Please try again."
        });
      }
    };

    handleDelete();
  };

  // Update toast calls to remove variant
  const addQueue = () => {
    if (!newQueueName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a queue name"
      });
      return;
    }

    const createQueue = async () => {
      try {
        // Prepare the queue data
        const queueData = {
          name: newQueueName.trim(),
          description: newQueueDescription.trim()
        };

        // Send the API request
        const newQueue = await jobService.createJobQueue(queueData);
        
        // Add to the local state
        setJobQueues([...jobQueues, newQueue]);
        
        // Clear the inputs
        setNewQueueName("");
        setNewQueueDescription("");
        
        // Show success message
        toast({
          title: "Success",
          description: `Queue "${newQueueName}" has been added`
        });
      } catch (error) {
        console.error('Error creating queue:', error);
        toast({
          title: "Error",
          description: "Failed to create queue. Please try again."
        });
      }
    };

    createQueue();
  };

  // Add a function to handle adding a new tag
  const addTag = () => {
    if (!newTagName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a tag name"
      });
      return;
    }

    // Create a new tag through the API
    const createTag = async () => {
      try {
        // Prepare the tag data
        const tagData = {
          name: newTagName.trim(),
          queue: selectedTagQueue ? parseInt(selectedTagQueue) : null
        };

        // Send the API request using jobService
        const newTag = await jobService.createJobTag(tagData);
        
        // Add to the local state
        setJobTags([...jobTags, newTag]);
        
        // Clear the input
        setNewTagName("");
        
        // Show success message
        toast({
          title: "Success",
          description: `Tag "${newTagName}" has been added`
        });
      } catch (error) {
        console.error('Error creating tag:', error);
        toast({
          title: "Error",
          description: "Failed to create tag. Please try again."
        });
      }
    };

    createTag();
  };

  // Add a function to handle adding a new job category
  const addJobCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a job category name"
      });
      return;
    }

    // Create a new job category through the API
    const createJobCategory = async () => {
      try {
        // Prepare the job category data
        const jobCategoryData = {
          name: newCategoryName.trim(),
          queue: selectedCategoryQueue ? parseInt(selectedCategoryQueue) : null
        };

        // Send the API request using jobService
        const newJobCategory = await jobService.createJobCategory(jobCategoryData);
        
        // Add to the local state
        setJobCategories([...jobCategories, newJobCategory]);
        
        // Clear the input
        setNewCategoryName("");
        
        // Show success message
        toast({
          title: "Success",
          description: `Job category "${newCategoryName}" has been added`
        });
      } catch (error) {
        console.error('Error creating job category:', error);
        toast({
          title: "Error",
          description: "Failed to create job category. Please try again."
        });
      }
    };

    createJobCategory();
  };

  // Add functions to handle deleting a job type and tag
  const deleteJobType = (id: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this job type?");
    if (!confirmDelete) return;

    const handleDelete = async () => {
      try {
        await jobService.deleteJobType(id);
        
        // Remove from the local state
        setJobTypes(jobTypes.filter(type => type.id !== id));
        
        // Show success message
        toast({
          title: "Success",
          description: "Job type has been deleted"
        });
      } catch (error) {
        console.error('Error deleting job type:', error);
        toast({
          title: "Error",
          description: "Failed to delete job type. Please try again."
        });
      }
    };

    handleDelete();
  };

  const deleteJobTag = (id: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this tag?");
    if (!confirmDelete) return;

    const handleDelete = async () => {
      try {
        await jobService.deleteJobTag(id);
        
        // Remove from the local state
        setJobTags(jobTags.filter(tag => tag.id !== id));
        
        // Show success message
        toast({
          title: "Success",
          description: "Tag has been deleted"
        });
      } catch (error) {
        console.error('Error deleting tag:', error);
        toast({
          title: "Error",
          description: "Failed to delete tag. Please try again."
        });
      }
    };

    handleDelete();
  };

  const deleteJobCategory = (id: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this job category?");
    if (!confirmDelete) return;

    const handleDelete = async () => {
      try {
        await jobService.deleteJobCategory(id);
        
        // Remove from the local state
        setJobCategories(jobCategories.filter(category => category.id !== id));
        
        // Show success message
        toast({
          title: "Success",
          description: "Job category has been deleted"
        });
      } catch (error) {
        console.error('Error deleting job category:', error);
        toast({
          title: "Error",
          description: "Failed to delete job category. Please try again."
        });
      }
    };

    handleDelete();
  };

  // Add functions for user management
  const handleAddUser = async () => {
    if (!newUsername || !newEmail || !newFirstName || !newLastName || !newPassword) {
      toast({
        title: "Error",
        description: "Please fill in all required fields."
      });
      return;
    }
    
    try {
      const newUser = await userService.createUser({
        username: newUsername,
        email: newEmail,
        first_name: newFirstName,
        last_name: newLastName,
        password: newPassword,
        is_active: true
      });
      
      setUsers([...users, newUser]);
      setNewUsername("");
      setNewEmail("");
      setNewFirstName("");
      setNewLastName("");
      setNewPassword("");
      setIsAddUserModalOpen(false);
      
      toast({
        title: "Success",
        description: `User "${newUsername}" has been created.`
      });
    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: "Failed to create user. Please try again."
      });
    }
  };
  
  const handleResetPassword = async () => {
    if (!selectedUser) return;
    
    try {
      await userService.resetPassword(selectedUser.id);
      setIsResetPasswordModalOpen(false);
      
      toast({
        title: "Success",
        description: `Password for user "${selectedUser.username}" has been reset.`
      });
    } catch (error) {
      console.error(`Error resetting password for user ${selectedUser.id}:`, error);
      toast({
        title: "Error",
        description: "Failed to reset password. Please try again."
      });
    }
  };
  
  const handleToggleUserActive = async (user: User) => {
    try {
      let updatedUser;
      
      if (user.is_active) {
        updatedUser = await userService.deactivateUser(user.id);
        toast({
          title: "Success",
          description: `User "${user.username}" has been deactivated.`
        });
      } else {
        updatedUser = await userService.activateUser(user.id);
        toast({
          title: "Success",
          description: `User "${user.username}" has been activated.`
        });
      }
      
      // Update the users list with the updated user
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    } catch (error) {
      console.error(`Error toggling active status for user ${user.id}:`, error);
      toast({
        title: "Error",
        description: `Failed to ${user.is_active ? 'deactivate' : 'activate'} user. Please try again.`
      });
    }
  };
  
  const handleDeleteUser = async (user: User) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete user "${user.username}"?`);
    if (!confirmDelete) return;
    
    try {
      await userService.deleteUser(user.id);
      
      // Remove the deleted user from the users list
      setUsers(users.filter(u => u.id !== user.id));
      
      toast({
        title: "Success",
        description: `User "${user.username}" has been deleted.`
      });
    } catch (error) {
      console.error(`Error deleting user ${user.id}:`, error);
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again."
      });
    }
  };
  
  const handleAddGroup = async () => {
    if (!newGroupName) {
      toast({
        title: "Error",
        description: "Please enter a group name."
      });
      return;
    }
    
    try {
      const newGroup = await userService.createGroup(newGroupName, newGroupDescription);
      
      setGroups([...groups, newGroup]);
      setNewGroupName("");
      setNewGroupDescription("");
      setIsAddGroupModalOpen(false);
      
      toast({
        title: "Success",
        description: `Group "${newGroupName}" has been created.`
      });
    } catch (error) {
      console.error("Error creating group:", error);
      toast({
        title: "Error",
        description: "Failed to create group. Please try again."
      });
    }
  };
  
  const handleDeleteGroup = async (group: UserGroup) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete group "${group.name}"?`);
    if (!confirmDelete) return;
    
    try {
      await userService.deleteGroup(group.id);
      
      // Remove the deleted group from the groups list
      setGroups(groups.filter(g => g.id !== group.id));
      
      toast({
        title: "Success",
        description: `Group "${group.name}" has been deleted.`
      });
    } catch (error) {
      console.error(`Error deleting group ${group.id}:`, error);
      toast({
        title: "Error",
        description: "Failed to delete group. Please try again."
      });
    }
  };
  
  // Add handleUpdateGroup function after handleDeleteGroup
  const handleUpdateGroup = async (group: UserGroup) => {
    if (!group) return;
    
    try {
      await userService.updateGroup(group.id, {
        name: group.name,
        description: group.description
      });
      
      // Update the group in the groups list
      setGroups(groups.map(g => g.id === group.id ? group : g));
      setFilteredGroups(filteredGroups.map(g => g.id === group.id ? group : g));
      
      toast({
        title: "Success",
        description: `Group "${group.name}" has been updated.`
      });
    } catch (error) {
      console.error(`Error updating group ${group.id}:`, error);
      toast({
        title: "Error",
        description: "Failed to update group. Please try again."
      });
    }
  };
  
  // Add handleRemoveUserFromGroup function after handleUpdateGroup
  const handleRemoveUserFromGroup = async (userId: number, groupId: number) => {
    try {
      await userService.removeUserFromGroup(userId, groupId);
      
      // Remove user from the usersInGroup list
      setUsersInGroup(usersInGroup.filter(user => user.id !== userId));
      
      toast({
        title: "Success",
        description: "User removed from group successfully"
      });
    } catch (error) {
      console.error(`Error removing user ${userId} from group ${groupId}:`, error);
      toast({
        title: "Error",
        description: "Failed to remove user from group. Please try again."
      });
    }
  };
  
  // Function to refresh data when needed
  const refreshAllData = useCallback(() => {
    // Fetch data again
    fetchAllData();
    // Reset user fetch state to allow refetching users as well
    userPageRef.current = 1;
    hasMoreUsersRef.current = true;
    initialFetchRef.current = false; // Allow fetchUsers effect to run again if needed
  }, [fetchAllData]);
  
  // Create a stable getUsersInGroup function with useCallback
  const fetchUsersInGroup = useCallback(async (groupId: number) => {
    if (!groupId || groupLoadingRef.current) return;
    
    groupLoadingRef.current = true;
    
    try {
      console.log(`Fetching users for group ${groupId}...`);
      const fetchedUsers = await userService.getUsersInGroup(groupId);
      
      if (groupMountedRef.current) {
        setUsersInGroup(Array.isArray(fetchedUsers) ? fetchedUsers : []);
      }
    } catch (error) {
      console.error(`Error fetching users in group ${groupId}:`, error);
      if (groupMountedRef.current) {
        toast({
          title: "Error",
          description: "Failed to load users in the selected group"
        });
      }
    } finally {
      if (groupMountedRef.current) {
        groupLoadingRef.current = false;
      }
    }
  }, []);
  
  // Simplified useEffect for fetching users in group
  useEffect(() => {
    // Reset the mounted ref
    groupMountedRef.current = true;
    
    // Clear users in group if no group is selected
    if (!selectedGroup) {
      setUsersInGroup([]);
      return;
    }
    
    // Fetch users for the selected group
    fetchUsersInGroup(selectedGroup.id);
    
    // Clean up
    return () => {
      groupMountedRef.current = false;
    };
  }, [selectedGroup?.id, fetchUsersInGroup]);

  // Fix the type errors in the form handlers
  const handleEditUserFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditUserForm(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleEditUserFormCheckboxChange = (checked: boolean) => {
    setEditUserForm(prev => ({ ...prev, is_active: checked }));
  };

  // New implementation of the User Management tab
  const renderUserManagementTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Button onClick={() => setIsAddUserModalOpen(true)}>
          Add New User
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Groups</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.first_name} {user.last_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
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
                        onClick={() => handleUserEdit(user)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUserStatusToggle(user)}
                      >
                        {user.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsResetPasswordModalOpen(true);
                        }}
                      >
                        Reset Password
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {isLoadingMore && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}

        {!isLoadingMore && filteredUsers.length < totalUsers && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
            >
              Load More
            </Button>
          </div>
        )}
      </div>

      {/* User Edit Modal */}
      {isEditingUser && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit User</CardTitle>
              <CardDescription>
                Edit user details and group membership
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={editUserForm.username || ''}
                    onChange={handleEditUserFormChange}
                    name="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editUserForm.email || ''}
                    onChange={handleEditUserFormChange}
                    name="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={editUserForm.first_name || ''}
                    onChange={handleEditUserFormChange}
                    name="first_name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={editUserForm.last_name || ''}
                    onChange={handleEditUserFormChange}
                    name="last_name"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={editUserForm.is_active}
                    onCheckedChange={handleEditUserFormCheckboxChange}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                
                {/* Groups Section */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-lg font-semibold">Current Groups</Label>
                    <div className="mt-2 space-y-2">
                      {selectedUser.groups.length > 0 ? (
                        selectedUser.groups.map(group => (
                          <div key={group.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/30">
                            <div>
                              <div className="font-medium">{group.name}</div>
                              {group.description && (
                                <div className="text-sm text-muted-foreground">{group.description}</div>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                userService.removeUserFromGroup(selectedUser.id, group.id)
                                  .then(() => {
                                    // Update the user's groups
                                    setSelectedUser({
                                      ...selectedUser,
                                      groups: selectedUser.groups.filter(g => g.id !== group.id)
                                    });
                                    toast({
                                      title: "Success",
                                      description: `Removed from group "${group.name}"`
                                    });
                                  })
                                  .catch(error => {
                                    console.error(`Error removing user from group ${group.id}:`, error);
                                    toast({
                                      title: "Error",
                                      description: "Failed to remove from group. Please try again."
                                    });
                                  });
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-center text-sm text-muted-foreground border rounded-md">
                          User is not a member of any groups
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-lg font-semibold">Available Groups</Label>
                    <div className="mt-2 space-y-2">
                      {(Array.isArray(groups) ? groups : []).filter(group => !selectedUser.groups.some(g => g.id === group.id)).length > 0 ? (
                        (Array.isArray(groups) ? groups : [])
                          .filter(group => !selectedUser.groups.some(g => g.id === group.id))
                          .map(group => (
                            <div key={group.id} className="flex items-center justify-between p-2 border rounded-md">
                              <div>
                                <div className="font-medium">{group.name}</div>
                                {group.description && (
                                  <div className="text-sm text-muted-foreground">{group.description}</div>
                                )}
                              </div>
                              <Button
                                size="sm"
                                onClick={() => {
                                  userService.addUserToGroup(selectedUser.id, group.id)
                                    .then(() => {
                                      // Update the user's groups
                                      setSelectedUser({
                                        ...selectedUser,
                                        groups: [...selectedUser.groups, group]
                                      });
                                      toast({
                                        title: "Success",
                                        description: `Added to group "${group.name}"`
                                      });
                                    })
                                    .catch(error => {
                                      console.error(`Error adding user to group ${group.id}:`, error);
                                      toast({
                                        title: "Error",
                                        description: "Failed to add to group. Please try again."
                                      });
                                    });
                                }}
                              >
                                Add
                              </Button>
                            </div>
                          ))
                      ) : (
                        <div className="p-2 text-center text-sm text-muted-foreground border rounded-md">
                          No more groups available to add
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <div className="flex justify-end p-4 space-x-2">
              <Button variant="outline" onClick={() => {
                setIsEditingUser(false);
                setSelectedUser(null);
                setEditUserForm({});
              }}>Cancel</Button>
              <Button onClick={handleUserUpdate}>Save Changes</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add New User</CardTitle>
              <CardDescription>
                Create a new user account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    value={newUsername} 
                    onChange={(e) => setNewUsername(e.target.value)} 
                    placeholder="Enter username" 
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={newEmail} 
                    onChange={(e) => setNewEmail(e.target.value)} 
                    placeholder="Enter email" 
                  />
                </div>
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    value={newFirstName} 
                    onChange={(e) => setNewFirstName(e.target.value)} 
                    placeholder="Enter first name" 
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={newLastName} 
                    onChange={(e) => setNewLastName(e.target.value)} 
                    placeholder="Enter last name" 
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    placeholder="Enter password" 
                  />
                </div>
              </div>
            </CardContent>
            <div className="flex justify-end p-4 space-x-2">
              <Button variant="outline" onClick={() => setIsAddUserModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAddUser}>Add User</Button>
            </div>
          </Card>
        </div>
      )}
      
      {/* Add Group Modal */}
      {isAddGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add New Group</CardTitle>
              <CardDescription>
                Create a new user group
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="groupName">Group Name</Label>
                  <Input 
                    id="groupName" 
                    value={newGroupName} 
                    onChange={(e) => setNewGroupName(e.target.value)} 
                    placeholder="Enter group name" 
                  />
                </div>
                <div>
                  <Label htmlFor="groupDescription">Description (Optional)</Label>
                  <Input 
                    id="groupDescription" 
                    value={newGroupDescription} 
                    onChange={(e) => setNewGroupDescription(e.target.value)} 
                    placeholder="Enter group description" 
                  />
                </div>
              </div>
            </CardContent>
            <div className="flex justify-end p-4 space-x-2">
              <Button variant="outline" onClick={() => setIsAddGroupModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAddGroup}>Add Group</Button>
            </div>
          </Card>
        </div>
      )}
      
      {/* Reset Password Modal */}
      {isResetPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Reset Password</CardTitle>
              <CardDescription>
                Reset password for {selectedUser.username}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Are you sure you want to reset the password for {selectedUser.first_name} {selectedUser.last_name}?</p>
              <p className="mt-2 text-sm text-muted-foreground">This will send a password reset link to the user's email.</p>
            </CardContent>
            <div className="flex justify-end p-4 space-x-2">
              <Button variant="outline" onClick={() => setIsResetPasswordModalOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleResetPassword}>Reset Password</Button>
            </div>
          </Card>
        </div>
      )}
      
      {/* Add User to Group Modal */}
      {isAddUserToGroupModalOpen && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add User to {selectedGroup.name}</CardTitle>
              <CardDescription>
                Select users to add to this group
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(users) && users
                  .filter(user => !usersInGroup.some(u => u.id === user.id))
                  .map(user => (
                    <div key={user.id} className="flex items-center justify-between p-2 border rounded-md">
                      <div>
                        <div className="font-medium">{user.first_name} {user.last_name}</div>
                        <div className="text-sm text-muted-foreground">{user.username}</div>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => handleAddUserToGroup(user.id, selectedGroup.id)}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                {!Array.isArray(users) || users.filter(user => !usersInGroup.some(u => u.id === user.id)).length === 0 && (
                  <div className="py-2 text-center text-sm text-muted-foreground">No more users available to add</div>
                )}
              </div>
            </CardContent>
            <div className="flex justify-end p-4 space-x-2">
              <Button variant="outline" onClick={() => setIsAddUserToGroupModalOpen(false)}>Close</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  // Update the renderGroupManagementTab function to include the GroupAccessControl component
  const renderGroupManagementTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Group Management</h2>
        <Button onClick={() => setIsAddGroupModalOpen(true)}>
          Add New Group
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Left sidebar - group list */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Groups</CardTitle>
            <CardDescription>Manage user groups and permissions</CardDescription>
            <Input
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => handleGroupSearch(e.target.value)}
              className="mt-2"
            />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {loading ? (
                <div className="flex justify-center p-4">
                  <div>Loading groups...</div>
                </div>
              ) : filteredGroups.length > 0 ? (
                filteredGroups.map((group) => (
                  <div 
                    key={group.id} 
                    className={`flex items-center justify-between p-2 border rounded-md cursor-pointer ${
                      selectedGroup?.id === group.id ? 'bg-muted border-primary' : ''
                    }`}
                    onClick={() => setSelectedGroup(group)}
                  >
                    <div>
                      <div className="font-medium">{group.name}</div>
                      {group.description && (
                        <div className="text-sm text-muted-foreground">{group.description}</div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGroup(group);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  No groups found
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right content - group details */}
        <div className="md:col-span-3">
          {selectedGroup ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{selectedGroup.name}</CardTitle>
                  <CardDescription>{selectedGroup.description || 'No description'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-semibold">Group Details</Label>
                      <div className="mt-2 space-y-2">
                        <div>
                          <Label htmlFor="groupName">Name</Label>
                          <Input 
                            id="groupName" 
                            value={selectedGroup.name} 
                            onChange={(e) => setSelectedGroup({...selectedGroup, name: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="groupDescription">Description</Label>
                          <Input 
                            id="groupDescription" 
                            value={selectedGroup.description || ''} 
                            onChange={(e) => setSelectedGroup({...selectedGroup, description: e.target.value})}
                          />
                        </div>
                        <div className="pt-2">
                          <Button onClick={() => handleUpdateGroup(selectedGroup)}>
                            Update Group
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-base font-semibold">Users in Group</Label>
                      <div className="mt-2">
                        <Button 
                          variant="outline" 
                          className="mb-2"
                          onClick={() => setIsAddUserToGroupModalOpen(true)}
                        >
                          Add User to Group
                        </Button>
                        
                        <div className="space-y-2">
                          {usersInGroup.length > 0 ? (
                            usersInGroup.map(user => (
                              <div key={user.id} className="flex items-center justify-between p-2 border rounded-md">
                                <div>
                                  <div className="font-medium">{user.first_name} {user.last_name}</div>
                                  <div className="text-sm text-muted-foreground">{user.email}</div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveUserFromGroup(user.id, selectedGroup.id)}
                                >
                                  Remove
                                </Button>
                              </div>
                            ))
                          ) : (
                            <div className="text-center p-2 border rounded-md text-muted-foreground">
                              User is not a member of any groups
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Add access control component */}
                    <GroupAccessControl group={selectedGroup} />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-full p-8">
                <div className="text-center">
                  <h3 className="text-lg font-medium">No Group Selected</h3>
                  <p className="text-muted-foreground mt-2">
                    Select a group from the list or create a new one.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        </div>
        
        <Tabs defaultValue="statuses" className="space-y-4">
          <div className="border-b">
            <TabsList className="flex h-10 items-center justify-start space-x-2 overflow-x-auto bg-white">
              <TabsTrigger className="rounded-sm data-[state=active]:bg-gray-100" value="statuses">Job Statuses</TabsTrigger>
              <TabsTrigger className="rounded-sm data-[state=active]:bg-gray-100" value="types">Job Types</TabsTrigger>
              <TabsTrigger className="rounded-sm data-[state=active]:bg-gray-100" value="categories">Categories</TabsTrigger>
              <TabsTrigger className="rounded-sm data-[state=active]:bg-gray-100" value="tags">Tags</TabsTrigger>
              <TabsTrigger className="rounded-sm data-[state=active]:bg-gray-100" value="templates">Templates</TabsTrigger>
              <TabsTrigger className="rounded-sm data-[state=active]:bg-gray-100" value="users">User Management</TabsTrigger>
              <TabsTrigger className="rounded-sm data-[state=active]:bg-gray-100" value="menu">Menu Permissions</TabsTrigger>
              <TabsTrigger className="rounded-sm data-[state=active]:bg-gray-100" value="departments">Departments</TabsTrigger>
              <TabsTrigger className="rounded-sm data-[state=active]:bg-gray-100" value="canned-messages">Canned Messages</TabsTrigger>
              <TabsTrigger className="rounded-sm data-[state=active]:bg-gray-100" value="data-filters">Data Filters</TabsTrigger>
            </TabsList>
          </div>
          
          {/* Job Statuses Tab */}
          <TabsContent value="statuses">
            <JobStatuses 
              jobStatuses={jobStatuses}
              jobQueues={jobQueues}
            />
          </TabsContent>
          
          {/* Job Types Tab - UNCOMMENT */}
          <TabsContent value="types">
            <JobTypes 
              jobTypes={jobTypes}
              jobQueues={jobQueues}
            />
          </TabsContent>
          
          {/* Job Categories Tab - UNCOMMENT */}
          <TabsContent value="categories">
            <JobCategories 
              jobCategories={jobCategories}
              jobQueues={jobQueues}
            />
          </TabsContent>
          
          {/* Job Tags Tab - UNCOMMENT */}
          <TabsContent value="tags">
            <JobTags 
              jobTags={jobTags}
              jobQueues={jobQueues}
            />
          </TabsContent>
          
          {/* Task Templates Tab - UNCOMMENT */}
          <TabsContent value="templates" className="space-y-4">
            {(Array.isArray(jobTypes) && Array.isArray(jobQueues)) ? (
              <TaskTemplates 
                jobTypes={jobTypes}
                queues={jobQueues}
              />
            ) : (
              <div className="p-8 text-center">Loading templates data...</div>
            )}
          </TabsContent>
          
          {/* User Management Tab - UNCOMMENT */}
          <TabsContent value="users">
            {renderUserManagementTab()}
          </TabsContent>

          {/* Menu Permissions Tab */}
          <TabsContent value="menu">
            {loading ? (
              <div className="p-8 text-center">Loading groups data...</div>
            ) : (
              <div>
                {console.log('Menu Permissions Tab - Groups data:', {
                  isArray: Array.isArray(groups),
                  length: Array.isArray(groups) ? groups.length : 0,
                  data: groups
                })}
                <MenuPermissionsSettings groups={Array.isArray(groups) ? groups : []} />
              </div>
            )}
          </TabsContent>

          {/* Departments Tab */}
          <TabsContent value="departments">
            <DepartmentsSettings />
          </TabsContent>

          {/* Canned Messages Tab */}
          <TabsContent value="canned-messages">
            <CannedMessagesSettings />
          </TabsContent>

          {/* Data Filters Tab */}
          <TabsContent value="data-filters">
            <GroupDataFilters />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 