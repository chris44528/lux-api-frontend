import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import jobService from "../../services/jobService";
import { useToast } from "../../hooks/use-toast";

interface SuccessOption {
  id: string;
  label: string;
  action: string;
  next_step?: number;
}

export interface TaskStep {
  id: number;
  name: string;
  description: string;
  status: string;
  is_conditional: boolean;
  success_record_type?: string;
  success_options?: SuccessOption[];
  step_order: number;
}

interface CompleteStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: number;
  currentStep: TaskStep | null;
  onStepCompleted: (nextStepId?: number) => void;
}

export function CompleteStepModal({
  isOpen,
  onClose,
  taskId,
  currentStep,
  onStepCompleted
}: CompleteStepModalProps) {
  const [notes, setNotes] = useState("");
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Reset form when step changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setNotes("");
      setSelectedOption("");
      setError(null);
      
      // Log the current step data for debugging
      console.log("Current step data:", currentStep);
    }
  }, [isOpen, currentStep]);

  // Set default option if only one exists
  useEffect(() => {
    if (currentStep?.success_options && currentStep.success_options.length === 1) {
      setSelectedOption(currentStep.success_options[0].id);
    }
  }, [currentStep]);

  const handleSubmit = async () => {
    // Validate inputs
    if (!notes.trim()) {
      setError("Please add completion notes");
      return;
    }

    // Check if this is a conditional step that requires an option selection
    if (hasConditionalOptions && !selectedOption) {
      setError("Please select an outcome option");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare data based on step type
      const completionData: Record<string, unknown> = {
        notes: notes.trim()
      };

      // Add selected option data if this is a conditional step with options
      if (hasConditionalOptions && selectedOption) {
        // Find the selected option, either from real or mock options
        const option = displayOptions.find(opt => opt.id === selectedOption);
        
        if (option) {
          completionData.option_id = option.id;
          completionData.action = option.action;
          
          // If action is jump, include the next step
          if (option.action === 'jump' && option.next_step) {
            completionData.next_step = option.next_step;
          }
        }
      }

      console.log("Sending completion data:", completionData);

      // Call the API to complete the step
      const result = await jobService.completeTaskStep(taskId, currentStep?.id as number, completionData);
      
      // Show success message
      toast({
        title: "Step Completed",
        description: `${currentStep?.name} has been marked as complete.`
      });

      // Determine next step based on API response or selected option
      let nextStepId: number | undefined;
      
      if (result && result.next_step) {
        nextStepId = result.next_step;
      } else if (hasConditionalOptions && selectedOption) {
        const option = displayOptions.find(opt => opt.id === selectedOption);
        if (option?.action === 'jump' && option.next_step) {
          nextStepId = option.next_step;
        }
      }

      // Notify parent component
      onStepCompleted(nextStepId);
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error('Error completing step:', error);
      setError("Failed to complete step. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if the current step has conditional options
  const hasConditionalOptions = 
    // Use the is_conditional property if it exists, or force true for testing
    (currentStep?.is_conditional || currentStep?.name === 'Call homeowner') && 
    // Use real success_options if they exist, or provide test options for specific steps
    (currentStep?.success_options || currentStep?.name === 'Call homeowner') ? true : false;
  
  // Mock options for testing if needed
  const displayOptions = currentStep?.success_options || [
    { id: "answered", label: "Customer Answered", action: "next" },
    { id: "didnt_answer", label: "Customer Didn't Answer", action: "jump", next_step: 3 }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Step: {currentStep?.name}</DialogTitle>
          <DialogDescription>
            {currentStep?.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded">
              {error}
            </div>
          )}

          {/* Success options selection for conditional steps */}
          {hasConditionalOptions && (
            <div className="space-y-2">
              <Label htmlFor="success-option">Select Outcome</Label>
              <Select 
                value={selectedOption} 
                onValueChange={setSelectedOption}
              >
                <SelectTrigger id="success-option">
                  <SelectValue placeholder="Choose an outcome" />
                </SelectTrigger>
                <SelectContent>
                  {displayOptions.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Required notes field */}
          <div className="space-y-2">
            <Label htmlFor="notes">Completion Notes (Required)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter details about the step completion..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Complete Step"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 