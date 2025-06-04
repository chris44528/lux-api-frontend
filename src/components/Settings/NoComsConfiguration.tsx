import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info, WifiOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface NoComsSettings {
  enabled: boolean;
  days_threshold: number;
  check_duplicate: boolean;
  description_template: string;
  job_type_id: number | null;
  queue_id: number | null;
  status_id: number | null;
  priority: 'low' | 'medium' | 'high';
  template_id: number | null;
}

interface AutomationOptions {
  job_types: Array<{ id: number; name: string; code: string }>;
  queues: Array<{ id: number; name: string }>;
  statuses: Array<{ id: number; name: string; code: string }>;
  task_templates: Array<{ id: number; name: string; description: string }>;
  priority_options: Array<{ value: string; label: string }>;
}

interface Props {
  settings: NoComsSettings;
  options: AutomationOptions;
  onChange: (settings: NoComsSettings) => void;
}

export default function NoComsConfiguration({ settings, options, onChange }: Props) {
  if (!settings) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-muted-foreground">
            No configuration available
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleChange = (field: keyof NoComsSettings, value: any) => {
    onChange({
      ...settings,
      [field]: value
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <WifiOff className="h-5 w-5" />
          No Coms Configuration
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Configure automated job creation for sites with no communication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            No Coms jobs are created when a site has not reported any readings for the specified number of days.
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="no-coms-enabled" className="text-gray-900 dark:text-gray-100">Enable No Coms Job Creation</Label>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Automatically create jobs for sites with no readings
            </p>
          </div>
          <Switch
            id="no-coms-enabled"
            checked={settings.enabled}
            onCheckedChange={(checked) => handleChange('enabled', checked)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="days-threshold" className="text-gray-900 dark:text-gray-100">Days Threshold</Label>
            <Input
              id="days-threshold"
              type="number"
              min="1"
              max="30"
              value={settings.days_threshold}
              onChange={(e) => handleChange('days_threshold', parseInt(e.target.value))}
              disabled={!settings.enabled}
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Number of days without readings before creating a job
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-900 dark:text-gray-100">Job Type</Label>
            <Select
              value={settings.job_type_id?.toString() || ''}
              onValueChange={(value) => handleChange('job_type_id', value ? parseInt(value) : null)}
              disabled={!settings.enabled}
            >
              <SelectTrigger className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                <SelectValue placeholder="Select job type" />
              </SelectTrigger>
              <SelectContent>
                {(options.job_types || []).map(type => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Job type to use for No Coms jobs
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="check-duplicate" className="text-gray-900 dark:text-gray-100">Check for Duplicates</Label>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Prevent creating duplicate jobs for the same site
            </p>
          </div>
          <Switch
            id="check-duplicate"
            checked={settings.check_duplicate}
            onCheckedChange={(checked) => handleChange('check_duplicate', checked)}
            disabled={!settings.enabled}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-gray-900 dark:text-gray-100">Description Template</Label>
          <Textarea
            value={settings.description_template}
            onChange={(e) => handleChange('description_template', e.target.value)}
            disabled={!settings.enabled}
            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            rows={3}
            placeholder="Job description template"
          />
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Available variables: {'{days_threshold}'}, {'{last_reading}'}, {'{site_name}'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-gray-900 dark:text-gray-100">Queue</Label>
            <Select
              value={settings.queue_id?.toString() || ''}
              onValueChange={(value) => handleChange('queue_id', value ? parseInt(value) : null)}
              disabled={!settings.enabled}
            >
              <SelectTrigger className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                <SelectValue placeholder="Select queue" />
              </SelectTrigger>
              <SelectContent>
                {(options.queues || []).map(queue => (
                  <SelectItem key={queue.id} value={queue.id.toString()}>
                    {queue.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-900 dark:text-gray-100">Initial Status</Label>
            <Select
              value={settings.status_id?.toString() || ''}
              onValueChange={(value) => handleChange('status_id', value ? parseInt(value) : null)}
              disabled={!settings.enabled}
            >
              <SelectTrigger className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {(options.statuses || []).map(status => (
                  <SelectItem key={status.id} value={status.id.toString()}>
                    {status.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-gray-900 dark:text-gray-100">Priority</Label>
            <Select
              value={settings.priority}
              onValueChange={(value) => handleChange('priority', value as 'low' | 'medium' | 'high')}
              disabled={!settings.enabled}
            >
              <SelectTrigger className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {(options.priority_options || [
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' }
                ]).map(priority => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-900 dark:text-gray-100">Task Template</Label>
            <Select
              value={settings.template_id?.toString() || 'none'}
              onValueChange={(value) => handleChange('template_id', value === 'none' ? null : parseInt(value))}
              disabled={!settings.enabled}
            >
              <SelectTrigger className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {(options.task_templates || []).map(template => (
                  <SelectItem key={template.id} value={template.id.toString()}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Optionally apply a task template to created jobs
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Job Creation Logic
            </h4>
            <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-2 list-decimal list-inside ml-1">
              <li>Check all sites for reading activity</li>
              <li>Identify sites with no readings for <span className="font-medium text-gray-900 dark:text-gray-100">{settings.days_threshold} days</span></li>
              <li>{settings.check_duplicate ? "Skip sites with existing open No Coms jobs" : "Create jobs regardless of existing jobs"}</li>
              <li>Create new No Coms job for qualifying sites</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}