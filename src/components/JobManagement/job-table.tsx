"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../ui/button"
import { PlusCircle } from "lucide-react"
import { useToast } from "../../hooks/use-toast"
import { Badge } from "../ui/badge"
import { JobFilter, type JobFilters } from "./job-filter"
import jobService, { Job, Technician, JobStatus, JobQueue, JobTask, TaskStepInstance } from "../../services/jobService"

// Extended Job interface with current step info
interface ExtendedJob extends Job {
  currentStep?: string;
  tasks?: JobTask[];
}
import { BulkAssignModal, BulkDeleteModal, BulkUpdateModal } from "./bulk-actions"
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
import { ArrowUpDown } from "lucide-react"
// Removed ColumnDef import since @tanstack/react-table is not installed

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

export function JobTable() {
  const [jobs, setJobs] = useState<ExtendedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filteredJobs, setFilteredJobs] = useState<ExtendedJob[]>([])
  const [loadingSteps, setLoadingSteps] = useState(false)
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [statuses, setStatuses] = useState<JobStatus[]>([])
  const [queues, setQueues] = useState<JobQueue[]>([])
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<JobFilters>(getSavedFilters() || defaultFilters)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  const { toast } = useToast()
  const navigate = useNavigate()

  // Function to get the current step for each job
  const fetchJobsWithSteps = async (jobsList: Job[]) => {
    setLoadingSteps(true)
    
    try {
      // Create extended jobs with empty current step
      const extendedJobs: ExtendedJob[] = jobsList.map(job => ({
        ...job,
        currentStep: "Loading..."
      }))
      
      // Update the jobs state immediately with loading state
      setJobs(extendedJobs)
      
      // For each job, fetch its tasks and update state
      const jobsWithSteps = await Promise.all(
        extendedJobs.map(async (job) => {
          try {
            console.log(`Fetching tasks for job ID: ${job.id}`)
            // Get tasks for this job using the numeric ID
            const jobId = typeof job.id === 'string' ? parseInt(job.id) : job.id
            const tasks = await jobService.getJobTasks(jobId)
            console.log(`Received tasks for job ${job.id}:`, tasks)
            
            // Set default value
            let currentStepName = "No tasks assigned"
            
            if (tasks && tasks.length > 0) {
              // Log the first task for debugging
              console.log(`First task for job ${job.id}:`, tasks[0])
              
              // Find the active task or use the first one
              const activeTask = tasks.find(task => task.status === "in_progress") || tasks[0]
              console.log(`Active task for job ${job.id}:`, activeTask)
              
              // If task has step_instances, find the current or next step
              if (activeTask.step_instances && activeTask.step_instances.length > 0) {
                console.log(`Step instances available for job ${job.id}`)
                
                // First look for in_progress steps
                const inProgressStep = activeTask.step_instances.find(step => step.status === "in_progress")
                
                if (inProgressStep) {
                  console.log(`Found in-progress step: ${inProgressStep.name}`)
                  currentStepName = `In progress: ${inProgressStep.name}`
                } else {
                  // Then look for pending steps
                  const pendingSteps = activeTask.step_instances
                    .filter(step => step.status === "pending")
                    .sort((a, b) => a.step_order - b.step_order)
                  
                  if (pendingSteps.length > 0) {
                    console.log(`Found pending step: ${pendingSteps[0].name}`)
                    currentStepName = pendingSteps[0].name
                  } else {
                    // If no in_progress or pending steps, look for the latest completed step
                    const completedSteps = activeTask.step_instances
                      .filter(step => step.status === "completed")
                      .sort((a, b) => b.step_order - a.step_order) // Reverse order to get latest
                    
                    if (completedSteps.length > 0) {
                      console.log(`Found completed step: ${completedSteps[0].name}`)
                      currentStepName = `Completed: ${completedSteps[0].name}`
                    } else {
                      currentStepName = "No active steps"
                    }
                  }
                }
              } else {
                // No step_instances, try to get task details
                console.log(`No step instances, trying to get task details for task ${activeTask.id}`)
                try {
                  const taskDetails = await jobService.getTaskDetails(activeTask.id)
                  console.log(`Task details for task ${activeTask.id}:`, taskDetails)
                  
                  if (taskDetails && taskDetails.step_instances && taskDetails.step_instances.length > 0) {
                    const steps = taskDetails.step_instances
                    const activeStep = steps.find(step => step.status === "in_progress") || 
                                      steps.filter(step => step.status === "pending")
                                          .sort((a, b) => a.step_order - b.step_order)[0]
                                    
                    if (activeStep) {
                      console.log(`Found active step from task details: ${activeStep.name}`)
                      currentStepName = activeStep.name
                    }
                  } else if (taskDetails && taskDetails.current_step) {
                    console.log(`Found current step in task details: ${taskDetails.current_step.name}`)
                    currentStepName = taskDetails.current_step.name
                  }
                } catch (error) {
                  console.error(`Error fetching task details for task ${activeTask.id}:`, error)
                }
              }
            }
            
            console.log(`Final current step for job ${job.id}: "${currentStepName}"`)
            
            // Return updated job with current step
            return {
              ...job,
              currentStep: currentStepName,
              tasks
            }
          } catch (error) {
            console.error(`Error fetching tasks for job ${job.id}:`, error)
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
      console.error('Error fetching job steps:', error)
    } finally {
      setLoadingSteps(false)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      // Adapt filters to match service interface
      const serviceFilters: JobFilters = {
        status: filters.status,
        priority: filters.priority,
        queue: filters.queue,
        assignedTo: filters.assignedTo,
        search: filters.search || ''
      }
      
      const response = await jobService.getJobs(serviceFilters)
      let jobsList: Job[] = []
      
      if (response && typeof response === 'object' && 'results' in response) {
        const paginatedResponse = response as unknown as PaginatedResponse<Job>
        jobsList = paginatedResponse.results
        setTotalPages(Math.ceil(paginatedResponse.count / 10))
      } else if (Array.isArray(response)) {
        jobsList = response
        setTotalPages(1)
      }
      
      // First update with basic job data
      setJobs(jobsList as ExtendedJob[])
      
      // Then fetch current step data for each job
      fetchJobsWithSteps(jobsList)
      
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filters, page])

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
        let techniciansData: Technician[] = [];
        let statusesData: JobStatus[] = [];
        let queuesData: JobQueue[] = [];
        
        // Try to fetch real data first
        try {
          const [jobsResponse, techniciansResponse, statusesResponse, queuesResponse] = await Promise.all([
            jobService.getJobs(),
            jobService.getTechnicians(),
            jobService.getJobStatuses(),
            jobService.getJobQueues()
          ]);

          if (!isMounted) return;

          jobsData = jobsResponse.results || jobsResponse;
          techniciansData = techniciansResponse;
          statusesData = statusesResponse;
          queuesData = queuesResponse;
        } catch (err) {
          console.error('Error fetching data:', err);
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
          // Use mock data if API fails
          jobsData = [
            {
              id: 1,
              title: "Plumbing Repair",
              description: "Fix leaking pipe in kitchen",
              site: { site_id: 1, site_name: "Test Site", postcode: "12345" },
              client: "John Smith",
              address: "123 Main St, Anytown",
              priority: "high",
              status: { id: 1, name: "pending", color: "#ef4444" },
              queue: { id: 1, name: "Electrical", description: "Electrical queue" },
              due_date: "2025-04-01",
              created_at: "2023-03-15",
              updated_at: "2023-03-15",
              estimated_duration: 2
            }
          ];
          techniciansData = [
            { 
              id: 1, 
              user: { id: 1, first_name: "Alex", last_name: "Johnson", username: "alex.johnson" },
              full_name: "Alex Johnson",
              is_active: true
            },
            { 
              id: 2, 
              user: { id: 2, first_name: "Sam", last_name: "Williams", username: "sam.williams" },
              full_name: "Sam Williams",
              is_active: true
            },
            { 
              id: 3, 
              user: { id: 3, first_name: "Taylor", last_name: "Smith", username: "taylor.smith" },
              full_name: "Taylor Smith",
              is_active: true
            }
          ];
          statusesData = [
            { id: 1, name: 'pending', color: '#ef4444', site: 1, is_default: false },
            { id: 2, name: 'in-progress', color: '#f59e0b', site: 1, is_default: false },
            { id: 3, name: 'completed', color: '#10b981', site: 1, is_default: true }
          ];
          queuesData = [
            { id: 1, name: 'Electrical', description: 'Electrical queue', created_at: '2024-01-01', updated_at: '2024-01-01' },
            { id: 2, name: 'Roofing', description: 'Roofing queue', created_at: '2024-01-01', updated_at: '2024-01-01' },
            { id: 3, name: 'Biomass', description: 'Biomass queue', created_at: '2024-01-01', updated_at: '2024-01-01' },
            { id: 4, name: 'Legal', description: 'Legal queue', created_at: '2024-01-01', updated_at: '2024-01-01' }
          ];
        }
        
        if (isMounted) {
          setJobs(jobsData);
          setTechnicians(techniciansData);
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
        console.error('Error in fetchData:', error);
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
  }, [jobs, filters]);
  
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
        default:
          toast({
            title: "Unknown action",
            description: "The selected action is not supported.",
          })
      }
    } catch (error) {
      console.error('Error performing bulk action:', error)
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
      console.error('Error bulk assigning jobs:', error)
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
      console.error('Error bulk deleting jobs:', error)
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
      console.error('Error bulk updating jobs:', error)
      throw error
    }
  }

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800 hover:bg-red-100"
      case "medium":
        return "bg-amber-100 text-amber-800 hover:bg-amber-100"
      case "low":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "in-progress":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const columns: any[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "client",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Client
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "site",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Site Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const site = row.original.site
        return site ? site.name : "N/A"
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <Badge className={getStatusColor(status.name)}>
            {status.name}
          </Badge>
        )
      },
    },
    {
      accessorKey: "priority",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Priority
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const priority = row.original.priority
        return (
          <Badge className={getPriorityColor(priority)}>
            {priority}
          </Badge>
        )
      },
    },
    {
      accessorKey: "queue",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Queue
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const queue = row.original.queue
        return queue ? queue.name : "N/A"
      },
    },
    {
      accessorKey: "due_date",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Due Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const dueDate = row.original.due_date
        return dueDate ? format(new Date(dueDate), "MMM d, yyyy") : "No due date"
      },
    },
    {
      accessorKey: "assigned_to",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Assigned To
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const assignedTo = row.original.assigned_to
        return assignedTo ? assignedTo.user.first_name + " " + assignedTo.user.last_name : "Unassigned"
      },
    },
  ]

  return (
    <div className="flex flex-col h-full min-h-screen">
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Job Management</h1>
            <p className="text-muted-foreground">
              Manage and track all jobs in the system
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
          technicians={technicians}
          statuses={statuses}
          queues={queues}
          loading={loading}
        />

        {selectedJobs.size > 0 && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">
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
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : filteredJobs.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-4">No jobs match the current filters</p>
            <Button 
              variant="outline" 
              onClick={() => setFilters({
                status: [],
                priority: [],
                assignedTo: [],
                queue: [],
                search: '',
                saveAsDefault: false
              })}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border shadow-lg overflow-hidden bg-white/80">
            <Table className="min-w-full divide-y divide-gray-200">
              <TableHeader className="bg-gray-100">
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedJobs.size === filteredJobs.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="uppercase tracking-wider text-xs text-gray-600">Title</TableHead>
                  <TableHead className="uppercase tracking-wider text-xs text-gray-600">Client</TableHead>
                  <TableHead className="uppercase tracking-wider text-xs text-gray-600">Site</TableHead>
                  <TableHead className="uppercase tracking-wider text-xs text-gray-600">Status</TableHead>
                  <TableHead className="uppercase tracking-wider text-xs text-gray-600">Priority</TableHead>
                  <TableHead className="uppercase tracking-wider text-xs text-gray-600">Queue</TableHead>
                  <TableHead className="uppercase tracking-wider text-xs text-gray-600">Current Step</TableHead>
                  <TableHead className="uppercase tracking-wider text-xs text-gray-600">Due Date</TableHead>
                  <TableHead className="uppercase tracking-wider text-xs text-gray-600">Assigned To</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white divide-y divide-gray-100">
                {filteredJobs.map((job, idx) => (
                  <TableRow
                    key={job.id}
                    className={`transition-colors cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    <TableCell className="px-6 py-4">
                      <Checkbox
                        checked={selectedJobs.has(job.id.toString())}
                        onCheckedChange={(checked) => handleSelectJob(job.id.toString(), checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="px-6 py-4 font-medium text-gray-900">{job.title}</TableCell>
                    <TableCell className="px-6 py-4">{job.client}</TableCell>
                    <TableCell className="px-6 py-4">
                      {typeof job.site === 'object' && job.site ? 
                        (job.site.site_name || job.site.name || 'Unknown Site') : 
                        typeof job.site === 'number' ? 
                          `Site ID: ${job.site}` : 
                          job.site_id ? `Site ID: ${job.site_id}` : 'Unknown Site'}
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
                    <TableCell className="px-6 py-4">{job.queue.name}</TableCell>
                    <TableCell className="px-6 py-4">
                      {job.currentStep ? (
                        <span className={job.currentStep === "Loading..." ? "text-gray-400 italic" : ""}>
                          {job.currentStep}
                        </span>
                      ) : "No tasks assigned"}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      {job.due_date ? format(new Date(job.due_date), "MMM d, yyyy") : "No due date"}
                    </TableCell>
                    <TableCell className="px-6 py-4">
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
        technicians={technicians}
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
        technicians={technicians}
        queues={queues}
        statuses={statuses}
      />
    </div>
  )
} 