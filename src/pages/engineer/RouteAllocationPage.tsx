import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Clock, User, Briefcase, Route, Plus, Filter, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import engineerService from '@/services/engineerService';
import { useToast } from '@/hooks/use-toast';

interface Job {
  id: number;
  site_name: string;
  address: string;
  postcode: string;
  region: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_duration: number; // in minutes
  job_type: string;
  status: string;
  created_date: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
}

interface Engineer {
  id: number;
  name: string;
  employee_id: string;
  region: string;
  current_location?: { lat: number; lng: number };
  assigned_jobs: number;
  status: 'available' | 'busy' | 'offline';
}

interface RouteJob extends Job {
  order: number;
  travel_time?: number;
  arrival_time?: string;
  form_type?: 'pre' | 'post' | 'both';
  selected_form?: string;
}

// Mock data for static jobs
const STATIC_JOBS = [
  { id: 'static-1', name: 'Load Van', duration: 30, type: 'static' },
  { id: 'static-2', name: 'Office Training', duration: 120, type: 'static' },
  { id: 'static-3', name: 'Vehicle Check', duration: 15, type: 'static' },
  { id: 'static-4', name: 'Lunch Break', duration: 60, type: 'static' },
  { id: 'static-5', name: 'Admin Time', duration: 45, type: 'static' },
];

// Mock forms data
const AVAILABLE_FORMS = [
  { id: 'form-1', name: 'Van Check', type: 'vehicle' },
  { id: 'form-2', name: 'Site Safety Assessment', type: 'safety' },
  { id: 'form-3', name: 'Installation Checklist', type: 'installation' },
  { id: 'form-4', name: 'Meter Reading Form', type: 'reading' },
  { id: 'form-5', name: 'Customer Signature', type: 'signature' },
];

const RouteAllocationPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedEngineer, setSelectedEngineer] = useState<Engineer | null>(null);
  const [unallocatedJobs, setUnallocatedJobs] = useState<Job[]>([]);
  const [routeJobs, setRouteJobs] = useState<RouteJob[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  
  const { toast } = useToast();

  // Mock data - replace with API calls
  useEffect(() => {
    // Load mock unallocated jobs
    const mockJobs: Job[] = [
      {
        id: 1,
        site_name: 'Green Energy Site A',
        address: '123 Solar Street',
        postcode: 'SW1A 1AA',
        region: 'London',
        priority: 'high',
        estimated_duration: 60,
        job_type: 'Installation',
        status: 'unallocated',
        created_date: '2024-01-15',
        latitude: 51.5074,
        longitude: -0.1278,
      },
      {
        id: 2,
        site_name: 'Wind Farm B',
        address: '456 Turbine Road',
        postcode: 'M1 1AA',
        region: 'Manchester',
        priority: 'medium',
        estimated_duration: 90,
        job_type: 'Maintenance',
        status: 'unallocated',
        created_date: '2024-01-14',
        latitude: 53.4808,
        longitude: -2.2426,
      },
      {
        id: 3,
        site_name: 'Solar Panel Array C',
        address: '789 Renewable Avenue',
        postcode: 'B1 1AA',
        region: 'Birmingham',
        priority: 'low',
        estimated_duration: 45,
        job_type: 'Inspection',
        status: 'unallocated',
        created_date: '2024-01-13',
        latitude: 52.4862,
        longitude: -1.8904,
      },
      // Add more mock jobs as needed
    ];
    setUnallocatedJobs(mockJobs);

    // Load mock engineers
    const mockEngineers: Engineer[] = [
      {
        id: 1,
        name: 'John Smith',
        employee_id: 'ENG001',
        region: 'London',
        current_location: { lat: 51.5074, lng: -0.1278 },
        assigned_jobs: 3,
        status: 'available',
      },
      {
        id: 2,
        name: 'Sarah Johnson',
        employee_id: 'ENG002',
        region: 'Manchester',
        current_location: { lat: 53.4808, lng: -2.2426 },
        assigned_jobs: 2,
        status: 'available',
      },
      {
        id: 3,
        name: 'Mike Williams',
        employee_id: 'ENG003',
        region: 'Birmingham',
        current_location: { lat: 52.4862, lng: -1.8904 },
        assigned_jobs: 4,
        status: 'busy',
      },
    ];
    setEngineers(mockEngineers);
  }, []);

  const regions = ['all', ...new Set(unallocatedJobs.map(job => job.region))];

  const filteredJobs = selectedRegion === 'all' 
    ? unallocatedJobs 
    : unallocatedJobs.filter(job => job.region === selectedRegion);

  const groupedJobs = filteredJobs.reduce((acc, job) => {
    if (!acc[job.region]) {
      acc[job.region] = [];
    }
    acc[job.region].push(job);
    return acc;
  }, {} as Record<string, Job[]>);

  const handleAddToRoute = (job: Job) => {
    const routeJob: RouteJob = {
      ...job,
      order: routeJobs.length + 1,
      form_type: 'both', // Default to both pre and post visit forms
    };
    setRouteJobs([...routeJobs, routeJob]);
    setUnallocatedJobs(unallocatedJobs.filter(j => j.id !== job.id));
  };

  const handleAddStaticJob = (staticJob: typeof STATIC_JOBS[0]) => {
    const routeJob: RouteJob = {
      id: Date.now(), // Generate unique ID
      site_name: staticJob.name,
      address: 'N/A',
      postcode: 'N/A',
      region: selectedEngineer?.region || 'N/A',
      priority: 'low',
      estimated_duration: staticJob.duration,
      job_type: 'Static',
      status: 'allocated',
      created_date: new Date().toISOString(),
      order: routeJobs.length + 1,
    };
    setRouteJobs([...routeJobs, routeJob]);
  };

  const handleRemoveFromRoute = (jobId: number) => {
    const job = routeJobs.find(j => j.id === jobId);
    if (job && job.job_type !== 'Static') {
      setUnallocatedJobs([...unallocatedJobs, job]);
    }
    setRouteJobs(routeJobs.filter(j => j.id !== jobId));
  };

  const handleOptimizeRoute = async () => {
    if (!selectedEngineer || routeJobs.length === 0) {
      toast({
        title: "Error",
        description: "Please select an engineer and add jobs to the route",
        variant: "destructive",
      });
      return;
    }

    setIsOptimizing(true);
    try {
      // Call the route optimization API
      const optimizedRoute = await engineerService.optimizeRoute({
        engineer_id: selectedEngineer.id,
        job_ids: routeJobs.filter(job => job.job_type !== 'Static').map(job => job.id),
        date: selectedDate.toISOString().split('T')[0],
        start_location: startLocation,
        end_location: endLocation || startLocation,
        constraints: {
          max_distance_km: 200,
          service_time_minutes: 30,
          start_time: '08:00',
          end_time: '17:00'
        }
      });

      // Update route jobs with optimized order
      if (optimizedRoute.optimized_order) {
        const optimizedJobs = optimizedRoute.optimized_order.map((optJob: any, index: number) => {
          const originalJob = routeJobs.find(j => j.id === optJob.job_id);
          return {
            ...originalJob,
            order: optJob.sequence_order || index + 1,
            travel_time: optJob.travel_time,
            arrival_time: optJob.arrival_time,
          };
        });

        // Add static jobs back in their original positions
        const staticJobs = routeJobs.filter(job => job.job_type === 'Static');
        const allJobs = [...optimizedJobs, ...staticJobs].sort((a, b) => a.order - b.order);
        
        setRouteJobs(allJobs);
        toast({
          title: "Success",
          description: `Route optimized! Total distance: ${optimizedRoute.total_distance} km, Estimated time: ${Math.round(optimizedRoute.estimated_duration / 60)} hours`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to optimize route",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSaveRoute = async () => {
    if (!selectedEngineer || routeJobs.length === 0) {
      toast({
        title: "Error",
        description: "Please select an engineer and add jobs to the route",
        variant: "destructive",
      });
      return;
    }

    try {
      // Save the route allocation
      await engineerService.saveRouteAllocation({
        engineer_id: selectedEngineer.id,
        date: selectedDate.toISOString().split('T')[0],
        jobs: routeJobs,
        start_location: startLocation,
        end_location: endLocation || startLocation,
      });

      toast({
        title: "Success",
        description: "Route allocation saved successfully",
      });

      // Reset the form
      setRouteJobs([]);
      setSelectedEngineer(null);
      setStartLocation('');
      setEndLocation('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save route allocation",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Route & Job Allocation</h1>
        <div className="flex gap-2">
          <Input
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="w-auto"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Unallocated Jobs */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Unallocated Jobs</CardTitle>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {regions.map(region => (
                    <SelectItem key={region} value={region}>
                      {region === 'all' ? 'All Regions' : region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
            {Object.entries(groupedJobs).map(([region, jobs]) => (
              <div key={region} className="space-y-2">
                <h3 className="font-semibold text-sm text-gray-600 uppercase">{region}</h3>
                {jobs.map(job => (
                  <div
                    key={job.id}
                    className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleAddToRoute(job)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{job.site_name}</h4>
                        <p className="text-sm text-gray-600">{job.address}, {job.postcode}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant={job.priority === 'urgent' ? 'destructive' : job.priority === 'high' ? 'default' : 'secondary'}>
                            {job.priority}
                          </Badge>
                          <Badge variant="outline">{job.job_type}</Badge>
                          <span className="text-xs text-gray-500">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {job.estimated_duration} min
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Right Panel - Route Builder */}
        <Card>
          <CardHeader>
            <CardTitle>Route Builder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Engineer Selection */}
            <div className="space-y-2">
              <Label>Select Engineer</Label>
              <Select
                value={selectedEngineer?.id.toString()}
                onValueChange={(value) => {
                  const engineer = engineers.find(e => e.id.toString() === value);
                  setSelectedEngineer(engineer || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an engineer" />
                </SelectTrigger>
                <SelectContent>
                  {engineers.map(engineer => (
                    <SelectItem key={engineer.id} value={engineer.id.toString()}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {engineer.name} ({engineer.employee_id})
                        <Badge variant={engineer.status === 'available' ? 'success' : 'secondary'}>
                          {engineer.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start/End Locations */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Start Location</Label>
                <Input
                  placeholder="e.g., Office, Home"
                  value={startLocation}
                  onChange={(e) => setStartLocation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Location</Label>
                <Input
                  placeholder="e.g., Office, Home"
                  value={endLocation}
                  onChange={(e) => setEndLocation(e.target.value)}
                />
              </div>
            </div>

            {/* Static Jobs */}
            <div className="space-y-2">
              <Label>Add Static Jobs</Label>
              <div className="flex gap-2 flex-wrap">
                {STATIC_JOBS.map(job => (
                  <Button
                    key={job.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddStaticJob(job)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {job.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Route Jobs List */}
            <div className="space-y-2">
              <Label>Route Schedule</Label>
              <div className="border rounded-lg p-2 space-y-2 max-h-[300px] overflow-y-auto">
                {routeJobs.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    No jobs added to route. Click on jobs from the left panel to add them.
                  </p>
                ) : (
                  routeJobs.map((job, index) => (
                    <div key={job.id} className="border rounded p-2 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">#{job.order}</span>
                            <h5 className="font-medium">{job.site_name}</h5>
                          </div>
                          <p className="text-xs text-gray-600">{job.address}</p>
                          {job.arrival_time && (
                            <p className="text-xs text-blue-600">
                              ETA: {new Date(job.arrival_time).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFromRoute(job.id)}
                        >
                          Remove
                        </Button>
                      </div>
                      
                      {/* Form Selection */}
                      {job.job_type !== 'Static' && (
                        <div className="grid grid-cols-2 gap-2">
                          <Select
                            value={job.form_type}
                            onValueChange={(value) => {
                              const updatedJobs = routeJobs.map(j =>
                                j.id === job.id ? { ...j, form_type: value as any } : j
                              );
                              setRouteJobs(updatedJobs);
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pre">Pre-visit only</SelectItem>
                              <SelectItem value="post">Post-visit only</SelectItem>
                              <SelectItem value="both">Both</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Select
                            value={job.selected_form}
                            onValueChange={(value) => {
                              const updatedJobs = routeJobs.map(j =>
                                j.id === job.id ? { ...j, selected_form: value } : j
                              );
                              setRouteJobs(updatedJobs);
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select form" />
                            </SelectTrigger>
                            <SelectContent>
                              {AVAILABLE_FORMS.map(form => (
                                <SelectItem key={form.id} value={form.id}>
                                  {form.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleOptimizeRoute}
                disabled={isOptimizing || routeJobs.length === 0}
                className="flex-1"
              >
                <Route className="h-4 w-4 mr-2" />
                {isOptimizing ? 'Optimizing...' : 'Optimize Route'}
              </Button>
              <Button
                onClick={handleSaveRoute}
                disabled={routeJobs.length === 0 || !selectedEngineer}
                variant="success"
                className="flex-1"
              >
                Save Allocation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RouteAllocationPage;