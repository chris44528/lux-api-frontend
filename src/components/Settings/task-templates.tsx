import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import { PlusCircle, Edit, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import jobService, { TaskTemplate, JobType, JobQueue } from "../../services/jobService";
import { useToast } from "../../hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Checkbox } from "../ui/checkbox";

interface TaskTemplatesProps {
  jobTypes: JobType[];
  queues: JobQueue[];
}

interface SuccessOption {
  id: string;
  label: string;
  action: string;
  next_step?: number;
}

interface StepFormData {
  name: string;
  description: string;
  instructions: string;
  action_type: string;
  is_required: boolean;
  estimated_time_minutes: number;
  is_conditional: boolean;
  condition_description?: string;
  success_record_type?: string;
  success_options?: SuccessOption[];
  next_step?: number;
}

const ACTION_TYPES = [
  { value: 'standard', label: 'Standard Task' },
  { value: 'conditional', label: 'Conditional Task' },
  { value: 'reading', label: 'Meter Reading' },
  { value: 'call', label: 'Phone Call' },
  { value: 'email', label: 'Send Email' },
  { value: 'form', label: 'Fill Form' },
  { value: 'verification', label: 'Verification' },
  { value: 'site_visit', label: 'Site Visit' },
  { value: 'reset', label: 'System Reset' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'approval', label: 'Approval' },
  { value: 'document', label: 'Document' },
  { value: 'jump', label: 'Jump to Step' },
  { value: 'api', label: 'API Call' },
  { value: 'notification', label: 'Notification' },
];

const SUCCESS_RECORD_TYPES = [
  { value: 'checkbox', label: 'Checkbox (Yes/No)' },
  { value: 'dropdown', label: 'Dropdown Selection' },
  { value: 'text', label: 'Text Input' },
  { value: 'number', label: 'Numeric Value' },
];

export default function TaskTemplates({ jobTypes = [], queues = [] }: TaskTemplatesProps) {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("");
  const [filteredTemplates, setFilteredTemplates] = useState<TaskTemplate[]>([]);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [selectedJobType, setSelectedJobType] = useState<string>("");
  const [selectedQueue, setSelectedQueue] = useState<string>("");
  const [dataFetched, setDataFetched] = useState(false);
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  const [isAddStepModalOpen, setIsAddStepModalOpen] = useState(false);
  const [isEditStepModalOpen, setIsEditStepModalOpen] = useState(false);
  const [editingStepId, setEditingStepId] = useState<number | null>(null);
  const [stepForm, setStepForm] = useState<StepFormData>({
    name: "",
    description: "",
    instructions: "",
    action_type: "standard",
    is_required: true,
    estimated_time_minutes: 15,
    is_conditional: false,
    success_record_type: "",
    success_options: []
  });

  // Fetch templates only once
  useEffect(() => {
    // Skip if we've already fetched the data
    if (dataFetched) return;
    
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const data = await jobService.getTaskTemplates();
        setTemplates(data);
        setFilteredTemplates(data);
        setDataFetched(true);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load task templates"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [toast, dataFetched]);

  // Filter templates based on selected type
  useEffect(() => {
    if (selectedType) {
      const filtered = templates.filter(template => 
        template.job_type.toString() === selectedType
      );
      setFilteredTemplates(filtered);
    } else {
      setFilteredTemplates(templates);
    }
  }, [selectedType, templates]);

  // Add new template - this would be expanded in a real implementation
  const addTemplate = async () => {
    if (!newTemplateName || !selectedJobType) {
      toast({
        title: "Error",
        description: "Template name and job type are required"
      });
      return;
    }

    try {
      // Create the template through the API
      const newTemplate = await jobService.createTaskTemplate({
        name: newTemplateName,
        job_type: parseInt(selectedJobType),
        queue: selectedQueue ? parseInt(selectedQueue) : null
      });

      // Add the new template to the local state
      setTemplates(prev => [...prev, newTemplate]);
      setFilteredTemplates(prev => [...prev, newTemplate]);

      // Show success message
      toast({
        title: "Success",
        description: "Task template created successfully"
      });

      // Reset form
      setNewTemplateName("");
      setSelectedJobType("");
      setSelectedQueue("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task template"
      });
    }
  };

  // Add success option to step form
  const addSuccessOption = () => {
    setStepForm((prev) => ({
      ...prev,
      success_options: [
        ...(prev.success_options || []), 
        { 
          id: Date.now().toString(), 
          label: "",
          action: "next" 
        }
      ]
    }));
  };

  // Remove success option from step form
  const removeSuccessOption = (id: string) => {
    setStepForm((prev) => ({
      ...prev,
      success_options: prev.success_options?.filter(option => option.id !== id) || []
    }));
  };

  // Update a specific success option
  const updateSuccessOption = (id: string, field: string, value: string | number) => {
    setStepForm((prev) => ({
      ...prev,
      success_options: prev.success_options?.map(option => 
        option.id === id ? { ...option, [field]: value } : option
      ) || []
    }));
  };

  // Add new step to template
  const handleAddStep = async () => {
    if (!selectedTemplate) {
      toast({
        title: "Error",
        description: "No template selected"
      });
      return;
    }

    try {
      // Determine the next step order - check both step_order and sequence_number fields
      const nextStepOrder = selectedTemplate.steps?.length 
        ? Math.max(...selectedTemplate.steps.map(s => s.step_order || s.sequence_number || 0)) + 1 
        : 1;

      // Create a new step - map frontend fields to backend fields
      const stepData = {
        name: stepForm.name,
        description: stepForm.description,
        step_type: stepForm.instructions || stepForm.action_type, // Backend uses step_type
        sequence_number: nextStepOrder, // Backend uses sequence_number instead of step_order
        is_required: stepForm.is_required,
        is_conditional: stepForm.is_conditional,
        success_record_type: stepForm.success_record_type,
        success_options: stepForm.success_options,
        // Only include next_step if it's a jump action
        ...(stepForm.action_type === 'jump' ? { next_step: stepForm.next_step } : {})
      };
      
      await jobService.createTaskStep(selectedTemplate.id, stepData);

      // Fetch the updated template to ensure we have the latest data from the backend
      const updatedTemplateData = await jobService.getTaskTemplate(selectedTemplate.id);
      
      // Update templates state with the fresh data
      setTemplates(templates.map(t => 
        t.id === selectedTemplate.id ? updatedTemplateData : t
      ));
      
      // Also update filtered templates
      setFilteredTemplates(filteredTemplates.map(t => 
        t.id === selectedTemplate.id ? updatedTemplateData : t
      ));
      
      // Update the selected template for the modal
      setSelectedTemplate(updatedTemplateData);

      // Reset form state
      setStepForm({
        name: '',
        description: '',
        instructions: '',
        action_type: 'form',
        is_required: true,
        estimated_time_minutes: 15,
        is_conditional: false,
        success_record_type: '',
        success_options: []
      });

      // Close modal
      setIsAddStepModalOpen(false);

      toast({
        title: "Success",
        description: "Step added successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add step"
      });
    }
  };

  // Add new function to reorder steps
  const reorderSteps = async (templateId: number, stepId: number, direction: 'up' | 'down') => {
    if (!templateId) return;

    const template = templates.find(t => t.id === templateId);
    if (!template || !template.steps || template.steps.length < 2) return;

    const stepIndex = template.steps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) return;

    // Can't move first step up or last step down
    if ((direction === 'up' && stepIndex === 0) || 
        (direction === 'down' && stepIndex === template.steps.length - 1)) {
      return;
    }

    // Create a copy of the steps array
    const newSteps = [...template.steps];
    
    // Get the step being moved and the one it's swapping with
    const stepToMove = newSteps[stepIndex];
    const adjacentIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1;
    const adjacentStep = newSteps[adjacentIndex];
    
    // Swap the step_order values
    const tempOrder = stepToMove.step_order;
    
    try {
      // First API call to update the step being moved
      await jobService.updateStepOrder(stepToMove.id, adjacentStep.step_order);
      
      // Second API call to update the adjacent step
      await jobService.updateStepOrder(adjacentStep.id, tempOrder);
      
      // Swap the steps in our local state
      [newSteps[stepIndex], newSteps[adjacentIndex]] = [newSteps[adjacentIndex], newSteps[stepIndex]];
      
      // Create a new template object with the updated steps
      const updatedTemplate = {
        ...template,
        steps: newSteps
      };
      
      // Update templates state
      setTemplates(templates.map(t => 
        t.id === templateId ? updatedTemplate : t
      ));
      
      // Also update filtered templates
      setFilteredTemplates(filteredTemplates.map(t => 
        t.id === templateId ? updatedTemplate : t
      ));
      
      toast({
        title: "Success",
        description: "Steps reordered successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reorder steps"
      });
    }
  };

  // Handle opening the edit step modal
  const handleEditStepClick = (template: TaskTemplate, stepId: number) => {
    setSelectedTemplate(template);
    setEditingStepId(stepId);
    
    // Find the step to edit
    const stepToEdit = template.steps.find(s => s.id === stepId);
    if (stepToEdit) {
      
      // Pre-fill the form with the step's current values
      const formData = {
        name: stepToEdit.name,
        description: stepToEdit.description || '',
        instructions: stepToEdit.instructions || '',
        action_type: stepToEdit.action_type,
        is_required: stepToEdit.is_required !== false, // Default to true if not specified
        estimated_time_minutes: stepToEdit.estimated_time_minutes || 15,
        is_conditional: stepToEdit.is_conditional || false,
        next_step: stepToEdit.next_step,
        // Ensure we preserve the success record type and options
        success_record_type: stepToEdit.success_record_type || '',
        success_options: stepToEdit.success_options?.map(option => ({
          id: option.id || Date.now().toString(),
          label: option.label,
          action: option.action,
          next_step: option.next_step
        })) || []
      };
      
      
      setStepForm(formData);
      setIsEditStepModalOpen(true);
    }
  };

  // Handle submitting the edit step form
  const handleEditStep = async () => {
    if (!selectedTemplate || !editingStepId) {
      toast({
        title: "Error",
        description: "No template or step selected"
      });
      return;
    }

    try {

      // Update the step through the API - map frontend fields to backend fields
      const updateData = {
        name: stepForm.name,
        description: stepForm.description,
        step_type: stepForm.instructions || stepForm.action_type, // Backend uses step_type
        is_required: stepForm.is_required,
        is_conditional: stepForm.is_conditional,
        success_record_type: stepForm.success_record_type,
        success_options: stepForm.success_options,
        // Only include next_step if it's a jump action
        ...(stepForm.action_type === 'jump' ? { next_step: stepForm.next_step } : {})
      };
      
      const updatedStep = await jobService.updateTaskStep(editingStepId, updateData);


      // Update the step in the selected template
      const updatedSteps = selectedTemplate.steps.map(step => 
        step.id === editingStepId ? { ...step, ...updatedStep } : step
      );


      // Update the selected template with the updated steps
      const updatedTemplate = {
        ...selectedTemplate,
        steps: updatedSteps
      };

      // Update templates state
      setTemplates(templates.map(t => 
        t.id === selectedTemplate.id ? updatedTemplate : t
      ));
      
      // Also update filtered templates
      setFilteredTemplates(filteredTemplates.map(t => 
        t.id === selectedTemplate.id ? updatedTemplate : t
      ));

      // Reset form and state
      setStepForm({
        name: '',
        description: '',
        instructions: '',
        action_type: 'form',
        is_required: true,
        estimated_time_minutes: 15,
        is_conditional: false,
        success_record_type: '',
        success_options: []
      });
      setEditingStepId(null);
      setIsEditStepModalOpen(false);

      toast({
        title: "Success",
        description: "Step updated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update step"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Task Templates</h2>
          <p className="text-muted-foreground">
            Define process workflows for different job types
          </p>
        </div>
        <div className="w-52">
          <select 
            className="w-full p-2 border rounded"
            value={selectedType} 
            onChange={e => setSelectedType(e.target.value)}
          >
            <option value="">All Job Types</option>
            {Array.isArray(jobTypes) && jobTypes.map(type => (
              <option key={type.id} value={type.id.toString()}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Template</CardTitle>
          <CardDescription>Create a new workflow template</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Template Name</label>
              <Input 
                value={newTemplateName}
                onChange={e => setNewTemplateName(e.target.value)}
                placeholder="Enter template name"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Job Type</label>
              <select
                className="w-full p-2 border rounded mt-1"
                value={selectedJobType}
                onChange={e => setSelectedJobType(e.target.value)}
              >
                <option value="">Select job type</option>
                {Array.isArray(jobTypes) && jobTypes.map(type => (
                  <option key={type.id} value={type.id.toString()}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Queue (Optional)</label>
              <select
                className="w-full p-2 border rounded mt-1"
                value={selectedQueue}
                onChange={e => setSelectedQueue(e.target.value)}
              >
                <option value="">None</option>
                {Array.isArray(queues) && queues.map(queue => (
                  <option key={queue.id} value={queue.id.toString()}>
                    {queue.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button 
            onClick={addTemplate} 
            disabled={!newTemplateName || !selectedJobType}
            className="mt-4"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Template
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <Card>
            <CardContent className="py-10">
              <p className="text-center text-muted-foreground">Loading task templates...</p>
            </CardContent>
          </Card>
        ) : filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="py-10">
              <p className="text-center text-muted-foreground">No templates found</p>
            </CardContent>
          </Card>
        ) : (
          filteredTemplates.map(template => (
            <Card key={template.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{template.name}</CardTitle>
                    <CardDescription>{template.description || "No description"}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  {Array.isArray(jobTypes) && jobTypes.find(t => t.id === (template.job_type?.id || template.job_type)) && (
                    <Badge>
                      {jobTypes.find(t => t.id === (template.job_type?.id || template.job_type))?.name}
                    </Badge>
                  )}
                  {template.queue && Array.isArray(queues) && queues.find(q => q.id === (template.queue?.id || template.queue)) && (
                    <Badge variant="outline">
                      {queues.find(q => q.id === (template.queue?.id || template.queue))?.name}
                    </Badge>
                  )}
                  <Badge variant="outline" className={template.is_active ? "bg-green-100" : "bg-gray-100"}>
                    {template.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                
                <Separator className="my-3" />
                
                <div>
                  <h4 className="font-medium mb-2">Steps ({template.steps?.length || 0})</h4>
                  {template.steps && template.steps.length > 0 ? (
                    <div className="space-y-2">
                      {template.steps.map((step, index) => (
                        <div key={step.id} className="p-2 border rounded-md flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{step.name}</p>
                              <p className="text-sm text-muted-foreground">{step.description}</p>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditStepClick(template, step.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => reorderSteps(template.id, step.id, 'up')}
                              disabled={index === 0}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => reorderSteps(template.id, step.id, 'down')}
                              disabled={index === template.steps.length - 1}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No steps defined</p>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setIsAddStepModalOpen(true);
                    }}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Step
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Step Modal */}
      <Dialog open={isAddStepModalOpen} onOpenChange={setIsAddStepModalOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Add New Step</DialogTitle>
            <DialogDescription>
              Add a new step to the template workflow
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Step Name</Label>
              <Input
                value={stepForm.name}
                onChange={e => setStepForm({ ...stepForm, name: e.target.value })}
                placeholder="Enter step name"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={stepForm.description}
                onChange={e => setStepForm({ ...stepForm, description: e.target.value })}
                placeholder="Enter step description"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Instructions</Label>
              <Textarea
                value={stepForm.instructions}
                onChange={e => setStepForm({ ...stepForm, instructions: e.target.value })}
                placeholder="Enter step instructions"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="action_type">Action Type</Label>
              <Select
                value={stepForm.action_type}
                onValueChange={(value) => setStepForm({ ...stepForm, action_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Action Type" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isRequired"
                checked={stepForm.is_required}
                onChange={e => setStepForm({ ...stepForm, is_required: e.target.checked })}
              />
              <Label htmlFor="isRequired">Required Step</Label>
            </div>
            
            <div className="space-y-2">
              <Label>Estimated Time (minutes)</Label>
              <Input
                type="number"
                value={stepForm.estimated_time_minutes}
                onChange={e => setStepForm({ ...stepForm, estimated_time_minutes: parseInt(e.target.value) })}
                min="1"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isConditional"
                checked={stepForm.is_conditional}
                onCheckedChange={(checked) => setStepForm({ ...stepForm, is_conditional: checked === true })}
              />
              <Label htmlFor="isConditional">Has Conditional Branches</Label>
            </div>
            
            {stepForm.is_conditional && (
              <div className="space-y-4 border p-4 rounded-md">
                <div className="space-y-2">
                  <Label>Success Record Type</Label>
                  <Select
                    value={stepForm.success_record_type}
                    onValueChange={(value) => setStepForm({ ...stepForm, success_record_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select record type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUCCESS_RECORD_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {stepForm.success_record_type && (
                  <>
                    <div className="space-y-2">
                      <Label>Success Options</Label>
                      {stepForm.success_options && stepForm.success_options.length > 0 ? (
                        <div className="space-y-3">
                          {stepForm.success_options.map((option) => (
                            <div key={option.id} className="flex items-center space-x-2 border p-3 rounded">
                              <div className="grid grid-cols-4 gap-2 flex-1">
                                <div className="col-span-2">
                                  <Label className="text-xs">Option Label</Label>
                                  <Input 
                                    value={option.label}
                                    onChange={(e) => updateSuccessOption(option.id, 'label', e.target.value)}
                                    placeholder="Option label (e.g. Call connected)"
                                    className="mt-1"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <Label className="text-xs">Action</Label>
                                  <Select
                                    value={option.action}
                                    onValueChange={(value) => updateSuccessOption(option.id, 'action', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Action" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="next">Continue to next step</SelectItem>
                                      <SelectItem value="repeat">Repeat current step</SelectItem>
                                      <SelectItem value="jump">Jump to specific step</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                {option.action === 'jump' && (
                                  <div className="col-span-4 mt-2">
                                    <Label className="text-xs">Jump to Step #</Label>
                                    <Input 
                                      type="number" 
                                      value={option.next_step || 1}
                                      onChange={(e) => updateSuccessOption(option.id, 'next_step', parseInt(e.target.value))}
                                      placeholder="Enter step number"
                                      min="1"
                                      className="mt-1"
                                    />
                                  </div>
                                )}
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeSuccessOption(option.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No options added</p>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={addSuccessOption}
                        className="mt-2"
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Option
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Jump to step number - only show if action type is jump */}
            {stepForm.action_type === 'jump' && (
              <div className="space-y-2">
                <Label htmlFor="next_step">Jump to Step Number</Label>
                <Input
                  id="next_step"
                  type="number"
                  min="1"
                  placeholder="Enter step number"
                  value={stepForm.next_step || ''}
                  onChange={(e) => setStepForm({ 
                    ...stepForm, 
                    next_step: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddStepModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStep}>Add Step</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Step Modal */}
      <Dialog open={isEditStepModalOpen} onOpenChange={setIsEditStepModalOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Edit Step</DialogTitle>
            <DialogDescription>
              Modify the existing step in the template workflow
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Step Name</Label>
              <Input
                value={stepForm.name}
                onChange={e => setStepForm({ ...stepForm, name: e.target.value })}
                placeholder="Enter step name"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={stepForm.description}
                onChange={e => setStepForm({ ...stepForm, description: e.target.value })}
                placeholder="Enter step description"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Instructions</Label>
              <Textarea
                value={stepForm.instructions}
                onChange={e => setStepForm({ ...stepForm, instructions: e.target.value })}
                placeholder="Enter step instructions"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="action_type">Action Type</Label>
              <Select
                value={stepForm.action_type}
                onValueChange={(value) => setStepForm({ ...stepForm, action_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Action Type" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isRequired"
                checked={stepForm.is_required}
                onChange={e => setStepForm({ ...stepForm, is_required: e.target.checked })}
              />
              <Label htmlFor="isRequired">Required Step</Label>
            </div>
            
            <div className="space-y-2">
              <Label>Estimated Time (minutes)</Label>
              <Input
                type="number"
                value={stepForm.estimated_time_minutes}
                onChange={e => setStepForm({ ...stepForm, estimated_time_minutes: parseInt(e.target.value) })}
                min="1"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isConditional"
                checked={stepForm.is_conditional}
                onCheckedChange={(checked) => setStepForm({ ...stepForm, is_conditional: checked === true })}
              />
              <Label htmlFor="isConditional">Has Conditional Branches</Label>
            </div>
            
            {stepForm.is_conditional && (
              <div className="space-y-4 border p-4 rounded-md">
                <div className="space-y-2">
                  <Label>Success Record Type</Label>
                  <Select
                    value={stepForm.success_record_type}
                    onValueChange={(value) => setStepForm({ ...stepForm, success_record_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select record type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUCCESS_RECORD_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {stepForm.success_record_type && (
                  <>
                    <div className="space-y-2">
                      <Label>Success Options</Label>
                      {stepForm.success_options && stepForm.success_options.length > 0 ? (
                        <div className="space-y-3">
                          {stepForm.success_options.map((option) => (
                            <div key={option.id} className="flex items-center space-x-2 border p-3 rounded">
                              <div className="grid grid-cols-4 gap-2 flex-1">
                                <div className="col-span-2">
                                  <Label className="text-xs">Option Label</Label>
                                  <Input 
                                    value={option.label}
                                    onChange={(e) => updateSuccessOption(option.id, 'label', e.target.value)}
                                    placeholder="Option label (e.g. Call connected)"
                                    className="mt-1"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <Label className="text-xs">Action</Label>
                                  <Select
                                    value={option.action}
                                    onValueChange={(value) => updateSuccessOption(option.id, 'action', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Action" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="next">Continue to next step</SelectItem>
                                      <SelectItem value="repeat">Repeat current step</SelectItem>
                                      <SelectItem value="jump">Jump to specific step</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                {option.action === 'jump' && (
                                  <div className="col-span-4 mt-2">
                                    <Label className="text-xs">Jump to Step #</Label>
                                    <Input 
                                      type="number" 
                                      value={option.next_step || 1}
                                      onChange={(e) => updateSuccessOption(option.id, 'next_step', parseInt(e.target.value))}
                                      placeholder="Enter step number"
                                      min="1"
                                      className="mt-1"
                                    />
                                  </div>
                                )}
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeSuccessOption(option.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No options added</p>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={addSuccessOption}
                        className="mt-2"
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Option
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Jump to step number - only show if action type is jump */}
            {stepForm.action_type === 'jump' && (
              <div className="space-y-2">
                <Label htmlFor="next_step">Jump to Step Number</Label>
                <Input
                  id="next_step"
                  type="number"
                  min="1"
                  placeholder="Enter step number"
                  value={stepForm.next_step || ''}
                  onChange={(e) => setStepForm({ 
                    ...stepForm, 
                    next_step: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditStepModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditStep}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 