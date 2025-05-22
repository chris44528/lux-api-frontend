import React, { useState, useEffect, useCallback, useRef } from "react"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Plus, Trash2 } from "lucide-react"
import jobService, { TaskTemplate, JobType, JobQueue } from "../../services/jobService"
import { useToast } from "../../hooks/use-toast"

interface TaskTemplatesProps {
  jobTypes: JobType[];
  queues: JobQueue[];
}

interface NewTemplateData {
  name: string;
  queue: number | null;
  job_type: number | null;
}

export function TaskTemplates({ jobTypes, queues }: TaskTemplatesProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [newName, setNewName] = useState("");
  const [newQueueId, setNewQueueId] = useState<number | null>(null);
  const [newJobTypeId, setNewJobTypeId] = useState<number | null>(null);
  
  // Track if we've already fetched templates
  const fetchedRef = useRef(false);
  
  // Track component mounted state
  const isMountedRef = useRef(true);
  
  // Only fetch templates once
  const fetchTemplates = useCallback(async () => {
    // Skip if we've already fetched or component is unmounted
    if (fetchedRef.current || !isMountedRef.current) return;
    
    // Mark as fetching
    fetchedRef.current = true;
    
    try {
      const templatesData = await jobService.getTaskTemplates();
      console.log("Task templates fetched successfully");
      
      // Only update state if still mounted
      if (isMountedRef.current) {
        setTemplates(Array.isArray(templatesData) ? templatesData : []);
      }
    } catch (error) {
      console.error("Error fetching task templates:", error);
      if (isMountedRef.current) {
        toast({
          title: "Error",
          description: "Failed to load task templates"
        });
      }
    }
  }, [toast]);
  
  // Fetch templates on mount, only once
  useEffect(() => {
    isMountedRef.current = true;
    fetchTemplates();
    
    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchTemplates]);
  
  // Create a new template
  const handleAddTemplate = async () => {
    if (!newName) {
      toast({
        title: "Error",
        description: "Please enter a template name"
      });
      return;
    }

    try {
      const templateData: NewTemplateData = {
        name: newName,
        queue: newQueueId,
        job_type: newJobTypeId
      };

      const newTemplate = await jobService.createTaskTemplate(templateData);
      
      // Only update if mounted
      if (isMountedRef.current) {
        setTemplates([...templates, newTemplate]);
        setNewName("");
        setNewQueueId(null);
        setNewJobTypeId(null);
        
        toast({
          title: "Success",
          description: `Template "${newName}" has been added`
        });
      }
    } catch (error) {
      console.error("Error creating template:", error);
      if (isMountedRef.current) {
        toast({
          title: "Error",
          description: "Failed to create template. Please try again."
        });
      }
    }
  };

  // Delete a template
  const handleDeleteTemplate = async (id: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this template?");
    if (!confirmDelete) return;

    try {
      await jobService.deleteTaskTemplate(id);
      
      // Only update if mounted
      if (isMountedRef.current) {
        setTemplates(templates.filter(template => template.id !== id));
        
        toast({
          title: "Success",
          description: "Template has been deleted"
        });
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      if (isMountedRef.current) {
        toast({
          title: "Error",
          description: "Failed to delete template. Please try again."
        });
      }
    }
  };

  // Get queue name by ID
  const getQueueName = (queueId: number | null) => {
    if (queueId === null) return "All Queues";
    const queue = queues.find(q => q.id === queueId);
    return queue ? queue.name : "Unknown Queue";
  };

  // Get job type name by ID
  const getJobTypeName = (typeId: number | null) => {
    if (typeId === null) return "Any Job Type";
    const jobType = jobTypes.find(t => t.id === typeId);
    return jobType ? jobType.name : "Unknown Type";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4">
        <div className="md:w-1/3">
          <Input
            placeholder="Template Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </div>
        <div className="md:w-1/3">
          <select
            className="w-full p-2 border rounded-md"
            value={newQueueId?.toString() || ""}
            onChange={(e) => setNewQueueId(e.target.value ? parseInt(e.target.value) : null)}
          >
            <option value="">All Queues</option>
            {queues.map((queue) => (
              <option key={queue.id} value={queue.id.toString()}>
                {queue.name}
              </option>
            ))}
          </select>
        </div>
        <div className="md:w-1/3">
          <select
            className="w-full p-2 border rounded-md"
            value={newJobTypeId?.toString() || ""}
            onChange={(e) => setNewJobTypeId(e.target.value ? parseInt(e.target.value) : null)}
          >
            <option value="">Any Job Type</option>
            {jobTypes.map((type) => (
              <option key={type.id} value={type.id.toString()}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={handleAddTemplate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Template
        </Button>
      </div>

      <div className="rounded-md border">
        <div className="w-full">
          <div className="bg-gray-50 border-b">
            <div className="grid grid-cols-4 gap-4">
              <div className="px-4 py-3 text-left text-sm font-medium text-gray-500">Template Name</div>
              <div className="px-4 py-3 text-left text-sm font-medium text-gray-500">Queue</div>
              <div className="px-4 py-3 text-left text-sm font-medium text-gray-500">Job Type</div>
              <div className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</div>
            </div>
          </div>
          <div className="divide-y">
            {templates.length === 0 ? (
              <div className="text-center py-4 text-sm text-gray-500">
                No task templates found. Create one to get started.
              </div>
            ) : (
              templates.map((template) => (
                <div key={template.id} className="grid grid-cols-4 gap-4 py-3 hover:bg-gray-50">
                  <div className="px-4 text-sm font-medium">{template.name}</div>
                  <div className="px-4 text-sm">{template.queue ? getQueueName(template.queue.id) : "All Queues"}</div>
                  <div className="px-4 text-sm">{template.job_type ? getJobTypeName(template.job_type.id) : "Any Job Type"}</div>
                  <div className="px-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 