import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { XCircle, AlertTriangle } from 'lucide-react';
import transferService from '@/services/transferService';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

interface RejectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfer: any;
  onSuccess: () => void;
}

const REJECTION_REASONS = [
  { value: 'invalid_docs', label: 'Invalid or fraudulent documents' },
  { value: 'wrong_property', label: 'Wrong property selected' },
  { value: 'duplicate', label: 'Duplicate submission' },
  { value: 'no_response', label: 'No response to information request' },
  { value: 'other', label: 'Other - see notes' },
];

export default function RejectionDialog({
  open,
  onOpenChange,
  transfer,
  onSuccess,
}: RejectionDialogProps) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [sendNotification, setSendNotification] = useState(true);

  const rejectionMutation = useMutation({
    mutationFn: (data: any) => transferService.rejectTransfer(transfer.id, data),
    onSuccess: () => {
      toast.success('Transfer rejected');
      onSuccess();
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to reject transfer');
    },
  });

  const resetForm = () => {
    setReason('');
    setNotes('');
    setSendNotification(true);
  };

  const handleSubmit = () => {
    if (!reason) {
      toast.error('Please select a rejection reason');
      return;
    }
    if (!notes.trim()) {
      toast.error('Please provide rejection notes');
      return;
    }

    rejectionMutation.mutate({
      reason,
      notes,
      send_notification: sendNotification,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Reject Transfer
          </DialogTitle>
          <DialogDescription>
            Reject the home owner transfer for {transfer?.site_details?.site_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Rejecting this transfer will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Mark the transfer as rejected</li>
                <li>Prevent the homeowner from submitting via this link</li>
                {sendNotification && <li>Send a rejection email to the homeowner</li>}
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rejection Reason</Label>
              <RadioGroup value={reason} onValueChange={setReason}>
                {REJECTION_REASONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="cursor-pointer font-normal">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">
                Rejection Notes <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="notes"
                placeholder="Provide detailed reason for rejection..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                required
              />
              <p className="text-sm text-muted-foreground">
                These notes will be recorded internally and may be shared with the homeowner
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="send-notification"
                checked={sendNotification}
                onCheckedChange={(checked) => setSendNotification(checked as boolean)}
              />
              <Label htmlFor="send-notification" className="cursor-pointer">
                Send rejection notification email to homeowner
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={rejectionMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={rejectionMutation.isPending || !reason || !notes.trim()}
          >
            {rejectionMutation.isPending ? 'Rejecting...' : 'Reject Transfer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}