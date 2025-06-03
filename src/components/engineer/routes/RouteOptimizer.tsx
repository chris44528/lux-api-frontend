import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import engineerService from '../../../services/engineerService';
import MapComponent from '../maps/MapComponent';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Alert } from '../../ui/alert';
import { Progress } from '../../ui/progress';
import { Switch } from '../../ui/switch';
import { Label } from '../../ui/label';

interface Job {
  id: number;
  title: string;
  site: {
    id: number;
    site_name: string;
    address: string;
    postcode: string;
    latitude?: number;
    longitude?: number;
  };
  priority: string;
  estimated_duration: number;
  due_date: string;
}

interface RouteOptimizerProps {
  engineer: {
    id: number;
    technician: {
      full_name: string;
    };
    current_location?: {
      latitude: number;
      longitude: number;
    };
  };
  availableJobs: Job[];
  onRouteOptimized: (route: any) => void;
}

const RouteOptimizer: React.FC<RouteOptimizerProps> = ({ 
  engineer, 
  availableJobs, 
  onRouteOptimized 
}) => {
  const [selectedJobs, setSelectedJobs] = useState<Job[]>([]);
  const [optimizedRoute, setOptimizedRoute] = useState<any>(null);
  const [constraints, setConstraints] = useState({
    max_distance_km: 200,
    service_time_minutes: 30,
    start_time: '08:00',
    end_time: '17:00',
    use_current_location: true,
    prioritize_urgent: true,
    use_enhanced_optimization: true,
    include_traffic: true,
    include_breaks: true,
    prefer_clusters: true
  });
  const [showMap, setShowMap] = useState(false);

  const optimizeMutation = useMutation(
    (optimizationData: any) => engineerService.optimizeRoute(optimizationData),
    {
      onSuccess: (data) => {
        setOptimizedRoute(data);
        onRouteOptimized(data);
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

  const handleSelectAll = () => {
    if (selectedJobs.length === availableJobs.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs([...availableJobs]);
    }
  };

  const optimizeRoute = () => {
    if (selectedJobs.length === 0) return;

    const optimizationData = {
      engineer_id: engineer.id,
      job_ids: selectedJobs.map(job => job.id),
      date: new Date().toISOString().split('T')[0],
      start_location: constraints.use_current_location && engineer.current_location ? {
        latitude: engineer.current_location.latitude,
        longitude: engineer.current_location.longitude
      } : null,
      constraints: {
        max_distance_km: constraints.max_distance_km,
        service_time_minutes: constraints.service_time_minutes,
        start_time: constraints.start_time,
        end_time: constraints.end_time,
        use_enhanced_optimization: constraints.use_enhanced_optimization,
        include_traffic: constraints.include_traffic,
        departure_time: constraints.include_traffic ? 
          `${new Date().toISOString().split('T')[0]}T${constraints.start_time}:00` : null,
        include_breaks: constraints.include_breaks,
        prefer_clusters: constraints.prefer_clusters
      }
    };

    optimizeMutation.mutate(optimizationData);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
      case 'urgent':
        return 'destructive';
      case 'medium':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const totalDuration = selectedJobs.reduce((sum, job) => sum + job.estimated_duration, 0);
  const workHours = 9; // Default 9-hour workday
  const utilizationRate = Math.min((totalDuration / 60 / workHours) * 100, 100);

  // Sort jobs by priority if enabled
  const displayJobs = constraints.prioritize_urgent 
    ? [...availableJobs].sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return (priorityOrder[a.priority.toLowerCase()] || 3) - (priorityOrder[b.priority.toLowerCase()] || 3);
      })
    : availableJobs;

  return (
    <div className="space-y-4">
      {/* Optimization Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Route Optimization Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Max Distance (km)</Label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-md"
                value={constraints.max_distance_km}
                onChange={(e) => setConstraints({
                  ...constraints,
                  max_distance_km: parseInt(e.target.value)
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Service Time (minutes)</Label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-md"
                value={constraints.service_time_minutes}
                onChange={(e) => setConstraints({
                  ...constraints,
                  service_time_minutes: parseInt(e.target.value)
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Start Time</Label>
              <input
                type="time"
                className="w-full px-3 py-2 border rounded-md"
                value={constraints.start_time}
                onChange={(e) => setConstraints({
                  ...constraints,
                  start_time: e.target.value
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>End Time</Label>
              <input
                type="time"
                className="w-full px-3 py-2 border rounded-md"
                value={constraints.end_time}
                onChange={(e) => setConstraints({
                  ...constraints,
                  end_time: e.target.value
                })}
              />
            </div>
          </div>
          
          <div className="mt-4 space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                checked={constraints.use_current_location}
                onCheckedChange={(checked) => setConstraints({
                  ...constraints,
                  use_current_location: checked
                })}
              />
              <Label>Use current location as starting point</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={constraints.prioritize_urgent}
                onCheckedChange={(checked) => setConstraints({
                  ...constraints,
                  prioritize_urgent: checked
                })}
              />
              <Label>Prioritize urgent jobs</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={constraints.use_enhanced_optimization}
                onCheckedChange={(checked) => setConstraints({
                  ...constraints,
                  use_enhanced_optimization: checked
                })}
              />
              <Label>Use Google Maps optimization</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={constraints.include_traffic}
                onCheckedChange={(checked) => setConstraints({
                  ...constraints,
                  include_traffic: checked
                })}
                disabled={!constraints.use_enhanced_optimization}
              />
              <Label>Include real-time traffic</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={constraints.include_breaks}
                onCheckedChange={(checked) => setConstraints({
                  ...constraints,
                  include_breaks: checked
                })}
              />
              <Label>Include break times</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={constraints.prefer_clusters}
                onCheckedChange={(checked) => setConstraints({
                  ...constraints,
                  prefer_clusters: checked
                })}
              />
              <Label>Group nearby jobs</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Selection */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Available Jobs ({availableJobs.length})</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedJobs.length === availableJobs.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {displayJobs.map(job => (
              <div
                key={job.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors
                  ${selectedJobs.some(j => j.id === job.id) 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-500' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                onClick={() => handleJobSelection(
                  job, 
                  !selectedJobs.some(j => j.id === job.id)
                )}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedJobs.some(j => j.id === job.id)}
                    onChange={(e) => handleJobSelection(job, e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{job.title}</h4>
                      <Badge variant={getPriorityColor(job.priority)}>
                        {job.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {job.site.site_name} - {job.site.address}, {job.site.postcode}
                    </p>
                    <div className="flex gap-4 mt-1">
                      <span className="text-xs text-gray-500">
                        Duration: {job.estimated_duration} min
                      </span>
                      <span className="text-xs text-gray-500">
                        Due: {new Date(job.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {selectedJobs.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Selected Jobs</span>
                <span className="text-sm">{selectedJobs.length} jobs</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Total Duration</span>
                <span className="text-sm font-medium">
                  {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Utilization Rate</span>
                  <span className="text-sm font-medium">{utilizationRate.toFixed(0)}%</span>
                </div>
                <Progress value={utilizationRate} className="h-2" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Optimization Results */}
      {optimizedRoute && (
        <Card>
          <CardHeader>
            <CardTitle>Optimization Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <p className="text-sm text-gray-500">Total Distance</p>
                <p className="text-xl font-bold">{optimizedRoute.total_distance.toFixed(1)} km</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <p className="text-sm text-gray-500">Est. Duration</p>
                <p className="text-xl font-bold">
                  {Math.floor(optimizedRoute.estimated_duration / 60)}h {optimizedRoute.estimated_duration % 60}m
                </p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <p className="text-sm text-gray-500">Jobs Scheduled</p>
                <p className="text-xl font-bold">{optimizedRoute.optimized_order.length}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium mb-2">Optimized Route Order</h4>
              {optimizedRoute.optimized_order.map((item: any, index: number) => (
                <div key={item.job_id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.job_title}</p>
                    <p className="text-xs text-gray-500">
                      ETA: {new Date(item.estimated_arrival).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {item.distance_from_previous.toFixed(1)} km
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map View Toggle */}
      {(selectedJobs.length > 0 || optimizedRoute) && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Route Visualization</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMap(!showMap)}
              >
                {showMap ? '🗺️ Hide Map' : '🗺️ Show Map'}
              </Button>
            </div>
          </CardHeader>
          {showMap && (
            <CardContent>
              <MapComponent
                apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''}
                engineerLocation={engineer.current_location}
                jobs={selectedJobs}
                routeJobs={optimizedRoute?.optimized_order.map((item: any, index: number) => ({
                  job: selectedJobs.find(j => j.id === item.job_id),
                  sequence_order: index + 1,
                  estimated_arrival: item.estimated_arrival,
                  distance_from_previous: item.distance_from_previous
                }))}
                optimizedRoute={optimizedRoute}
                height="400px"
              />
            </CardContent>
          )}
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={optimizeRoute}
          disabled={selectedJobs.length === 0 || optimizeMutation.isLoading}
          className="flex-1"
        >
          {optimizeMutation.isLoading ? (
            <>
              <span className="animate-spin mr-2">🔄</span>
              Optimizing...
            </>
          ) : (
            <>
              <span className="mr-2">🎯</span>
              Optimize Route
            </>
          )}
        </Button>
        
        {optimizedRoute && (
          <Button
            variant="outline"
            onClick={() => {
              setOptimizedRoute(null);
              setSelectedJobs([]);
              setShowMap(false);
            }}
          >
            Clear Results
          </Button>
        )}
      </div>

      {optimizeMutation.isError && (
        <Alert variant="destructive">
          <p>Failed to optimize route. Please try again.</p>
        </Alert>
      )}

      {/* Enhanced Features Info */}
      {constraints.use_enhanced_optimization && (
        <Alert>
          <p className="text-sm">
            🚀 Enhanced optimization is enabled. This uses Google Maps to calculate real distances 
            and {constraints.include_traffic ? 'includes real-time traffic data' : 'optimal routes'}.
          </p>
        </Alert>
      )}
    </div>
  );
};

export default RouteOptimizer;