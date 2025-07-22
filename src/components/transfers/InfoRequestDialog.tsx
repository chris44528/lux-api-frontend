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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageSquare, Info, Calendar } from 'lucide-react';
import transferService from '@/services/transferService';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';

interface InfoRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfer: any;
  onSuccess: () => void;
}

const PRESET_REASONS = [
  {
    id: 'missing_doc',
    label: 'Missing documentation',
    template: 'We need you to upload the following documents: [SPECIFY DOCUMENTS]',
  },
  {
    id: 'unclear_info',
    label: 'Unclear information',
    template: 'The information provided for [FIELD] is unclear. Please clarify: [SPECIFIC QUESTION]',
  },
  {
    id: 'address_mismatch',
    label: 'Address mismatch',
    template: 'The postal address provided does not match our records. Please confirm the correct address.',
  },
  {
    id: 'date_issue',
    label: 'Date verification',
    template: 'The sale completion date appears to be incorrect. Please verify and provide the correct date.',
  },
  {
    id: 'name_discrepancy',
    label: 'Name discrepancy',
    template: 'There is a discrepancy in the proprietor names. Please provide clarification on: [SPECIFIC ISSUE]',
  },
];

export default function InfoRequestDialog({
  open,
  onOpenChange,
  transfer,
  onSuccess,
}: InfoRequestDialogProps) {
  const [activeTab, setActiveTab] = useState('custom');
  const [reason, setReason] = useState('');
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [deadlineDays, setDeadlineDays] = useState(7);
  const [specificFields, setSpecificFields] = useState<any>({});

  const infoRequestMutation = useMutation({
    mutationFn: (data: any) => transferService.requestInfo(transfer.id, data),
    onSuccess: () => {
      toast.success('Information request sent');
      onSuccess();
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to send information request');
    },
  });

  const resetForm = () => {
    setReason('');
    setSelectedPresets([]);
    setDeadlineDays(7);
    setSpecificFields({});
    setActiveTab('custom');
  };

  const handlePresetToggle = (presetId: string) => {
    setSelectedPresets((prev) =>
      prev.includes(presetId)
        ? prev.filter((id) => id !== presetId)
        : [...prev, presetId]
    );
  };

  const buildReasonFromPresets = () => {
    const selectedTemplates = PRESET_REASONS
      .filter((preset) => selectedPresets.includes(preset.id))
      .map((preset) => preset.template);
    
    return selectedTemplates.join('\n\n');
  };

  const handleSubmit = () => {
    let finalReason = reason;
    
    if (activeTab === 'preset') {
      finalReason = buildReasonFromPresets();
      if (!finalReason) {
        toast.error('Please select at least one preset reason');
        return;
      }
    }
    
    if (!finalReason.trim()) {
      toast.error('Please provide a reason for the information request');
      return;
    }

    infoRequestMutation.mutate({
      reason: finalReason,
      deadline_days: deadlineDays,
      specific_fields: specificFields,
      preset_reasons: activeTab === 'preset' ? selectedPresets : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            Request Information
          </DialogTitle>
          <DialogDescription>
            Request additional information from the homeowner for {transfer?.site_details?.site_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Change the transfer status to "Needs Information"</li>
                <li>Send an email to the homeowner with your request</li>
                <li>Set a deadline for response (default: 7 days)</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="custom">Custom Request</TabsTrigger>
              <TabsTrigger value="preset">Use Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="custom" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-reason">
                  Information Request <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="custom-reason"
                  placeholder="Please describe what information you need from the homeowner..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={6}
                />
                <p className="text-sm text-muted-foreground">
                  Be specific about what information or documents you need
                </p>
              </div>
            </TabsContent>

            <TabsContent value="preset" className="space-y-4">
              <div className="space-y-3">
                <Label>Select Template(s)</Label>
                {PRESET_REASONS.map((preset) => (
                  <div key={preset.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={preset.id}
                      checked={selectedPresets.includes(preset.id)}
                      onCheckedChange={() => handlePresetToggle(preset.id)}
                    />
                    <div className="flex-1 space-y-1">
                      <Label htmlFor={preset.id} className="cursor-pointer font-medium">
                        {preset.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">{preset.template}</p>
                    </div>
                  </div>
                ))}
                <p className="text-sm text-muted-foreground">
                  Selected templates will be combined in the request. Remember to fill in the [PLACEHOLDERS]
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="deadline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Response Deadline (days)
            </Label>
            <Input
              id="deadline"
              type="number"
              min="1"
              max="30"
              value={deadlineDays}
              onChange={(e) => setDeadlineDays(parseInt(e.target.value) || 7)}
            />
            <p className="text-sm text-muted-foreground">
              The homeowner will have {deadlineDays} days to respond
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={infoRequestMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={infoRequestMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {infoRequestMutation.isPending ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}