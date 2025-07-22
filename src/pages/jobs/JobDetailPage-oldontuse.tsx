import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import jobService, { Job, JobStatus } from '../../services/jobService';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useToast } from '../../hooks/use-toast';
import { useUIPermission } from '../../hooks/useUIPermission';
import { ArrowLeft, Save, MapPin, User, Calendar, Clock, Briefcase, Activity, Zap, TestTube } from 'lucide-react';
import { getSiteDetail, getSiteReadings } from '../../services/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

const JobDetailPage: React.FC = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const canChangeStatus = useUIPermission('jobs.status.change');
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState<JobStatus[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [siteReadings, setSiteReadings] = useState<any[]>([]);
  const [meterTests, setMeterTests] = useState<any[]>([]);
  const [loadingReadings, setLoadingReadings] = useState(false);
  const [loadingTests, setLoadingTests] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch job details and statuses in parallel
        const [jobData, statusesData] = await Promise.all([
          jobService.getJob(Number(jobId)),
          jobService.getJobStatuses()
        ]);
        
        setJob(jobData);
        setStatuses(statusesData);
        setSelectedStatus(jobData.status.id.toString());
      } catch (error) {
        console.error('Failed to fetch job details:', error);
        toast({
          title: "Error",
          description: "Failed to load job details",
        });
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchData();
    }
  }, [jobId]);

  useEffect(() => {
    // Fetch site readings and meter tests when job is loaded
    if (job && job.site) {
      fetchSiteData();
    }
  }, [job]);

  const fetchSiteData = async () => {
    if (!job || !job.site) return;

    // Fetch meter readings
    setLoadingReadings(true);
    try {
      const readingsData = await getSiteReadings(job.site.toString());
      setSiteReadings(readingsData.readings || []);
    } catch (error) {
      console.error('Failed to fetch site readings:', error);
    } finally {
      setLoadingReadings(false);
    }

    // Fetch meter tests
    setLoadingTests(true);
    try {
      const siteData = await getSiteDetail(job.site.toString());
      setMeterTests(siteData.meter_tests || []);
    } catch (error) {
      console.error('Failed to fetch meter tests:', error);
    } finally {
      setLoadingTests(false);
    }
  };

  const handleStatusChange = async () => {
    if (!job || !selectedStatus || selectedStatus === job.status.id.toString()) {
      return;
    }

    setUpdatingStatus(true);
    try {
      await jobService.updateJob(job.id, {
        status: Number(selectedStatus)
      });

      // Update local state
      const newStatus = statuses.find(s => s.id.toString() === selectedStatus);
      if (newStatus) {
        setJob({
          ...job,
          status: newStatus
        });
      }

      toast({
        title: "Success",
        description: "Job status updated successfully",
      });
      setShowStatusModal(false);
    } catch (error) {
      console.error('Failed to update job status:', error);
      toast({
        title: "Error",
        description: "Failed to update job status",
      });
      // Reset to original status on error
      setSelectedStatus(job.status.id.toString());
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
      case "urgent":
        return "destructive";
      case "medium":
        return "outline";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  const getStatusColor = (statusName: string) => {
    switch (statusName.toLowerCase()) {
      case "pending":
        return "outline";
      case "in-progress":
      case "in progress":
        return "default";
      case "completed":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">Job not found</p>
            <div className="text-center mt-4">
              <Button onClick={() => navigate('/jobs')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Jobs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate('/jobs')}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Job Details</h1>
        </div>
      </div>

      {/* Main Job Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{job.title}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={getPriorityColor(job.priority)}>
                {job.priority} Priority
              </Badge>
              <Badge variant={getStatusColor(job.status.name)}>
                {job.status.name}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Job Status and Opened Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Job Status</p>
              <Badge 
                variant={getStatusColor(job.status.name)}
                className="cursor-pointer"
                onClick={() => {
                  if (canChangeStatus) {
                    setShowStatusModal(true);
                  }
                }}
              >
                {job.status.name}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Job Opened</p>
              <p className="text-sm">{formatDate(job.created_at)}</p>
            </div>
          </div>

          {/* Job Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">Site</p>
                  <p className="text-sm text-gray-600">{job.site_name || 'N/A'}</p>
                  <p className="text-sm text-gray-600">{job.address}</p>
                  {job.site_fco && (
                    <p className="text-sm text-gray-600">FCO: {job.site_fco}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">Assigned To</p>
                  <p className="text-sm text-gray-600">
                    {job.assigned_to
                      ? `${job.assigned_to.user.first_name} ${job.assigned_to.user.last_name}`
                      : 'Unassigned'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Briefcase className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">Type & Category</p>
                  <p className="text-sm text-gray-600">
                    {job.type?.name || 'N/A'} • {job.category?.name || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">Dates</p>
                  <p className="text-sm text-gray-600">
                    Created: {new Date(job.created_at).toLocaleDateString()}
                  </p>
                  {job.due_date && (
                    <p className="text-sm text-gray-600">
                      Due: {new Date(job.due_date).toLocaleDateString()}
                    </p>
                  )}
                  {job.completed_date && (
                    <p className="text-sm text-gray-600">
                      Completed: {new Date(job.completed_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">Duration</p>
                  <p className="text-sm text-gray-600">
                    {job.estimated_duration ? `${job.estimated_duration} minutes` : 'Not specified'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Briefcase className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">Queue</p>
                  <p className="text-sm text-gray-600">{job.queue.name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {job.description && (
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{job.description}</p>
            </div>
          )}


          {/* Tags */}
          {job.tags && job.tags.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {job.tags.map((tag) => (
                  <Badge key={tag.id} variant="outline">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Performance Section */}
      <Card>
        <CardHeader>
          <CardTitle>System Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="performance" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="performance">
                <Activity className="h-4 w-4 mr-2" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="readings">
                <Zap className="h-4 w-4 mr-2" />
                Meter Readings
              </TabsTrigger>
              <TabsTrigger value="tests">
                <TestTube className="h-4 w-4 mr-2" />
                Meter Tests
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="performance" className="mt-4">
              <div className="text-center text-gray-500 py-8">
                System performance data will be displayed here
              </div>
            </TabsContent>
            
            <TabsContent value="readings" className="mt-4">
              {loadingReadings ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading readings...</p>
                </div>
              ) : siteReadings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-4 text-left">Date</th>
                        <th className="py-2 px-4 text-left">Meter Reading</th>
                        <th className="py-2 px-4 text-left">Daily Generation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {siteReadings.slice(0, 10).map((reading, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="py-2 px-4">{reading.date}</td>
                          <td className="py-2 px-4">{reading.meter_reading || '-'}</td>
                          <td className="py-2 px-4 text-sm">
                            <span className={
                              reading.daily_gen_status === 'no_comms' || reading.daily_gen_status === 'zero'
                                ? 'text-red-600'
                                : reading.daily_gen_status === 'amber'
                                  ? 'text-amber-500'
                                  : reading.daily_gen_status === 'green'
                                    ? 'text-green-600'
                                    : ''
                            }>
                              {reading.daily_gen || '-'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {siteReadings.length > 10 && (
                    <p className="text-center text-sm text-gray-500 mt-4">
                      Showing 10 of {siteReadings.length} readings
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No meter readings available
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="tests" className="mt-4">
              {loadingTests ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading tests...</p>
                </div>
              ) : meterTests.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-4 text-left">Test Date</th>
                        <th className="py-2 px-4 text-left">Meter Reading</th>
                        <th className="py-2 px-4 text-left">Signal Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meterTests.map((test, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="py-2 px-4">
                            {test.test_date ? new Date(test.test_date).toLocaleString() : '-'}
                          </td>
                          <td className="py-2 px-4">
                            {test.test_reading 
                              ? `${parseFloat(test.test_reading).toLocaleString(undefined, { 
                                  minimumFractionDigits: 2, 
                                  maximumFractionDigits: 2 
                                })} kWh`
                              : '-'}
                          </td>
                          <td className="py-2 px-4">{test.signal_level || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No meter tests available
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Status Change Modal */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Job Status</DialogTitle>
            <DialogDescription>
              Select a new status for this job
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Select
              value={selectedStatus}
              onValueChange={setSelectedStatus}
              disabled={updatingStatus}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status.id} value={status.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      {status.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowStatusModal(false)}
                disabled={updatingStatus}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStatusChange}
                disabled={updatingStatus || selectedStatus === job.status.id.toString()}
              >
                <Save className="h-4 w-4 mr-2" />
                {updatingStatus ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobDetailPage;