import api from "./api";

// Interface for paginated responses
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Types matching our backend models
export interface Job {
  id: number;
  title: string;
  description: string;
  site_id?: number; // Add direct site_id property
  site: number; // Now always a number (site ID)
  site_name?: string; // Site name is now a separate field
  site_fco?: string; // FCO field from the site
  client: string;
  address: string;
  priority: "low" | "medium" | "high";
  status: {
    id: number;
    name: string;
    color: string;
  };
  queue: {
    id: number;
    name: string;
    description: string;
  };
  type?: {
    id: number;
    name: string;
  };
  category?: {
    id: number;
    name: string;
  };
  tags?: {
    id: number;
    name: string;
  }[];
  due_date: string;
  completed_date?: string;
  estimated_duration?: number;
  assigned_to?: {
    id: number;
    user: {
      id: number;
      first_name: string;
      last_name: string;
      username: string;
    };
    avatar?: string;
    specialization?: string;
  };
  created_at: string;
  updated_at: string;
  last_status_change?: string;
  created_by?: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
  };
  last_updated_by?: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
  };
}

export interface JobTask {
  id: number;
  job: number;
  template: {
    id: number;
    name: string;
    description: string;
  };
  name: string;
  status:
    | "pending"
    | "in_progress"
    | "completed"
    | "blocked"
    | "skipped"
    | "cancelled";
  current_step: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  assigned_to?: {
    id: number;
    user: {
      id: number;
      first_name: string;
      last_name: string;
    };
  };
  task_order: number;
  completion_percentage: number;
  step_instances?: TaskStepInstance[]; // Array of step instances for this task
}

export interface TaskStepInstance {
  id: number;
  job_task: number;
  template_step: {
    id: number;
    name: string;
    description: string;
    action_type: string;
    is_conditional: boolean;
  };
  name: string;
  description: string;
  instructions: string;
  action_type: string;
  status: "pending" | "in_progress" | "completed" | "failed" | "skipped";
  step_order: number;
  next_step?: number;
  started_at?: string;
  completed_at?: string;
  fields: TaskStepField[];
  is_conditional?: boolean;
  success_record_type?: string;
  success_options?: {
    id: string;
    label: string;
    action: string;
    next_step?: number;
  }[];
  conditionalBranches?: {
    id: number;
    condition_name: string;
    target_step_order: number;
    description: string;
  }[];
}

export interface TaskStep {
  id: number;
  job_task: number;
  template_step: {
    id: number;
    name: string;
    description: string;
    action_type: string;
    is_conditional: boolean;
  };
  name: string;
  description: string;
  instructions: string;
  action_type: string;
  status: "pending" | "in_progress" | "completed" | "failed" | "skipped";
  step_order: number;
  next_step?: number;
  started_at?: string;
  completed_at?: string;
  fields: TaskStepField[];
  conditionalBranches?: {
    id: number;
    condition_name: string;
    target_step_order: number;
    description: string;
  }[];
}

export interface TaskStepField {
  id: number;
  name: string;
  label: string;
  field_type: string;
  options?: string[];
  placeholder?: string;
  help_text?: string;
  is_required: boolean;
  validation_regex?: string;
}

export interface StepFieldValue {
  id: number;
  step_instance: number;
  field: number;
  field_name: string;
  field_type: string;
  text_value?: string;
  number_value?: number;
  date_value?: string;
  time_value?: string;
  boolean_value?: boolean;
  file_value?: string;
}

export interface JobNote {
  id: number;
  job: number;
  content: string;
  created_at: string;
  created_by: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
  };
}

export interface JobAttachment {
  id: number;
  job: number;
  file: string;
  filename: string;
  file_type: string;
  uploaded_at: string;
  uploaded_by: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
  };
}

export interface JobLink {
  id: number;
  source_job: number;
  target_job: number;
  link_type: "parent_child" | "related" | "duplicate" | "sequential";
  sync_notes: boolean;
  sync_status: boolean;
  sync_assignments: boolean;
  sync_attachments: boolean;
  sync_completion: boolean;
  created_at: string;
  description?: string;
}

export interface Technician {
  id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
  };
  avatar?: string;
  phone_number?: string;
  specialization?: string;
  is_active: boolean;
  full_name?: string;
}

export interface TaskTemplate {
  id: number;
  name: string;
  description: string;
  job_type: {
    id: number;
    name: string;
  };
  queue?: {
    id: number;
    name: string;
  };
  is_active: boolean;
  display_order: number;
  steps: {
    id: number;
    name: string;
    description: string;
    step_order: number;
    sequence_number?: number; // Backend field name
    action_type: string;
    instructions?: string;
    is_required?: boolean;
    estimated_time_minutes?: number;
    is_conditional?: boolean;
    next_step?: number;
    success_record_type?: string;
    success_options?: {
      id: string;
      label: string;
      action: string;
      next_step?: number;
    }[];
  }[];
}

// Define filter types for better type safety
export interface JobFilters {
  site_id?: number;
  status?: string[];
  priority?: string[];
  queue?: string[];
  technician_id?: string | number;
  search?: string;
  assignedTo?: number[];
  page?: number;
  page_size?: number;
  site_fco?: string[]; // Add FCO filter support
}

export interface StepStatusData {
  status: string;
  notes?: string;
  completion_time?: string;
  [key: string]: unknown;
}

export interface FieldValues {
  [fieldId: string]: string | number | boolean | null;
}

export interface TaskTemplateFilters {
  site_id?: number;
  job_type_id?: number;
  is_active?: boolean;
}

export interface JobStatus {
  id: number;
  name: string;
  description?: string;
  color: string;
  site: number;
  is_default: boolean;
}

export interface JobQueue {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface JobType {
  id: number;
  name: string;
  queue?: number;
  estimated_duration_minutes?: number;
  created_at: string;
  updated_at: string;
}

export interface JobTag {
  id: number;
  name: string;
  queue?: number;
  created_at: string;
  updated_at: string;
}

export interface JobCategory {
  id: number;
  name: string;
  queue?: number;
  created_at: string;
  updated_at: string;
}

// Add a new interface for job creation that matches what the API expects
export interface JobCreate {
  title: string;
  description: string;
  site_id: number; // Changed from site to site_id
  client: string;
  address: string;
  priority: "low" | "medium" | "high";
  status_id: number; // Changed from status to status_id
  queue_id: number; // Changed from queue to queue_id
  type_id?: number | null; // Changed from type to type_id
  category_id?: number | null; // Changed from category to category_id
  due_date: string;
}

// Add a cache for jobs with no tasks
const jobsWithNoTasks = new Set<number>();

// API functions
const jobService = {
  // Jobs
  async getJobs(filters: JobFilters = {}): Promise<PaginatedResponse<Job>> {
    try {
      const params = new URLSearchParams();

      // Add search parameter if provided
      if (filters.search) {
        params.append("search", filters.search);
      }

      // Add other filter parameters
      if (filters.status?.length) {
        filters.status.forEach((status) => params.append("status", status));
      }
      if (filters.priority?.length) {
        filters.priority.forEach((priority) =>
          params.append("priority", priority)
        );
      }
      if (filters.assignedTo?.length) {
        filters.assignedTo.forEach((techId) =>
          params.append("assigned_to", techId.toString())
        );
      }
      if (filters.queue?.length) {
        filters.queue.forEach((queue) => params.append("queue", queue));
      }

      // Add site_id filter if provided
      if (filters.site_id) {
        params.append("site_id", filters.site_id.toString());
      }

      // Add FCO filter if provided
      if (filters.site_fco?.length) {
        filters.site_fco.forEach((fco) => params.append("site_fco", fco));
      }

      // Add pagination parameters
      if (filters.page) {
        params.append("page", filters.page.toString());
      }
      if (filters.page_size) {
        params.append("page_size", filters.page_size.toString());
      }

      const response = await api.get<PaginatedResponse<Job>>(
        `/jobs/?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Gets jobs for a specific site
   * @param siteId The ID of the site
   * @param excludeJobId Optional ID of job to exclude (typically the current job)
   * @param status Optional status to filter by
   * @returns Paginated response of jobs
   */
  async getJobsBySite(
    siteId: number,
    excludeJobId?: string | number,
    status?: string
  ): Promise<PaginatedResponse<Job>> {
    try {
      const params = new URLSearchParams();
      params.append("site_id", siteId.toString());

      if (excludeJobId) {
        params.append("exclude_job", excludeJobId.toString());
      }

      if (status) {
        params.append("status", status);
      }

      const response = await api.get<PaginatedResponse<Job>>(
        `/jobs/?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getJob(id: string | number): Promise<Job> {
    try {
      const response = await api.get(`/jobs/${id}/`);
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 401) {
          // Let the component handle the 401 error
          throw error;
        }
      }
      // For other errors, return null
      return null;
    }
  },

  async createJob(jobData: JobCreate): Promise<Job> {
    try {

      const response = await api.post(`/jobs/`, jobData);
      return response.data;
    } catch (error: unknown) {
      throw error;
    }
  },

  async updateJob(id: string | number, jobData: Partial<Job>): Promise<Job> {
    try {
      const response = await api.patch(`/jobs/${id}/`, jobData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async deleteJob(id: string | number): Promise<void> {
    try {
      await api.delete(`/jobs/${id}/`);
    } catch (error) {
      throw error;
    }
  },

  async bulkAssignJobs(
    jobIds: string[],
    technicianId: number | null
  ): Promise<void> {
    try {
      await api.post(`/jobs/bulk-assign/`, {
        job_ids: jobIds,
        technician_id: technicianId,
      });
    } catch (error) {
      throw error;
    }
  },

  async bulkDeleteJobs(jobIds: string[]): Promise<void> {
    try {
      await api.delete(`/jobs/bulk-delete/`, {
        data: {
          job_ids: jobIds,
        },
      });
    } catch (error) {
      throw error;
    }
  },

  async bulkUpdateJobs(
    jobIds: string[],
    updates: {
      assignedTo?: number | null;
      dueDate?: string | null;
      queue?: number | null;
      priority?: string | null;
      status?: number | null;
    }
  ): Promise<void> {
    try {
      // Prepare the update data
      const updateData: Record<string, any> = {
        job_ids: jobIds,
      };

      // Only include fields that have actual values (not null or undefined)
      if (updates.assignedTo !== undefined && updates.assignedTo !== null) {
        updateData.assigned_to = updates.assignedTo;
      }

      if (updates.dueDate !== undefined && updates.dueDate !== null) {
        updateData.due_date = updates.dueDate;
      }

      if (updates.queue !== undefined && updates.queue !== null) {
        updateData.queue_id = updates.queue;
      }

      if (updates.priority !== undefined && updates.priority !== null) {
        updateData.priority = updates.priority;
      }

      if (updates.status !== undefined && updates.status !== null) {
        updateData.status_id = updates.status;
      }

      await api.patch(`/jobs/bulk-update/`, updateData);
    } catch (error) {
      throw error;
    }
  },

  async fetchJobsByIds(jobIds: string[]): Promise<Job[]> {
    try {
      // Fetch jobs in batches to avoid URL length limits
      const BATCH_SIZE = 100;
      const allJobs: Job[] = [];
      
      for (let i = 0; i < jobIds.length; i += BATCH_SIZE) {
        const batch = jobIds.slice(i, i + BATCH_SIZE);
        const response = await api.get(`/jobs/`, {
          params: {
            ids: batch.join(','),
            page_size: BATCH_SIZE
          }
        });
        
        if (response.data && typeof response.data === 'object' && 'results' in response.data) {
          const paginatedResponse = response.data as PaginatedResponse<Job>;
          allJobs.push(...paginatedResponse.results);
        } else if (Array.isArray(response.data)) {
          allJobs.push(...response.data);
        }
      }
      
      return allJobs;
    } catch (error) {
      console.error('Error fetching jobs by IDs:', error);
      throw error;
    }
  },

  // Job Tasks
  async getJobTasks(jobId: number): Promise<JobTask[]> {
    // If we know this job has no tasks, return an empty array immediately
    if (jobsWithNoTasks.has(jobId)) {
      return [];
    }

    try {
      const response = await api.get(`/jobs/${jobId}/tasks/`);

      // Check if the response is paginated
      if (response.data && "results" in response.data) {
        const paginatedData = response.data as PaginatedResponse<JobTask>;
        return paginatedData.results;
      }

      return response.data;
    } catch (error: any) {
      // If it's a 404, the job simply doesn't have tasks yet, return empty array
      if (error?.response?.status === 404) {
        // Remember this job has no tasks to avoid future API calls
        jobsWithNoTasks.add(jobId);
        return [];
      }
      // For other errors, also return empty array for consistency
      return [];
    }
  },

  async getJobTask(taskId: string | number): Promise<JobTask> {
    try {
      const response = await api.get(`/job-tasks/${taskId}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Add function to clear the no-tasks cache for a job
  async clearJobTasksCache(jobId: number): Promise<void> {
    if (jobsWithNoTasks.has(jobId)) {
      jobsWithNoTasks.delete(jobId);
    }
  },

  async assignTaskTemplate(
    jobId: string | number,
    templateId: string | number
  ): Promise<JobTask> {
    try {
      // If this is a number ID, remove it from the no-tasks cache
      if (typeof jobId === "number") {
        jobsWithNoTasks.delete(jobId);
      } else {
        // Try to parse string as number and remove from cache
        const numId = parseInt(jobId, 10);
        if (!isNaN(numId)) {
          jobsWithNoTasks.delete(numId);
        }
      }

      const response = await api.post(`/jobs/${jobId}/assign-template/`, {
        template_id: templateId,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Task Steps
  async getTaskSteps(taskId: string | number): Promise<TaskStep[]> {
    try {
      const response = await api.get(`/tasks/${taskId}/steps/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async updateStepStatus(
    stepId: string | number,
    status: string,
    data?: StepStatusData
  ): Promise<TaskStep> {
    try {
      const response = await api.patch(`/steps/${stepId}/`, {
        status,
        ...data,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Step Field Values
  async submitStepFieldValues(
    stepId: string | number,
    values: FieldValues
  ): Promise<TaskStep> {
    try {
      const response = await api.post(
        `/steps/${stepId}/submit-values/`,
        values
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Job Notes
  async getJobNotes(jobId: string | number): Promise<JobNote[]> {
    try {
      const response = await api.get(`/jobs/${jobId}/notes/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Fetches notes that were created during step completion
   * @param jobId The ID of the job
   * @returns Array of step notes
   */
  async getJobStepNotes(jobId: string | number): Promise<any[]> {
    try {
      const response = await api.get(`/jobs/${jobId}/step-notes/`);
      return response.data;
    } catch (error) {
      return [];
    }
  },

  /**
   * Fetches all notes for a job's site (from any source)
   * @param jobId The ID of the job
   * @returns Array of all site notes
   */
  async getAllSiteNotes(jobId: string | number): Promise<any[]> {
    try {
      const response = await api.get(`/jobs/${jobId}/all-notes/`);
      return response.data;
    } catch (error) {
      return [];
    }
  },

  /**
   * Fetches notes associated with a site
   * @param siteId The ID of the site
   * @returns Array of site notes
   */
  async getSiteNotes(siteId: number): Promise<any[]> {
    try {
      const response = await api.get(`/sites/${siteId}/notes/`);
      return response.data;
    } catch (error) {
      return [];
    }
  },

  /**
   * Fetches notes from all historical jobs for a site
   * @param siteId The ID of the site
   * @param excludeJobId Optional job ID to exclude from results (current job)
   * @returns Array of notes from historical jobs
   */
  async getHistoricalJobNotes(
    siteId: number,
    excludeJobId?: string | number
  ): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      params.append("site_id", siteId.toString());
      if (excludeJobId) {
        params.append("exclude_job_id", excludeJobId.toString());
      }

      const response = await api.get(
        `/sites/${siteId}/historical-job-notes/?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      return [];
    }
  },

  async addJobNote(jobId: string | number, content: string): Promise<JobNote> {
    try {
      const response = await api.post(`/jobs/${jobId}/notes/`, { content });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Job Attachments
  async getJobAttachments(jobId: string | number): Promise<JobAttachment[]> {
    try {
      const response = await api.get(`/jobs/${jobId}/attachments/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async uploadJobAttachment(
    jobId: string | number,
    file: File
  ): Promise<JobAttachment> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("job", String(jobId));
      formData.append("filename", file.name);

      const response = await api.post(`/jobs/${jobId}/attachments/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Job Links
  async getJobLinks(jobId: string | number): Promise<{
    outgoing: JobLink[];
    incoming: JobLink[];
  }> {
    try {
      const response = await api.get(`/jobs/${jobId}/links/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async createJobLink(
    sourceJobId: string | number,
    targetJobId: string | number,
    data: Partial<JobLink>
  ): Promise<JobLink> {
    try {
      const response = await api.post(`/job-links/`, {
        source_job: sourceJobId,
        target_job: targetJobId,
        ...data,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async removeJobLink(linkId: string | number): Promise<void> {
    try {
      await api.delete(`/job-links/${linkId}/`);
    } catch (error) {
      throw error;
    }
  },

  // Templates
  async getTaskTemplates(
    filters?: TaskTemplateFilters
  ): Promise<TaskTemplate[]> {
    try {
      // Build query params
      const params = new URLSearchParams();
      if (filters?.site_id)
        params.append("site_id", filters.site_id.toString());
      if (filters?.job_type_id)
        params.append("job_type", filters.job_type_id.toString());
      if (filters?.is_active !== undefined)
        params.append("is_active", filters.is_active.toString());

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const response = await api.get(`/task-templates/${queryString}`);

      // Check if the response is paginated
      if (response.data && "results" in response.data) {
        const paginatedData = response.data as PaginatedResponse<TaskTemplate>;
        return paginatedData.results;
      }

      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 401) {
          // Let the component handle the 401 error
          throw error;
        }
      }
      // For other errors, return empty array
      return [];
    }
  },

  async getTaskTemplate(id: string | number): Promise<TaskTemplate> {
    try {
      const response = await api.get(`/task-templates/${id}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async createTaskTemplate(data: { name: string; queue: number | null; job_type: number | null }): Promise<TaskTemplate> {
    try {
      const response = await api.post('/task-templates/', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async deleteTaskTemplate(id: number): Promise<void> {
    try {
      await api.delete(`/task-templates/${id}/`);
    } catch (error) {
      throw error;
    }
  },

  // Technicians
  async getTechnicians(): Promise<Technician[]> {
    try {
      const response = await api.get("/technicians/");

      // Check if the response is paginated
      if (response.data && "results" in response.data) {
        const paginatedData = response.data as PaginatedResponse<Technician>;
        return paginatedData.results;
      }

      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 401) {
          // Let the component handle the 401 error
          throw error;
        }
      }
      // For other errors, return empty array
      return [];
    }
  },

  // Statuses and Queues
  async getJobStatuses(): Promise<JobStatus[]> {
    try {
      const response = await api.get(`/job-statuses/`);

      // Check if the response is paginated
      if (response.data && "results" in response.data) {
        const paginatedData = response.data as PaginatedResponse<JobStatus>;
        return paginatedData.results;
      }

      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 401) {
          // Let the component handle the 401 error
          throw error;
        }
      }
      // For other errors, return empty array
      return [];
    }
  },

  async getJobQueues(): Promise<JobQueue[]> {
    try {
      const response = await api.get(`/job-queues/`);

      // Check if the response is paginated
      if (response.data && "results" in response.data) {
        const paginatedData = response.data as PaginatedResponse<JobQueue>;
        return paginatedData.results;
      }

      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 401) {
          // Let the component handle the 401 error
          throw error;
        }
      }
      // For other errors, return empty array
      return [];
    }
  },

  async getJobTypes(): Promise<JobType[]> {
    try {
      const response = await api.get(`/job-types/`);

      // Check if the response is paginated
      if (response.data && "results" in response.data) {
        const paginatedData = response.data as PaginatedResponse<JobType>;
        return paginatedData.results;
      }

      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 401) {
          // Let the component handle the 401 error
          throw error;
        }
      }
      // For other errors, return empty array
      return [];
    }
  },

  async createJobType(data: {
    name: string;
    queue?: number | null;
    estimated_duration_minutes?: number;
  }): Promise<JobType> {
    try {
      const response = await api.post(`/job-types/`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async updateJobType(id: number, data: {
    name?: string;
    queue?: number | null;
    estimated_duration_minutes?: number;
  }): Promise<JobType> {
    try {
      const response = await api.patch(`/job-types/${id}/`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async deleteJobType(id: number): Promise<void> {
    try {
      await api.delete(`/job-types/${id}/`);
    } catch (error) {
      throw error;
    }
  },

  // Update the order of a task step
  async updateStepOrder(stepId: number, newOrder: number): Promise<any> {
    try {
      const response = await api.patch(`/task-steps/${stepId}/`, {
        step_order: newOrder,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getJobCategories(): Promise<JobCategory[]> {
    try {
      const response = await api.get(`/job-categories/`);

      // Check if the response is paginated
      if (response.data && "results" in response.data) {
        const paginatedData = response.data as PaginatedResponse<JobCategory>;
        return paginatedData.results;
      }

      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 401) {
          // Let the component handle the 401 error
          throw error;
        }
      }
      // For other errors, return empty array
      return [];
    }
  },

  async getJobTags(): Promise<JobTag[]> {
    try {
      const response = await api.get(`/job-tags/`);

      // Check if the response is paginated
      if (response.data && "results" in response.data) {
        const paginatedData = response.data as PaginatedResponse<JobTag>;
        return paginatedData.results;
      }

      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 401) {
          // Let the component handle the 401 error
          throw error;
        }
      }
      // For other errors, return empty array
      return [];
    }
  },

  // Add the completeTaskStep method to jobService

  /**
   * Completes a task step with the provided data
   * @param taskId The ID of the task
   * @param stepId The ID of the step to complete
   * @param data The completion data including notes and any conditional options
   * @returns The API response including potential next step information
   */
  async completeTaskStep(
    taskId: number,
    stepId: number,
    data: Record<string, unknown>
  ): Promise<any> {
    try {

      // The correct endpoint URL based on the REST API design
      const response = await api.post(
        `/job-tasks/${taskId}/steps/${stepId}/complete/`,
        data
      );

      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Add additional task-related methods for workflow functionality

  /**
   * Fetches details for a specific task
   * @param taskId The ID of the task
   * @returns Task object with steps
   */
  async getTaskDetails(taskId: number): Promise<any> {
    try {
      const response = await api.get(`/job-tasks/${taskId.toString()}/`);
      return response.data;
    } catch (error) {
      return null;
    }
  },

  /**
   * Fetches current active step for a task
   * @param taskId The ID of the task
   * @returns The active step object or null
   */
  async getActiveStep(taskId: number): Promise<any> {
    try {
      // According to the backend implementation, there might not be a dedicated endpoint
      // for active step. Let's get the task details and extract the current step.
      const taskDetails = await this.getTaskDetails(taskId);
      if (taskDetails && taskDetails.current_step) {
        return taskDetails.current_step;
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  /**
   * Updates the status of a task
   * @param taskId The ID of the task
   * @param status The new status
   * @returns Updated task object
   */
  async updateTaskStatus(taskId: number, status: string): Promise<any> {
    try {
      const response = await api.patch(`/tasks/${taskId}`, { status });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Job Queue Management
  async createJobQueue(data: { name: string; description: string }): Promise<JobQueue> {
    try {
      const response = await api.post(`/job-queues/`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async deleteJobQueue(id: number): Promise<void> {
    try {
      await api.delete(`/job-queues/${id}/`);
    } catch (error) {
      throw error;
    }
  },

  // Job Tag Management
  async createJobTag(data: { name: string; queue?: number | null }): Promise<JobTag> {
    try {
      const response = await api.post(`/job-tags/`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async deleteJobTag(id: number): Promise<void> {
    try {
      await api.delete(`/job-tags/${id}/`);
    } catch (error) {
      throw error;
    }
  },

  // Job Category Management
  async createJobCategory(data: { name: string; queue?: number | null }): Promise<JobCategory> {
    try {
      const response = await api.post(`/job-categories/`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async deleteJobCategory(id: number): Promise<void> {
    try {
      await api.delete(`/job-categories/${id}/`);
    } catch (error) {
      throw error;
    }
  },

  // Job Status Management
  async createJobStatus(data: { name: string; color: string; queue?: number | null }): Promise<JobStatus> {
    try {
      const response = await api.post(`/job-statuses/`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async deleteJobStatus(id: number): Promise<void> {
    try {
      await api.delete(`/job-statuses/${id}/`);
    } catch (error) {
      throw error;
    }
  },

  // Task Template Step Management
  async createTaskStep(templateId: number, data: any): Promise<any> {
    try {
      // Include the template ID in the request body as expected by the backend
      const stepData = {
        ...data,
        template: templateId
      };
      const response = await api.post(`/task-steps/`, stepData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async updateTaskStep(stepId: number, data: any): Promise<any> {
    try {
      const response = await api.patch(`/task-steps/${stepId}/`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Site details
  async getSite(siteId: number): Promise<any> {
    try {
      // Use the exact URL format from the example that works
      const url = `http://127.0.0.1:8000/api/v1/sites/${siteId}/`;

      // Use a direct fetch to avoid baseURL issues
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: `Token ${localStorage.getItem("access_token")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      throw error;
    }
  },
};

export default jobService;
