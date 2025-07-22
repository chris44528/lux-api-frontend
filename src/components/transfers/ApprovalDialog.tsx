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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';
import transferService from '@/services/transferService';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfer: any;
  onSuccess: () => void;
}

export default function ApprovalDialog({
  open,
  onOpenChange,
  transfer,
  onSuccess,
}: ApprovalDialogProps) {
  const [notes, setNotes] = useState('');
  const [createAccount, setCreateAccount] = useState(true);
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);

  const approvalMutation = useMutation({
    mutationFn: (data: any) => transferService.approveTransfer(transfer.id, data),
    onSuccess: () => {
      toast.success('Transfer approved successfully');
      onSuccess();
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to approve transfer');
    },
  });

  const resetForm = () => {
    setNotes('');
    setCreateAccount(true);
    setSendWelcomeEmail(true);
  };

  const handleSubmit = () => {
    approvalMutation.mutate({
      notes,
      create_account: createAccount,
      send_welcome_email: sendWelcomeEmail,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Approve Transfer
          </DialogTitle>
          <DialogDescription>
            Approve the home owner transfer for {transfer?.site_details?.site_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Approving this transfer will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Mark the transfer as approved</li>
                <li>Update the site ownership records</li>
                {createAccount && <li>Create a new customer account</li>}
                {sendWelcomeEmail && <li>Send welcome email with login details</li>}
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="create-account"
                checked={createAccount}
                onCheckedChange={(checked) => setCreateAccount(checked as boolean)}
              />
              <Label htmlFor="create-account" className="cursor-pointer">
                Create customer account automatically
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="send-email"
                checked={sendWelcomeEmail}
                onCheckedChange={(checked) => setSendWelcomeEmail(checked as boolean)}
                disabled={!createAccount}
              />
              <Label htmlFor="send-email" className="cursor-pointer">
                Send welcome email with login credentials
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Approval Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this approval..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={approvalMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={approvalMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {approvalMutation.isPending ? 'Approving...' : 'Approve Transfer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}