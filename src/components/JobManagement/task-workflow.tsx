import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Input } from "../ui/input";

export interface TaskStep {
  id: number;  // This is the TaskStepInstance id
  template_step_id?: number;  // This is the TaskStep id from the template
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  step_order: number;
  completed_at?: string;
  performed_by?: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
  };
  is_conditional?: boolean;
  success_record_type?: string;
  success_options?: {
    id: string;
    label: string;
    action: string;
    next_step?: number;
  }[];
  job_task_id?: number;  // Made optional since it might be undefined
}

export interface WorkflowTask {
  id: number;
  name: string;
  status: string;
  steps: TaskStep[];
  completion_percentage: number;
  template: {
    id: number;
    name: string;
  };
}

interface TaskWorkflowProps {
  task: WorkflowTask;
  onCompleteStep: (taskId: number, stepId: number, fieldValues: Record<string, unknown>) => Promise<void>;
  loading?: boolean;
}

export const TaskWorkflow: React.FC<TaskWorkflowProps> = ({ 
  task, 
  onCompleteStep,
  loading = false 
}) => {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [textValue, setTextValue] = useState<string>("");
  const [numberValue, setNumberValue] = useState<string>("");
  const [checkboxValue, setCheckboxValue] = useState(false);
  
  // Set active step based on task status
  useEffect(() => {
    const pendingStep = task.steps.find(step => step.status === 'pending');
    if (pendingStep) {
      setActiveStep(pendingStep.id);
    } else {
      const inProgressStep = task.steps.find(step => step.status === 'in_progress');
      if (inProgressStep) {
        setActiveStep(inProgressStep.id);
      }
    }
  }, [task]);

  // Add a useEffect to reset form values when active step changes
  useEffect(() => {
    if (activeStep) {
      const currentStep = task.steps.find(s => s.id === activeStep);
      console.log("Active step changed:", {
        stepId: activeStep,
        name: currentStep?.name,
        is_conditional: currentStep?.is_conditional,
        successRecordType: currentStep?.success_record_type,
        successOptions: JSON.stringify(currentStep?.success_options)
      });
      
      // Reset form values when active step changes
      setSelectedOption("");
      setTextValue("");
      setNumberValue("");
      setCheckboxValue(false);
    }
  }, [activeStep, task.steps]);

  const getStepStatus = (step: TaskStep) => {
    switch (step.status) {
      case 'completed':
        return { color: 'text-green-500 bg-green-100', icon: '✓', text: 'Completed' };
      case 'in_progress':
        return { color: 'text-blue-500 bg-blue-100', icon: '›', text: 'In Progress' };
      case 'failed':
        return { color: 'text-red-500 bg-red-100', icon: '✗', text: 'Failed' };
      case 'skipped':
        return { color: 'text-gray-500 bg-gray-100', icon: '→', text: 'Skipped' };
      default:
        return { color: 'text-gray-500 bg-gray-100', icon: '○', text: 'Pending' };
    }
  };

  const handleConditionalStep = async (stepId: number) => {
    if (!stepId) return;
    
    const currentStep = task.steps.find(s => s.id === stepId);
    if (!currentStep) return;
    
    // For non-conditional steps (except Call homeowner), complete with empty field values
    if (!currentStep.is_conditional && currentStep.name && currentStep.name !== 'Call homeowner') {
      console.log("Completing non-conditional step");
      await onCompleteStep(task.id, currentStep.id, {});
      return;
    }
    
    // Special case for Call homeowner - force it to be treated as conditional
    const isCallHomeowner = currentStep.name === 'Call homeowner';
    
    // Validate the input based on the record type
    let isValid = true;
    let errorMessage = "";
    
    // For Call homeowner, ensure an option is selected
    if (isCallHomeowner && !selectedOption) {
      isValid = false;
      errorMessage = "Please select whether the homeowner answered";
    } else if (currentStep.success_record_type === 'dropdown' && !selectedOption) {
      isValid = false;
      errorMessage = "Please select an outcome option";
    } else if (currentStep.success_record_type === 'text' && !textValue.trim()) {
      isValid = false;
      errorMessage = "Please enter a text response";
    } else if (currentStep.success_record_type === 'number' && !numberValue) {
      isValid = false;
      errorMessage = "Please enter a numeric value";
    }
    
    if (!isValid) {
      alert(errorMessage);
      return;
    }
    
    // Create field values based on the record type
    const fieldValues: Record<string, unknown> = {};
    
    // For Call homeowner, always use selected_option with special handling for didnt_answer
    if (isCallHomeowner) {
      // Map the UI option to match the backend expected values
      // If didnt_answer is selected, we'll send "repeat" as the action
      if (selectedOption === 'didnt_answer') {
        fieldValues['selected_option'] = 'repeat';
      } else {
        fieldValues['selected_option'] = selectedOption;
      }
    } else if (currentStep.is_conditional || currentStep.success_record_type) {
      // For any conditional step, always include selected_option
      if (selectedOption) {
        fieldValues['selected_option'] = selectedOption;
      }
      
      // Add additional fields based on record type
      if (currentStep.success_record_type) {
        switch (currentStep.success_record_type) {
          case 'text':
            fieldValues['text_value'] = textValue;
            break;
          case 'number':
            fieldValues['number_value'] = parseFloat(numberValue);
            break;
          case 'checkbox':
            fieldValues['checkbox_value'] = checkboxValue;
            break;
        }
      }
    }
    
    // Complete the step with the field values
    try {
      console.log('Completing step with values:', fieldValues);
      await onCompleteStep(task.id, currentStep.id, fieldValues);
      
      // Reset the form values
      setSelectedOption("");
      setTextValue("");
      setNumberValue("");
      setCheckboxValue(false);
      
      // Force a reload of the page to show the updated workflow
      window.location.reload();
    } catch (error) {
      console.error("Error completing step:", error);
      alert(`Error completing step: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Find the next step after the current active step
  const getNextStep = (steps: TaskStep[]): TaskStep | null => {
    if (!activeStep) return null;
    
    const sortedSteps = [...steps].sort((a, b) => a.step_order - b.step_order);
    const currentIndex = sortedSteps.findIndex(step => step.id === activeStep);
    
    if (currentIndex !== -1 && currentIndex < sortedSteps.length - 1) {
      return sortedSteps[currentIndex + 1];
    }
    
    return null;
  };

  const nextStep = getNextStep(task.steps);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Process Flow</CardTitle>
          <CardDescription>Current progress through the workflow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium">Process Flow</h3>
              <div className="mt-2 flex items-center justify-between">
                {task.steps.map((step, index) => {
                  const status = getStepStatus(step);
                  const isActive = step.id === activeStep;
                  
                  return (
                    <React.Fragment key={step.id}>
                      <div className="flex flex-col items-center">
                        <div 
                          className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${status.color} ${isActive ? 'ring-2 ring-blue-500' : ''}`}
                        >
                          {status.icon}
                        </div>
                        <span className="mt-2 text-sm">{step.name}</span>
                      </div>
                      
                      {index < task.steps.length - 1 && (
                        <div className="h-px bg-gray-200 w-full mx-2"></div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
              
              <div className="mt-6 text-right">
                <p className="text-sm text-gray-500">Next: {nextStep ? nextStep.name : 'Complete'}</p>
              </div>
            </div>

            <Separator />
            
            <div>
              <h3 className="font-medium mb-4">Current Step: {task.steps.find(s => s.id === activeStep)?.name || 'None'}</h3>
              
              {task.steps.find(s => s.id === activeStep) && (
                <div className="space-y-4">
                  <p className="text-sm">{task.steps.find(s => s.id === activeStep)?.description}</p>
                  
                  {/* Debug info */}
                  {process.env.NODE_ENV !== 'production' && (
                    <div className="p-2 border border-gray-200 rounded-md mb-2 text-xs">
                      <div>Step ID: {activeStep}</div>
                      <div>Is Conditional: {task.steps.find(s => s.id === activeStep)?.is_conditional ? 'Yes' : 'No'}</div>
                      <div>Record Type: {task.steps.find(s => s.id === activeStep)?.success_record_type || 'None'}</div>
                      <div>Options: {task.steps.find(s => s.id === activeStep)?.success_options?.length || 0}</div>
                      <div>Raw Options: {JSON.stringify(task.steps.find(s => s.id === activeStep)?.success_options)}</div>
                    </div>
                  )}
                  
                  {/* Inline outcome selection for conditional steps - ALWAYS show radio options for conditional steps */}
                  {activeStep && 
                   (task.steps.find(s => s.id === activeStep)?.is_conditional || 
                    task.steps.find(s => s.id === activeStep)?.name === 'Call homeowner' ||
                    task.steps.find(s => s.id === activeStep)?.success_record_type === 'dropdown') && (
                    <div className="space-y-4 my-4 p-4 bg-gray-50 rounded-md">
                      <h4 className="font-medium text-sm">Outcome</h4>
                      <div className="space-y-2">
                        {/* Radio buttons for outcome selection - add hardcoded values if none exist */}
                        <div className="grid grid-cols-1 gap-2">
                          {(() => {
                            // Get the current step once to avoid repeating lookups
                            const currentStep = task.steps.find(s => s.id === activeStep);
                            console.log("Rendering options for step:", {
                              stepId: activeStep,
                              name: currentStep?.name,
                              isConditional: currentStep?.is_conditional,
                              successRecordType: currentStep?.success_record_type,
                              hasSuccessOptions: currentStep?.success_options && currentStep.success_options.length > 0,
                              successOptionsCount: currentStep?.success_options?.length,
                              successOptions: currentStep?.success_options
                            });
                            
                            // If we have success options from the backend, use those
                            if (currentStep?.success_options && currentStep.success_options.length > 0) {
                              return currentStep.success_options.map(option => (
                                <label 
                                  key={option.id} 
                                  className={`flex items-center space-x-2 p-2 border rounded-md cursor-pointer hover:bg-gray-100 ${selectedOption === option.action ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                                >
                                  <input
                                    type="radio"
                                    className="w-4 h-4 text-blue-600"
                                    checked={selectedOption === option.action}
                                    onChange={() => {
                                      console.log("Selected option:", option.label, option.action);
                                      setSelectedOption(option.action);
                                    }}
                                  />
                                  <span>{option.label}</span>
                                </label>
                              ));
                            }
                            
                            // Special handling for Call homeowner step - show default options
                            if (currentStep?.name === 'Call homeowner') {
                              return (
                                <>
                                  <label 
                                    className={`flex items-center space-x-2 p-2 border rounded-md cursor-pointer hover:bg-gray-100 ${selectedOption === 'answered' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                                  >
                                    <input
                                      type="radio"
                                      className="w-4 h-4 text-blue-600"
                                      checked={selectedOption === 'answered'}
                                      onChange={() => {
                                        console.log("Selected option: answered");
                                        setSelectedOption('answered');
                                      }}
                                    />
                                    <span>Answered</span>
                                  </label>
                                  <label 
                                    className={`flex items-center space-x-2 p-2 border rounded-md cursor-pointer hover:bg-gray-100 ${selectedOption === 'didnt_answer' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                                  >
                                    <input
                                      type="radio"
                                      className="w-4 h-4 text-blue-600"
                                      checked={selectedOption === 'didnt_answer'}
                                      onChange={() => {
                                        console.log("Selected option: didnt_answer");
                                        setSelectedOption('didnt_answer');
                                      }}
                                    />
                                    <span>Didn't answer</span>
                                  </label>
                                </>
                              );
                            }
                            
                            // For other conditional steps or dropdown types with no options, provide generic defaults
                            if (currentStep?.is_conditional || currentStep?.success_record_type === 'dropdown') {
                              return (
                                <>
                                  <label 
                                    className={`flex items-center space-x-2 p-2 border rounded-md cursor-pointer hover:bg-gray-100 ${selectedOption === 'success' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                                  >
                                    <input
                                      type="radio"
                                      className="w-4 h-4 text-blue-600"
                                      checked={selectedOption === 'success'}
                                      onChange={() => {
                                        console.log("Selected option: success");
                                        setSelectedOption('success');
                                      }}
                                    />
                                    <span>Success</span>
                                  </label>
                                  <label 
                                    className={`flex items-center space-x-2 p-2 border rounded-md cursor-pointer hover:bg-gray-100 ${selectedOption === 'failure' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                                  >
                                    <input
                                      type="radio"
                                      className="w-4 h-4 text-blue-600"
                                      checked={selectedOption === 'failure'}
                                      onChange={() => {
                                        console.log("Selected option: failure");
                                        setSelectedOption('failure');
                                      }}
                                    />
                                    <span>Issue Encountered</span>
                                  </label>
                                </>
                              );
                            }
                            
                            // If we reach here, there are no options to show
                            return (
                              <p className="text-sm text-gray-500">No outcome options found for this step</p>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Text input for text conditional steps */}
                  {activeStep && 
                   task.steps.find(s => s.id === activeStep)?.is_conditional && 
                   task.steps.find(s => s.id === activeStep)?.success_record_type === 'text' && (
                    <div className="space-y-2 my-4">
                      <Label htmlFor="text-input">Enter response:</Label>
                      <Input
                        id="text-input"
                        value={textValue}
                        onChange={(e) => setTextValue(e.target.value)}
                        placeholder="Type your response here"
                      />
                    </div>
                  )}
                  
                  {/* Number input for number conditional steps */}
                  {activeStep && 
                   task.steps.find(s => s.id === activeStep)?.is_conditional && 
                   task.steps.find(s => s.id === activeStep)?.success_record_type === 'number' && (
                    <div className="space-y-2 my-4">
                      <Label htmlFor="number-input">Enter value:</Label>
                      <Input
                        id="number-input"
                        type="number"
                        value={numberValue}
                        onChange={(e) => setNumberValue(e.target.value)}
                        placeholder="Enter a number"
                      />
                    </div>
                  )}
                  
                  {/* Checkbox for checkbox conditional steps */}
                  {activeStep && 
                   task.steps.find(s => s.id === activeStep)?.is_conditional && 
                   task.steps.find(s => s.id === activeStep)?.success_record_type === 'checkbox' && (
                    <div className="flex items-center space-x-2 my-4">
                      <Checkbox
                        id="checkbox-input"
                        checked={checkboxValue}
                        onCheckedChange={(checked: boolean | "indeterminate") => 
                          setCheckboxValue(checked === true)}
                      />
                      <Label htmlFor="checkbox-input">Mark as completed</Label>
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => {
                      if (!activeStep) return;
                      
                      const currentStep = task.steps.find(s => s.id === activeStep);
                      
                      // Check if this is a conditional step that needs input
                      if (currentStep?.is_conditional || (currentStep && currentStep.name === 'Call homeowner')) {
                        handleConditionalStep(activeStep);
                      } else {
                        // Non-conditional steps
                        handleConditionalStep(activeStep);
                      }
                    }}
                    disabled={(loading === true) || !activeStep || Boolean(
                      activeStep && 
                      (task.steps.find(s => s.id === activeStep)?.is_conditional || 
                       task.steps.find(s => s.id === activeStep)?.name === 'Call homeowner') && 
                      !selectedOption
                    )}
                    className="w-full"
                  >
                    {loading ? 'Processing...' : 'Complete Step'}
                  </Button>
                </div>
              )}
              
              {!activeStep && task.steps.every(step => step.status === 'completed') && (
                <div className="p-4 bg-green-50 rounded-md text-center">
                  <p className="text-green-700 font-medium">All steps completed!</p>
                </div>
              )}
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-medium mb-2">Step History</h3>
              <div className="space-y-2">
                {[...task.steps]
                  .filter(step => step.status === 'completed' && step.completed_at)
                  .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
                  .map(step => (
                    <div key={step.id} className="flex justify-between items-center text-sm">
                      <span>{step.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">
                          {new Date(step.completed_at!).toLocaleString()}
                        </span>
                        <Badge variant="outline" className="ml-2">
                          {step.performed_by ? 
                            `${step.performed_by.first_name} ${step.performed_by.last_name}` : 
                            'System'}
                        </Badge>
                      </div>
                    </div>
                  ))
                }
                
                {task.steps.filter(step => step.status === 'completed').length === 0 && (
                  <p className="text-sm text-gray-500">No steps completed yet</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}; 