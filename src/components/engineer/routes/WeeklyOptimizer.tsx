import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import engineerService from '../../../services/engineerService';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Alert } from '../../ui/alert';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Switch } from '../../ui/switch';

interface Job {
  id: number;
  title: string;
  site: {
    site_name: string;
    address: string;
  };
  priority: string;
  estimated_duration: number;
  due_date: string;
}

interface WeeklyOptimizerProps {
  engineerId: number;
  availableJobs: Job[];
  onScheduleCreated: (schedule: any) => void;
}

interface DaySchedule {
  date: string;
  jobs: any[];
  total_duration: number;
  total_distance: number;
  utilization_percent: number;
}

const WeeklyOptimizer: React.FC<WeeklyOptimizerProps> = ({
  engineerId,
  availableJobs,
  onScheduleCreated
}) => {
  const [selectedJobs, setSelectedJobs] = useState<Job[]>([]);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [constraints, setConstraints] = useState({
    working_days: 5,
    daily_capacity: 6,
    max_hours_per_day: 8,
    include_breaks: true,
    prefer_clusters: true,
    balance_workload: true
  });
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[] | null>(null);

  const optimizeMutation = useMutation(
    () => engineerService.optimizeWeeklySchedule({
      engineer_id: engineerId,
      job_ids: selectedJobs.map(j => j.id),
      start_date: startDate,
      constraints
    }),
    {
      onSuccess: (data) => {
        setWeeklySchedule(data.daily_schedules);
        onScheduleCreated(data);
      }
    }
  );

  const handleJobSelection = (job: Job, isSelected: boolean) => {
    if (isSelected) {
      setSelectedJobs([...selectedJobs, job]);
    } else {
      setSelectedJobs(selectedJobs.filter(j => j.id !== job.id));
    }
  };

  const selectAllJobs = () => {
    setSelectedJobs(availableJobs);
  };

  const clearSelection = () => {
    setSelectedJobs([]);
  };

  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getUtilizationColor = (percent: number) => {
    if (percent < 60) return 'text-yellow-600';
    if (percent < 80) return 'text-green-600';
    if (percent < 95) return 'text-blue-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div>
              <Label>Working Days</Label>
              <Input
                type="number"
                value={constraints.working_days}
                onChange={(e) => setConstraints({
                  ...constraints,
                  working_days: parseInt(e.target.value)
                })}
                min={1}
                max={7}
              />
            </div>
            
            <div>
              <Label>Jobs per Day (Max)</Label>
              <Input
                type="number"
                value={constraints.daily_capacity}
                onChange={(e) => setConstraints({
                  ...constraints,
                  daily_capacity: parseInt(e.target.value)
                })}
                min={1}
                max={20}
              />
            </div>
            
            <div>
              <Label>Hours per Day (Max)</Label>
              <Input
                type="number"
                value={constraints.max_hours_per_day}
                onChange={(e) => setConstraints({
                  ...constraints,
                  max_hours_per_day: parseInt(e.target.value)
                })}
                min={1}
                max={12}
              />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label>Include break times</Label>
              <Switch
                checked={constraints.include_breaks}
                onCheckedChange={(checked) => setConstraints({
                  ...constraints,
                  include_breaks: checked
                })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Group nearby jobs</Label>
              <Switch
                checked={constraints.prefer_clusters}
                onCheckedChange={(checked) => setConstraints({
                  ...constraints,
                  prefer_clusters: checked
                })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Balance daily workload</Label>
              <Switch
                checked={constraints.balance_workload}
                onCheckedChange={(checked) => setConstraints({
                  ...constraints,
                  balance_workload: checked
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Selection */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Select Jobs for Weekly Schedule</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={selectAllJobs}>
                Select All
              </Button>
              <Button size="sm" variant="outline" onClick={clearSelection}>
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
            <p className="text-sm">
              Selected: <strong>{selectedJobs.length}</strong> jobs | 
              Total duration: <strong>{Math.round(selectedJobs.reduce((sum, job) => sum + job.estimated_duration, 0) / 60)}h</strong>
            </p>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {availableJobs.map(job => (
              <label
                key={job.id}
                className="flex items-center gap-3 p-2 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <input
                  type="checkbox"
                  checked={selectedJobs.some(j => j.id === job.id)}
                  onChange={(e) => handleJobSelection(job, e.target.checked)}
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">{job.title}</p>
                  <p className="text-xs text-gray-500">
                    {job.site.site_name} • {job.estimated_duration}min
                  </p>
                </div>
                <Badge variant={job.priority === 'urgent' ? 'destructive' : 'default'}>
                  {job.priority}
                </Badge>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Optimize Button */}
      <Button
        onClick={() => optimizeMutation.mutate()}
        disabled={selectedJobs.length === 0 || optimizeMutation.isLoading}
        className="w-full"
      >
        {optimizeMutation.isLoading ? (
          <>
            <span className="animate-spin mr-2">🔄</span>
            Creating Weekly Schedule...
          </>
        ) : (
          <>
            <span className="mr-2">📅</span>
            Create Weekly Schedule
          </>
        )}
      </Button>

      {/* Results */}
      {weeklySchedule && (
        <Card>
          <CardHeader>
            <CardTitle>Optimized Weekly Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weeklySchedule.map((day, index) => (
                <div key={day.date} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h4 className="font-semibold">
                        {getDayName(day.date)} - {new Date(day.date).toLocaleDateString()}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {day.jobs.length} jobs • {Math.round(day.total_duration / 60)}h • {day.total_distance.toFixed(1)}km
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getUtilizationColor(day.utilization_percent)}`}>
                        {day.utilization_percent}%
                      </p>
                      <p className="text-xs text-gray-500">Utilization</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {day.jobs.map((job: any, jobIndex: number) => (
                      <div key={job.job_id} className="flex items-center gap-2 text-sm">
                        <span className="w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs font-bold">
                          {jobIndex + 1}
                        </span>
                        <span className="flex-1">{job.job_title}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(job.estimated_arrival).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <Button className="flex-1">
                Accept Schedule
              </Button>
              <Button variant="outline" onClick={() => setWeeklySchedule(null)}>
                Reconfigure
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {optimizeMutation.isError && (
        <Alert variant="destructive">
          <p>Failed to create weekly schedule. Please try again.</p>
        </Alert>
      )}
    </div>
  );
};

export default WeeklyOptimizer;