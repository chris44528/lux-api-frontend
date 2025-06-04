import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info, Activity } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ZeroReadsSettings {
  enabled: boolean;
  days_to_check: number;
  readings_to_compare: number;
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
  settings: ZeroReadsSettings;
  options: AutomationOptions;
  onChange: (settings: ZeroReadsSettings) => void;
}

export default function ZeroReadsConfiguration({ settings, options, onChange }: Props) {
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

  const handleChange = (field: keyof ZeroReadsSettings, value: any) => {
    onChange({
      ...settings,
      [field]: value
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Activity className="h-5 w-5" />
          Zero Reads Configuration
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Configure automated job creation for sites with no generation increase
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            Zero Reads jobs are created when a site shows no increase in generation readings over consecutive days.
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="zero-reads-enabled" className="text-gray-900 dark:text-gray-100">Enable Zero Reads Job Creation</Label>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Automatically create jobs for sites with stagnant readings
            </p>
          </div>
          <Switch
            id="zero-reads-enabled"
            checked={settings.enabled}
            onCheckedChange={(checked) => handleChange('enabled', checked)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="days-to-check" className="text-gray-900 dark:text-gray-100">Days to Check</Label>
            <Input
              id="days-to-check"
              type="number"
              min="2"
              max="30"
              value={settings.days_to_check}
              onChange={(e) => handleChange('days_to_check', parseInt(e.target.value))}
              disabled={!settings.enabled}
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Number of days to analyze for zero differences
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="readings-to-compare" className="text-gray-900 dark:text-gray-100">Readings to Compare</Label>
            <Input
              id="readings-to-compare"
              type="number"
              min="2"
              max="10"
              value={settings.readings_to_compare}
              onChange={(e) => handleChange('readings_to_compare', parseInt(e.target.value))}
              disabled={!settings.enabled}
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Number of consecutive readings to compare
            </p>
          </div>
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
            Job type to use for Zero Reads jobs
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="zero-check-duplicate" className="text-gray-900 dark:text-gray-100">Check for Duplicates</Label>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Prevent creating duplicate jobs for the same site
            </p>
          </div>
          <Switch
            id="zero-check-duplicate"
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
            Available variables: {'{zero_count}'}, {'{date_range}'}, {'{total_difference}'}, {'{site_name}'}
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
              <li>Retrieve last <span className="font-medium text-gray-900 dark:text-gray-100">{settings.readings_to_compare}</span> readings for each site</li>
              <li>Calculate daily differences between consecutive readings</li>
              <li>Check if all differences in the last <span className="font-medium text-gray-900 dark:text-gray-100">{settings.days_to_check} days</span> equal zero</li>
              <li>{settings.check_duplicate ? "Skip sites with existing open Zero Reads jobs" : "Create jobs regardless of existing jobs"}</li>
              <li>Create new Zero Reads job for qualifying sites</li>
            </ol>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Example
            </h4>
            <div className="bg-gray-100 dark:bg-gray-900/50 p-3 rounded-md font-mono text-xs space-y-1">
              <div className="text-gray-700 dark:text-gray-300">Day 1: 1234 kWh</div>
              <div className="text-gray-700 dark:text-gray-300">Day 2: 1234 kWh <span className="text-gray-500 dark:text-gray-500">(difference: 0)</span></div>
              <div className="text-gray-700 dark:text-gray-300">Day 3: 1234 kWh <span className="text-gray-500 dark:text-gray-500">(difference: 0)</span></div>
              <div className="text-gray-700 dark:text-gray-300">Day 4: 1234 kWh <span className="text-gray-500 dark:text-gray-500">(difference: 0)</span></div>
              <div className="text-orange-600 dark:text-orange-400 font-semibold mt-2">→ Zero Reads job created</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}