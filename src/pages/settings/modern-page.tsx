import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Settings2, Users, Shield, Filter, MessageSquare, Building } from "lucide-react";
import { cn } from "@/lib/utils";

// Import existing components
import { GroupDataFilters } from "@/components/Settings/GroupDataFilters";
import MenuPermissionsSettings from "@/components/Settings/MenuPermissionsSettings";
import DepartmentsSettings from "@/components/Settings/departments";
import CannedMessagesSettings from "@/components/Settings/CannedMessagesSettings";
import { JobStatuses, JobTypes, JobCategories, JobTags, TaskTemplates } from "@/components/Settings";

const ModernSettingsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data for overview stats - this should come from your API
  const overviewStats = [
    { label: "Active Users", value: 42, icon: Users, color: "bg-blue-500" },
    { label: "User Groups", value: 8, icon: Shield, color: "bg-green-500" },
    { label: "Data Filters", value: 15, icon: Filter, color: "bg-purple-500" },
    { label: "Departments", value: 6, icon: Building, color: "bg-orange-500" },
  ];

  const settingsCategories = [
    {
      id: "user-management",
      title: "User Management",
      description: "Manage users, groups, and permissions",
      icon: Users,
      color: "bg-blue-50 border-blue-200",
      iconColor: "text-blue-600",
      tabs: ["users", "groups", "permissions"]
    },
    {
      id: "job-settings",
      title: "Job Configuration",
      description: "Configure job types, statuses, and templates",
      icon: Settings2,
      color: "bg-green-50 border-green-200",
      iconColor: "text-green-600",
      tabs: ["job-statuses", "job-types", "job-categories", "job-tags", "templates"]
    },
    {
      id: "access-control",
      title: "Access Control",
      description: "Manage data filters and menu permissions",
      icon: Shield,
      color: "bg-purple-50 border-purple-200",
      iconColor: "text-purple-600",
      tabs: ["data-filters", "menu-permissions"]
    },
    {
      id: "system-config",
      title: "System Configuration",
      description: "Configure departments and messaging",
      icon: Building,
      color: "bg-orange-50 border-orange-200",
      iconColor: "text-orange-600",
      tabs: ["departments", "canned-messages"]
    }
  ];

  const tabs = [
    { id: "overview", label: "Overview", icon: Settings2 },
    { id: "job-statuses", label: "Job Statuses", category: "job-settings" },
    { id: "job-types", label: "Job Types", category: "job-settings" },
    { id: "job-categories", label: "Categories", category: "job-settings" },
    { id: "job-tags", label: "Tags", category: "job-settings" },
    { id: "templates", label: "Templates", category: "job-settings" },
    { id: "users", label: "Users", category: "user-management" },
    { id: "groups", label: "Groups", category: "user-management" },
    { id: "permissions", label: "Permissions", category: "user-management" },
    { id: "data-filters", label: "Data Filters", category: "access-control" },
    { id: "menu-permissions", label: "Menu Permissions", category: "access-control" },
    { id: "departments", label: "Departments", category: "system-config" },
    { id: "canned-messages", label: "Canned Messages", category: "system-config" },
  ];

  const filteredTabs = tabs.filter(tab => 
    tab.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">Configure your system preferences and permissions</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search settings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Navigation */}
          <div className="bg-white rounded-lg border border-gray-200 p-1">
            <TabsList className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-13 gap-1 h-auto bg-transparent">
              {filteredTabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700",
                    "hover:bg-gray-100 transition-colors",
                    "text-sm font-medium px-3 py-2 rounded-md"
                  )}
                >
                  {tab.icon && <tab.icon className="h-4 w-4 mr-2" />}
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {overviewStats.map((stat, index) => (
                <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                        <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <div className={cn("p-3 rounded-full", stat.color)}>
                        <stat.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {settingsCategories.map((category) => (
                <Card 
                  key={category.id} 
                  className={cn(
                    "border-2 hover:shadow-lg transition-all duration-200 cursor-pointer",
                    category.color
                  )}
                  onClick={() => setActiveTab(category.tabs[0])}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className={cn("p-2 rounded-lg bg-white", category.iconColor)}>
                        <category.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{category.title}</CardTitle>
                        <CardDescription className="text-sm">{category.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {category.tabs.map((tabId) => {
                        const tab = tabs.find(t => t.id === tabId);
                        return tab ? (
                          <Badge key={tabId} variant="secondary" className="text-xs">
                            {tab.label}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Job Settings Tabs */}
          <TabsContent value="job-statuses">
            <Card>
              <CardHeader>
                <CardTitle>Job Statuses</CardTitle>
                <CardDescription>Manage job status configurations</CardDescription>
              </CardHeader>
              <CardContent>
                <JobStatuses jobStatuses={[]} jobQueues={[]} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="job-types">
            <Card>
              <CardHeader>
                <CardTitle>Job Types</CardTitle>
                <CardDescription>Configure different types of jobs</CardDescription>
              </CardHeader>
              <CardContent>
                <JobTypes jobTypes={[]} jobQueues={[]} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="job-categories">
            <Card>
              <CardHeader>
                <CardTitle>Job Categories</CardTitle>
                <CardDescription>Organize jobs by categories</CardDescription>
              </CardHeader>
              <CardContent>
                <JobCategories jobCategories={[]} jobQueues={[]} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="job-tags">
            <Card>
              <CardHeader>
                <CardTitle>Job Tags</CardTitle>
                <CardDescription>Create tags for job classification</CardDescription>
              </CardHeader>
              <CardContent>
                <JobTags jobTags={[]} jobQueues={[]} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Task Templates</CardTitle>
                <CardDescription>Manage reusable task templates</CardDescription>
              </CardHeader>
              <CardContent>
                <TaskTemplates jobTypes={[]} queues={[]} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management Tabs */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts and profiles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">User management interface will be implemented here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups">
            <Card>
              <CardHeader>
                <CardTitle>Group Management</CardTitle>
                <CardDescription>Manage user groups and memberships</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Group management interface will be implemented here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions">
            <Card>
              <CardHeader>
                <CardTitle>Permission Management</CardTitle>
                <CardDescription>Configure user permissions and access levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Permission management interface will be implemented here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Access Control Tabs */}
          <TabsContent value="data-filters">
            <GroupDataFilters />
          </TabsContent>

          <TabsContent value="menu-permissions">
            <Card>
              <CardHeader>
                <CardTitle>Menu Permissions</CardTitle>
                <CardDescription>Control menu visibility for different user groups</CardDescription>
              </CardHeader>
              <CardContent>
                <MenuPermissionsSettings groups={[]} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Configuration Tabs */}
          <TabsContent value="departments">
            <Card>
              <CardHeader>
                <CardTitle>Department Management</CardTitle>
                <CardDescription>Manage organizational departments</CardDescription>
              </CardHeader>
              <CardContent>
                <DepartmentsSettings />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="canned-messages">
            <Card>
              <CardHeader>
                <CardTitle>Canned Messages</CardTitle>
                <CardDescription>Manage pre-defined message templates</CardDescription>
              </CardHeader>
              <CardContent>
                <CannedMessagesSettings />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ModernSettingsPage;