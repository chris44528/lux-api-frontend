import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, Edit, X, AlertCircle } from "lucide-react";
import { agedCasesService, AgedCaseSettings, AgedCaseTemplate } from '../../services/agedCasesService';
import { useToast } from "@/hooks/use-toast";

interface TemplateConfig {
  [key: string]: number;
}

const AgedCaseConfig: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingSettings, setEditingSettings] = useState<AgedCaseSettings | null>(null);

  // Fetch active settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['agedCaseSettings'],
    queryFn: () => agedCasesService.getActiveSettings(),
  });

  // Fetch templates for rotation settings
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['agedCaseTemplates'],
    queryFn: () => agedCasesService.getTemplates(),
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (settings: Partial<AgedCaseSettings>) => 
      agedCasesService.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agedCaseSettings'] });
      setEditingSettings(null);
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handleSettingsChange = (field: keyof AgedCaseSettings, value: any) => {
    if (editingSettings) {
      setEditingSettings({ ...editingSettings, [field]: value });
    }
  };

  const handleTemplateConfigChange = (tier: number, templateName: string, tries: number) => {
    if (editingSettings) {
      const tierKey = `tier_${tier}_templates` as keyof AgedCaseSettings;
      const currentConfig = editingSettings[tierKey] as TemplateConfig;
      setEditingSettings({
        ...editingSettings,
        [tierKey]: {
          ...currentConfig,
          [templateName]: tries,
        },
      });
    }
  };

  const startEditingSettings = () => {
    if (settings) {
      setEditingSettings({ ...settings });
    }
  };

  const saveSettings = () => {
    if (editingSettings) {
      updateSettingsMutation.mutate(editingSettings);
    }
  };

  const cancelEditingSettings = () => {
    setEditingSettings(null);
  };

  if (settingsLoading || templatesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  const displaySettings = editingSettings || settings;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Aged Cases Configuration</h2>
          <p className="text-muted-foreground">
            Current Configuration: {displaySettings?.name}
          </p>
        </div>
        {!editingSettings ? (
          <Button onClick={startEditingSettings}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Settings
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={cancelEditingSettings}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button 
              onClick={saveSettings}
              disabled={updateSettingsMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {updateSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      {/* Communication Frequencies */}
      <Card>
        <CardHeader>
          <CardTitle>Communication Frequencies</CardTitle>
          <CardDescription>Set how often communications are sent for each escalation tier</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((tier) => (
              <div key={tier} className="space-y-2">
                <Label>Tier {tier} Frequency</Label>
                <Select
                  value={displaySettings?.[`tier_${tier}_frequency` as keyof AgedCaseSettings] as string || ''}
                  onValueChange={(value) => handleSettingsChange(`tier_${tier}_frequency` as keyof AgedCaseSettings, value)}
                  disabled={!editingSettings}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="every_2_days">Every 2 Days</SelectItem>
                    <SelectItem value="daily_alternating">Daily Alternating</SelectItem>
                    <SelectItem value="twice_daily">Twice Daily</SelectItem>
                    <SelectItem value="three_times_daily">Three Times Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Escalation Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle>Escalation Thresholds</CardTitle>
          <CardDescription>Days with no response before escalating to the next tier</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((tier) => (
              <div key={tier} className="space-y-2">
                <Label>Tier {tier} → Tier {tier + 1}</Label>
                <Input
                  type="number"
                  min="1"
                  value={displaySettings?.[`tier_${tier}_escalation_days` as keyof AgedCaseSettings] as number || ''}
                  onChange={(e) => handleSettingsChange(`tier_${tier}_escalation_days` as keyof AgedCaseSettings, parseInt(e.target.value))}
                  disabled={!editingSettings}
                  placeholder="Days"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Template Rotation Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Template Rotation Settings</CardTitle>
          <CardDescription>Configure how many times each template should be sent before rotating to the next one</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Set the number of times each template should be sent before moving to the next template in the rotation.
              Templates will be sent in the order they appear below.
            </AlertDescription>
          </Alert>
          
          <Accordion type="single" collapsible className="w-full">
            {[1, 2, 3, 4].map((tier) => (
              <AccordionItem key={tier} value={`tier-${tier}`}>
                <AccordionTrigger>
                  Tier {tier} Templates
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({templates.filter(t => t.escalation_tier === tier && t.active).length} active templates)
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Template Name</TableHead>
                        <TableHead>Channel</TableHead>
                        <TableHead className="w-[150px]">Times to Send</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {templates
                        .filter(t => t.escalation_tier === tier && t.active)
                        .map((template) => {
                          const tierConfig = displaySettings?.[`tier_${tier}_templates` as keyof AgedCaseSettings] as TemplateConfig;
                          const tries = tierConfig?.[template.name] || 1;
                          
                          return (
                            <TableRow key={template.id}>
                              <TableCell className="font-medium">{template.name}</TableCell>
                              <TableCell>
                                <span className="capitalize">{template.channel}</span>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="1"
                                  max="10"
                                  value={tries}
                                  onChange={(e) => handleTemplateConfigChange(tier, template.name, parseInt(e.target.value) || 1)}
                                  disabled={!editingSettings}
                                  className="w-20"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      {templates.filter(t => t.escalation_tier === tier && t.active).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            No active templates for this tier
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgedCaseConfig;