import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, AlertCircle, Copy } from "lucide-react";
import { agedCasesService, AgedCaseTemplate } from '../../services/agedCasesService';
import { useToast } from "@/hooks/use-toast";

interface AgedCaseTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  template: AgedCaseTemplate | null;
  onSuccess: () => void;
}

interface CommunicationStep {
  id: string;
  channel: 'email' | 'sms' | 'whatsapp';
  delayDays: number;
  templateContent?: string;
  subject?: string;
}

interface FormData {
  name: string;
  escalation_tier: number;
  channel: 'email' | 'sms' | 'whatsapp';
  case_type: string | null;
  subject: string;
  content: string;
  active: boolean;
  communicationFlow?: CommunicationStep[];
}

const availableVariables = [
  { name: '{{customer_name}}', description: 'Customer\'s full name' },
  { name: '{{site_name}}', description: 'Site name or address' },
  { name: '{{last_reading}}', description: 'Last meter reading value' },
  { name: '{{last_reading_date}}', description: 'Date of last reading' },
  { name: '{{days_without_reading}}', description: 'Days since last reading' },
  { name: '{{savings_loss}}', description: 'Total savings loss' },
  { name: '{{daily_savings_loss}}', description: 'Daily savings loss' },
  { name: '{{expected_generation}}', description: 'Expected daily generation' },
  { name: '{{ticket_number}}', description: 'Support ticket number' },
  { name: '{{portal_link}}', description: 'Link to customer portal' },
];

const AgedCaseTemplateDialog: React.FC<AgedCaseTemplateDialogProps> = ({
  isOpen,
  onClose,
  template,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('basic');
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    escalation_tier: 1,
    channel: 'email',
    case_type: null,
    subject: '',
    content: '',
    active: true,
    communicationFlow: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        escalation_tier: template.escalation_tier,
        channel: template.channel,
        case_type: template.case_type,
        subject: template.subject || '',
        content: template.content,
        active: template.active,
        communicationFlow: [], // TODO: Load from backend when implemented
      });
    } else {
      // Reset form for new template
      setFormData({
        name: '',
        escalation_tier: 1,
        channel: 'email',
        case_type: null,
        subject: '',
        content: '',
        active: true,
        communicationFlow: [{
          id: Date.now().toString(),
          channel: 'email',
          delayDays: 0,
          templateContent: '',
          subject: '',
        }],
      });
    }
  }, [template]);

  const createMutation = useMutation({
    mutationFn: (data: Partial<AgedCaseTemplate>) => agedCasesService.createTemplate(data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Template created successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create template",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<AgedCaseTemplate>) => agedCasesService.updateTemplate(template!.id, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Template updated successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update template",
        variant: "destructive",
      });
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Template content is required';
    }

    if (formData.channel === 'email' && !formData.subject.trim()) {
      newErrors.subject = 'Subject is required for email templates';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const templateData: Partial<AgedCaseTemplate> = {
      name: formData.name,
      escalation_tier: formData.escalation_tier,
      channel: formData.channel,
      case_type: formData.case_type,
      subject: formData.subject || '',
      content: formData.content,
      active: formData.active,
    };

    if (template) {
      updateMutation.mutate(templateData);
    } else {
      createMutation.mutate(templateData);
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('template-content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = formData.content.substring(0, start) + variable + formData.content.substring(end);
      setFormData({ ...formData, content: newContent });
      
      // Restore cursor position after React re-render
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + variable.length;
        textarea.focus();
      }, 0);
    }
  };

  const addCommunicationStep = () => {
    const newStep: CommunicationStep = {
      id: Date.now().toString(),
      channel: 'email',
      delayDays: formData.communicationFlow?.length ? 
        (formData.communicationFlow[formData.communicationFlow.length - 1].delayDays + 1) : 1,
      templateContent: '',
      subject: '',
    };
    
    setFormData({
      ...formData,
      communicationFlow: [...(formData.communicationFlow || []), newStep],
    });
  };

  const removeCommunicationStep = (stepId: string) => {
    setFormData({
      ...formData,
      communicationFlow: formData.communicationFlow?.filter(step => step.id !== stepId) || [],
    });
  };

  const updateCommunicationStep = (stepId: string, field: keyof CommunicationStep, value: any) => {
    setFormData({
      ...formData,
      communicationFlow: formData.communicationFlow?.map(step =>
        step.id === stepId ? { ...step, [field]: value } : step
      ) || [],
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit Template' : 'Create New Template'}
          </DialogTitle>
          <DialogDescription>
            Create or edit aged case communication templates with variables and communication flow
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="flow">Communication Flow</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Template Name*</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Tier 1 - Initial Contact"
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="tier">Escalation Tier*</Label>
                  <Select
                    value={formData.escalation_tier.toString()}
                    onValueChange={(value) => setFormData({ ...formData, escalation_tier: parseInt(value) })}
                  >
                    <SelectTrigger id="tier">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Tier 1</SelectItem>
                      <SelectItem value="2">Tier 2</SelectItem>
                      <SelectItem value="3">Tier 3</SelectItem>
                      <SelectItem value="4">Tier 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="channel">Channel*</Label>
                  <Select
                    value={formData.channel}
                    onValueChange={(value: 'email' | 'sms' | 'whatsapp') => 
                      setFormData({ ...formData, channel: value })}
                  >
                    <SelectTrigger id="channel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="case_type">Case Type (Optional)</Label>
                <Select
                  value={formData.case_type || 'all'}
                  onValueChange={(value) => setFormData({ ...formData, case_type: value === 'all' ? null : value })}
                >
                  <SelectTrigger id="case_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Case Types</SelectItem>
                    <SelectItem value="no_communication">No Communication</SelectItem>
                    <SelectItem value="zero_generation">Zero Generation</SelectItem>
                    <SelectItem value="low_performance">Low Performance</SelectItem>
                    <SelectItem value="connection_issue">Connection Issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="active" className="cursor-pointer">
                  Active (Template will be used in automated communications)
                </Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            {formData.channel === 'email' && (
              <div className="grid gap-2">
                <Label htmlFor="subject">Subject*</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Action Required: Your solar system needs attention"
                />
                {errors.subject && <p className="text-sm text-red-500">{errors.subject}</p>}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="template-content">Content*</Label>
              <Textarea
                id="template-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter your template content here..."
                className="min-h-[200px] font-mono"
              />
              {errors.content && <p className="text-sm text-red-500">{errors.content}</p>}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Available Variables</CardTitle>
                <CardDescription>Click to insert into template</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {availableVariables.map((variable) => (
                    <Button
                      key={variable.name}
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariable(variable.name)}
                      title={variable.description}
                    >
                      <Copy className="mr-1 h-3 w-3" />
                      {variable.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Variables will be automatically replaced with actual values when the template is sent.
                For example, {'{{customer_name}}'} will be replaced with the customer's actual name.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="flow" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Define a communication flow to automatically send follow-up messages. 
                Each step will be sent after the specified delay if no response is received.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {formData.communicationFlow?.map((step, index) => (
                <Card key={step.id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm">
                        Step {index + 1}: {step.channel.toUpperCase()} after {step.delayDays} day{step.delayDays !== 1 ? 's' : ''}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCommunicationStep(step.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Channel</Label>
                        <Select
                          value={step.channel}
                          onValueChange={(value: 'email' | 'sms' | 'whatsapp') => 
                            updateCommunicationStep(step.id, 'channel', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="sms">SMS</SelectItem>
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label>Delay (days)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={step.delayDays}
                          onChange={(e) => updateCommunicationStep(step.id, 'delayDays', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    {step.channel === 'email' && (
                      <div className="grid gap-2">
                        <Label>Subject</Label>
                        <Input
                          value={step.subject || ''}
                          onChange={(e) => updateCommunicationStep(step.id, 'subject', e.target.value)}
                          placeholder="Follow-up email subject"
                        />
                      </div>
                    )}

                    <div className="grid gap-2">
                      <Label>Content</Label>
                      <Textarea
                        value={step.templateContent || ''}
                        onChange={(e) => updateCommunicationStep(step.id, 'templateContent', e.target.value)}
                        placeholder="Follow-up message content..."
                        className="min-h-[100px]"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button
                variant="outline"
                onClick={addCommunicationStep}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Communication Step
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AgedCaseTemplateDialog;