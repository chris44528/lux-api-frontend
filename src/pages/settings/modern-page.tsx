import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings2, Users, Shield, Filter, Building, Palmtree, Cpu, Mail, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// Import existing components
import { GroupDataFilters } from "@/components/Settings/GroupDataFilters";
import DepartmentsSettings from "@/components/Settings/departments";
import CannedMessagesSettings from "@/components/Settings/CannedMessagesSettings";
import { JobStatuses, JobTypes, JobCategories, JobTags, TaskTemplates, UserManagement, GroupManagement, UIPermissionsManagement, EmailTemplatesSettings } from "@/components/Settings";
import EngineerManagement from "@/components/Settings/EngineerManagement";
import HolidayEntitlements from "@/components/Settings/HolidayEntitlements";
import HolidayPolicies from "@/components/Settings/HolidayPolicies";
import PublicHolidays from "@/components/Settings/PublicHolidays";
import BlackoutPeriods from "@/components/Settings/BlackoutPeriods";
import DepartmentApprovers from "@/components/Settings/DepartmentApprovers";
import HolidayTypes from "@/components/Settings/HolidayTypes";
import JobAutomationSettings from "@/components/Settings/JobAutomationSettings";
import EmailAccountManagement from "@/components/Settings/EmailAccountManagement";
import { TestPermissions } from "@/components/TestPermissions";
import { TestBulkUpdate } from "@/components/TestBulkUpdate";
import AgedCaseSettingsV2 from "@/components/AgedCases/AgedCaseSettingsV2";
import AgedCaseTemplateManager from "@/components/AgedCases/AgedCaseTemplateManager";

// Import jobService to fetch data
import jobService from "@/services/jobService";

const ModernSettingsPage = () => {
  const [searchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  
  // State for job-related data
  const [jobStatuses, setJobStatuses] = useState<any[]>([]);
  const [jobQueues, setJobQueues] = useState<any[]>([]);
  const [jobTypes, setJobTypes] = useState<any[]>([]);
  const [jobCategories, setJobCategories] = useState<any[]>([]);
  const [jobTags, setJobTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch job data
  const fetchJobData = async () => {
    try {
      setLoading(true);
      const [statuses, queues, types, categories, tags] = await Promise.all([
        jobService.getJobStatuses(),
        jobService.getJobQueues(),
        jobService.getJobTypes(),
        jobService.getJobCategories(),
        jobService.getJobTags()
      ]);
      
      setJobStatuses(statuses);
      setJobQueues(queues);
      setJobTypes(types);
      setJobCategories(categories);
      setJobTags(tags);
    } catch (error) {
      console.error("Failed to fetch job configuration data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch job configuration data when component mounts
  useEffect(() => {
    fetchJobData();
  }, []);

  // Handle URL parameters for direct navigation
  useEffect(() => {
    const category = searchParams.get('category');
    const tab = searchParams.get('tab');
    
    if (category && tab) {
      // Find the category in settingsCategories
      const foundCategory = settingsCategories.find(c => c.id === category);
      if (foundCategory && foundCategory.tabs.includes(tab)) {
        setActiveCategory(category);
        setActiveTab(tab);
      }
    }
  }, [searchParams]);

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
      description: "Manage users, groups, and engineers",
      icon: Users,
      color: "bg-blue-50 border-blue-200",
      iconColor: "text-blue-600",
      tabs: ["users", "groups", "engineers"]
    },
    {
      id: "job-settings",
      title: "Job Configuration",
      description: "Configure job types, statuses, and templates",
      icon: Settings2,
      color: "bg-green-50 border-green-200",
      iconColor: "text-green-600",
      tabs: ["job-statuses", "job-types", "job-categories", "job-tags", "templates", "job-automation"]
    },
    {
      id: "holiday-management",
      title: "Holiday Management",
      description: "Manage holiday policies, entitlements, and blackouts",
      icon: Palmtree,
      color: "bg-teal-50 border-teal-200",
      iconColor: "text-teal-600",
      tabs: ["holiday-types", "department-approvers", "holiday-policies", "holiday-entitlements", "public-holidays", "blackout-periods"]
    },
    {
      id: "access-control",
      title: "Access Control",
      description: "Manage data filters and menu permissions",
      icon: Shield,
      color: "bg-purple-50 border-purple-200",
      iconColor: "text-purple-600",
      tabs: ["data-filters", "menu-permissions", "ui-permissions"]
    },
    {
      id: "system-config",
      title: "System Configuration",
      description: "Configure departments and messaging",
      icon: Building,
      color: "bg-orange-50 border-orange-200",
      iconColor: "text-orange-600",
      tabs: ["departments", "canned-messages", "email-templates", "email-accounts"]
    },
    {
      id: "aged-cases",
      title: "Aged Cases Management",
      description: "Configure aged cases thresholds and communication templates",
      icon: Clock,
      color: "bg-amber-50 border-amber-200",
      iconColor: "text-amber-600",
      tabs: ["aged-cases-config", "aged-cases-templates"]
    }
  ];

  const tabs = [
    { id: "overview", label: "Overview", icon: Settings2 },
    { id: "job-statuses", label: "Job Statuses", category: "job-settings" },
    { id: "job-types", label: "Job Types", category: "job-settings" },
    { id: "job-categories", label: "Categories", category: "job-settings" },
    { id: "job-tags", label: "Tags", category: "job-settings" },
    { id: "templates", label: "Templates", category: "job-settings" },
    { id: "job-automation", label: "Job Automation", category: "job-settings", icon: Cpu },
    { id: "users", label: "Users", category: "user-management" },
    { id: "groups", label: "Groups", category: "user-management" },
    { id: "engineers", label: "Engineers", category: "user-management" },
    { id: "holiday-types", label: "Holiday Types", category: "holiday-management" },
    { id: "department-approvers", label: "Department Approvers", category: "holiday-management" },
    { id: "holiday-policies", label: "Holiday Policies", category: "holiday-management" },
    { id: "holiday-entitlements", label: "Entitlements", category: "holiday-management" },
    { id: "public-holidays", label: "Public Holidays", category: "holiday-management" },
    { id: "blackout-periods", label: "Blackout Periods", category: "holiday-management" },
    { id: "data-filters", label: "Data Filters", category: "access-control" },
    { id: "ui-permissions", label: "UI Permissions", category: "access-control" },
    { id: "departments", label: "Departments", category: "system-config" },
    { id: "canned-messages", label: "Canned Text Messages", category: "system-config" },
    { id: "email-templates", label: "Email Templates", category: "system-config" },
    { id: "email-accounts", label: "Email Accounts", category: "system-config", icon: Mail },
    { id: "aged-cases-config", label: "Configuration", category: "aged-cases" },
    { id: "aged-cases-templates", label: "Templates", category: "aged-cases" },
  ];

  const handleCategoryClick = (categoryId: string, firstTab: string) => {
    setActiveCategory(categoryId);
    setActiveTab(firstTab);
  };

  const handleBackToOverview = () => {
    setActiveCategory(null);
    setActiveTab(null);
  };

  const getCurrentCategoryTabs = () => {
    if (!activeCategory) return [];
    const category = settingsCategories.find(c => c.id === activeCategory);
    if (!category) return [];
    return tabs.filter(tab => tab.category === activeCategory);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              {activeCategory && (
                <button
                  onClick={handleBackToOverview}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {activeCategory ? settingsCategories.find(c => c.id === activeCategory)?.title : 'Settings'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {activeCategory ? settingsCategories.find(c => c.id === activeCategory)?.description : 'Configure your system preferences and permissions'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Show overview or category content */}
        {!activeCategory ? (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {overviewStats.map((stat, index) => (
                <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
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
                    category.color,
                    "dark:bg-gray-800 dark:border-gray-700"
                  )}
                  onClick={() => handleCategoryClick(category.id, category.tabs[0])}
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
          </div>
        ) : (
          <Tabs value={activeTab || ''} onValueChange={setActiveTab} className="space-y-6">
            {/* Category-specific tab navigation */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
              <TabsList className="flex flex-wrap gap-1 h-auto bg-transparent dark:bg-transparent p-1">
                {getCurrentCategoryTabs().map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={cn(
                      "data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400",
                      "hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                      "text-sm font-medium px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 whitespace-nowrap flex items-center"
                    )}
                  >
                    {tab.icon && <tab.icon className="h-4 w-4 mr-2" />}
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

          {/* Job Settings Tabs */}
          <TabsContent value="job-statuses">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Job Statuses</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Manage job status configurations</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-4 text-center">Loading job statuses...</div>
                ) : (
                  <JobStatuses jobStatuses={jobStatuses} jobQueues={jobQueues} onRefresh={fetchJobData} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="job-types">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Job Types</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Configure different types of jobs</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-4 text-center">Loading job types...</div>
                ) : (
                  <JobTypes jobTypes={jobTypes} jobQueues={jobQueues} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="job-categories">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Job Categories</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Organize jobs by categories</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-4 text-center">Loading job categories...</div>
                ) : (
                  <JobCategories jobCategories={jobCategories} jobQueues={jobQueues} onRefresh={fetchJobData} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="job-tags">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Job Tags</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Create tags for job classification</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-4 text-center">Loading job tags...</div>
                ) : (
                  <JobTags jobTags={jobTags} jobQueues={jobQueues} onRefresh={fetchJobData} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Task Templates</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Manage reusable task templates</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-4 text-center">Loading task templates...</div>
                ) : (
                  <TaskTemplates jobTypes={jobTypes} queues={jobQueues} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="job-automation">
            <JobAutomationSettings />
          </TabsContent>

          {/* User Management Tabs */}
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="groups">
            <GroupManagement />
          </TabsContent>

          <TabsContent value="engineers">
            <EngineerManagement />
          </TabsContent>

          {/* Access Control Tabs */}
          <TabsContent value="data-filters">
            <GroupDataFilters />
          </TabsContent>


          <TabsContent value="ui-permissions">
            <UIPermissionsManagement />
            {/* Temporary test components - remove after debugging */}
            {import.meta.env.DEV && (
              <div className="mt-8 space-y-8">
                <TestPermissions />
                <TestBulkUpdate />
              </div>
            )}
          </TabsContent>

          {/* System Configuration Tabs */}
          <TabsContent value="departments">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Department Management</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Manage organizational departments</CardDescription>
              </CardHeader>
              <CardContent>
                <DepartmentsSettings />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="canned-messages">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Canned Text Messages</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Manage pre-defined SMS and text message templates</CardDescription>
              </CardHeader>
              <CardContent>
                <CannedMessagesSettings />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email-templates">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Email Templates</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Create and manage email templates with dynamic variables</CardDescription>
              </CardHeader>
              <CardContent>
                <EmailTemplatesSettings />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email-accounts">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Email Accounts</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Configure email accounts for sending notifications and communications</CardDescription>
              </CardHeader>
              <CardContent>
                <EmailAccountManagement />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Holiday Management Tabs */}
          <TabsContent value="holiday-types">
            <HolidayTypes />
          </TabsContent>

          <TabsContent value="department-approvers">
            <DepartmentApprovers />
          </TabsContent>

          <TabsContent value="holiday-policies">
            <HolidayPolicies />
          </TabsContent>

          <TabsContent value="holiday-entitlements">
            <HolidayEntitlements />
          </TabsContent>

          <TabsContent value="public-holidays">
            <PublicHolidays />
          </TabsContent>

          <TabsContent value="blackout-periods">
            <BlackoutPeriods />
          </TabsContent>

          {/* Aged Cases Management Tabs */}
          <TabsContent value="aged-cases-config">
            <AgedCaseSettingsV2 />
          </TabsContent>

          <TabsContent value="aged-cases-templates">
            <AgedCaseTemplateManager />
          </TabsContent>
        </Tabs>
        )}
      </div>
    </div>
  );
};

export default ModernSettingsPage;