import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, Play, RefreshCw } from "lucide-react";
import NoComsConfiguration from './NoComsConfiguration';
import ZeroReadsConfiguration from './ZeroReadsConfiguration';
import AutomationDashboard from './AutomationDashboard';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface JobAutomationSettings {
  no_coms: {
    enabled: boolean;
    days_threshold: number;
    check_duplicate: boolean;
    description_template: string;
    job_type_id: number | null;
    queue_id: number | null;
    status_id: number | null;
    priority: 'low' | 'medium' | 'high';
    template_id: number | null;
  };
  zero_reads: {
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
  };
}

interface AutomationOptions {
  job_types: Array<{ id: number; name: string; code: string }>;
  queues: Array<{ id: number; name: string }>;
  statuses: Array<{ id: number; name: string; code: string }>;
  task_templates: Array<{ id: number; name: string; description: string }>;
  priority_options: Array<{ value: string; label: string }>;
}

export default function JobAutomationSettings() {
  const [settings, setSettings] = useState<JobAutomationSettings | null>(null);
  const [options, setOptions] = useState<AutomationOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([fetchSettings(), fetchOptions()]);
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/job-automation/settings/');
      // Ensure we have the expected structure
      const data = response.data || {};
      const defaultSettings: JobAutomationSettings = {
        no_coms: {
          enabled: data.NO_COMS?.enabled ?? false,
          days_threshold: data.NO_COMS?.days_threshold ?? 3,
          check_duplicate: data.NO_COMS?.check_duplicate ?? true,
          description_template: data.NO_COMS?.description_template ?? 'No readings for {days_threshold} days from {site_name}',
          job_type_id: data.NO_COMS?.job_type_id ?? null,
          queue_id: data.NO_COMS?.queue_id ?? null,
          status_id: data.NO_COMS?.status_id ?? null,
          priority: data.NO_COMS?.priority ?? 'medium',
          template_id: data.NO_COMS?.template_id ?? null
        },
        zero_reads: {
          enabled: data.ZERO_READS?.enabled ?? false,
          days_to_check: data.ZERO_READS?.days_to_check ?? 4,
          readings_to_compare: data.ZERO_READS?.readings_to_compare ?? 3,
          check_duplicate: data.ZERO_READS?.check_duplicate ?? true,
          description_template: data.ZERO_READS?.description_template ?? 'No generation increase for {zero_count} days at {site_name}',
          job_type_id: data.ZERO_READS?.job_type_id ?? null,
          queue_id: data.ZERO_READS?.queue_id ?? null,
          status_id: data.ZERO_READS?.status_id ?? null,
          priority: data.ZERO_READS?.priority ?? 'medium',
          template_id: data.ZERO_READS?.template_id ?? null
        }
      };
      setSettings(defaultSettings);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast({
        title: "Error",
        description: "Failed to load job automation settings",
        variant: "destructive",
      });
      // Set default settings on error
      setSettings({
        no_coms: {
          enabled: false,
          days_threshold: 3,
          check_duplicate: true,
          description_template: 'No readings for {days_threshold} days from {site_name}',
          job_type_id: null,
          queue_id: null,
          status_id: null,
          priority: 'medium',
          template_id: null
        },
        zero_reads: {
          enabled: false,
          days_to_check: 4,
          readings_to_compare: 3,
          check_duplicate: true,
          description_template: 'No generation increase for {zero_count} days at {site_name}',
          job_type_id: null,
          queue_id: null,
          status_id: null,
          priority: 'medium',
          template_id: null
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const response = await api.get('/job-automation/options/');
      setOptions(response.data);
    } catch (error) {
      console.error('Failed to fetch options:', error);
      toast({
        title: "Error",
        description: "Failed to load automation options",
        variant: "destructive",
      });
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      // Transform to backend format
      const payload = {
        NO_COMS: settings.no_coms,
        ZERO_READS: settings.zero_reads
      };
      await api.put('/job-automation/settings/', payload);
      toast({
        title: "Success",
        description: "Job automation settings saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const runManualAutomation = async () => {
    setRunning(true);
    try {
      const response = await api.post('/job-automation/run-manual/');
      toast({
        title: "Success",
        description: `Created ${response.data.created_jobs} new jobs`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to run manual automation",
        variant: "destructive",
      });
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  if (!settings) {
    return <Alert><AlertDescription>Failed to load settings</AlertDescription></Alert>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Settings className="h-8 w-8" />
            Job Automation Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure automated job creation for No Coms and Zero Reads
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={runManualAutomation}
            disabled={running}
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {running ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run Now
              </>
            )}
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="no-coms">No Coms Configuration</TabsTrigger>
          <TabsTrigger value="zero-reads">Zero Reads Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <AutomationDashboard />
        </TabsContent>

        <TabsContent value="no-coms">
          {settings?.no_coms && options ? (
            <NoComsConfiguration
              settings={settings.no_coms}
              options={options}
              onChange={(noComsSettings) => 
                setSettings({ ...settings, no_coms: noComsSettings })
              }
            />
          ) : (
            <div className="flex items-center justify-center p-8">Loading configuration...</div>
          )}
        </TabsContent>

        <TabsContent value="zero-reads">
          {settings?.zero_reads && options ? (
            <ZeroReadsConfiguration
              settings={settings.zero_reads}
              options={options}
              onChange={(zeroReadsSettings) => 
                setSettings({ ...settings, zero_reads: zeroReadsSettings })
              }
            />
          ) : (
            <div className="flex items-center justify-center p-8">Loading configuration...</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}