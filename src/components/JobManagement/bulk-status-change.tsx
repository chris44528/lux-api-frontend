import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { JobStatus } from "../../services/jobService";
import { useToast } from "../../hooks/use-toast";
import { Loader2 } from "lucide-react";

interface BulkStatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (statusId: number) => Promise<void>;
  selectedCount: number;
  statuses: JobStatus[];
}

export function BulkStatusChangeModal({
  isOpen,
  onClose,
  onUpdate,
  selectedCount,
  statuses
}: BulkStatusChangeModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!selectedStatus) {
      toast({
        title: "No status selected",
        description: "Please select a status to update.",
      });
      return;
    }

    setLoading(true);
    try {
      await onUpdate(selectedStatus);
      
      toast({
        title: "Success",
        description: `Updated status for ${selectedCount} job${selectedCount === 1 ? '' : 's'} successfully.`,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update job status. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedStatus(null);
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
          <DialogTitle>Change Job Status</DialogTitle>
          <DialogDescription>
            Update status for {selectedCount} selected job{selectedCount === 1 ? '' : 's'}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              New Status
            </Label>
            <Select
              value={selectedStatus?.toString() || ""}
              onValueChange={(value) => setSelectedStatus(parseInt(value))}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
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
          <Button onClick={handleSubmit} disabled={loading || !selectedStatus}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Status"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}