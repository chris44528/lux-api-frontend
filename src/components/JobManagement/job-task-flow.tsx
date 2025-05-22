"use client"

import { useState } from "react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Separator } from "../ui/separator"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Label } from "../ui/label"
import { 
  ChevronRight, 
  Check, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Phone, 
  FileText,
  Gauge,
  Tool,
  Undo2,
  FileSignature,
  Mail,
  ClipboardList
} from "lucide-react"
import { Progress } from "../ui/progress"

interface JobTaskFlowProps {
  jobId: string
  taskId: string
}

// Mock data for demonstration
const mockTask = {
  id: "task-1",
  name: "Zero Read Investigation",
  description: "Investigate and resolve extended zero readings",
  status: "in_progress",
  completionPercentage: 25,
  currentStep: 1,
  totalSteps: 4,
  startedAt: "2025-03-25T10:30:00",
  steps: [
    {
      id: "step-1",
      name: "Test System & Record Reading",
      description: "Perform a manual test of the meter and record the current reading",
      instructions: "1. Locate the meter\n2. Record the current reading\n3. Note if the display is working\n4. Test signal strength",
      actionType: "reading",
      status: "in_progress",
      stepOrder: 1,
      fields: [
        {
          id: "field-1",
          name: "meter_reading",
          label: "Current Meter Reading",
          fieldType: "number",
          isRequired: true,
          placeholder: "Enter the current meter reading"
        },
        {
          id: "field-2",
          name: "display_working",
          label: "Is the display working?",
          fieldType: "select",
          isRequired: true,
          options: ["Yes", "No", "Partial/Flickering"],
          placeholder: "Select an option"
        },
        {
          id: "field-3",
          name: "signal_strength",
          label: "Signal Strength (dBm)",
          fieldType: "number",
          isRequired: true,
          placeholder: "Enter signal strength"
        },
        {
          id: "field-4",
          name: "notes",
          label: "Additional Notes",
          fieldType: "text",
          isRequired: false,
          placeholder: "Any other observations..."
        }
      ]
    },
    {
      id: "step-2",
      name: "Review System History",
      description: "Examine past readings and notes to identify patterns",
      instructions: "1. Review the last 3 months of readings\n2. Check for previous issues\n3. Note any recurring problems",
      actionType: "documentation",
      status: "pending",
      stepOrder: 2,
      fields: [
        {
          id: "field-5",
          name: "pattern_identified",
          label: "Pattern Identified",
          fieldType: "select",
          isRequired: true,
          options: ["Intermittent Zeros", "Complete Outage", "Declining Readings", "No Pattern", "Other"],
          placeholder: "Select a pattern"
        },
        {
          id: "field-6",
          name: "analysis",
          label: "Analysis Notes",
          fieldType: "text",
          isRequired: true,
          placeholder: "Describe your analysis of the historical data"
        }
      ]
    },
    {
      id: "step-3",
      name: "Call Landlord",
      description: "Contact the landlord to arrange site access",
      instructions: "1. Call the landlord at the primary number\n2. If no answer, try the alternative number\n3. Arrange access for inspection",
      actionType: "call",
      status: "pending",
      stepOrder: 3,
      isConditional: true,
      fields: [
        {
          id: "field-7",
          name: "call_result",
          label: "Call Result",
          fieldType: "select",
          isRequired: true,
          options: ["Reached and Arranged Access", "Left Message", "No Answer", "Wrong Number", "Refused Access"],
          placeholder: "Select call outcome"
        },
        {
          id: "field-8",
          name: "scheduled_date",
          label: "Access Date (if arranged)",
          fieldType: "date",
          isRequired: false,
          placeholder: "Select date"
        },
        {
          id: "field-9",
          name: "call_notes",
          label: "Call Notes",
          fieldType: "text",
          isRequired: false,
          placeholder: "Notes from the conversation"
        }
      ],
      conditionalBranches: [
        {
          conditionName: "No Answer",
          targetStepOrder: 5,
          description: "If landlord does not answer, try email contact"
        },
        {
          conditionName: "Wrong Number",
          targetStepOrder: 6,
          description: "If number is incorrect, research correct contact"
        }
      ]
    },
    {
      id: "step-4",
      name: "Reset Switches",
      description: "Reset the system switches and confirm power restoration",
      instructions: "1. Locate the main switch panel\n2. Turn off the main power\n3. Wait 30 seconds\n4. Turn power back on\n5. Confirm system reboot",
      actionType: "reset",
      status: "pending",
      stepOrder: 4,
      fields: [
        {
          id: "field-10",
          name: "reset_successful",
          label: "Reset Successful",
          fieldType: "select",
          isRequired: true,
          options: ["Yes", "No", "Partial"],
          placeholder: "Select result of reset"
        },
        {
          id: "field-11",
          name: "post_reset_reading",
          label: "Reading After Reset",
          fieldType: "number",
          isRequired: true,
          placeholder: "Enter reading after reset"
        },
        {
          id: "field-12",
          name: "post_reset_notes",
          label: "Notes After Reset",
          fieldType: "text",
          isRequired: false,
          placeholder: "Any observations after reset"
        }
      ]
    },
    {
      id: "step-5",
      name: "Send Email to Landlord",
      description: "Send follow-up email if call unsuccessful",
      instructions: "1. Use the template 'Landlord Access Request'\n2. Include job reference number\n3. Request urgent response",
      actionType: "email",
      status: "pending",
      stepOrder: 5,
      fields: [
        {
          id: "field-13",
          name: "email_sent",
          label: "Email Sent",
          fieldType: "checkbox",
          isRequired: true
        },
        {
          id: "field-14",
          name: "email_notes",
          label: "Email Notes",
          fieldType: "text",
          isRequired: false,
          placeholder: "Additional notes about the email sent"
        }
      ]
    },
    {
      id: "step-6",
      name: "Research Correct Contact",
      description: "Research correct contact information",
      instructions: "1. Check property records\n2. Contact agent if applicable\n3. Update system with correct details",
      actionType: "documentation",
      status: "pending",
      stepOrder: 6,
      fields: [
        {
          id: "field-15",
          name: "new_contact_found",
          label: "New Contact Found",
          fieldType: "select",
          isRequired: true,
          options: ["Yes", "No"],
          placeholder: "Was a new contact found?"
        },
        {
          id: "field-16",
          name: "new_phone",
          label: "New Phone Number",
          fieldType: "text",
          isRequired: false,
          placeholder: "Enter new phone number"
        },
        {
          id: "field-17",
          name: "new_email",
          label: "New Email",
          fieldType: "text",
          isRequired: false,
          placeholder: "Enter new email"
        }
      ]
    }
  ]
}

export function JobTaskFlow({ jobId, taskId }: JobTaskFlowProps) {
  const [task] = useState(mockTask)
  const [currentStepIndex, setCurrentStepIndex] = useState(task.currentStep - 1)
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  
  const currentStep = task.steps[currentStepIndex]

  // Get icon for step type
  const getStepIcon = (actionType: string) => {
    switch (actionType) {
      case 'reading':
        return <Gauge className="h-5 w-5" />
      case 'call':
        return <Phone className="h-5 w-5" />
      case 'email':
        return <Mail className="h-5 w-5" />
      case 'form':
        return <ClipboardList className="h-5 w-5" />
      case 'verification':
        return <CheckCircle2 className="h-5 w-5" />
      case 'site_visit':
        return <FileSignature className="h-5 w-5" />
      case 'reset':
        return <Undo2 className="h-5 w-5" />
      case 'documentation':
        return <FileText className="h-5 w-5" />
      default:
        return <Tool className="h-5 w-5" />
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'in_progress':
        return <AlertCircle className="h-5 w-5 text-amber-500" />
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300"></div>
    }
  }

  // Get step status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      case 'in_progress':
        return <Badge className="bg-amber-100 text-amber-800">In Progress</Badge>
      case 'skipped':
        return <Badge className="bg-gray-100 text-gray-800">Skipped</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>
    }
  }

  // Handle input change
  const handleInputChange = (fieldId: string, value: any) => {
    setFormValues({
      ...formValues,
      [fieldId]: value
    })
    
    // Clear error if field has a value
    if (value && formErrors[fieldId]) {
      const newErrors = {...formErrors}
      delete newErrors[fieldId]
      setFormErrors(newErrors)
    }
  }

  // Handle form submission
  const handleSubmit = () => {
    // Validate required fields
    const errors: Record<string, string> = {}
    currentStep.fields.forEach(field => {
      if (field.isRequired && !formValues[field.id]) {
        errors[field.id] = 'This field is required'
      }
    })

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    // Process conditional branches if present
    if (currentStep.isConditional && currentStep.conditionalBranches) {
      const callResult = formValues['field-7']
      
      if (callResult === 'No Answer') {
        // Transition to step 5 (Email landlord)
        setCurrentStepIndex(4) // 0-based index for step 5
        return
      } else if (callResult === 'Wrong Number') {
        // Transition to step 6 (Research correct contact)
        setCurrentStepIndex(5) // 0-based index for step 6
        return
      }
    }

    // Default transition to next step
    if (currentStepIndex < task.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    }
  }

  // Render field based on type
  const renderField = (field: any) => {
    const hasError = !!formErrors[field.id]
    
    switch (field.fieldType) {
      case 'text':
        return (
          <div className="space-y-1">
            <Label htmlFor={field.id} className={hasError ? 'text-red-500' : ''}>{field.label}{field.isRequired && <span className="text-red-500">*</span>}</Label>
            <Textarea 
              id={field.id} 
              placeholder={field.placeholder}
              value={formValues[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={hasError ? 'border-red-500' : ''}
            />
            {hasError && <p className="text-red-500 text-sm">{formErrors[field.id]}</p>}
          </div>
        )
      case 'number':
        return (
          <div className="space-y-1">
            <Label htmlFor={field.id} className={hasError ? 'text-red-500' : ''}>{field.label}{field.isRequired && <span className="text-red-500">*</span>}</Label>
            <Input 
              id={field.id} 
              type="number" 
              placeholder={field.placeholder}
              value={formValues[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={hasError ? 'border-red-500' : ''}
            />
            {hasError && <p className="text-red-500 text-sm">{formErrors[field.id]}</p>}
          </div>
        )
      case 'select':
        return (
          <div className="space-y-1">
            <Label htmlFor={field.id} className={hasError ? 'text-red-500' : ''}>{field.label}{field.isRequired && <span className="text-red-500">*</span>}</Label>
            <select 
              id={field.id} 
              className={`w-full rounded-md border px-3 py-2 ${hasError ? 'border-red-500' : ''}`}
              value={formValues[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            >
              <option value="">{field.placeholder}</option>
              {field.options?.map((option: string) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {hasError && <p className="text-red-500 text-sm">{formErrors[field.id]}</p>}
          </div>
        )
      case 'date':
        return (
          <div className="space-y-1">
            <Label htmlFor={field.id} className={hasError ? 'text-red-500' : ''}>{field.label}{field.isRequired && <span className="text-red-500">*</span>}</Label>
            <Input 
              id={field.id} 
              type="date" 
              value={formValues[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={hasError ? 'border-red-500' : ''}
            />
            {hasError && <p className="text-red-500 text-sm">{formErrors[field.id]}</p>}
          </div>
        )
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <input 
              id={field.id} 
              type="checkbox" 
              className="rounded border-gray-300"
              checked={formValues[field.id] || false}
              onChange={(e) => handleInputChange(field.id, e.target.checked)}
            />
            <Label htmlFor={field.id} className={hasError ? 'text-red-500' : ''}>{field.label}{field.isRequired && <span className="text-red-500">*</span>}</Label>
            {hasError && <p className="text-red-500 text-sm">{formErrors[field.id]}</p>}
          </div>
        )
      default:
        return (
          <div className="space-y-1">
            <Label htmlFor={field.id} className={hasError ? 'text-red-500' : ''}>{field.label}{field.isRequired && <span className="text-red-500">*</span>}</Label>
            <Input 
              id={field.id} 
              placeholder={field.placeholder}
              value={formValues[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={hasError ? 'border-red-500' : ''}
            />
            {hasError && <p className="text-red-500 text-sm">{formErrors[field.id]}</p>}
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">{task.name}</h2>
          <p className="text-muted-foreground">{task.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">Task Progress:</div>
          <Progress value={task.completionPercentage} className="w-40" />
          <div className="text-sm font-medium">{task.completionPercentage}%</div>
        </div>
      </div>

      {/* Steps overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Task Steps</CardTitle>
          <CardDescription>Progress through the steps to complete this task</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {task.steps.map((step, index) => (
              <div key={step.id} className={`flex items-start p-2 rounded-md ${currentStepIndex === index ? 'bg-gray-100' : ''}`}>
                <div className="mr-3 mt-1">{getStatusIcon(step.status)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">
                      {step.stepOrder}. {step.name}
                    </div>
                    {getStatusBadge(step.status)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                    {getStepIcon(step.actionType)}
                    <span>{step.description}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current step */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="bg-primary rounded-full p-1 text-white">
                  {getStepIcon(currentStep.actionType)}
                </div>
                <CardTitle className="text-lg">Step {currentStep.stepOrder}: {currentStep.name}</CardTitle>
              </div>
              <CardDescription>{currentStep.description}</CardDescription>
            </div>
            {getStatusBadge(currentStep.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Instructions */}
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="font-medium mb-2">Instructions:</div>
              <div className="text-sm whitespace-pre-line">{currentStep.instructions}</div>
            </div>

            {/* Conditional indicators if applicable */}
            {currentStep.isConditional && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
                <div className="font-medium mb-2 text-amber-800">This step has conditional branches:</div>
                <div className="space-y-2">
                  {currentStep.conditionalBranches?.map((branch, index) => (
                    <div key={index} className="text-sm flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 mt-0.5 text-amber-800" />
                      <div>
                        <span className="font-medium">If {branch.conditionName}:</span> {branch.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form fields */}
            <div className="space-y-4">
              <div className="font-medium">Required Information:</div>
              <div className="grid gap-4 md:grid-cols-2">
                {currentStep.fields.map((field) => (
                  <div key={field.id} className={field.fieldType === 'text' ? 'md:col-span-2' : ''}>
                    {renderField(field)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-0">
          <Button 
            variant="outline" 
            disabled={currentStepIndex === 0}
            onClick={() => setCurrentStepIndex(currentStepIndex - 1)}
          >
            Previous Step
          </Button>
          <Button onClick={handleSubmit}>
            {currentStepIndex === task.steps.length - 1 ? (
              <>Complete Task <Check className="ml-2 h-4 w-4" /></>
            ) : (
              <>Next Step <ChevronRight className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 