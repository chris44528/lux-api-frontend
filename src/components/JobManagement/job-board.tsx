"use client"

import { useState, useEffect } from "react"
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { JobColumn } from "./job-column"
import { JobCard } from "./job-card"
import { useToast } from "../../hooks/use-toast"
import { DashboardHeader } from "./dashboard-header"
import { JobFilter, type JobFilters } from "./job-filter"
import jobService, { Job, Technician, JobStatus, JobQueue } from "../../services/jobService"
import { BulkAssignModal, BulkDeleteModal } from "./bulk-actions"

export function JobBoard() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [activeJob, setActiveJob] = useState<Job | null>(null)
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [statuses, setStatuses] = useState<JobStatus[]>([])
  const [queues, setQueues] = useState<JobQueue[]>([])
  const [filters, setFilters] = useState<JobFilters>(() => {
    // Check if user has opted to use default filters
    const useDefaults = localStorage.getItem('useDefaultJobFilters')
    if (useDefaults === 'true') {
      const savedFilters = getSavedFilters()
      if (savedFilters) {
        return savedFilters
      }
    }
    return {
      status: [],
      priority: [],
      assignedTo: [],
      queue: [],
      search: '',
      defaultQueue: null,
      saveAsDefault: false
    }
  })
  
  const { toast } = useToast()
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set())
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Get saved filters from localStorage if available
  const getSavedFilters = (): JobFilters | null => {
    const saved = localStorage.getItem('jobFilters')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Error parsing saved filters', e)
        return null
      }
    }
    return null
  }

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  // Load all data from API
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchData = async () => {
      if (!isMounted) return;
      
      setLoading(true);

      try {
        // Mock data for development if API fails
        let jobsData: Job[] = [];
        let techniciansData: Technician[] = [];
        let statusesData: JobStatus[] = [];
        let queuesData: JobQueue[] = [];
        
        // Try to fetch real data first
        try {
          console.log('Fetching data from API...');
          const [jobsResponse, techniciansResponse, statusesResponse, queuesResponse] = await Promise.all([
            jobService.getJobs(),
            jobService.getTechnicians(),
            jobService.getJobStatuses(),
            jobService.getJobQueues()
          ]);

          if (!isMounted) return;

          console.log('API responses received:', {
            jobs: jobsResponse,
            technicians: techniciansResponse,
            statuses: statusesResponse,
            queues: queuesResponse
          });

          jobsData = jobsResponse.results || jobsResponse;
          techniciansData = techniciansResponse;
          statusesData = statusesResponse;
          queuesData = queuesResponse;
        } catch (error: unknown) {
          console.error('Error fetching data:', error);
          if (error && typeof error === 'object' && 'response' in error && 
              error.response && typeof error.response === 'object' && 
              'status' in error.response && error.response.status === 401) {
            // Handle unauthorized error
            if (isMounted) {
              toast({
                title: "Authentication Error",
                description: "Your session has expired. Please log in again.",
                type: "error"
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
              updated_at: "2023-03-15"
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
            { id: 1, name: 'pending', color: '#ef4444', site: 1, is_default: true },
            { id: 2, name: 'in-progress', color: '#f59e0b', site: 1, is_default: false },
            { id: 3, name: 'completed', color: '#10b981', site: 1, is_default: false }
          ];
          queuesData = [
            { id: 1, name: 'Electrical', description: 'Electrical queue', created_at: "2024-01-01", updated_at: "2024-01-01" },
            { id: 2, name: 'Roofing', description: 'Roofing queue', created_at: "2024-01-01", updated_at: "2024-01-01" },
            { id: 3, name: 'Biomass', description: 'Biomass queue', created_at: "2024-01-01", updated_at: "2024-01-01" },
            { id: 4, name: 'Legal', description: 'Legal queue', created_at: "2024-01-01", updated_at: "2024-01-01" }
          ];
        }
        
        if (isMounted) {
          setJobs(jobsData);
          setTechnicians(techniciansData);
          setStatuses(statusesData);
          setQueues(queuesData);
          
          // Show a toast if we're using mock data
          if (Array.isArray(jobsData) && jobsData.length > 0 && jobsData[0].id === 1) {
            toast({
              title: "Using mock data",
              description: "Could not connect to API. Using sample data instead.",
              type: "warning"
            });
          }
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
        if (isMounted) {
          toast({
            title: "Error",
            description: "Failed to load data. Please try again later.",
            type: "error"
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Cleanup function to prevent setting state on unmounted component
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []); // Empty dependency array - only run once on mount

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const job = jobs.find((j) => j.id === active.id);
    if (job) {
      setActiveJob(job);
    }
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const job = jobs.find((j) => j.id === active.id);
      const newStatus = statuses.find((s) => s.id === over.id);
      
      if (job && newStatus) {
        try {
          await jobService.updateJob(job.id, {
            status: { id: newStatus.id, name: newStatus.name, color: newStatus.color }
          });
          
          // Update local state
          setJobs((prevJobs) =>
            prevJobs.map((j) =>
              j.id === job.id
                ? { ...j, status: { id: newStatus.id, name: newStatus.name, color: newStatus.color } }
                : j
            )
          );
          
          toast({
            title: "Success",
            description: "Job status updated successfully.",
            type: "success"
          });
        } catch (error) {
          console.error('Error updating job status:', error);
          toast({
            title: "Error",
            description: "Failed to update job status. Please try again.",
            type: "error"
          });
        }
      }
    }
    
    setActiveJob(null);
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: JobFilters) => {
    setFilters(newFilters);
    
    // Save filters if user opted to use them as defaults
    if (newFilters.saveAsDefault) {
      localStorage.setItem('jobFilters', JSON.stringify(newFilters));
      localStorage.setItem('useDefaultJobFilters', 'true');
    }
  };

  // Handle job selection
  const handleSelectJob = (jobId: string, checked: boolean) => {
    setSelectedJobs((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(jobId);
      } else {
        newSet.delete(jobId);
      }
      return newSet;
    });
  };

  // Handle bulk assign
  const handleBulkAssign = async (technicianId: number | null) => {
    try {
      await jobService.bulkAssignJobs(Array.from(selectedJobs), technicianId);
      setSelectedJobs(new Set());
      setShowAssignModal(false);
      toast({
        title: "Success",
        description: "Jobs assigned successfully.",
        type: "success"
      });
    } catch (error) {
      console.error('Error assigning jobs:', error);
      toast({
        title: "Error",
        description: "Failed to assign jobs. Please try again.",
        type: "error"
      });
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      await jobService.bulkDeleteJobs(Array.from(selectedJobs));
      setSelectedJobs(new Set());
      setShowDeleteModal(false);
      toast({
        title: "Success",
        description: "Jobs deleted successfully.",
        type: "success"
      });
    } catch (error) {
      console.error('Error deleting jobs:', error);
      toast({
        title: "Error",
        description: "Failed to delete jobs. Please try again.",
        type: "error"
      });
    }
  };

  // Filter jobs based on current filters
  useEffect(() => {
    if (!jobs.length) return;

    let result = [...jobs];

    // Apply status filter
    if (filters.status.length > 0) {
      result = result.filter((job) => filters.status.includes(job.status.name));
    }

    // Apply priority filter
    if (filters.priority.length > 0) {
      result = result.filter((job) => filters.priority.includes(job.priority));
    }

    // Apply assigned to filter
    if (filters.assignedTo.length > 0) {
      result = result.filter((job) => {
        if (!job.assigned_to) return false;
        return filters.assignedTo.includes(job.assigned_to.id.toString());
      });
    }

    // Apply queue filter
    if (filters.queue.length > 0) {
      result = result.filter((job) => filters.queue.includes(job.queue.id.toString()));
    }

    setFilteredJobs(result);
  }, [jobs, filters]);

  return (
    <div className="h-full flex flex-col">
      <DashboardHeader />

      <div className="flex-1 p-4">
        <JobFilter
          filters={filters}
          onFiltersChange={handleFiltersChange}
          technicians={technicians}
          statuses={statuses}
          queues={queues}
          loading={loading}
        />

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
            {statuses.map((status) => {
              const statusJobs = filteredJobs.filter(
                (job) => job.status.id === status.id
              );

              return (
                <JobColumn
                  key={status.id}
                  id={status.id.toString()}
                  title={status.name}
                  count={statusJobs.length}
                  colorClass={status.color}
                >
                  <SortableContext
                    items={statusJobs.map((job) => job.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {statusJobs.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        technicians={technicians}
                        onSelect={handleSelectJob}
                        isSelected={selectedJobs.has(job.id.toString())}
                      />
                    ))}
                  </SortableContext>
                </JobColumn>
              );
            })}
          </div>

          <DragOverlay>
            {activeJob ? (
              <JobCard
                job={activeJob}
                technicians={technicians}
                overlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <BulkAssignModal
        isOpen={showAssignModal}
        onClose={() => {
          console.log('Technicians data:', technicians);
          setShowAssignModal(false);
        }}
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
    </div>
  );
}

