import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Mail, Send } from "lucide-react";
import transferService, { InitiateTransferData } from '@/services/transferService';

interface NewHomeOwnerDialogProps {
  siteId: number;
  siteName: string;
  siteAddress: string;
  existingEmail?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (transferId: number) => void;
}

export default function NewHomeOwnerDialog({
  siteId,
  siteName,
  siteAddress,
  existingEmail,
  open,
  onOpenChange,
  onSuccess,
}: NewHomeOwnerDialogProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState(existingEmail || '');
  const [useExistingEmail, setUseExistingEmail] = useState(!!existingEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const data: InitiateTransferData = {
        site_id: siteId,
        homeowner_email: email,
        use_existing_email: useExistingEmail && email === existingEmail,
      };

      const transfer = await transferService.initiateTransfer(data);

      toast({
        title: "Transfer Initiated",
        description: `Transfer form has been sent to ${email}`,
      });

      onOpenChange(false);
      if (onSuccess) {
        onSuccess(transfer.id);
      }
    } catch (error: any) {
      console.error('Failed to initiate transfer:', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to initiate transfer",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Home Owner Transfer</DialogTitle>
            <DialogDescription>
              Initiate a home owner transfer for {siteName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Property</Label>
              <div className="text-sm text-muted-foreground">
                <div className="font-medium">{siteName}</div>
                <div>{siteAddress}</div>
              </div>
            </div>

            {existingEmail && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="use-existing"
                  checked={useExistingEmail}
                  onCheckedChange={(checked) => {
                    setUseExistingEmail(checked as boolean);
                    if (checked) {
                      setEmail(existingEmail);
                    } else {
                      setEmail('');
                    }
                  }}
                />
                <Label
                  htmlFor="use-existing"
                  className="text-sm font-normal cursor-pointer"
                >
                  Use existing email ({existingEmail})
                </Label>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="inline-block w-4 h-4 mr-2" />
                New Homeowner Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="newhomeowner@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (existingEmail && e.target.value !== existingEmail) {
                    setUseExistingEmail(false);
                  }
                }}
                required
                disabled={useExistingEmail && email === existingEmail}
              />
              <p className="text-sm text-muted-foreground">
                The transfer form will be sent to this email address
              </p>
            </div>

            <div className="rounded-lg bg-muted p-4 space-y-2">
              <h4 className="text-sm font-medium">What happens next?</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• An email will be sent with transfer instructions</li>
                <li>• The homeowner will receive a secure link to complete the form</li>
                <li>• The link will expire in 30 days (can be extended)</li>
                <li>• You'll be notified when the form is completed</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Transfer Form
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}