import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Technician, JobQueue, JobStatus } from "../../services/jobService";
import { useToast } from "../../hooks/use-toast";
import { Input } from "../ui/input";
import { Loader2 } from "lucide-react";

interface BulkAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (technicianId: number | null) => Promise<void>;
  technicians: Technician[];
  selectedCount: number;
}

export const BulkAssignModal: React.FC<BulkAssignModalProps> = ({
  isOpen,
  onClose,
  onAssign,
  technicians = [],
  selectedCount
}) => {
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const { toast } = useToast();

  const techniciansArray = Array.isArray(technicians) ? technicians : [];
  

  useEffect(() => {
    if (isOpen) {
      setSelectedTechnicianId("");
    }
  }, [isOpen]);

  const handleAssign = async () => {
    if (!selectedTechnicianId) return;

    setIsAssigning(true);
    try {
      await onAssign(parseInt(selectedTechnicianId, 10));
      
      toast({
        title: "Success",
        description: `Successfully assigned ${selectedCount} job${selectedCount === 1 ? '' : 's'}`
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign jobs"
      });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Jobs</DialogTitle>
          <DialogDescription>
            Select a technician to assign {selectedCount} selected job{selectedCount === 1 ? '' : 's'} to.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="technician" className="text-right">
              Technician
            </Label>
            <div className="col-span-3">
              <Select
                value={selectedTechnicianId}
                onValueChange={setSelectedTechnicianId}
                disabled={isAssigning || techniciansArray.length === 0}
              >
                <SelectTrigger id="technician">
                  <SelectValue placeholder="Select a technician" />
                </SelectTrigger>
                <SelectContent>
                  {techniciansArray.map(tech => (
                    <SelectItem key={tech.id} value={tech.id.toString()}>
                      {tech.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {techniciansArray.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">No technicians found</p>
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
            onClick={handleAssign} 
            disabled={!selectedTechnicianId || isAssigning}
          >
            {isAssigning ? "Assigning..." : "Assign Jobs"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface BulkDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  selectedCount: number;
}

export const BulkDeleteModal: React.FC<BulkDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedCount
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      
      toast({
        title: "Success",
        description: `Successfully deleted ${selectedCount} job${selectedCount === 1 ? '' : 's'}`
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete jobs"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Jobs</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {selectedCount} selected job{selectedCount === 1 ? '' : 's'}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="destructive"
            onClick={handleConfirm} 
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Jobs"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface BulkUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: {
    assignedTo?: number | null;
    dueDate?: string | null;
    queue?: number | null;
    priority?: string | null;
    status?: number | null;
  }) => Promise<void>;
  selectedCount: number;
  technicians: Technician[];
  queues: JobQueue[];
  statuses: JobStatus[];
}

export function BulkUpdateModal({
  isOpen,
  onClose,
  onUpdate,
  selectedCount,
  technicians,
  queues,
  statuses
}: BulkUpdateModalProps) {
  const [assignedTo, setAssignedTo] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [queue, setQueue] = useState<number | null>(null);
  const [priority, setPriority] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" }
  ];

  const handleSubmit = async () => {
    if (!assignedTo && !dueDate && !queue && !priority && !status) {
      toast({
        title: "No changes selected",
        description: "Please select at least one field to update.",
      });
      return;
    }

    setLoading(true);
    try {
      const updates: {
        assignedTo?: number | null;
        dueDate?: string | null;
        queue?: number | null;
        priority?: string | null;
        status?: number | null;
      } = {};
      
      if (assignedTo !== null) updates.assignedTo = assignedTo;
      if (dueDate !== null) updates.dueDate = dueDate;
      if (queue !== null) updates.queue = queue;
      if (priority !== null) updates.priority = priority;
      if (status !== null) updates.status = status;
      
      await onUpdate(updates);
      
      toast({
        title: "Success",
        description: `Updated ${selectedCount} job${selectedCount === 1 ? '' : 's'} successfully.`,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update jobs. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAssignedTo(null);
    setDueDate(null);
    setQueue(null);
    setPriority(null);
    setStatus(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bulk Update Jobs</DialogTitle>
          <DialogDescription>
            Update {selectedCount} selected job{selectedCount === 1 ? '' : 's'}. Leave fields empty to keep current values.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="assignedTo" className="text-right">
              Assigned To
            </Label>
            <Select
              value={assignedTo?.toString() || "none"}
              onValueChange={(value) => setAssignedTo(value === "none" ? null : parseInt(value))}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select technician" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No change</SelectItem>
                {technicians.map((tech) => (
                  <SelectItem key={tech.id} value={tech.id.toString()}>
                    {tech.user.first_name} {tech.user.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dueDate" className="text-right">
              Due Date
            </Label>
            <div className="col-span-3">
              <Input
                id="dueDate"
                type="date"
                value={dueDate || ""}
                onChange={(e) => setDueDate(e.target.value || null)}
                className="col-span-3"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="queue" className="text-right">
              Queue
            </Label>
            <Select
              value={queue?.toString() || "none"}
              onValueChange={(value) => setQueue(value === "none" ? null : parseInt(value))}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select queue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No change</SelectItem>
                {queues.map((q) => (
                  <SelectItem key={q.id} value={q.id.toString()}>
                    {q.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="priority" className="text-right">
              Priority
            </Label>
            <Select
              value={priority || "none"}
              onValueChange={(value) => setPriority(value === "none" ? null : value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No change</SelectItem>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select
              value={status?.toString() || "none"}
              onValueChange={(value) => setStatus(value === "none" ? null : parseInt(value))}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No change</SelectItem>
                {statuses.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Jobs"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 