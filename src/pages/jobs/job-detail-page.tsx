"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import Progress from "../../components/ui/progress";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  CheckCircle,
  Circle,
  ExternalLink,
  MoreVertical,
  Send,
  History,
  FlaskConical,
} from "lucide-react";
import {
  CompleteStepModal,
  TaskStep,
} from "../../components/JobManagement/CompleteStepModal";
import { ViewAllNotesModal } from "../../components/JobManagement/ViewAllNotesModal";
import { AssignTemplateModal } from "../../components/JobManagement/assign-template-modal";
import { PostcardHistoryModal } from "../../components/JobManagement/PostcardHistoryModal";
import jobService, { Job as APIJob } from "../../services/jobService";
import siteComparisonService, {
  SiteComparisonData,
} from "../../services/siteComparisonService";
import { api, getSiteReadings, getSiteDetail, startMeterTest, pollMeterTestStatus } from "../../services/api";
import { Badge } from "../../components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { useUIPermission } from "../../hooks/useUIPermission";
import EmailTemplateModal from "../../components/EmailTemplateModal";

// Define types for our job data
interface JobNote {
  id: string;
  text: string;
  date: string;
  author: string;
  type?: "job" | "step" | "site" | "customer" | "system" | "task";
  stepName?: string;
  source?: string;
  source_type?: string;
}


// Import JobTask from service instead of redefining it
import type { JobTask as ServiceJobTask, TaskStepInstance as ServiceTaskStepInstance } from "../../services/jobService";

// Use the service types
type JobTask = ServiceJobTask;
type TaskStepInstance = ServiceTaskStepInstance;

// Add a new interface for the last completed job
interface LastCompletedJob {
  id: number;
  title: string;
  completed_date: string;
}

// We'll use this interface for our component state
interface Job {
  id: string;
  title: string;
  client: string;
  address: string;
  priority: "high" | "medium" | "low";
  status: string;
  statusColor?: string;
  dueDate: string;
  assignedTo: string | null;
  assignedToName?: string;
  phone: string;
  email: string;
  description: string;
  notes: JobNote[];
  jobType: string;
  jobCategory: string;
  preferredAppointmentDate: string;
  actualAppointmentDate: string;
  tags: string[];
  queue: string;
  // Solar specific fields
  systemSize?: string;
  panelCount?: string;
  installDate?: string;
  lastMaintenance?: string;
  nextStep?: string;
  created_at?: string;
  currentProduction?: string;
  efficiency?: string;
  detectedIssues?: string[];
  postcode?: string;
  site_name?: string;
  // Add site_id as a direct property
  site_id?: number;
  // Site can be a direct number ID or an object
  site?:
    | number
    | {
        id?: number;
        site_id?: number;
        name?: string;
        site_name?: string;
        postcode?: string;
      };
  lastCompletedJob?: LastCompletedJob;
}

// Update the StepNoteResponse interface to include source and source_type
interface StepNoteResponse {
  id: number | string;
  content?: string;
  notes?: string;
  text?: string;
  created_at?: string;
  createdAt?: string;
  date?: string;
  note_date?: string;
  created_by?: {
    id?: number;
    first_name?: string;
    last_name?: string;
    username?: string;
  };
  note_author?: string;
  step_name?: string;
  stepName?: string;
  source?: string;
  source_type?: string;
  [key: string]: unknown; // Allow for additional unknown properties with more specific type
}

// Helper function to ensure note type is valid
const getSafeNoteType = (
  type: string | undefined
): "job" | "step" | "site" | "customer" | "system" | "task" => {
  const validTypes = ["job", "step", "site", "customer", "system", "task"];
  return validTypes.includes(type || "")
    ? (type as "job" | "step" | "site" | "customer" | "system" | "task")
    : "job";
};

export default function JobDetailsPage() {
  const params = useParams();
  const navigate = useNavigate();
  const jobId = params.id as string;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<JobTask[]>([]);
  const [lastCompletedJob, setLastCompletedJob] =
    useState<LastCompletedJob | null>(null);
  const [nextPendingStep, setNextPendingStep] =
    useState<string>("No pending steps");
  const [siteComparison, setSiteComparison] =
    useState<SiteComparisonData | null>(null);
  const [loadingComparison, setLoadingComparison] = useState(false);

  // Add state for the ViewAllNotesModal
  const [isViewAllNotesModalOpen, setIsViewAllNotesModalOpen] = useState(false);
  
  // Add state for status change
  const [statuses, setStatuses] = useState<any[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  // Add state for meter readings and tests
  const [siteReadings, setSiteReadings] = useState<any[]>([]);
  const [meterTests, setMeterTests] = useState<any[]>([]);
  const [loadingReadings, setLoadingReadings] = useState(false);
  const [loadingTests, setLoadingTests] = useState(false);
  const [readingsDisplayCount, setReadingsDisplayCount] = useState(30);
  
  // Add state for active tab
  const [activeTab, setActiveTab] = useState<string>('performance');
  
  // Add state for email modal
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  
  // Add state for postcard management
  const [showPostcardMenu, setShowPostcardMenu] = useState(false);
  const [postcardRequests, setPostcardRequests] = useState<any[]>([]);
  const [showPostcardHistory, setShowPostcardHistory] = useState(false);
  const [loadingPostcards, setLoadingPostcards] = useState(false);
  
  // Check UI permissions
  const canChangeStatus = useUIPermission('jobs.status.change');
  
  // Add state for meter test
  const [meterTestLoading, setMeterTestLoading] = useState(false);
  const [meterTestStatus, setMeterTestStatus] = useState('');
  const [meterTestResult, setMeterTestResult] = useState<Record<string, unknown> | null>(null);
  const [meterTestError, setMeterTestError] = useState('');
  const [showMeterTestResult, setShowMeterTestResult] = useState(false);
  
  // Close postcard menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showPostcardMenu) {
        setShowPostcardMenu(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showPostcardMenu]);

  // Add state for the step completion modal
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  
  // Add state for the assign template modal
  const [assignTemplateModalOpen, setAssignTemplateModalOpen] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState<TaskStep | null>(null);
  const [taskSteps, setTaskSteps] = useState<TaskStepInstance[]>([]);
  const [taskProgress, setTaskProgress] = useState(0);

  // Add a function to handle showing/hiding all steps
  const [showAllSteps, setShowAllSteps] = useState(false);
  const toggleShowAllSteps = () => {
    setShowAllSteps(!showAllSteps);
  };

  // Add a function to prioritize and limit steps for display
  const getPrioritizedSteps = (
    steps: TaskStepInstance[],
    showAll: boolean
  ): TaskStepInstance[] => {
    if (!steps || steps.length === 0) return [];

    // Clone the array to avoid modifying the original
    const sortedSteps = [...steps];

    // First sort by step_order (increasing)
    sortedSteps.sort((a, b) => a.step_order - b.step_order);

    // If showing all steps, return them all sorted by step_order
    if (showAll) return sortedSteps;

    // Otherwise, prioritize pending steps
    const pendingSteps = sortedSteps.filter(
      (step) => step.status === "pending" || step.status === "in_progress"
    );

    const otherSteps = sortedSteps.filter(
      (step) => step.status !== "pending" && step.status !== "in_progress"
    );

    // Combine with pending steps first, then others, limited to 4 items
    const result = [...pendingSteps, ...otherSteps];
    return result.slice(0, 4);
  };

  // Function to fetch job tasks
  const fetchJobTasks = async (jobId: string): Promise<JobTask[]> => {
    try {
      // Get all tasks for this job
      const tasks = await jobService.getJobTasks(parseInt(jobId, 10));
      setTasks(tasks);

      if (tasks && tasks.length > 0) {
        // Set the first task as active if none is selected
        const firstInProgressTask = tasks.find(
          (task: JobTask) => task.status === "in_progress"
        );
        const taskToUse = firstInProgressTask || tasks[0];

        // Set the overall progress
        setTaskProgress(taskToUse.completion_percentage || 0);

        // Check if step instances are included in the response
        if (taskToUse.step_instances && taskToUse.step_instances.length > 0) {
          setTaskSteps(taskToUse.step_instances);

          // Find next pending step
          const nextStep = taskToUse.step_instances
            .filter((step: TaskStepInstance) => step.status === "pending")
            .sort(
              (a: TaskStepInstance, b: TaskStepInstance) =>
                a.step_order - b.step_order
            )[0];

          if (nextStep) {
            setNextPendingStep(nextStep.name);
          } else {
            setNextPendingStep("No pending steps");
          }
        } else {
          // If no step instances in the response, try to fetch them separately
          try {
            const taskDetails = await jobService.getTaskDetails(taskToUse.id);

            if (taskDetails && taskDetails.step_instances) {
              setTaskSteps(taskDetails.step_instances);

              // Find next pending step
              const nextStep = taskDetails.step_instances
                .filter((step: TaskStepInstance) => step.status === "pending")
                .sort(
                  (a: TaskStepInstance, b: TaskStepInstance) =>
                    a.step_order - b.step_order
                )[0];

              if (nextStep) {
                setNextPendingStep(nextStep.name);
              } else {
                setNextPendingStep("No pending steps");
              }
            } else {
              setTaskSteps([]);
              setNextPendingStep("No steps defined");
            }
          } catch (error) {
            setTaskSteps([]);
            setNextPendingStep("Error fetching steps");
          }
        }

        // Get the current step - current_step is a number (ID) in the API
        if (taskToUse.current_step && taskToUse.step_instances) {
          // Find the step instance that matches the current_step ID
          const currentStepInstance = taskToUse.step_instances.find(
            step => step.id === taskToUse.current_step
          );
          
          if (currentStepInstance) {
            // Convert to TaskStep format for the modal
            const mockStep: TaskStep = {
              id: currentStepInstance.id,
              name: currentStepInstance.name,
              description: currentStepInstance.description,
              status: currentStepInstance.status,
              is_conditional: currentStepInstance.is_conditional || false,
              step_order: currentStepInstance.step_order,
              success_record_type: currentStepInstance.success_record_type || "text",
              success_options: currentStepInstance.success_options || [],
            };
            setCurrentStep(mockStep);
            setCurrentTaskId(taskToUse.id);
          }
        } 
        
        // If we don't have a current step set, try to find the first pending or in-progress step
        if (!currentStep && taskToUse.step_instances && taskToUse.step_instances.length > 0) {
          const firstActionableStep = taskToUse.step_instances.find(
            step => step.status === "pending" || step.status === "in_progress"
          );
          
          if (firstActionableStep) {
            const mockStep: TaskStep = {
              id: firstActionableStep.id,
              name: firstActionableStep.name,
              description: firstActionableStep.description,
              status: firstActionableStep.status,
              is_conditional: firstActionableStep.is_conditional || false,
              step_order: firstActionableStep.step_order,
              success_record_type: firstActionableStep.success_record_type || "text",
              success_options: firstActionableStep.success_options || [],
            };
            setCurrentStep(mockStep);
            setCurrentTaskId(taskToUse.id);
          } else {
            // If no pending/in-progress steps, try the API
            try {
              const activeStep = await jobService.getActiveStep(taskToUse.id);
              if (activeStep) {
                setCurrentStep(activeStep);
                setCurrentTaskId(taskToUse.id);
              }
            } catch (error) {
              console.error("Failed to get active step:", error);
            }
          }
        }
      } else {
        setTaskSteps([]);
        setTaskProgress(0);
        setNextPendingStep("No tasks assigned");
      }

      return tasks;
    } catch (error) {
      setTaskSteps([]);
      setTaskProgress(0);
      setNextPendingStep("Error fetching tasks");
      return [];
    }
  };

  // Function to convert API job to our component format
  const convertApiJobToComponentFormat = (apiJob: APIJob): Job => {
    // Map the API job format to our component's job format

    // Extract the site_id - can be either apiJob.site_id, or apiJob.site if site is a number
    let siteId: number | undefined;

    if (typeof apiJob.site === "number") {
      // If site is a direct number, use it as the site_id
      siteId = apiJob.site;
    } else if (apiJob.site_id) {
      // If site_id exists directly, use it
      siteId = apiJob.site_id;
    } else if (
      apiJob.site &&
      typeof apiJob.site === "object" &&
      "site_id" in apiJob.site &&
      (apiJob.site as any).site_id
    ) {
      // If site is an object with site_id, use that
      siteId = (apiJob.site as any).site_id;
    }


    return {
      id: apiJob.id.toString(),
      title: apiJob.title,
      client: apiJob.client,
      address: apiJob.address,
      priority: apiJob.priority as "high" | "medium" | "low",
      status: apiJob.status.name,
      statusColor: apiJob.status.color,
      dueDate: apiJob.due_date,
      assignedTo: apiJob.assigned_to
        ? apiJob.assigned_to.user.id.toString()
        : null,
      assignedToName: apiJob.assigned_to
        ? `${apiJob.assigned_to.user.first_name} ${apiJob.assigned_to.user.last_name}`
        : undefined,
      phone: "Loading...", // Will be populated from site-detail API
      email: "Loading...", // Will be populated from site-detail API
      description: apiJob.description,
      notes: [], // Will be populated separately
      jobType: apiJob.type?.name || "Unknown",
      jobCategory: apiJob.category?.name || "Unknown",
      preferredAppointmentDate: "", // These might not be in API
      actualAppointmentDate: "",
      tags: apiJob.tags ? apiJob.tags.map((tag) => tag.name) : [],
      queue: apiJob.queue.name,

      // We need to use a separate API call to get additional site details
      // For now, show temporary values and we'll update the site-specific API
      systemSize: "Loading...", // Will need a site details API
      panelCount: "Loading...", // Will need a site details API
      installDate: "Loading...", // Will need a site details API
      lastMaintenance: "",
      // Don't set a default for nextStep - it will come from the task data
      currentProduction: "24.3 kWh",
      efficiency: "92%",
      detectedIssues: [
        "Panel Degradation - Two panels showing reduced efficiency, likely due to dust accumulation or partial shading.",
      ],

      // Store site_id as a direct property
      site_id: siteId,

      // Keep site property for backward compatibility
      site: apiJob.site,
      
      // Add created_at for job opened date
      created_at: apiJob.created_at,
    };
  };

  // Add function to fetch site details and update job info
  const fetchSiteDetails = async (siteId: number) => {
    try {
      // Use site-detail endpoint to get complete site, customer, and meter data
      const response = await api.get(`/site-detail/${siteId}/?page=1&sort_order=desc`);
      const data = response.data;

      // Update job with site and customer details
      setJob((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          // Site details
          systemSize: data.site?.panel_size || data.site?.panel_type || "Unknown",
          panelCount: data.site?.fco || "Unknown",
          installDate: data.site?.install_date
            ? new Date(data.site.install_date).toLocaleDateString()
            : "Unknown",
          postcode: data.site?.postcode || "Unknown",
          site_name: data.site?.site_name || "Unknown",
          
          // Customer details - replace dummy data with real customer info
          phone: data.customer?.phone || data.customer?.mobile || "+1 (555) 123-4567",
          email: data.customer?.email || "customer@example.com",
          client: data.customer?.owner || prev.client,
          address: data.customer?.owner_address || data.site?.address || prev.address,
        };
      });
    } catch (error) {
      console.error("Failed to fetch site details:", error);
      // Set fallback values if API fails
      setJob((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          systemSize: "Data unavailable",
          panelCount: "Data unavailable",
          installDate: "Data unavailable",
          postcode: "Data unavailable",
          site_name: "Data unavailable",
        };
      });
    }
  };

  // Function to fetch job notes
  const fetchJobNotes = async (jobId: string) => {
    try {

      // Fetch all site notes with a single API call
      const allNotes = await jobService.getAllSiteNotes(jobId);

      // Convert API notes to component format
      const formattedNotes = allNotes.map((note: StepNoteResponse) => {
        const content = note.content || note.notes || note.text || "No content";
        const createdAt =
          note.created_at ||
          note.createdAt ||
          note.date ||
          note.note_date ||
          new Date().toISOString();

        // Handle potentially missing created_by information
        let author = "System";
        if (note.created_by) {
          const firstName = note.created_by.first_name || "";
          const lastName = note.created_by.last_name || "";
          author =
            `${firstName} ${lastName}`.trim() ||
            note.created_by.username ||
            "Unknown";
        } else if (note.note_author) {
          author = note.note_author;
        }

        // Determine note type
        const noteType = note.source || "job";
        const safeType = getSafeNoteType(noteType);

        return {
          id: `${noteType}-${
            note.id?.toString() || Math.random().toString(36).substring(7)
          }`,
          text: content,
          date: new Date(createdAt).toLocaleDateString(),
          author: author,
          type: safeType,
          stepName: note.step_name || note.stepName,
          source: note.source || undefined,
          source_type: note.source_type || undefined,
        };
      });

      // Sort by date (newest first)
      formattedNotes.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      return formattedNotes;
    } catch (error) {
      return [];
    }
  };

  // Add a function to fetch the last completed job for a site
  const fetchLastCompletedJob = async (
    siteId: number,
    currentJobId: string
  ) => {
    try {

      // Use the jobService method instead of direct fetch
      const response = await jobService.getJobsBySite(
        siteId,
        currentJobId,
        "completed"
      );

      // Sort by completed_date in descending order to get the most recent
      if (response.results && response.results.length > 0) {
        const sortedJobs = [...response.results].sort((a, b) => {
          return (
            new Date(b.completed_date || b.updated_at).getTime() -
            new Date(a.completed_date || a.updated_at).getTime()
          );
        });

        setLastCompletedJob({
          id: sortedJobs[0].id,
          title: sortedJobs[0].title,
          completed_date: new Date(
            sortedJobs[0].completed_date || sortedJobs[0].updated_at
          ).toLocaleDateString(),
        });
      } else {
        setLastCompletedJob(null);
      }
    } catch (error) {
      setLastCompletedJob(null);
    }
  };

  // Fetch job details from API
  const fetchJobDetails = async () => {
    if (!jobId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch job data from API
      const apiJob = await jobService.getJob(jobId);

      if (!apiJob) {
        setError("Job not found");
        setLoading(false);
        return;
      }

      // Log the entire API job to inspect its structure

      // Convert API job to our component format
      const formattedJob = convertApiJobToComponentFormat(apiJob);

      // Fetch notes for this job
      const notes = await fetchJobNotes(jobId);
      formattedJob.notes = notes;

      setJob(formattedJob);

      // Fetch tasks for this job
      await fetchJobTasks(jobId);

      // If we have a site_id, fetch site details explicitly
      let siteIdToUse: number | undefined;
      if (formattedJob.site_id) {
        siteIdToUse = formattedJob.site_id;
        fetchSiteDetails(formattedJob.site_id);
        fetchLastCompletedJob(formattedJob.site_id, jobId);
      } else if (typeof apiJob.site === "number") {
        siteIdToUse = apiJob.site;
        fetchSiteDetails(apiJob.site);
        fetchLastCompletedJob(apiJob.site, jobId);
      }

      // Load site comparison data if we have a site ID
      if (siteIdToUse) {
        setLoadingComparison(true);
        try {
          const comparisonData = await siteComparisonService.getSiteComparison(
            siteIdToUse
          );
          setSiteComparison(comparisonData);
        } catch (error) {
        } finally {
          setLoadingComparison(false);
        }
      }
    } catch (error) {
      setError("Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  // Load the job details
  useEffect(() => {
    fetchJobDetails();
    fetchStatuses();
  }, [jobId]);
  
  // Load postcard requests when job is loaded
  useEffect(() => {
    if (job) {
      fetchPostcardRequests();
    }
  }, [job?.id]);
  
  // Fetch job statuses
  const fetchStatuses = async () => {
    try {
      const statusesData = await jobService.getJobStatuses();
      setStatuses(statusesData);
    } catch (error) {
      console.error('Failed to fetch statuses:', error);
    }
  };
  
  // Fetch meter readings and tests when job is loaded
  useEffect(() => {
    if (job && job.site_id) {
      fetchSiteReadingsAndTests();
    }
  }, [job]);
  
  const fetchSiteReadingsAndTests = async () => {
    if (!job || !job.site_id) return;
    
    // Fetch meter readings
    setLoadingReadings(true);
    try {
      const readingsData = await getSiteReadings(job.site_id.toString());
      setSiteReadings(readingsData.readings || []);
    } catch (error) {
      console.error('Failed to fetch site readings:', error);
    } finally {
      setLoadingReadings(false);
    }
    
    // Fetch meter tests
    setLoadingTests(true);
    try {
      const siteData = await getSiteDetail(job.site_id.toString());
      setMeterTests(siteData.meter_tests || []);
    } catch (error) {
      console.error('Failed to fetch meter tests:', error);
    } finally {
      setLoadingTests(false);
    }
  };
  
  // Handle status change
  const handleStatusChange = async (statusId: string) => {
    if (!job || updatingStatus) return;
    
    setUpdatingStatus(true);
    try {
      // The backend expects just the status ID for updates
      const updateData: any = {
        status: parseInt(statusId)
      };
      await jobService.updateJob(parseInt(job.id), updateData);
      
      // Update local state
      const newStatus = statuses.find(s => s.id.toString() === statusId);
      if (newStatus) {
        setJob({
          ...job,
          status: newStatus.name,
          statusColor: newStatus.color
        });
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Function to fetch postcard requests for the job
  const fetchPostcardRequests = async () => {
    if (!job) return;
    
    setLoadingPostcards(true);
    try {
      const response = await api.get('/postcards/job_postcards/', {
        params: { job_id: job.id }
      });
      setPostcardRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch postcard requests:', error);
    } finally {
      setLoadingPostcards(false);
    }
  };
  
  // Function to handle sending a postcard
  const handleSendPostcard = async (postcardNumber: number) => {
    if (!job) return;
    
    setShowPostcardMenu(false);
    
    try {
      const response = await api.post('/postcards/request_postcard/', {
        job_id: job.id,
        postcard_number: postcardNumber
      });
      
      // Refresh postcard requests
      await fetchPostcardRequests();
      
      // Show success message (you might want to add a toast notification here)
      alert(`Postcard ${postcardNumber} requested successfully`);
    } catch (error: any) {
      console.error('Failed to request postcard:', error);
      alert(error.response?.data?.error || 'Failed to request postcard');
    }
  };
  
  // Function to handle meter test
  const handleTestMeter = async () => {
    if (!job || !job.site_id) return;
    
    setShowPostcardMenu(false);
    setMeterTestLoading(true);
    setMeterTestStatus('Starting meter test...');
    setMeterTestResult(null);
    setMeterTestError('');
    setShowMeterTestResult(true);
    
    try {
      // Get site details to obtain meter information
      const siteData = await getSiteDetail(job.site_id.toString());
      
      if (!siteData || !siteData.active_meter) {
        setMeterTestError('No meter data available.');
        setMeterTestLoading(false);
        return;
      }
      
      // Use SIM IP for meter test
      const meterIp = String(siteData.sim?.sim_ip ?? '');
      const meterModel = String(siteData.active_meter.meter_model ?? '');
      const meterPassword = String(siteData.active_meter.meter_password ?? '');
      const meterPort = siteData.sim?.connection_port ? Number(siteData.sim.connection_port) : undefined;
      
      if (!meterIp || !meterModel || !meterPassword) {
        setMeterTestError('Missing meter information.');
        setMeterTestLoading(false);
        return;
      }
      
      const { task_id } = await startMeterTest({
        ip: meterIp,
        model: meterModel,
        password: meterPassword,
        site_id: job.site_id,
        port: meterPort,
      });
      
      await pollMeterTestStatus(
        task_id,
        async (statusResponse) => {
          setMeterTestStatus(statusResponse.status);
          
          // Handle completed status
          if (statusResponse.status === 'completed') {
            setMeterTestResult(statusResponse.result ?? null);
            setMeterTestLoading(false);
            
            // Save the test attempt to backend
            try {
              const obis = statusResponse.result ? (statusResponse.result as unknown as Record<string, unknown>) : {};
              const obisVal = obis['1.0.1.8.0.255'] as Record<string, unknown> ?? {};
              const value = Number(obisVal.value ?? 0);
              
              await api.post('/meter-test/', {
                site_id: job.site_id,
                meter_model: meterModel,
                test_reading: value.toFixed(4),
                test_date: new Date().toISOString(),
                signal_level: statusResponse.result?.['0.0.128.20.0.255']?.value ?? '',
              });
              
              // Refresh meter tests
              await fetchSiteReadingsAndTests();
            } catch (saveError) {
              console.error('Failed to save meter test:', saveError);
            }
          }
          
          // Handle error status
          if (statusResponse.status === 'error') {
            setMeterTestError(statusResponse.error || 'Unknown error');
            setMeterTestLoading(false);
          }
        }
      );
    } catch (error) {
      console.error('Failed to start meter test:', error);
      setMeterTestError('Failed to start meter test');
      setMeterTestLoading(false);
    }
  };
  
  // Add a function to handle the "Mark as Complete" button click
  const handleMarkAsComplete = () => {
    let taskIdToUse = currentTaskId;
    let stepToUse = currentStep;

    // If no current task is set but we have tasks, use the first one
    if (!taskIdToUse && tasks.length > 0) {
      const firstInProgressTask = tasks.find(t => t.status === "in_progress");
      taskIdToUse = firstInProgressTask?.id || tasks[0].id;
      setCurrentTaskId(taskIdToUse);
    }

    // If we don't have a current step, try to find one from the task steps
    if (!stepToUse && taskSteps.length > 0) {
      const firstActionableStep = taskSteps.find(
        step => step.status === "pending" || step.status === "in_progress"
      );
      
      if (firstActionableStep) {
        stepToUse = {
          id: firstActionableStep.id,
          name: firstActionableStep.name,
          description: firstActionableStep.description,
          status: firstActionableStep.status,
          is_conditional: firstActionableStep.is_conditional || false,
          step_order: firstActionableStep.step_order,
          success_record_type: firstActionableStep.success_record_type || "text",
          success_options: firstActionableStep.success_options || [],
        };
        setCurrentStep(stepToUse);
      } else if (taskSteps.length > 0) {
        // If no pending/in-progress steps, use the first step
        const firstStep = taskSteps[0];
        stepToUse = {
          id: firstStep.id,
          name: firstStep.name,
          description: firstStep.description,
          status: firstStep.status,
          is_conditional: firstStep.is_conditional || false,
          step_order: firstStep.step_order,
          success_record_type: firstStep.success_record_type || "text",
          success_options: firstStep.success_options || [],
        };
        setCurrentStep(stepToUse);
      }
    }

    // If we have a task ID and either a step or can proceed without one, show the modal
    if (taskIdToUse) {
      setCompleteModalOpen(true);
    }
  };

  // Handle step completion from the modal
  const handleStepCompleted = async (_nextStepId?: number) => {
    // In a real implementation, update the task/step via API

    // Refresh the job data
    await fetchJobDetails();

    // Reset state
    setCurrentTaskId(null);
    setCurrentStep(null);
    setCompleteModalOpen(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Jobs</span>
          </Button>
        </div>
        <p className="text-gray-700 dark:text-gray-300">Loading job details...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Jobs</span>
          </Button>
        </div>
        <p className="text-red-500 dark:text-red-400">{error || "Failed to load job"}</p>
      </div>
    );
  }

  // Define function to get badge color based on status
  const getBadgeClass = (status: string): string => {
    if (job.statusColor) {
      // If API provides a color, use it (with transparent background for better text contrast)
      return `bg-opacity-20 text-[${job.statusColor}] bg-[${job.statusColor}]`;
    }

    // Otherwise use our hardcoded colors
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "in-progress":
      case "in progress":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  // Add a function to get status display for a step
  const getStepStatusDisplay = (
    status: string
  ): {
    icon: React.ReactElement;
    badge: string;
    badgeClass: string;
  } => {
    switch (status.toLowerCase()) {
      case "completed":
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          badge: "Completed",
          badgeClass: getBadgeClass("completed"),
        };
      case "in_progress":
        return {
          icon: <Circle className="h-5 w-5 text-amber-500" />,
          badge: "In Progress",
          badgeClass: getBadgeClass("in-progress"),
        };
      case "failed":
        return {
          icon: <Circle className="h-5 w-5 text-red-500" />,
          badge: "Failed",
          badgeClass: getBadgeClass("pending"),
        };
      default:
        return {
          icon: <Circle className="h-5 w-5 text-gray-400" />,
          badge: "Pending",
          badgeClass: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
        };
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Jobs</span>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2">
          <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="h-6 w-6 flex items-center justify-center mr-2">
                    <span className="text-gray-500 dark:text-gray-400">⊙</span>
                  </div>
                  <h2 className="text-xl font-semibold dark:text-white">Job Details</h2>
                </div>
                <div className="relative">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPostcardMenu(!showPostcardMenu);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Actions
                  </Button>
                  {showPostcardMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border dark:border-gray-700">
                      <div className="py-1">
                        <button
                          onClick={handleTestMeter}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 border-b dark:border-gray-700"
                          disabled={meterTestLoading}
                        >
                          <FlaskConical className="h-4 w-4" />
                          {meterTestLoading ? 'Testing Meter...' : 'Test Meter'}
                        </button>
                        <div className="py-1 px-4 text-xs text-gray-500 dark:text-gray-400 font-semibold">
                          Send Postcard
                        </div>
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            key={num}
                            onClick={() => handleSendPostcard(num)}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <Send className="h-4 w-4" />
                            Send Postcard {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Description</h3>
                  <p className="dark:text-gray-200">{job.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Job Status</h3>
                    {canChangeStatus ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full"
                            title="Click to change status"
                            disabled={updatingStatus}
                          >
                            <Badge 
                              className={`${getBadgeClass(job.status)} cursor-pointer hover:opacity-75 hover:scale-105 transition-all duration-200`}
                            >
                              {updatingStatus ? (
                                <>Updating...</>
                              ) : (
                                <>
                                  {job.status}
                                  <span className="ml-1 text-xs">▼</span>
                                </>
                              )}
                            </Badge>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                          {statuses.map((status) => (
                            <DropdownMenuItem
                              key={status.id}
                              onClick={() => handleStatusChange(status.id.toString())}
                              disabled={status.name === job.status}
                              className={status.name === job.status ? 'opacity-50' : ''}
                            >
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: status.color || '#6B7280' }}
                                />
                                <span>{status.name}</span>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Badge className={getBadgeClass(job.status)}>
                        {job.status}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Job Opened</h3>
                    <p className="dark:text-gray-200">
                      {job.created_at ? new Date(job.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Job Type</h3>
                    <p className="dark:text-gray-200">{job.jobType}</p>
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">System Size</h3>
                    <p className="dark:text-gray-200">{job.systemSize}</p>
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">F-Co</h3>
                    <p className="dark:text-gray-200">{job.panelCount}</p>
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Install Date</h3>
                    <p className="dark:text-gray-200">{job.installDate}</p>
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Last Completed Job
                    </h3>
                    {lastCompletedJob ? (
                      <p className="flex items-center dark:text-gray-200">
                        <span>{lastCompletedJob.completed_date}</span>
                        <button
                          onClick={() =>
                            navigate(`/jobs/${lastCompletedJob.id}`)
                          }
                          className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center"
                        >
                          <span className="text-sm mr-1">View</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </p>
                    ) : (
                      <p className="dark:text-gray-200">No previous jobs</p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Next Step</h3>
                    <p className="dark:text-gray-200">{nextPendingStep}</p>
                  </div>
                </div>
                
                {/* Postcard Status Section */}
                {postcardRequests.length > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium dark:text-white">Postcard Status</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPostcardHistory(true)}
                        className="flex items-center gap-1 text-xs"
                      >
                        <History className="h-3 w-3" />
                        History
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {postcardRequests.map((postcard) => (
                        <div key={postcard.id} className="flex items-center justify-between text-sm">
                          <span className="dark:text-gray-300">
                            Postcard {postcard.postcard_number}
                          </span>
                          <Badge
                            className={`text-xs ${
                              postcard.status === 'sent' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
                            }`}
                          >
                            {postcard.status === 'sent' ? 'Sent' : 'Requested'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Meter Test Result Display */}
          {showMeterTestResult && (meterTestLoading || meterTestResult || meterTestError) && (
            <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold dark:text-white">Meter Test Result</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMeterTestResult(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ✕
                  </Button>
                </div>
                
                {meterTestLoading && !meterTestResult && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{meterTestStatus}</p>
                  </div>
                )}
                
                {meterTestError && (
                  <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
                    <p className="text-sm">{meterTestError}</p>
                  </div>
                )}
                
                {meterTestResult && !meterTestLoading && (
                  <div className="space-y-2">
                    {(() => {
                      const obis = meterTestResult ? (meterTestResult as unknown as Record<string, Record<string, unknown>>) : {};
                      const reading = obis['1.0.1.8.0.255'] as Record<string, unknown> ?? {};
                      const value = Number(reading.value ?? 0);
                      const unit = String(reading.unit ?? 'kWh');
                      const signalLevel = obis['0.0.128.20.0.255'] as Record<string, unknown> ?? {};
                      
                      return (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Current Reading</p>
                              <p className="text-lg font-semibold dark:text-white">
                                {value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {unit}
                              </p>
                            </div>
                            {signalLevel.value && (
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Signal Level</p>
                                <p className="text-lg font-semibold dark:text-white">{String(signalLevel.value)}</p>
                              </div>
                            )}
                          </div>
                          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                            <p>Test completed successfully at {new Date().toLocaleTimeString()}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="py-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="h-6 w-6 flex items-center justify-center mr-2">
                    <span className="text-gray-500 dark:text-gray-400">⊙</span>
                  </div>
                  <h2 className="text-xl font-semibold dark:text-white">Current Progress</h2>
                </div>
                {tasks.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <span>View Full Process</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {tasks.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Overall Progress</p>
                    <p className="font-semibold dark:text-white">{taskProgress}%</p>
                  </div>
                  <Progress value={taskProgress} className="h-2" />

                  <div className="mt-6 space-y-4">
                    {taskSteps.length > 0 ? (
                      // Display actual steps from the backend with prioritization
                      getPrioritizedSteps(taskSteps, showAllSteps).map(
                        (step) => {
                          const statusDisplay = getStepStatusDisplay(
                            step.status
                          );
                          return (
                            <div
                              key={step.id}
                              className="flex items-start gap-4"
                            >
                              <div className="mt-1">{statusDisplay.icon}</div>
                              <div className="flex-1">
                                <div className="flex justify-between items-center">
                                  <h4 className="font-medium dark:text-white">{step.name}</h4>
                                  <Badge className={statusDisplay.badgeClass}>
                                    {statusDisplay.badge}
                                  </Badge>
                                </div>
                                {step.description && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {step.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        }
                      )
                    ) : (
                      // If no steps are available, show a message
                      <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                        <p>No step data available for this task.</p>
                        <p className="text-sm mt-2">
                          Task may be in initialization phase or template has no
                          steps.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center mt-4">
                    <Button
                      className="w-40"
                      onClick={handleMarkAsComplete}
                      disabled={tasks.length === 0}
                    >
                      Mark as Complete
                    </Button>
                  </div>

                  {taskSteps.length > 4 && (
                    <div className="text-center mt-4">
                      <Button
                        variant="link"
                        className="text-sm"
                        onClick={toggleShowAllSteps}
                      >
                        {showAllSteps
                          ? "Show fewer steps"
                          : `Show ${
                              taskSteps.length - Math.min(4, taskSteps.length)
                            } more steps`}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                // If no tasks are available, show a message
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                  <p className="mb-4">No tasks assigned to this job.</p>
                  <Button 
                    variant="outline" 
                    className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={() => setAssignTemplateModalOpen(true)}
                  >
                    Assign Task Template
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="h-6 w-6 flex items-center justify-center mr-2">
                    <span className="text-gray-500 dark:text-gray-400">⊙</span>
                  </div>
                  <h2 className="text-xl font-semibold dark:text-white">Recent Notes</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => setIsViewAllNotesModalOpen(true)}
                >
                  <span>Add Note & View All</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {job.notes.length > 0 ? (
                  job.notes.slice(0, 2).map((note) => (
                    <div key={note.id} className="flex gap-3">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium dark:text-white">{note.author}</h4>
                          {note.source && (
                            <span
                              className={`text-xs px-2 py-1 rounded-full 
                              ${
                                note.source === "step"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                  : note.source === "site"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                                  : note.source === "customer"
                                  ? "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
                                  : note.source === "task"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {note.source_type || note.source}
                              {note.source === "step" &&
                                note.stepName &&
                                `: ${note.stepName}`}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {note.date}
                        </p>
                        <p className="mt-1 dark:text-gray-200">{note.text}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">No notes available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-1/2">
          <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                <div className="h-6 w-6 flex items-center justify-center mr-2">
                  <span className="text-gray-500 dark:text-gray-400">⊙</span>
                </div>
                <h2 className="text-xl font-semibold dark:text-white">Site Details</h2>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Site Name</h3>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <p className="dark:text-gray-200">{job.site_name}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Home Owner</h3>
                  <h3 className="font-medium dark:text-white">{job.client}</h3>
                </div>

                <div>
                  <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Address</h3>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <p className="dark:text-gray-200">{job.address}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Post Code</h3>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <p className="dark:text-gray-200">{job.postcode}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Phone</h3>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <p className="dark:text-gray-200">{job.phone}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email</h3>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <p className="dark:text-gray-200">{job.email}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <Button 
                  className="w-1/2 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700" 
                  variant="outline"
                  onClick={() => window.location.href = `tel:${job.phone}`}
                  disabled={job.phone === "Loading..." || job.phone === "+1 (555) 123-4567"}
                >
                  Call
                </Button>
                <Button 
                  className="w-1/2 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700" 
                  variant="outline"
                  onClick={() => setIsEmailModalOpen(true)}
                  disabled={job.email === "Loading..." || job.email === "customer@example.com" || !job.email}
                >
                  Email
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="py-6">
              <div className="flex items-center mb-4">
                <div className="h-6 w-6 flex items-center justify-center mr-2">
                  <span className="text-gray-500 dark:text-gray-400">⊙</span>
                </div>
                <h2 className="text-xl font-semibold dark:text-white">System Performance</h2>
              </div>

              <div className="w-full">
                {/* Custom Tab Navigation */}
                <div className="flex h-11 items-center justify-center rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
                  <button
                    onClick={() => setActiveTab('performance')}
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all ${
                      activeTab === 'performance'
                        ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-white'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    Performance
                  </button>
                  <button
                    onClick={() => setActiveTab('readings')}
                    className={`ml-1 inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all ${
                      activeTab === 'readings'
                        ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-white'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    Meter Readings
                  </button>
                  <button
                    onClick={() => setActiveTab('tests')}
                    className={`ml-1 inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all ${
                      activeTab === 'tests'
                        ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-white'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    Meter Tests
                  </button>
                </div>
                
                {/* Tab Content */}
                <div className="mt-4">
                  {activeTab === 'performance' && (
                    <div className="space-y-4">
                      {loadingComparison ? (
                    <div className="py-8 text-center">
                      <p className="text-gray-500 dark:text-gray-400 mb-2">
                        Loading comparison data...
                      </p>
                    </div>
                  ) : siteComparison ? (
                <div>
                  {/* Current Site Data */}
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <h4 className="font-medium text-blue-800 dark:text-blue-400">
                      Current Site: {siteComparison.current_site.site_name}
                    </h4>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">System Size</p>
                        <p className="font-medium dark:text-white">
                          {siteComparison.current_site.system_size
                            ? `${siteComparison.current_site.system_size} kW`
                            : "Unknown"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Meter Type</p>
                        <p className="font-medium dark:text-white">
                          {siteComparison.current_site.meter_type}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">SIM Provider</p>
                        <p className="font-medium dark:text-white">
                          {siteComparison.current_site.sim_provider}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h5 className="text-sm font-medium mb-2 dark:text-white">
                        Generation History
                      </h5>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white dark:bg-gray-800 p-2 rounded">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Last 7 Days</p>
                          <p className="text-lg font-semibold dark:text-white">
                            {siteComparison.current_site.generation_data.current_period.total_generation.toFixed(
                              2
                            )}{" "}
                            kWh
                          </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-2 rounded">
                          <p className="text-xs text-gray-500 dark:text-gray-400">1 Year Ago</p>
                          <p className="text-lg font-semibold dark:text-white">
                            {siteComparison.current_site.generation_data.last_year.total_generation.toFixed(
                              2
                            )}{" "}
                            kWh
                          </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-2 rounded">
                          <p className="text-xs text-gray-500 dark:text-gray-400">2 Years Ago</p>
                          <p className="text-lg font-semibold dark:text-white">
                            {siteComparison.current_site.generation_data.two_years_ago.total_generation.toFixed(
                              2
                            )}{" "}
                            kWh
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nearby Sites Comparison */}
                  <h4 className="font-medium mb-3 dark:text-white">Nearby Sites Comparison</h4>
                  {siteComparison.nearby_sites.length > 0 ? (
                    <div className="space-y-4">
                      {siteComparison.nearby_sites.map((site, index) => (
                        <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                          <h5 className="font-medium dark:text-white">{site.site_name}</h5>
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                System Size
                              </p>
                              <p className="text-sm font-medium dark:text-gray-200">
                                {site.system_size
                                  ? `${site.system_size} kW`
                                  : "Unknown"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Meter Type
                              </p>
                              <p className="text-sm dark:text-gray-200">{site.meter_type}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                SIM Provider
                              </p>
                              <p className="text-sm dark:text-gray-200">{site.sim_provider}</p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <h6 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Generation History
                            </h6>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-white dark:bg-gray-800 p-2 rounded">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Last 7 Days
                                </p>
                                <p className="text-sm font-medium dark:text-gray-200">
                                  {site.generation_data.current_period.total_generation.toFixed(
                                    2
                                  )}{" "}
                                  kWh
                                </p>
                              </div>
                              <div className="bg-white dark:bg-gray-800 p-2 rounded">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  1 Year Ago
                                </p>
                                <p className="text-sm font-medium dark:text-gray-200">
                                  {site.generation_data.last_year.total_generation.toFixed(
                                    2
                                  )}{" "}
                                  kWh
                                </p>
                              </div>
                              <div className="bg-white dark:bg-gray-800 p-2 rounded">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  2 Years Ago
                                </p>
                                <p className="text-sm font-medium dark:text-gray-200">
                                  {site.generation_data.two_years_ago.total_generation.toFixed(
                                    2
                                  )}{" "}
                                  kWh
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">
                      No nearby sites found for comparison
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Current Production
                      </p>
                      <p className="text-2xl font-semibold mt-1 dark:text-white">
                        {job.currentProduction}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Efficiency</p>
                      <p className="text-2xl font-semibold mt-1 dark:text-white">
                        {job.efficiency}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-1 dark:text-gray-300">
                      <span>System Efficiency</span>
                      <span>{job.efficiency}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 dark:bg-green-600 rounded-full"
                        style={{ width: job.efficiency || "0%" }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-3 dark:text-white">
                      Detected Issues
                    </h3>
                    {job.detectedIssues && job.detectedIssues.length > 0 ? (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-md p-4">
                        <div className="flex gap-2">
                          <div className="text-red-500 dark:text-red-400 mt-0.5">⊙</div>
                          <div>
                            <p className="font-medium text-red-700 dark:text-red-400">
                              Panel Degradation
                            </p>
                            <p className="text-sm mt-1 dark:text-red-300">
                              Two panels showing reduced efficiency, likely due
                              to dust accumulation or partial shading.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No issues detected</p>
                    )}
                    {/* No button needed as comparison data is loaded automatically */}
                  </div>
                </div>
              )}
                    </div>
                  )}
                  
                  {activeTab === 'readings' && (
                    <div className="space-y-4">
                  {loadingReadings ? (
                    <div className="py-8 text-center">
                      <p className="text-gray-500 dark:text-gray-400">Loading meter readings...</p>
                    </div>
                  ) : siteReadings.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b dark:border-gray-700">
                            <th className="text-left py-2 px-2 font-medium dark:text-gray-300">Date</th>
                            <th className="text-left py-2 px-2 font-medium dark:text-gray-300">Type</th>
                            <th className="text-right py-2 px-2 font-medium dark:text-gray-300">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {siteReadings.slice(0, readingsDisplayCount).map((reading: any, index: number) => (
                            <tr key={index} className="border-b dark:border-gray-700">
                              <td className="py-2 px-2 dark:text-gray-200">
                                {new Date(reading.date || reading.timestamp).toLocaleDateString()}
                              </td>
                              <td className="py-2 px-2 dark:text-gray-200">
                                <Badge variant="secondary" className="text-xs">
                                  {reading.type || 'Generation'}
                                </Badge>
                              </td>
                              <td className="text-right py-2 px-2 dark:text-gray-200">
                                {reading.meter_reading || reading.value || reading.generation_value || reading.daily_gen} kWh
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {siteReadings.length > readingsDisplayCount && (
                        <div className="mt-4 text-center">
                          <Button
                            variant="outline"
                            onClick={() => setReadingsDisplayCount(readingsDisplayCount + 30)}
                            className="mx-auto"
                          >
                            Load More ({siteReadings.length - readingsDisplayCount} remaining)
                          </Button>
                        </div>
                      )}
                      {readingsDisplayCount >= siteReadings.length && siteReadings.length > 30 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                          Showing all {siteReadings.length} readings
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      No meter readings available
                    </p>
                  )}
                    </div>
                  )}
                  
                  {activeTab === 'tests' && (
                    <div className="space-y-4">
                  {loadingTests ? (
                    <div className="py-8 text-center">
                      <p className="text-gray-500 dark:text-gray-400">Loading meter tests...</p>
                    </div>
                  ) : meterTests.length > 0 ? (
                    <div className="space-y-4">
                      {meterTests.slice(0, 5).map((test: any, index: number) => (
                        <div key={index} className="border dark:border-gray-700 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium dark:text-white">
                              {test.test_type || 'Meter Test'}
                            </h4>
                            <Badge 
                              variant={test.status === 'passed' ? 'success' : test.status === 'failed' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {test.status || 'Completed'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <p>Date: {new Date(test.created_at || test.test_date).toLocaleDateString()}</p>
                            {test.notes && <p className="mt-1">Notes: {test.notes}</p>}
                            {test.result && <p className="mt-1">Result: {test.result}</p>}
                          </div>
                        </div>
                      ))}
                      {meterTests.length > 5 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                          Showing 5 of {meterTests.length} tests
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      No meter tests available
                    </p>
                  )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add the ViewAllNotesModal */}
      {job && (
        <ViewAllNotesModal
          isOpen={isViewAllNotesModalOpen}
          onClose={() => setIsViewAllNotesModalOpen(false)}
          jobId={job.id}
          siteId={
            typeof job.site === "number"
              ? job.site
              : job.site_id || job.site?.site_id || 0
          }
        />
      )}

      {/* Add the CompleteStepModal */}
      {currentTaskId && (
        <CompleteStepModal
          isOpen={completeModalOpen}
          onClose={() => setCompleteModalOpen(false)}
          taskId={currentTaskId}
          currentStep={currentStep}
          onStepCompleted={handleStepCompleted}
        />
      )}

      {/* Add the AssignTemplateModal */}
      {job && (
        <AssignTemplateModal
          isOpen={assignTemplateModalOpen}
          onClose={() => setAssignTemplateModalOpen(false)}
          jobId={job.id}
          onTemplateAssigned={async () => {
            setAssignTemplateModalOpen(false);
            // Reload the job data to show the newly assigned task
            window.location.reload();
          }}
        />
      )}

      {/* Add the EmailTemplateModal */}
      {job && (
        <EmailTemplateModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          siteId={job.site_id?.toString() || job.id}
          customer={{
            owner: job.client,
            email: job.email,
            phone: job.phone,
            owner_address: job.address,
            customer_name: job.client
          }}
          site={{
            site_name: job.site_name,
            site_reference: job.site_id?.toString(),
            postcode: job.postcode,
            address: job.address,
            fit_id: job.id
          }}
        />
      )}
      
      {/* Add the PostcardHistoryModal */}
      {job && (
        <PostcardHistoryModal
          isOpen={showPostcardHistory}
          onClose={() => setShowPostcardHistory(false)}
          jobId={job.id}
          postcardRequests={postcardRequests}
        />
      )}

    </div>
  );
}
