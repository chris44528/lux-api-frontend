import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
// Temporarily disabled Badge due to TypeScript issue
// import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { Clock, Briefcase, Route, Plus, X, Navigation, Coffee, Truck, MapPin } from 'lucide-react';
import { format, addDays } from 'date-fns';
import engineerService from '../../services/engineerService';
import jobService from '../../services/jobService';
import MapComponent from '../../components/engineer/maps/MapComponent';
import { useToast } from '../../hooks/use-toast';
import api from '../../services/api';

import type { Job as JobServiceJob } from '../../services/jobService';

// Extended Job interface for route allocation
interface Job extends Omit<JobServiceJob, 'due_date' | 'priority'> {
  site_name?: string;
  site_fco?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  due_date?: string; // Make due_date optional
  priority?: "low" | "medium" | "high" | "urgent"; // Allow urgent for UI flexibility
}

interface Engineer {
  id: number;
  technician: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  phone: string;
  emergency_contact?: string;
  vehicle_reg?: string;
  skills: string[];
  service_areas: string[];
  status: 'available' | 'busy' | 'offline';
  current_latitude?: number;
  current_longitude?: number;
  max_daily_jobs: number;
  work_start_time?: string;
  work_end_time?: string;
}

interface RouteJob extends Job {
  order: number;
  travel_time?: number;
  arrival_time?: string;
  departure_time?: string;
  is_static?: boolean;
  static_type?: string;
  distance_from_previous?: number;
  due_date?: string; // Override to make it optional for static jobs
}

interface AvailableDate {
  date: string;
  engineer_id: number;
  engineer_name: string;
  jobs_in_area: number;
  total_duration: number;
}

interface EngineerAvailability {
  id: number;
  name: string;
  employee_id: string;
  max_weekly_hours: number;
  estimated_job_hours: number;
  availability_dates: Array<{
    date: string;
    distance_km: number;
    remaining_weekly_hours: number;
    hours_worked_this_week: number;
    can_accommodate_jobs: boolean;
    would_cause_overtime: boolean;
    no_route: boolean;
  }>;
}

interface EngineersByLocationData {
  jobs: Array<{ id: number; title: string }>;
  location: { latitude: number; longitude: number };
  available_engineers: EngineerAvailability[];
  total_job_duration_hours: number;
}

// Static jobs for daily activities
const STATIC_JOBS = [
  { id: 'load-van', name: 'Load Van', duration: 30, icon: Truck, description: 'Prepare van with equipment' },
  { id: 'lunch', name: 'Lunch Break', duration: 60, icon: Coffee, description: 'Scheduled break' },
  { id: 'travel-office', name: 'Travel to Office', duration: 45, icon: Navigation, description: 'Return to office' },
  { id: 'admin', name: 'Admin Time', duration: 30, icon: Briefcase, description: 'Paperwork and reporting' },
];

const RouteAllocationPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const date = new Date();
    // Ensure it's a valid date
    if (isNaN(date.getTime())) {
      console.error('Invalid date created');
      return new Date(Date.now());
    }
    return date;
  });
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedEngineer, setSelectedEngineer] = useState<Engineer | null>(null);
  const [unallocatedJobs, setUnallocatedJobs] = useState<Job[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<Job[]>([]);
  const [routeJobs, setRouteJobs] = useState<RouteJob[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const googleMapsApiKey = '';
  const [regions, setRegions] = useState<string[]>(['all']);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isLoadingEngineers, setIsLoadingEngineers] = useState(false);
  const [showNextAvailableDate, setShowNextAvailableDate] = useState(false);
  const [jobStatuses, setJobStatuses] = useState<{id: number, name: string, color: string}[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('17:00');
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [availableEngineers, setAvailableEngineers] = useState<EngineerAvailability[]>([]);
  const [jobLocation, setJobLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoadingAvailableEngineers, setIsLoadingAvailableEngineers] = useState(false);
  const [selectedEngineerAvailability, setSelectedEngineerAvailability] = useState<EngineerAvailability | null>(null);
  const [currentRouteTimeline, setCurrentRouteTimeline] = useState<any>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  
  const { toast } = useToast();
  
  // Removed debug logging to avoid hooks error

  // Transform API job to our extended Job type
  const transformJob = (apiJob: JobServiceJob): Job => {
    // Site is always a number according to the JobServiceJob interface
    const siteId = apiJob.site;
    return {
      ...apiJob,
      site_name: apiJob.site_name || 'Unknown Site',
      site_fco: apiJob.site_fco,
      region: apiJob.site_name ? apiJob.site_name.split(' - ')[0] : 'Unknown', // Extract region from site name
      latitude: undefined, // Would need to fetch from site details
      longitude: undefined,
    };
  };

  // Check if Google Maps API key is configured
  useEffect(() => {
    if (!googleMapsApiKey) {
      console.warn('Google Maps API key not configured. Please set VITE_GOOGLE_MAPS_API_KEY in your .env file');
      toast({
        title: "Configuration Required",
        description: "Google Maps API key not configured",
      });
    }
  }, [googleMapsApiKey]);

  // Fetch job statuses
  useEffect(() => {
    const fetchStatuses = async () => {
      setIsLoadingStatuses(true);
      try {
        const response = await jobService.getJobStatuses();
        setJobStatuses(response);
        // Set default to first status if available
        if (response.length > 0 && !selectedStatus) {
          setSelectedStatus(response[0].name);
        }
      } catch (error) {
        console.error('Failed to fetch job statuses:', error);
        toast({
          title: "Error",
          description: "Failed to load job statuses",
        });
      } finally {
        setIsLoadingStatuses(false);
      }
    };
    fetchStatuses();
  }, []);

  // Fetch jobs with selected status
  useEffect(() => {
    const fetchJobs = async () => {
      if (!selectedStatus) return; // Don't fetch if no status selected
      
      setIsLoadingJobs(true);
      try {
        const response = await jobService.getJobs({
          status: [selectedStatus], // Pass as array
          page_size: 100,
        });
        
        const apiJobs = response.results || [];
        const jobs = apiJobs.map(transformJob);
        setUnallocatedJobs(jobs);
        
        // Extract unique regions
        const uniqueRegions = new Set(jobs
          .map((job: Job) => job.region)
          .filter(Boolean));
        setRegions(['all', ...Array.from(uniqueRegions as Set<string>)]);
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
        toast({
          title: "Error",
          description: "Failed to load jobs",
        });
      } finally {
        setIsLoadingJobs(false);
      }
    };
    fetchJobs();
  }, [selectedStatus]);

  // Fetch engineers
  useEffect(() => {
    const fetchEngineers = async () => {
      setIsLoadingEngineers(true);
      try {
        const response = await engineerService.getEngineers({
          status: 'available',
          active_only: true,
        });
        setEngineers(response.results || response);
      } catch (error) {
        console.error('Failed to fetch engineers:', error);
        toast({
          title: "Error",
          description: "Failed to load engineers",
        });
      } finally {
        setIsLoadingEngineers(false);
      }
    };
    fetchEngineers();
  }, []);

  // Fetch available dates when region changes or show next available is toggled
  useEffect(() => {
    const fetchAvailableDates = async () => {
      try {
        const params: any = {
          start_date: format(new Date(), 'yyyy-MM-dd'),
          end_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
          show_next_available_only: showNextAvailableDate
        };
        
        // Only add region if not 'all'
        if (selectedRegion !== 'all') {
          params.region = selectedRegion;
        }
        
        const response = await api.get('/engineer/available-dates/', { params });
        
        if (response.data && response.data.results) {
          setAvailableDates(response.data.results);
        } else {
          setAvailableDates([]);
        }
      } catch (error) {
        console.error('Failed to fetch available dates:', error);
        setAvailableDates([]);
      }
    };
    
    fetchAvailableDates();
  }, [selectedRegion, showNextAvailableDate]);

  const filteredJobs = selectedRegion === 'all' 
    ? unallocatedJobs 
    : unallocatedJobs.filter(job => job.region === selectedRegion);

  const groupedJobs = filteredJobs.reduce((acc: Record<string, Job[]>, job: Job) => {
    const region = job.region || 'Unknown';
    if (!acc[region]) {
      acc[region] = [];
    }
    acc[region].push(job);
    return acc;
  }, {} as Record<string, Job[]>);

  const handleSelectJob = (job: Job) => {
    if (selectedJobs.find(j => j.id === job.id)) {
      setSelectedJobs(selectedJobs.filter(j => j.id !== job.id));
    } else {
      setSelectedJobs([...selectedJobs, job]);
    }
  };

  // Fetch available engineers when jobs are selected
  useEffect(() => {
    const fetchAvailableEngineers = async () => {
      if (selectedJobs.length === 0) {
        setAvailableEngineers([]);
        setJobLocation(null);
        return;
      }

      setIsLoadingAvailableEngineers(true);
      try {
        // Check if the method exists (for backward compatibility)
        if (!engineerService.getEngineersByLocation) {
          console.warn('getEngineersByLocation method not available yet');
          setAvailableEngineers([]);
          setAvailableDates([]);
          return;
        }
        
        const response = await engineerService.getEngineersByLocation({
          job_ids: selectedJobs.map(j => j.id),
          date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined,
          max_distance_km: 50,
        });

        setAvailableEngineers(response.available_engineers || []);
        setJobLocation(response.location || null);
        
        // Update the date dropdown with available dates
        const uniqueDates = new Set<string>();
        const availableEngineers = response.available_engineers || [];
        availableEngineers.forEach(engineer => {
          if (engineer.availability_dates) {
            engineer.availability_dates.forEach(dateInfo => {
              uniqueDates.add(dateInfo.date);
            });
          }
        });
        
        const sortedDates = Array.from(uniqueDates).sort();
        // Convert to AvailableDate format for compatibility
        const availableDatesList = sortedDates.map(date => {
          const engineersOnDate = availableEngineers.filter(eng => 
            eng.availability_dates && eng.availability_dates.some(d => d.date === date)
          );
          return {
            date,
            engineer_id: engineersOnDate[0]?.id || 0,
            engineer_name: engineersOnDate[0]?.name || '',
            jobs_in_area: engineersOnDate.length,
            total_duration: response.total_job_duration_hours || 0,
          };
        });
        setAvailableDates(availableDatesList);
      } catch (error) {
        console.error('Failed to fetch available engineers:', error);
        toast({
          title: "Error",
          description: "Failed to fetch available engineers",
        });
      } finally {
        setIsLoadingAvailableEngineers(false);
      }
    };

    fetchAvailableEngineers();
  }, [selectedJobs, selectedDate, toast]);

  // Load existing route when engineer and date are selected
  useEffect(() => {
    const loadExistingRoute = async () => {
      if (!selectedEngineer || !selectedDate) {
        setCurrentRouteTimeline(null);
        return;
      }

      setIsLoadingRoute(true);
      try {
        // Check if engineer has existing route for this date
        const routesResponse = await engineerService.getRoutes({
          engineer: selectedEngineer.id,
          date: format(selectedDate, 'yyyy-MM-dd'),
        });

        if (routesResponse.results && routesResponse.results.length > 0) {
          const route = routesResponse.results[0];
          
          // Load timeline
          if (engineerService.getRouteTimeline) {
            const timelineResponse = await engineerService.getRouteTimeline(route.id);
            setCurrentRouteTimeline(timelineResponse);
          } else {
            console.warn('getRouteTimeline method not available yet');
          }
          
          // If we have jobs in the route and the route is not empty, load them
          if (route.jobs && route.jobs.length > 0) {
            // Transform route jobs to our RouteJob format
            const existingRouteJobs = route.jobs.map((job: any, index: number) => ({
              ...job,
              order: index + 1,
              travel_time: job.travel_time_minutes,
              arrival_time: job.arrival_time,
              departure_time: job.departure_time,
              distance_from_previous: job.distance_from_previous,
            }));
            
            setRouteJobs(existingRouteJobs);
            
            // Remove these jobs from unallocated list
            const allocatedJobIds = new Set(route.jobs.map((j: any) => j.id));
            setUnallocatedJobs(prev => prev.filter(job => !allocatedJobIds.has(job.id)));
          }
        } else {
          setCurrentRouteTimeline(null);
        }
      } catch (error) {
        console.error('Error loading route:', error);
        setCurrentRouteTimeline(null);
      } finally {
        setIsLoadingRoute(false);
      }
    };

    loadExistingRoute();
  }, [selectedEngineer, selectedDate]);

  const handleAddSelectedToRoute = () => {
    const newRouteJobs = selectedJobs.map((job, index) => ({
      ...job,
      order: routeJobs.length + index + 1,
    }));
    setRouteJobs([...routeJobs, ...newRouteJobs]);
    setUnallocatedJobs(unallocatedJobs.filter(j => !selectedJobs.find(s => s.id === j.id)));
    setSelectedJobs([]);
  };

  const handleAddStaticJob = (staticJob: typeof STATIC_JOBS[0]) => {
    const routeJob: RouteJob = {
      id: Date.now(),
      title: staticJob.name,
      description: staticJob.description,
      site: 0, // Use dummy site ID for static jobs
      site_name: 'Static Task',
      client: 'N/A',
      address: 'N/A',
      priority: 'low',
      estimated_duration: staticJob.duration,
      status: {
        id: 0,
        name: 'Static',
        color: 'gray',
      },
      queue: {
        id: 0,
        name: 'Static',
        description: 'Static task',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      order: routeJobs.length + 1,
      is_static: true,
      static_type: staticJob.id,
    };
    setRouteJobs([...routeJobs, routeJob]);
  };

  const handleRemoveFromRoute = (jobId: number) => {
    const job = routeJobs.find((j: RouteJob) => j.id === jobId);
    if (job && !job.is_static) {
      // Add back to unallocated jobs
      setUnallocatedJobs([...unallocatedJobs, job as Job]);
    }
    setRouteJobs(routeJobs.filter((j: RouteJob) => j.id !== jobId));
  };

  const handleOptimizeRoute = async () => {
    if (!selectedEngineer || routeJobs.length === 0) {
      toast({
        title: "Error",
        description: "Please select an engineer and add jobs to the route",
              });
      return;
    }

    setIsOptimizing(true);
    try {
      const nonStaticJobs = routeJobs.filter(job => !job.is_static);
      const staticJobs = routeJobs.filter(job => job.is_static);
      
      // Always use an object for start_location, use default office coordinates if not available
      const startLocation = selectedEngineer.current_latitude && selectedEngineer.current_longitude
        ? { latitude: selectedEngineer.current_latitude, longitude: selectedEngineer.current_longitude }
        : { latitude: 53.496416, longitude: -1.485755 }; // Default coordinates

      const optimizedRoute = await engineerService.optimizeRoute({
        engineer_id: selectedEngineer.id,
        job_ids: nonStaticJobs.map(job => job.id),
        date: selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        start_location: startLocation,
        constraints: {
          max_distance_km: 200,
          service_time_minutes: 45,
          start_time: startTime || '08:00',
          end_time: endTime || '17:00',
          // max_hours_per_day: 8,
          // break_interval_hours: 4,
          // break_duration_minutes: 30,
        },
        // start_time: startTime || '08:00',
        // end_time: endTime || '17:00',
        use_enhanced_optimization: true,
        include_traffic: true,
        include_breaks: true,
        prefer_clusters: true,
      });

      if (optimizedRoute.optimized_order) {
        const optimizedJobs = optimizedRoute.optimized_order.map((optJob: any) => {
          const originalJob = nonStaticJobs.find(j => j.id === optJob.job_id);
          return {
            ...originalJob,
            order: optJob.sequence_order,
            travel_time: optJob.travel_time_minutes,
            arrival_time: optJob.arrival_time,
            departure_time: optJob.departure_time,
            distance_from_previous: optJob.distance_from_previous,
          } as RouteJob;
        });

        // Insert static jobs at appropriate times
        let finalJobs: RouteJob[] = [];
        let currentOrder = 1;
        
        // Add load van at start
        const loadVan = staticJobs.find(j => j.static_type === 'load-van');
        if (loadVan) {
          finalJobs.push({ ...loadVan, order: currentOrder++ });
        }
        
        // Add jobs with lunch break in middle
        const halfPoint = Math.floor(optimizedJobs.length / 2);
        optimizedJobs.forEach((job, index) => {
          if (index === halfPoint) {
            const lunch = staticJobs.find(j => j.static_type === 'lunch');
            if (lunch) {
              finalJobs.push({ ...lunch, order: currentOrder++ });
            }
          }
          finalJobs.push({ ...job, order: currentOrder++ });
        });
        
        // Add remaining static jobs at end
        staticJobs
          .filter(j => j.static_type !== 'load-van' && j.static_type !== 'lunch')
          .forEach(job => {
            finalJobs.push({ ...job, order: currentOrder++ });
          });
        
        setRouteJobs(finalJobs);
        
        // Store the optimization result for the map
        if (optimizedRoute.optimization_result) {
          setOptimizationResult(optimizedRoute.optimization_result);
        }
        
        const distanceKm = parseFloat(optimizedRoute.total_distance_km || optimizedRoute.total_distance);
        const distanceMiles = distanceKm * 0.621371;
        toast({
          title: "Route Optimized",
          description: `Total distance: ${distanceMiles.toFixed(1)} miles (${distanceKm.toFixed(1)} km), Duration: ${Math.round(optimizedRoute.estimated_duration_minutes / 60)} hours`,
        });
      }
    } catch (error) {
      console.error('Route optimization error:', error);
      toast({
        title: "Error",
        description: "Failed to optimize route",
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
              });
      return;
    }

    try {
      // Extract non-static job IDs
      const jobIds = routeJobs
        .filter(job => !job.is_static)
        .map(job => job.id);

      // Check if allocateJobs method exists
      if (!engineerService.allocateJobs) {
        console.warn('allocateJobs method not available yet, using saveRouteAllocation instead');
        // Fall back to saveRouteAllocation
        await engineerService.saveRouteAllocation({
          engineer_id: selectedEngineer.id,
          date: selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          jobs: routeJobs,
          start_time: startTime,
          end_time: endTime,
        });
        
        handleAllocationSuccess({ 
          status: 'success', 
          jobs_allocated: jobIds.length 
        });
        return;
      }
      
      // First try to allocate without overtime
      const response = await engineerService.allocateJobs({
        engineer_id: selectedEngineer.id,
        job_ids: jobIds,
        date: selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        override_hours_limit: false,
      });

      if (response.error === 'Would exceed weekly hours limit' && response.details) {
        // Show overtime confirmation dialog
        const confirmed = await new Promise<boolean>((resolve) => {
          if (window.confirm(`This allocation will exceed the weekly hours limit:\n\n` +
            `• Remaining hours: ${response.details.remaining_hours.toFixed(1)}\n` +
            `• Required hours: ${response.details.required_hours.toFixed(1)}\n` +
            `• Overtime hours: ${response.details.overtime_hours.toFixed(1)}\n\n` +
            `Do you want to proceed with overtime?`)) {
            resolve(true);
          } else {
            resolve(false);
          }
        });

        if (confirmed) {
          // Retry with override
          const overrideResponse = await engineerService.allocateJobs({
            engineer_id: selectedEngineer.id,
            job_ids: jobIds,
            date: selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            override_hours_limit: true,
          });

          if (overrideResponse.status === 'success') {
            handleAllocationSuccess(overrideResponse);
          } else {
            throw new Error(overrideResponse.error || 'Failed to allocate jobs');
          }
        }
      } else if (response.status === 'success') {
        handleAllocationSuccess(response);
      } else {
        throw new Error(response.error || 'Failed to allocate jobs');
      }
    } catch (error) {
      console.error('Save route error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save route allocation",
              });
    }
  };

  const handleAllocationSuccess = async (response: any) => {
    toast({
      title: "Success",
      description: `Successfully allocated ${response.jobs_allocated} jobs${response.weekly_hours_status?.is_overtime ? ' (with overtime)' : ''}`,
    });

    // Reset the form
    setRouteJobs([]);
    setSelectedJobs([]);
    setSelectedEngineer(null);
    setSelectedEngineerAvailability(null);
    setOptimizationResult(null);
    
    // Refresh jobs list to show updated statuses
    const jobsResponse = await jobService.getJobs({
      status: [selectedStatus],
      page_size: 100,
    });
    const apiJobs = jobsResponse.results || [];
    const jobs = apiJobs.map(transformJob);
    setUnallocatedJobs(jobs);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Route Allocation Planner</h1>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-semibold transition-colors">
              {selectedJobs.length} jobs selected
            </span>
            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-semibold transition-colors bg-gray-100">
              {routeJobs.length} jobs in route
            </span>
          </div>
        </div>
      </div>

      {/* Main Content - Three Columns */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column - Jobs List */}
        <div className="w-96 bg-gray-50 border-r flex flex-col">
          <div className="bg-white border-b p-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Available Jobs</h2>
                <Button
                  size="sm"
                  onClick={handleAddSelectedToRoute}
                  disabled={selectedJobs.length === 0}
                >
                  Add Selected ({selectedJobs.length})
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label>Job Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingStatuses ? "Loading statuses..." : "Select job status"} />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingStatuses ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : (
                      jobStatuses.map(status => {
                        try {
                          if (!status || typeof status !== 'object' || !status.name) {
                            console.error('Invalid status object:', status);
                            return null;
                          }
                          const statusName = String(status.name || '');
                          return (
                            <SelectItem key={status.id} value={statusName}>
                              {statusName}
                            </SelectItem>
                          );
                        } catch (e) {
                          console.error('Error rendering status:', e, status);
                          return null;
                        }
                      }).filter(Boolean)
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map(region => {
                    const regionStr = String(region || '');
                    return (
                      <SelectItem key={regionStr} value={regionStr}>
                        {regionStr === 'all' ? 'All Regions' : regionStr}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {isLoadingJobs ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading jobs...</p>
              </div>
            ) : !selectedStatus ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Please select a job status to view available jobs</p>
              </div>
            ) : Object.entries(groupedJobs).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No jobs with status "{String(selectedStatus)}" available for allocation</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedJobs).map(([region, jobs]: [string, Job[]]) => (
                  <div key={region}>
                    <h3 className="font-semibold text-sm text-gray-600 uppercase mb-2">
                      {String(region)} ({jobs.length})
                    </h3>
                    <div className="space-y-2">
                      {jobs.map((job: Job) => (
                        <div
                          key={job.id}
                          className={`bg-white rounded-lg border p-3 cursor-pointer transition-all ${
                            selectedJobs.find(j => j.id === job.id)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleSelectJob(job)}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={!!selectedJobs.find(j => j.id === job.id)}
                              onChange={() => handleSelectJob(job)}
                              onClick={(e) => e.stopPropagation()}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">
                                {String(job.site_name || 'Unknown Site')}
                              </h4>
                              <p className="text-xs text-gray-600 truncate">
                                {String(job.address || 'No address')}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  job.priority === 'high'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {String(job.priority || 'normal')}
                                </span>
                                {job.type && job.type.name && (
                                  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold">
                                    {String(job.type.name)}
                                  </span>
                                )}
                                <span className="text-xs text-gray-500 ml-auto">
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {String(job.estimated_duration || 0)}m
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Middle Column - Map */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Selected Jobs Bar */}
          {selectedJobs.length > 0 && (
            <div className="bg-blue-50 border-b border-blue-200 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  {selectedJobs.length} job{selectedJobs.length > 1 ? 's' : ''} selected
                  {jobLocation && (
                    <span className="text-xs text-gray-600 ml-2">
                      (Location shown on map)
                    </span>
                  )}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedJobs([])}
                  >
                    Clear Selection
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddSelectedToRoute}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add to Route
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Map and Timeline Container */}
          <div className="flex-1 flex flex-col">
            {/* Map Component */}
            <div className="flex-1 relative" style={{ minHeight: '300px' }}>
            {googleMapsApiKey && googleMapsApiKey !== '' ? (
              <MapComponent
                apiKey={googleMapsApiKey}
                engineerLocation={
                  selectedEngineer && selectedEngineer.current_latitude && selectedEngineer.current_longitude
                    ? { lat: selectedEngineer.current_latitude, lng: selectedEngineer.current_longitude }
                    : undefined
                }
                jobs={[...selectedJobs, ...routeJobs.filter((j: RouteJob) => !j.is_static)].map(job => ({
                  id: job.id,
                  title: job.title,
                  site: {
                    site_name: job.site_name || 'Unknown',
                    address: job.address || 'Unknown',
                    latitude: job.latitude,
                    longitude: job.longitude,
                  },
                  priority: job.priority,
                  estimated_duration: job.estimated_duration,
                }))}
                routeJobs={routeJobs
                  .filter((j: RouteJob) => !j.is_static)
                  .map((job: RouteJob) => ({
                    job: {
                      id: job.id,
                      title: job.title,
                      site: {
                        site_name: job.site_name || 'Unknown',
                        address: job.address || 'Unknown',
                        latitude: job.latitude,
                        longitude: job.longitude,
                      },
                      priority: job.priority,
                      estimated_duration: job.estimated_duration,
                    },
                    sequence_order: job.order,
                    estimated_arrival: job.arrival_time || '',
                    distance_from_previous: 0,
                  }))}
                optimizedRoute={routeJobs.length > 0}
                optimizationResult={optimizationResult}
                height="calc(100vh - 300px)"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-100">
                <div className="text-center">
                  <p className="text-gray-500 mb-2">Google Maps not configured</p>
                  <p className="text-sm text-gray-400">Please add VITE_GOOGLE_MAPS_API_KEY to your .env file</p>
                </div>
              </div>
            )}
            </div>
            
            {/* Route Timeline */}
            {routeJobs.length > 0 && (
              <div className="border-t bg-white p-4">
                <h3 className="text-sm font-semibold mb-3">Daily Timeline</h3>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  <div className="flex items-center gap-2 text-xs bg-green-100 px-3 py-2 rounded-lg whitespace-nowrap">
                    <Clock className="h-4 w-4 text-green-600" />
                    <span className="font-medium">{String(startTime || '08:00')}</span>
                    <span className="text-gray-600">Start</span>
                  </div>
                  
                  {routeJobs
                    .sort((a, b) => a.order - b.order)
                    .map((job, index) => (
                      <React.Fragment key={job.id}>
                        {index > 0 && job.travel_time && (
                          <div className="flex items-center gap-2 text-xs bg-blue-100 px-3 py-2 rounded-lg whitespace-nowrap">
                            <Truck className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">{String(job.travel_time || 0)}m</span>
                            <span className="text-gray-600">Travel</span>
                          </div>
                        )}
                        
                        <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg whitespace-nowrap ${
                          job.is_static ? 
                            job.static_type === 'lunch' ? 'bg-orange-100' : 'bg-gray-100' : 
                            'bg-purple-100'
                        }`}>
                          {job.is_static ? (
                            job.static_type === 'lunch' ? (
                              <Coffee className="h-4 w-4 text-orange-600" />
                            ) : (
                              <Briefcase className="h-4 w-4 text-gray-600" />
                            )
                          ) : (
                            <MapPin className="h-4 w-4 text-purple-600" />
                          )}
                          <span className="font-medium">{String(job.estimated_duration || 0)}m</span>
                          <span className="text-gray-600">
                            {String(job.is_static ? job.title : job.site_name || 'Site')}
                          </span>
                          {job.arrival_time && (
                            <span className="text-xs text-gray-500">({String(job.arrival_time || '')})</span>
                          )}
                        </div>
                      </React.Fragment>
                    ))}
                  
                  <div className="flex items-center gap-2 text-xs bg-red-100 px-3 py-2 rounded-lg whitespace-nowrap">
                    <Clock className="h-4 w-4 text-red-600" />
                    <span className="font-medium">{String(endTime || '17:00')}</span>
                    <span className="text-gray-600">End</span>
                  </div>
                </div>
                
                {/* Timeline Summary */}
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
                  <span>Total Jobs: {routeJobs.filter(j => !j.is_static).length}</span>
                  <span>•</span>
                  <span>Est. Duration: {String(routeJobs.reduce((sum: number, job: RouteJob) => sum + (job.estimated_duration || 0) + (job.travel_time || 0), 0))}m</span>
                  {optimizationResult && (
                    <>
                      <span>•</span>
                      <span>Distance: {String((parseFloat(optimizationResult?.total_distance_km || '0') * 0.621371).toFixed(1))} miles</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Route Planning */}
        <div className="w-96 bg-gray-50 border-l flex flex-col">
          <div className="bg-white border-b p-4">
            <h2 className="text-lg font-semibold">Route Planning</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Date Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Schedule Date</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label>Select Date</Label>
                    <Select
                      value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                      onValueChange={(value) => {
                        try {
                          const newDate = new Date(value);
                          if (!isNaN(newDate.getTime())) {
                            setSelectedDate(newDate);
                          }
                        } catch (e) {
                          console.error('Error parsing date:', e, value);
                        }
                      }}
                      disabled={selectedJobs.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={selectedJobs.length === 0 ? "Select jobs first" : "Select date"} />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedJobs.length === 0 ? (
                          <SelectItem value="no-jobs" disabled>
                            Please select jobs first
                          </SelectItem>
                        ) : availableDates.length === 0 ? (
                          <SelectItem value="no-dates" disabled>
                            No available dates found for selected jobs
                          </SelectItem>
                        ) : (
                          availableDates.map((dateInfo) => {
                            // Count engineers available on this date
                            const engineersOnDate = availableEngineers.filter(eng =>
                              eng.availability_dates.some(d => d.date === dateInfo.date)
                            );
                            return (
                              <SelectItem 
                                key={dateInfo.date} 
                                value={dateInfo.date}
                              >
                                {(() => {
                                  try {
                                    const dateStr = format(new Date(dateInfo.date), 'EEE, MMM d');
                                    const count = engineersOnDate?.length || 0;
                                    return `${dateStr} - ${count} engineer${count !== 1 ? 's' : ''} available`;
                                  } catch (e) {
                                    console.error('Error formatting date:', e, dateInfo);
                                    return String(dateInfo.date || 'Invalid date');
                                  }
                                })()}
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="show-next-available"
                      checked={showNextAvailableDate}
                      onChange={(e) => setShowNextAvailableDate(e.target.checked)}
                    />
                    <Label htmlFor="show-next-available" className="text-sm font-normal">
                      Show only next available date per engineer
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Engineer Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Engineer Assignment</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selectedEngineerAvailability?.id.toString()}
                    onValueChange={(value) => {
                      const engineerAvail = availableEngineers.find(e => e.id.toString() === value);
                      setSelectedEngineerAvailability(engineerAvail || null);
                      
                      // Find the actual engineer object
                      const engineer = engineers.find(e => e.id.toString() === value);
                      setSelectedEngineer(engineer || null);
                      
                      // Update start/end times based on engineer's work hours
                      if (engineer) {
                        if (engineer.work_start_time) {
                          setStartTime(engineer.work_start_time.slice(0, 5)); // Convert HH:MM:SS to HH:MM
                        }
                        if (engineer.work_end_time) {
                          setEndTime(engineer.work_end_time.slice(0, 5)); // Convert HH:MM:SS to HH:MM
                        }
                      }
                    }}
                    disabled={selectedJobs.length === 0 || !selectedDate}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        selectedJobs.length === 0 ? "Select jobs first" : 
                        !selectedDate ? "Select date first" : 
                        "Select engineer"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingAvailableEngineers ? (
                        <SelectItem value="loading" disabled>
                          Loading available engineers...
                        </SelectItem>
                      ) : selectedJobs.length === 0 || !selectedDate ? (
                        <SelectItem value="no-selection" disabled>
                          Please select jobs and date first
                        </SelectItem>
                      ) : availableEngineers.length === 0 ? (
                        <SelectItem value="no-engineers" disabled>
                          No engineers available for selected jobs and date
                        </SelectItem>
                      ) : (
                        availableEngineers
                          .filter(engineer => {
                            // Only show engineers available on selected date
                            return engineer.availability_dates && engineer.availability_dates.some(d => d.date === format(selectedDate, 'yyyy-MM-dd'));
                          })
                          .sort((a, b) => {
                            // Get date info for selected date
                            const aDate = a.availability_dates.find(d => d.date === format(selectedDate, 'yyyy-MM-dd'));
                            const bDate = b.availability_dates.find(d => d.date === format(selectedDate, 'yyyy-MM-dd'));
                            
                            if (!aDate || !bDate) return 0;
                            
                            // Prioritize those who can accommodate
                            if (aDate.can_accommodate_jobs !== bDate.can_accommodate_jobs) {
                              return aDate.can_accommodate_jobs ? -1 : 1;
                            }
                            
                            // Then prioritize no overtime
                            if (aDate.would_cause_overtime !== bDate.would_cause_overtime) {
                              return aDate.would_cause_overtime ? 1 : -1;
                            }
                            
                            // Finally by distance
                            return aDate.distance_km - bDate.distance_km;
                          })
                          .map(engineer => {
                            const dateInfo = engineer.availability_dates.find(d => d.date === format(selectedDate, 'yyyy-MM-dd'));
                            // Since we already filtered, dateInfo should exist
                            if (!dateInfo) {
                              console.error('DateInfo not found for engineer:', engineer.id);
                              return null;
                            }
                            
                            let displayText = `${engineer.name} - ${dateInfo.distance_km.toFixed(1)}km - ${dateInfo.remaining_weekly_hours.toFixed(1)}h available`;
                            
                            if (dateInfo.would_cause_overtime) {
                              displayText += ' ⚠️ OVERTIME';
                            }
                            
                            if (!dateInfo.can_accommodate_jobs) {
                              displayText += ' ❌ INSUFFICIENT HOURS';
                            }
                            
                            return (
                              <SelectItem 
                                key={engineer.id} 
                                value={engineer.id.toString()}
                                disabled={!dateInfo.can_accommodate_jobs}
                              >
                                {displayText}
                              </SelectItem>
                            );
                          })
                          .filter(item => item !== null)
                      )}
                    </SelectContent>
                  </Select>
                  
                  {/* Engineer Details */}
                  {selectedEngineerAvailability && selectedDate && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs space-y-1">
                      {(() => {
                        const dateInfo = selectedEngineerAvailability.availability_dates.find(
                          d => d.date === format(selectedDate, 'yyyy-MM-dd')
                        );
                        if (!dateInfo) return null;
                        
                        return (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Distance:</span>
                              <span className="font-medium">{dateInfo.distance_km.toFixed(1)}km</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Status:</span>
                              <span className={`font-medium ${
                                !dateInfo.can_accommodate_jobs ? 'text-red-600' :
                                dateInfo.would_cause_overtime ? 'text-orange-600' :
                                'text-green-600'
                              }`}>
                                {!dateInfo.can_accommodate_jobs ? 'Insufficient Hours' :
                                 dateInfo.would_cause_overtime ? 'Will Cause Overtime' :
                                 'Available'}
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                  
                  {/* Weekly Hours Visual Indicator */}
                  {selectedEngineerAvailability && selectedDate && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium">Weekly Hours</span>
                          <span className="text-gray-600">
                            {(() => {
                              try {
                                const dateInfo = selectedEngineerAvailability.availability_dates?.find(
                                  d => d?.date === format(selectedDate, 'yyyy-MM-dd')
                                );
                                if (!dateInfo) return '0 / 0h';
                                const hoursWorked = dateInfo.hours_worked_this_week || 0;
                                const maxHours = selectedEngineerAvailability.max_weekly_hours || 40;
                                return `${hoursWorked.toFixed(1)} / ${maxHours}h`;
                              } catch (e) {
                                console.error('Error formatting weekly hours:', e);
                                return '0 / 0h';
                              }
                            })()}
                          </span>
                        </div>
                        <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
                          {(() => {
                            const dateInfo = selectedEngineerAvailability.availability_dates.find(
                              d => d.date === format(selectedDate, 'yyyy-MM-dd')
                            );
                            if (!dateInfo) return null;
                            
                            const workedPercentage = (dateInfo.hours_worked_this_week / selectedEngineerAvailability.max_weekly_hours) * 100;
                            const newHoursPercentage = (selectedEngineerAvailability.estimated_job_hours / selectedEngineerAvailability.max_weekly_hours) * 100;
                            
                            return (
                              <>
                                <div 
                                  className="absolute h-full bg-green-500 transition-all"
                                  style={{ width: `${Math.min(workedPercentage, 100)}%` }}
                                />
                                <div 
                                  className="absolute h-full bg-blue-500 opacity-70 transition-all"
                                  style={{ 
                                    width: `${Math.min(newHoursPercentage, 100 - workedPercentage)}%`,
                                    left: `${Math.min(workedPercentage, 100)}%`
                                  }}
                                />
                                {workedPercentage + newHoursPercentage > 100 && (
                                  <div 
                                    className="absolute h-full bg-orange-500 opacity-70 transition-all"
                                    style={{ 
                                      width: `${Math.min((workedPercentage + newHoursPercentage) - 100, 100)}%`,
                                      left: '100%',
                                      transform: 'translateX(-100%)'
                                    }}
                                  />
                                )}
                              </>
                            );
                          })()}
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                            <span>Hours Worked</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                            <span>New Jobs ({(selectedEngineerAvailability?.estimated_job_hours || 0).toFixed(1)}h)</span>
                          </div>
                          {(() => {
                            const dateInfo = selectedEngineerAvailability.availability_dates.find(
                              d => d.date === format(selectedDate, 'yyyy-MM-dd')
                            );
                            return dateInfo?.would_cause_overtime ? (
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
                                <span className="text-orange-600">Overtime</span>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Time inputs */}
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div>
                      <Label htmlFor="start-time" className="text-xs">Start Time</Label>
                      <input
                        id="start-time"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full mt-1 px-2 py-1 border rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-time" className="text-xs">End Time</Label>
                      <input
                        id="end-time"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full mt-1 px-2 py-1 border rounded-md text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Static Jobs */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Add Static Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {STATIC_JOBS.map(job => {
                      const Icon = job.icon;
                      return (
                        <Button
                          key={job.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddStaticJob(job)}
                          className="justify-start"
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {job.name}
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Route Schedule */}
              <Card className="flex-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Route Schedule</CardTitle>
                  {isLoadingRoute && (
                    <p className="text-xs text-gray-500">Loading existing route...</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {isLoadingRoute ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 text-sm">Loading route...</p>
                      </div>
                    ) : routeJobs.length === 0 ? (
                      <p className="text-center text-gray-500 py-8 text-sm">
                        Select jobs from the left panel to build route
                      </p>
                    ) : (
                      routeJobs.map((job, index) => (
                        <div
                          key={job.id}
                          className={`rounded-lg border p-3 ${
                            job.is_static ? 'bg-gray-50' : 'bg-white'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {job.order}
                            </span>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-sm">
                                {String(job.is_static ? job.title : (job.site_name || 'Unknown Site'))}
                              </h5>
                              {!job.is_static && (
                                <p className="text-xs text-gray-600">
                                  {String(job.address || 'No address')}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {String(job.estimated_duration || 0)}m
                                </span>
                                {job.arrival_time && (
                                  <span className="text-xs text-blue-600">
                                    ETA: {String(job.arrival_time || '')}
                                  </span>
                                )}
                                {job.distance_from_previous !== undefined && job.distance_from_previous > 0 && (
                                  <span className="text-xs text-gray-500">
                                    <MapPin className="h-3 w-3 inline mr-1" />
                                    {String((job.distance_from_previous * 0.621371).toFixed(1))} miles
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFromRoute(job.id)}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Actions Footer */}
          <div className="bg-white border-t p-4">
            <div className="flex gap-3">
              <Button
                onClick={handleOptimizeRoute}
                disabled={isOptimizing || routeJobs.length === 0 || !selectedEngineer}
                className="flex-1"
              >
                <Route className="h-4 w-4 mr-2" />
                {isOptimizing ? 'Optimizing...' : 'Optimize Route'}
              </Button>
              <Button
                onClick={handleSaveRoute}
                disabled={routeJobs.length === 0 || !selectedEngineer}
                variant="default"
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Save Allocation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteAllocationPage;