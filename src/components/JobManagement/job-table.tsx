"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../ui/button"
import { PlusCircle } from "lucide-react"
import { useToast } from "../../hooks/use-toast"
import { Badge } from "../ui/badge"
import { JobFilter, type JobFilters } from "./job-filter"
import jobService, { Job, Technician, JobStatus, JobQueue, JobTask, TaskStepInstance } from "../../services/jobService"
import { getBulkSiteCommunicationStatus } from "../../services/api"
import { getUsers } from "../../services/userService"
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
}
import { BulkAssignModal, BulkDeleteModal, BulkUpdateModal } from "./bulk-actions"
import { BulkMeterTestModal } from "./BulkMeterTestModal"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table"
import { Checkbox } from "../ui/checkbox"
import { format } from "date-fns"

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
  defaultQueue: null
}

const getSavedFilters = (): JobFilters | null => {
  const savedFilters = localStorage.getItem('jobFilters')
  return savedFilters ? JSON.parse(savedFilters) : null
}

interface JobTableProps {
  showOnlyCompleted?: boolean;
}

export function JobTable({ showOnlyCompleted = false }: JobTableProps) {
  const [jobs, setJobs] = useState<ExtendedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filteredJobs, setFilteredJobs] = useState<ExtendedJob[]>([])
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
  // Removed unused pagination states
  
  const { toast } = useToast()
  const navigate = useNavigate()

  // Function to get the current step for each job
  const fetchJobsWithSteps = async (jobsList: Job[]) => {
    
    try {
      // Create extended jobs with empty current step
      const extendedJobs: ExtendedJob[] = jobsList.map(job => ({
        ...job,
        currentStep: "Loading...",
        siteStatus: { status: 'loading' }
      }))
      
      // Update the jobs state immediately with loading state
      setJobs(extendedJobs)
      
      // First, get all unique site IDs and fetch their statuses in bulk
      const siteIds = jobsList
        .filter(job => job.site !== null && job.site !== undefined)
        .map(job => {
          // Handle both cases: site as number or site as object
          if (typeof job.site === 'number') {
            return job.site;
          } else if (typeof job.site === 'object' && job.site.site_id) {
            return job.site.site_id;
          }
          return null;
        })
        .filter(id => id !== null) as number[];
      
      const uniqueSiteIds = [...new Set(siteIds)];
      const siteStatuses = await getBulkSiteCommunicationStatus(uniqueSiteIds);
      
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
            
            // Extract site ID from either number or object format
            if (typeof job.site === 'number') {
              siteId = job.site;
            } else if (typeof job.site === 'object' && job.site && job.site.site_id) {
              siteId = job.site.site_id;
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
              siteStatus
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
        status: filters.status,
        priority: filters.priority,
        queue: filters.queue,
        assignedTo: filters.assignedTo.map(id => id === 'unassigned' ? -1 : parseInt(id)),
        search: filters.search || ''
      }
      
      const response = await jobService.getJobs(serviceFilters)
      let jobsList: Job[] = []
      
      if (response && typeof response === 'object' && 'results' in response) {
        const paginatedResponse = response as unknown as PaginatedResponse<Job>
        jobsList = paginatedResponse.results
        // setTotalPages(Math.ceil(paginatedResponse.count / 10))
      } else if (Array.isArray(response)) {
        jobsList = response
        // setTotalPages(1)
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
  }, [filters])

  // Load all data from API
  useEffect(() => {
    let isMounted = true;
    let abortController = new AbortController();

    const fetchData = async () => {
      if (!isMounted) return;
      
      setLoading(true);
      setError(null);

      try {
        // Mock data for development if API fails
        let jobsData: Job[] = [];
        let statusesData: JobStatus[] = [];
        let queuesData: JobQueue[] = [];
        
        // Try to fetch real data first
        try {
          const [jobsResponse, techniciansResponse, statusesResponse, queuesResponse, usersResponse] = await Promise.all([
            jobService.getJobs(),
            jobService.getTechnicians(),
            jobService.getJobStatuses(),
            jobService.getJobQueues(),
            getUsers()
          ]);

          if (!isMounted) return;

          // Handle both array and paginated response
          if (Array.isArray(jobsResponse)) {
            jobsData = jobsResponse;
          } else if (jobsResponse && typeof jobsResponse === 'object' && 'results' in jobsResponse) {
            jobsData = (jobsResponse as PaginatedResponse<Job>).results;
          } else {
            jobsData = [];
          }
          // Note: techniciansResponse is not used anymore since we're using all users
          statusesData = statusesResponse;
          queuesData = queuesResponse;
          
          // Handle users response (it's paginated)
          if (usersResponse && usersResponse.results) {
            setAllUsers(usersResponse.results);
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
          // If API fails, show error and return
          setError(`Failed to load data: ${err.message || 'Unknown error'}`);
          toast({
            title: "Error",
            description: "Failed to load job data. Please try again."
          });
        }
        
        if (isMounted) {
          setJobs(jobsData);
          setStatuses(statusesData);
          setQueues(queuesData);
          setError(null);
          
          if (jobsData.length > 0 && jobsData[0].id === 1) {
            toast({
              title: "Using mock data",
              description: "Could not connect to API. Using sample data instead.",
            });
          }
        }
      } catch (error) {
        if (isMounted) {
          setError('Failed to load data. Please try again later.');
          toast({
            title: "Error",
            description: "Failed to load data. Please try again later.",
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  // Apply filters when they change or when jobs change
  useEffect(() => {
    if (!jobs.length) return;

    let result = [...jobs];
    
    // Apply route-based filtering first
    if (showOnlyCompleted) {
      // Show only completed jobs
      result = result.filter(job => job.status.name.toLowerCase() === 'completed');
    } else {
      // Default view: exclude completed jobs unless explicitly filtered
      if (filters.status.length === 0) {
        result = result.filter(job => job.status.name.toLowerCase() !== 'completed');
      }
    }
    
    if (filters.status.length > 0) {
      result = result.filter(job => filters.status.includes(job.status.name));
    }
    
    if (filters.priority.length > 0) {
      result = result.filter(job => filters.priority.includes(job.priority));
    }
    
    if (filters.assignedTo.length > 0) {
      result = result.filter(job => {
        if (filters.assignedTo.includes('unassigned') && !job.assigned_to) {
          return true;
        }
        return job.assigned_to && filters.assignedTo.includes(String(job.assigned_to.id));
      });
    }
    
    if (filters.queue.length > 0) {
      result = result.filter(job => filters.queue.includes(job.queue.name));
    }
    
    // Keep the extended job data (particularly currentStep) when filtering
    const resultWithSteps = result.map(job => {
      // Find the corresponding job with currentStep in the jobs array
      const jobWithSteps = jobs.find(j => j.id === job.id);
      // If found, merge the currentStep
      if (jobWithSteps && jobWithSteps.currentStep) {
        return { ...job, currentStep: jobWithSteps.currentStep, tasks: jobWithSteps.tasks };
      }
      return job;
    });
    
    setFilteredJobs(resultWithSteps);
  }, [jobs, filters, showOnlyCompleted]);
  
  // Save filters to localStorage if saveAsDefault is checked
  useEffect(() => {
    if (filters.saveAsDefault) {
      localStorage.setItem('jobFilters', JSON.stringify(filters))
      localStorage.setItem('useDefaultJobFilters', 'true')
    }
  }, [filters])

  const handleFiltersChange = (newFilters: JobFilters) => {
    setFilters(newFilters)
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('assign')}
            >
              Assign
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('update')}
            >
              Update
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('delete')}
            >
              Delete
            </Button>
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
              onClick={() => setFilters({
                status: [],
                priority: [],
                assignedTo: [],
                queue: [],
                search: '',
                saveAsDefault: false,
                defaultQueue: null
              })}
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
                  <TableHead className="uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300">Type</TableHead>
                  <TableHead className="uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300">Title</TableHead>
                  <TableHead className="uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300">Client</TableHead>
                  <TableHead className="uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300">Site</TableHead>
                  <TableHead className="uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300">Status</TableHead>
                  <TableHead className="uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300">Priority</TableHead>
                  <TableHead className="uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300">Queue</TableHead>
                  <TableHead className="uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300">Site Status</TableHead>
                  <TableHead className="uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300">Current Step</TableHead>
                  <TableHead className="uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300">Due Date</TableHead>
                  <TableHead className="uppercase tracking-wider text-xs text-gray-600 dark:text-gray-300">Assigned To</TableHead>
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
                    <TableCell className="px-6 py-4 dark:text-gray-300">{job.client}</TableCell>
                    <TableCell className="px-6 py-4 dark:text-gray-300">
                      {(job as any).site_name || 'Unknown Site'}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge className={getStatusColor(job.status.name)}>
                        {job.status.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge className={getPriorityColor(job.priority)}>
                        {job.priority}
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
                      {job.due_date ? format(new Date(job.due_date), "MMM d, yyyy") : "No due date"}
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
    </div>
  )
} 