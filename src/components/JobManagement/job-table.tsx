"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../ui/button"
import { PlusCircle, ChevronDown } from "lucide-react"
import { useToast } from "../../hooks/use-toast"
import { Badge } from "../ui/badge"
import { JobFilter, type JobFilters } from "./job-filter"
import jobService, { Job, Technician, JobStatus, JobQueue, JobTask, TaskStepInstance } from "../../services/jobService"
import { useUIPermission } from "../../hooks/useUIPermission"
import { getBulkSiteCommunicationStatus, getSiteDetail, getFcoList } from "../../services/api"
import { getUsers, getGroups, getUsersInGroup } from "../../services/userService"
import { User } from "../../types/user"

// Extended Job interface with current step info
interface ExtendedJob extends Job {
  currentStep?: string;
  tasks?: JobTask[];
  siteStatus?: {
    status: 'no_coms' | 'zero_read' | 'healthy' | 'loading' | 'error';
    days?: number;
    last_reading_date?: string;
    last_reading_value?: number;
  };
  fco?: string;
}
import { BulkAssignModal, BulkDeleteModal, BulkUpdateModal } from "./bulk-actions"
import { BulkMeterTestModal } from "./BulkMeterTestModal"
import { BulkStatusChangeModal } from "./bulk-status-change"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table"
import { Checkbox } from "../ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Label } from "../ui/label"

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

const defaultFilters: JobFilters = {
  status: [],
  priority: [],
  assignedTo: [],
  queue: [],
  search: '',
  saveAsDefault: false,
  defaultQueue: null,
  fco: []
}

const getSavedFilters = (): JobFilters | null => {
  const savedFilters = localStorage.getItem('jobFilters')
  if (savedFilters) {
    const parsed = JSON.parse(savedFilters)
    // Ensure fco is an array, not null
    if (!parsed.fco || !Array.isArray(parsed.fco)) {
      parsed.fco = []
    }
    return parsed
  }
  return null
}

interface JobTableProps {
  showOnlyCompleted?: boolean;
}

export function JobTable({ showOnlyCompleted = false }: JobTableProps) {
  const [jobs, setJobs] = useState<ExtendedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filteredJobs, setFilteredJobs] = useState<ExtendedJob[]>([])
  const [totalJobCount, setTotalJobCount] = useState<number>(0)
  // Removed unused loadingSteps state
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [statuses, setStatuses] = useState<JobStatus[]>([])
  const [queues, setQueues] = useState<JobQueue[]>([])
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<JobFilters>(getSavedFilters() || defaultFilters)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showMeterTestModal, setShowMeterTestModal] = useState(false)
  const [showStatusChangeModal, setShowStatusChangeModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize] = useState(10) // Jobs per page
  const [openHeaderFilter, setOpenHeaderFilter] = useState<string | null>(null)
  const [availableFCOs, setAvailableFCOs] = useState<string[]>([])
  const [loadingFCOs, setLoadingFCOs] = useState(false)
  
  const { toast } = useToast()
  const navigate = useNavigate()
  
  // UI Permission checks
  const canChangeJobStatus = useUIPermission('jobs.list.bulk_status_change')
  const canBulkUpdateJobs = useUIPermission('jobs.list.bulk_update')
  const canDeleteJobs = useUIPermission('jobs.list.bulk_delete')
  const canAssignJobs = useUIPermission('jobs.list.bulk_assign')


  // Function to get the current step for each job
  const fetchJobsWithSteps = async (jobsList: Job[]) => {
    
    try {
      // Create extended jobs with empty current step
      const extendedJobs: ExtendedJob[] = jobsList.map(job => ({
        ...job,
        currentStep: "Loading...",
        siteStatus: { status: 'loading' },
        fco: job.site_fco // Use FCO from backend response
      }))
      
      // Update the jobs state immediately with loading state
      setJobs(extendedJobs)
      
      // First, get all unique site IDs and fetch their statuses in bulk
      const siteIds = jobsList
        .filter(job => job.site !== null && job.site !== undefined)
        .map(job => {
          // Site is always a number (site ID)
          return typeof job.site === 'number' ? job.site : null;
        })
        .filter(id => id !== null) as number[];
      
      const uniqueSiteIds = [...new Set(siteIds)];
      const siteStatuses = await getBulkSiteCommunicationStatus(uniqueSiteIds);
      
      // Don't fetch FCO data during initial load - it will be loaded lazily
      
      // For each job, fetch its tasks and update state
      const jobsWithSteps = await Promise.all(
        extendedJobs.map(async (job) => {
          try {
            // Get tasks for this job using the numeric ID
            const jobId = typeof job.id === 'string' ? parseInt(job.id) : job.id
            const tasks = await jobService.getJobTasks(jobId)
            
            // Set default value
            let currentStepName = "No tasks assigned"
            
            if (tasks && tasks.length > 0) {
              // Log the first task for debugging
              
              // Find the active task or use the first one
              const activeTask = tasks.find(task => task.status === "in_progress") || tasks[0]
              
              // If task has step_instances, find the current or next step
              if (activeTask.step_instances && activeTask.step_instances.length > 0) {
                
                // First look for in_progress steps
                const inProgressStep = activeTask.step_instances.find(step => step.status === "in_progress")
                
                if (inProgressStep) {
                  currentStepName = `In progress: ${inProgressStep.name}`
                } else {
                  // Then look for pending steps
                  const pendingSteps = activeTask.step_instances
                    .filter(step => step.status === "pending")
                    .sort((a, b) => a.step_order - b.step_order)
                  
                  if (pendingSteps.length > 0) {
                    currentStepName = pendingSteps[0].name
                  } else {
                    // If no in_progress or pending steps, look for the latest completed step
                    const completedSteps = activeTask.step_instances
                      .filter(step => step.status === "completed")
                      .sort((a, b) => b.step_order - a.step_order) // Reverse order to get latest
                    
                    if (completedSteps.length > 0) {
                      currentStepName = `Completed: ${completedSteps[0].name}`
                    } else {
                      currentStepName = "No active steps"
                    }
                  }
                }
              } else {
                // No step_instances, try to get task details
                try {
                  const taskDetails = await jobService.getTaskDetails(activeTask.id)
                  
                  if (taskDetails && taskDetails.step_instances && taskDetails.step_instances.length > 0) {
                    const steps = taskDetails.step_instances
                    const activeStep = steps.find((step: TaskStepInstance) => step.status === "in_progress") || 
                                      steps.filter((step: TaskStepInstance) => step.status === "pending")
                                          .sort((a: TaskStepInstance, b: TaskStepInstance) => a.step_order - b.step_order)[0]
                                    
                    if (activeStep) {
                      currentStepName = activeStep.name
                    }
                  } else if (taskDetails && taskDetails.current_step) {
                    currentStepName = taskDetails.current_step.name
                  }
                } catch (error) {
                }
              }
            }
            
            
            // Get site communication status from bulk results
            let siteStatus: ExtendedJob['siteStatus'] = { status: 'loading' };
            let siteId: number | null = null;
            
            // Site is always a number (site ID)
            if (typeof job.site === 'number') {
              siteId = job.site;
            }
            
            if (siteId !== null) {
              const statusData = siteStatuses[siteId];
              
              if (statusData && !statusData.error) {
                siteStatus = statusData;
              } else if (statusData && statusData.error) {
                siteStatus = { status: 'error' };
              } else {
                // No data available
                siteStatus = { status: 'error' };
              }
            }
            
            // Return updated job with current step and site status
            return {
              ...job,
              currentStep: currentStepName,
              tasks,
              siteStatus,
              fco: job.site_fco // FCO now comes from backend
            }
          } catch (error) {
            // Return job with error message
            return {
              ...job,
              currentStep: "Error loading step"
            }
          }
        })
      )
      
      // Update jobs state with all fetched data
      setJobs(jobsWithSteps)
      // Also update filtered jobs 
      setFilteredJobs(jobsWithSteps)
      
    } catch (error) {
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      // Adapt filters to match service interface
      const serviceFilters = {
        status: showOnlyCompleted 
          ? ['completed'] 
          : (filters.status.length > 0 ? filters.status : undefined), // If no status filter and not showing completed, backend should exclude completed
        priority: filters.priority,
        queue: filters.queue,
        assignedTo: filters.assignedTo.map(id => id === 'unassigned' ? -1 : parseInt(id)),
        search: filters.search || '',
        page: currentPage,
        page_size: pageSize,
        site_fco: filters.fco && filters.fco.length > 0 ? filters.fco : undefined
      }
      
      const response = await jobService.getJobs(serviceFilters)
      let jobsList: Job[] = []
      
      if (response && typeof response === 'object' && 'results' in response) {
        const paginatedResponse = response as unknown as PaginatedResponse<Job>
        jobsList = paginatedResponse.results
        setTotalJobCount(paginatedResponse.count)
        setTotalPages(Math.ceil(paginatedResponse.count / pageSize))
      } else if (Array.isArray(response)) {
        jobsList = response
        setTotalJobCount(response.length)
        setTotalPages(1)
      }
      
      // First update with basic job data
      setJobs(jobsList as ExtendedJob[])
      
      // Then fetch current step data for each job
      fetchJobsWithSteps(jobsList)
      
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filters, currentPage, showOnlyCompleted])

  // Remove FCO lazy loading - no longer needed since backend provides FCO

  // Fetch available FCO values for the filter dropdown
  useEffect(() => {
    const fetchAvailableFCOs = async () => {
      setLoadingFCOs(true);
      try {
        // Get ALL FCO values from the system
        const fcoList = await getFcoList();
        if (fcoList && Array.isArray(fcoList)) {
          setAvailableFCOs(fcoList.filter(fco => fco && fco !== ''));
        } else if (fcoList && fcoList.fcos && Array.isArray(fcoList.fcos)) {
          setAvailableFCOs(fcoList.fcos.filter(fco => fco && fco !== ''));
        } else {
          setAvailableFCOs([]);
        }
      } catch (error) {
        console.error('Failed to fetch FCO list:', error);
        setAvailableFCOs([]);
      } finally {
        setLoadingFCOs(false);
      }
    };

    fetchAvailableFCOs();
  }, [])

  // Load initial data (statuses, queues, users)
  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      if (!isMounted) return;

      try {
        const [statusesResponse, queuesResponse, groupsResponse] = await Promise.all([
          jobService.getJobStatuses(),
          jobService.getJobQueues(),
          getGroups()
        ]);

        if (!isMounted) return;

        setStatuses(statusesResponse);
        setQueues(queuesResponse);
        
        // Find the technician group (case insensitive)
        const technicianGroup = groupsResponse.find(
          group => group.name.toLowerCase() === 'technician'
        );
        
        if (technicianGroup) {
          // Get only users in the technician group
          try {
            const technicianUsers = await getUsersInGroup(technicianGroup.id);
            setAllUsers(technicianUsers);
          } catch (err) {
            // Fallback to all users if we can't get technician group users
            const usersResponse = await getUsers();
            if (usersResponse && usersResponse.results) {
              setAllUsers(usersResponse.results);
            }
          }
        } else {
          // Fallback to all users if no technician group found
          const usersResponse = await getUsers();
          if (usersResponse && usersResponse.results) {
            setAllUsers(usersResponse.results);
          }
        }
      } catch (err) {
        if (err.response?.status === 401) {
          if (isMounted) {
            setError('Authentication failed. Please log in again.');
            toast({
              title: "Authentication Error",
              description: "Your session has expired. Please log in again.",
            });
          }
          return;
        }
        toast({
          title: "Error",
          description: "Failed to load configuration data. Please try again."
        });
      }
    };

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, []);
  

  // Set filtered jobs when jobs change
  // All filtering is now done server-side via API parameters
  useEffect(() => {
    setFilteredJobs(jobs);
  }, [jobs]);
  
  // Save filters to localStorage if saveAsDefault is checked
  useEffect(() => {
    if (filters.saveAsDefault) {
      localStorage.setItem('jobFilters', JSON.stringify(filters))
      localStorage.setItem('useDefaultJobFilters', 'true')
    }
  }, [filters])

  const handleFiltersChange = (newFilters: JobFilters) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filters change
    if (newFilters.saveAsDefault) {
      localStorage.setItem('useDefaultJobFilters', 'true')
    } else {
      localStorage.removeItem('useDefaultJobFilters')
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedJobs(new Set(filteredJobs.map(job => job.id.toString())))
    } else {
      setSelectedJobs(new Set())
    }
  }

  const handleSelectJob = (jobId: string, checked: boolean) => {
    const newSelected = new Set(selectedJobs)
    if (checked) {
      newSelected.add(jobId)
    } else {
      newSelected.delete(jobId)
    }
    setSelectedJobs(newSelected)
  }

  const handleBulkAction = async (action: string) => {
    if (selectedJobs.size === 0) {
      toast({
        title: "No jobs selected",
        description: "Please select at least one job to perform this action.",
      })
      return
    }

    try {
      switch (action) {
        case 'delete':
          setShowDeleteModal(true)
          break
        case 'assign':
          setShowAssignModal(true)
          break
        case 'update':
          setShowUpdateModal(true)
          break
        case 'statusChange':
          setShowStatusChangeModal(true)
          break
        case 'meterTest':
          setShowMeterTestModal(true)
          break
        default:
          toast({
            title: "Unknown action",
            description: "The selected action is not supported.",
          })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform the selected action. Please try again.",
      })
    }
  }

  const handleBulkAssign = async (technicianId: number | null) => {
    try {
      await jobService.bulkAssignJobs(Array.from(selectedJobs), technicianId)
      
      // Refresh the jobs list
      fetchData()
      
      // Clear selection
      setSelectedJobs(new Set())
    } catch (error) {
      throw error
    }
  }

  const handleBulkDelete = async () => {
    try {
      await jobService.bulkDeleteJobs(Array.from(selectedJobs))
      
      // Refresh the jobs list
      fetchData()
      
      // Clear selection
      setSelectedJobs(new Set())
    } catch (error) {
      throw error
    }
  }

  const handleBulkUpdate = async (updates: {
    assignedTo?: number | null;
    dueDate?: string | null;
    queue?: number | null;
    priority?: string | null;
    status?: number | null;
  }) => {
    try {
      await jobService.bulkUpdateJobs(Array.from(selectedJobs), updates)
      
      // Refresh the jobs list
      fetchData()
      
      // Clear selection
      setSelectedJobs(new Set())
    } catch (error) {
      throw error
    }
  }

  const handleBulkStatusChange = async (statusId: number) => {
    try {
      await jobService.bulkUpdateJobs(Array.from(selectedJobs), { status: statusId })
      
      // Refresh the jobs list
      fetchData()
      
      // Clear selection
      setSelectedJobs(new Set())
    } catch (error) {
      throw error
    }
  }

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/30"
      case "medium":
        return "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/30"
      case "low":
        return "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/30"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
    }
  }

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "in-progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  // Get site status display
  const getSiteStatusDisplay = (siteStatus?: ExtendedJob['siteStatus']) => {
    if (!siteStatus) return { text: 'N/A', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' };
    
    switch (siteStatus.status) {
      case 'no_coms':
        return { 
          text: `No Coms (${siteStatus.days || 0}d)`, 
          color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
        };
      case 'zero_read':
        return { 
          text: `Zero Read (${siteStatus.days || 0}d)`, 
          color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' 
        };
      case 'healthy':
        return { 
          text: 'Healthy', 
          color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
        };
      case 'loading':
        return { 
          text: 'Loading...', 
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' 
        };
      case 'error':
        return { 
          text: 'Error', 
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' 
        };
      default:
        return { 
          text: 'Unknown', 
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' 
        };
    }
  }

  // Handler for header filter clicks
  const handleHeaderFilterClick = (header: string) => {
    setOpenHeaderFilter(openHeaderFilter === header ? null : header)
  }

  // Get unique values for column filters
  const getUniqueValues = (column: string) => {
    switch (column) {
      case 'type':
        return [...new Set(filteredJobs.map(job => job.type?.name).filter(Boolean))]
      case 'site':
        return [...new Set(filteredJobs.map(job => (job as any).site_name).filter(Boolean))]
      case 'fco':
        return [...new Set(filteredJobs.map(job => {
          const extendedJob = job as ExtendedJob;
          return extendedJob.fco ? String(extendedJob.fco) : null;
        }).filter(Boolean))]
      case 'status':
        return statuses.map(s => s.name)
      case 'queue':
        return queues.map(q => q.name)
      case 'assignedTo':
        return [
          { id: 'unassigned', name: 'Unassigned' },
          ...allUsers.map(user => ({ 
            id: String(user.id), 
            name: `${user.first_name} ${user.last_name}`.trim() || user.username 
          }))
        ]
      default:
        return []
    }
  }

  // Removed unused columns variable

  return (
    <div className="flex flex-col h-full min-h-screen">
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold dark:text-white">
              {showOnlyCompleted ? 'Completed Jobs' : 'Job Management'}
            </h1>
            <p className="text-muted-foreground dark:text-gray-400">
              {showOnlyCompleted 
                ? 'View all completed jobs' 
                : 'Manage and track active jobs in the system'}
              {totalJobCount > 0 && (
                <span className="ml-2 font-semibold">
                  • Total: {totalJobCount} {totalJobCount === 1 ? 'job' : 'jobs'}
                  {totalJobCount > filteredJobs.length && (
                    <span className="text-sm font-normal">
                      {' '}(showing {filteredJobs.length})
                    </span>
                  )}
                </span>
              )}
            </p>
          </div>
          <Button onClick={() => navigate("/jobs/new")} size="sm" className="h-8">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Job
          </Button>
        </div>
        
        <JobFilter 
          filters={filters} 
          onFiltersChange={handleFiltersChange} 
          technicians={allUsers.map(user => ({
            id: user.id,
            user: {
              id: user.id,
              first_name: user.first_name,
              last_name: user.last_name,
              username: user.username
            },
            full_name: `${user.first_name} ${user.last_name}`.trim() || user.username,
            is_active: user.is_active
          } as Technician))}
          statuses={statuses}
          queues={queues}
          loading={loading}
        />


        {selectedJobs.size > 0 && (
          <div className="flex items-center gap-2 p-2 bg-muted dark:bg-gray-800 rounded-lg">
            <span className="text-sm text-muted-foreground dark:text-gray-400">
              {selectedJobs.size} job{selectedJobs.size === 1 ? '' : 's'} selected
            </span>
            {canAssignJobs && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('assign')}
              >
                Bulk Assign
              </Button>
            )}
            {canChangeJobStatus && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('statusChange')}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
              >
                Change Status
              </Button>
            )}
            {canBulkUpdateJobs && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('update')}
              >
                Update
              </Button>
            )}
            {canDeleteJobs && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('delete')}
              >
                Delete
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('meterTest')}
            >
              Meter Test
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 dark:text-red-400">{error}</div>
        ) : filteredJobs.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground dark:text-gray-400 mb-4">No jobs match the current filters</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setFilters({
                  status: [],
                  priority: [],
                  assignedTo: [],
                  queue: [],
                  search: '',
                  saveAsDefault: false,
                  defaultQueue: null,
                  fco: []
                });
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border dark:border-gray-700 shadow-lg overflow-hidden bg-white dark:bg-gray-900">
            <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <TableHeader className="bg-gray-100 dark:bg-gray-800">
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedJobs.size === filteredJobs.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300">
                    <Popover open={openHeaderFilter === 'type'} onOpenChange={(open) => setOpenHeaderFilter(open ? 'type' : null)}>
                      <PopoverTrigger asChild>
                        <button className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-gray-100">
                          <span>Type</span>
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Filter by Type</h4>
                          {getUniqueValues('type').map(type => (
                            <div key={type} className="flex items-center space-x-2">
                              <Checkbox 
                                checked={filters.status.includes(type)}
                                onCheckedChange={(checked) => {
                                  const newFilters = { ...filters }
                                  if (checked) {
                                    newFilters.status = [...filters.status, type]
                                  } else {
                                    newFilters.status = filters.status.filter(s => s !== type)
                                  }
                                  handleFiltersChange(newFilters)
                                }}
                              />
                              <Label className="text-sm font-normal">{type}</Label>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableHead>
                  <TableHead className="uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300">Title</TableHead>
                  <TableHead className="uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300">Site</TableHead>
                  <TableHead className="uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300">
                    <Popover open={openHeaderFilter === 'fco'} onOpenChange={(open) => setOpenHeaderFilter(open ? 'fco' : null)}>
                      <PopoverTrigger asChild>
                        <button className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-gray-100">
                          <span>FCO</span>
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 max-h-80 overflow-y-auto">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Filter by FCO</h4>
                          {loadingFCOs ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-gray-100"></div>
                            </div>
                          ) : availableFCOs.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No FCO values available</p>
                          ) : (
                            <div className="space-y-1">
                              {availableFCOs.map(fco => (
                                <div key={fco} className="flex items-center space-x-2">
                                  <Checkbox 
                                    checked={filters.fco && filters.fco.includes(fco)}
                                    onCheckedChange={(checked) => {
                                      const currentFCOs = filters.fco || [];
                                      const newFCOs = checked
                                        ? [...currentFCOs, fco]
                                        : currentFCOs.filter(f => f !== fco);
                                      handleFiltersChange({ ...filters, fco: newFCOs });
                                    }}
                                  />
                                  <Label className="text-sm font-normal cursor-pointer" 
                                    onClick={() => {
                                      const currentFCOs = filters.fco || [];
                                      const isChecked = currentFCOs.includes(fco);
                                      const newFCOs = isChecked
                                        ? currentFCOs.filter(f => f !== fco)
                                        : [...currentFCOs, fco];
                                      handleFiltersChange({ ...filters, fco: newFCOs });
                                    }}>
                                    {fco}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableHead>
                  <TableHead className="uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300">
                    <Popover open={openHeaderFilter === 'status'} onOpenChange={(open) => setOpenHeaderFilter(open ? 'status' : null)}>
                      <PopoverTrigger asChild>
                        <button className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-gray-100">
                          <span>Status</span>
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Filter by Status</h4>
                          {getUniqueValues('status').map(status => (
                            <div key={status} className="flex items-center space-x-2">
                              <Checkbox 
                                checked={filters.status.includes(status)}
                                onCheckedChange={(checked) => {
                                  const newStatuses = checked
                                    ? [...filters.status, status]
                                    : filters.status.filter(s => s !== status)
                                  handleFiltersChange({ ...filters, status: newStatuses })
                                }}
                              />
                              <Label className="text-sm font-normal">{status}</Label>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableHead>
                  <TableHead className="uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300">
                    <Popover open={openHeaderFilter === 'queue'} onOpenChange={(open) => setOpenHeaderFilter(open ? 'queue' : null)}>
                      <PopoverTrigger asChild>
                        <button className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-gray-100">
                          <span>Queue</span>
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Filter by Queue</h4>
                          {getUniqueValues('queue').map(queue => (
                            <div key={queue} className="flex items-center space-x-2">
                              <Checkbox 
                                checked={filters.queue.includes(queue)}
                                onCheckedChange={(checked) => {
                                  const newQueues = checked
                                    ? [...filters.queue, queue]
                                    : filters.queue.filter(q => q !== queue)
                                  handleFiltersChange({ ...filters, queue: newQueues })
                                }}
                              />
                              <Label className="text-sm font-normal">{queue}</Label>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableHead>
                  <TableHead className="uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300">Site Status</TableHead>
                  <TableHead className="uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300">Current Step</TableHead>
                  <TableHead className="uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300">
                    <Popover open={openHeaderFilter === 'assignedTo'} onOpenChange={(open) => setOpenHeaderFilter(open ? 'assignedTo' : null)}>
                      <PopoverTrigger asChild>
                        <button className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-gray-100">
                          <span>Assigned To</span>
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Filter by Assignment</h4>
                          {getUniqueValues('assignedTo').map((user: any) => (
                            <div key={user.id} className="flex items-center space-x-2">
                              <Checkbox 
                                checked={filters.assignedTo.includes(user.id)}
                                onCheckedChange={(checked) => {
                                  const newAssignedTo = checked
                                    ? [...filters.assignedTo, user.id]
                                    : filters.assignedTo.filter(a => a !== user.id)
                                  handleFiltersChange({ ...filters, assignedTo: newAssignedTo })
                                }}
                              />
                              <Label className="text-sm font-normal">{user.name}</Label>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                {filteredJobs.map((job, idx) => (
                  <TableRow
                    key={job.id}
                    className={`transition-colors cursor-pointer ${idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'} hover:bg-blue-50 dark:hover:bg-gray-800`}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    <TableCell 
                      className="px-6 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selectedJobs.has(job.id.toString())}
                        onCheckedChange={(checked) => handleSelectJob(job.id.toString(), checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="px-6 py-4 dark:text-gray-300">
                      {job.type ? job.type.name : '-'}
                    </TableCell>
                    <TableCell className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{job.title}</TableCell>
                    <TableCell className="px-6 py-4 dark:text-gray-300">
                      {(job as any).site_name || 'Unknown Site'}
                    </TableCell>
                    <TableCell className="px-6 py-4 dark:text-gray-300">
                      {job.fco === undefined ? (
                        <span className="text-gray-400 dark:text-gray-500 italic">Loading...</span>
                      ) : (
                        job.fco || '-'
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge className={getStatusColor(job.status.name)}>
                        {job.status.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 dark:text-gray-300">{job.queue.name}</TableCell>
                    <TableCell className="px-6 py-4">
                      {(() => {
                        const siteStatus = getSiteStatusDisplay(job.siteStatus);
                        return (
                          <Badge className={siteStatus.color}>
                            {siteStatus.text}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="px-6 py-4 dark:text-gray-300">
                      {job.currentStep ? (
                        <span className={job.currentStep === "Loading..." ? "text-gray-400 dark:text-gray-500 italic" : ""}>
                          {job.currentStep}
                        </span>
                      ) : "No tasks assigned"}
                    </TableCell>
                    <TableCell className="px-6 py-4 dark:text-gray-300">
                      {job.assigned_to ? job.assigned_to.user.first_name + " " + job.assigned_to.user.last_name : "Unassigned"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-t dark:border-gray-700">
            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
              Showing{' '}
              <span className="font-medium">
                {(currentPage - 1) * pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min(currentPage * pageSize, totalJobCount)}
              </span>{' '}
              of{' '}
              <span className="font-medium">{totalJobCount}</span> results
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              {/* Page numbers */}
              <div className="flex space-x-1">
                {/* First page */}
                {currentPage > 3 && (
                  <>
                    <Button
                      variant={currentPage === 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      className="min-w-[40px]"
                    >
                      1
                    </Button>
                    {currentPage > 4 && <span className="px-2 py-1">...</span>}
                  </>
                )}
                
                {/* Pages around current */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    return page === currentPage || 
                           page === currentPage - 1 || 
                           page === currentPage + 1 ||
                           page === currentPage - 2 ||
                           page === currentPage + 2
                  })
                  .filter(page => page > 0 && page <= totalPages)
                  .map(page => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="min-w-[40px]"
                    >
                      {page}
                    </Button>
                  ))}
                
                {/* Last page */}
                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && <span className="px-2 py-1">...</span>}
                    <Button
                      variant={currentPage === totalPages ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      className="min-w-[40px]"
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </main>
      
      {/* Bulk action modals */}
      <BulkAssignModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onAssign={handleBulkAssign}
        technicians={allUsers.map(user => ({
          id: user.id,
          user: {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username
          },
          full_name: `${user.first_name} ${user.last_name}`.trim() || user.username,
          is_active: user.is_active
        } as Technician))}
        selectedCount={selectedJobs.size}
      />
      
      <BulkDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleBulkDelete}
        selectedCount={selectedJobs.size}
      />
      
      <BulkUpdateModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onUpdate={handleBulkUpdate}
        selectedCount={selectedJobs.size}
        technicians={allUsers.map(user => ({
          id: user.id,
          user: {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username
          },
          full_name: `${user.first_name} ${user.last_name}`.trim() || user.username,
          is_active: user.is_active
        } as Technician))}
        queues={queues}
        statuses={statuses}
      />
      
      <BulkMeterTestModal
        isOpen={showMeterTestModal}
        onClose={() => setShowMeterTestModal(false)}
        selectedJobs={filteredJobs.filter(job => selectedJobs.has(job.id.toString()))}
        onComplete={() => {
          setSelectedJobs(new Set());
          fetchData();
        }}
      />
      
      <BulkStatusChangeModal
        isOpen={showStatusChangeModal}
        onClose={() => setShowStatusChangeModal(false)}
        onUpdate={handleBulkStatusChange}
        selectedCount={selectedJobs.size}
        statuses={statuses}
      />
    </div>
  )
} 