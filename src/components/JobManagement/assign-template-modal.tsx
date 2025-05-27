import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import jobService, { TaskTemplate } from "../../services/jobService";
import { useToast } from "../../hooks/use-toast";

interface AssignTemplateModalProps {
  jobId: string | number;
  isOpen: boolean;
  onClose: () => void;
  onTemplateAssigned: () => void;
}

export const AssignTemplateModal: React.FC<AssignTemplateModalProps> = ({
  jobId,
  isOpen,
  onClose,
  onTemplateAssigned
}) => {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const { toast } = useToast();

  // Fetch templates
  useEffect(() => {
    if (!isOpen) return;

    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const data = await jobService.getTaskTemplates({ is_active: true });
        setTemplates(data);
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
  }, [isOpen]);

  const handleAssignTemplate = async () => {
    if (!selectedTemplateId) return;

    setIsAssigning(true);
    try {
      await jobService.assignTaskTemplate(jobId, selectedTemplateId);
      
      // Clear the job tasks cache to ensure we fetch the newly created tasks
      if (typeof jobId === 'number') {
        await jobService.clearJobTasksCache(jobId);
      } else {
        const numId = parseInt(String(jobId), 10);
        if (!isNaN(numId)) {
          await jobService.clearJobTasksCache(numId);
        }
      }
      
      toast({
        title: "Success",
        description: "Template assigned successfully"
      });
      onTemplateAssigned();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign template"
      });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Task Template</DialogTitle>
          <DialogDescription>
            Select a task template to assign to this job. This will create a workflow with steps to follow.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="template" className="text-right">
              Template
            </Label>
            <div className="col-span-3">
              <Select
                value={selectedTemplateId}
                onValueChange={setSelectedTemplateId}
                disabled={loading || templates.length === 0}
              >
                <SelectTrigger id="template">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {loading && <p className="text-center text-sm text-muted-foreground">Loading templates...</p>}
        {!loading && templates.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">No active templates found</p>
        )}

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isAssigning}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleAssignTemplate} 
            disabled={!selectedTemplateId || isAssigning}
          >
            {isAssigning ? "Assigning..." : "Assign Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 