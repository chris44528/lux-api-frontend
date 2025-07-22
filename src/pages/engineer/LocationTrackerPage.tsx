import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { MapPin, Calendar, Users, Activity, Download, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import locationTrackingService from '../../services/locationTrackingService';
import engineerService from '../../services/engineerService';
import LocationTrackingMap from '../../components/engineer/location/LocationTrackingMap';
import LocationHistory from '../../components/engineer/location/LocationHistory';
import EngineerSelector from '../../components/engineer/location/EngineerSelector';

interface SelectedEngineer {
  id: number;
  name: string;
  employee_id: string;
  color?: string;
}

const LocationTrackerPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEngineers, setSelectedEngineers] = useState<SelectedEngineer[]>([]);
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'custom'>('day');
  const [showLiveTracking, setShowLiveTracking] = useState(true);
  const [mapView, setMapView] = useState<'tracking' | 'heatmap' | 'clusters'>('tracking');

  // Fetch engineers list
  const { data: engineersData, isLoading: engineersLoading } = useQuery({
    queryKey: ['engineers'],
    queryFn: () => engineerService.getEngineers({ status: 'active' }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch current locations (for live tracking)
  const { data: currentLocations, refetch: refetchCurrentLocations } = useQuery({
    queryKey: ['currentLocations', showLiveTracking],
    queryFn: () => locationTrackingService.getCurrentEngineerLocations(15),
    enabled: showLiveTracking,
    refetchInterval: showLiveTracking ? 30000 : false, // Refresh every 30 seconds
    staleTime: 20000,
  });

  // Fetch location history
  const { data: locationHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['locationHistory', selectedDate, selectedEngineers],
    queryFn:
    async () => {
      if (selectedEngineers.length === 0) return { count: 0, locations: [] };
      
      const startDate = dateRange === 'week' 
        ? subDays(selectedDate, 6) 
        : selectedDate;
        
      const promises = selectedEngineers.map(engineer =>
        locationTrackingService.getEngineerLocationHistory(engineer.id, {
          start_date: format(startOfDay(startDate), 'yyyy-MM-dd'),
          end_date: format(endOfDay(selectedDate), 'yyyy-MM-dd'),
        })
      );
      
      const results = await Promise.all(promises);
      
      // Combine all locations and add engineer info
      const allLocations = results.flatMap((result, index) => 
        result.locations.map(loc => ({
          ...loc,
          engineer: selectedEngineers[index]
        }))
      );
      
      return {
        count: allLocations.length,
        locations: allLocations
      };
    },
    enabled: selectedEngineers.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch movement summaries
  const { data: movementSummaries } = useQuery({
    queryKey: ['movementSummaries', selectedDate, selectedEngineers],
    queryFn:
    async () => {
      if (selectedEngineers.length === 0) return [];
      
      const promises = selectedEngineers.map(engineer =>
        locationTrackingService.getMovementSummary({
          date: format(selectedDate, 'yyyy-MM-dd'),
          days: dateRange === 'week' ? 7 : 1
        }).then(result => ({
          engineer,
          ...result
        }))
      );
      
      return Promise.all(promises);
    },
    enabled: selectedEngineers.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch location clusters
  const { data: locationClusters } = useQuery({
    queryKey: ['locationClusters'],
    queryFn: () => locationTrackingService.getLocationClusters(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Handle engineer selection
  const handleEngineerSelect = (engineers: SelectedEngineer[]) => {
    // Assign colors to engineers
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    const engineersWithColors = engineers.map((eng, index) => ({
      ...eng,
      color: colors[index % colors.length]
    }));
    setSelectedEngineers(engineersWithColors);
  };

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(new Date(e.target.value));
  };

  // Export data
  const handleExport = () => {
    // TODO: Implement data export functionality
    console.log('Exporting location data...');
  };

  // Calculate statistics
  const calculateStats = () => {
    if (!movementSummaries || movementSummaries.length === 0) {
      return {
        totalDistance: 0,
        totalTime: 0,
        avgSpeed: 0,
        efficiency: 0
      };
    }

    const totals = movementSummaries.reduce((acc, summary) => {
      const summaryData = summary.summaries?.[0] || {};
      return {
        totalDistance: acc.totalDistance + (summaryData.total_distance_km || 0),
        totalTime: acc.totalTime + (summaryData.total_driving_time_minutes || 0),
        efficiency: acc.efficiency + (summaryData.efficiency_percentage || 0)
      };
    }, { totalDistance: 0, totalTime: 0, efficiency: 0 });

    return {
      totalDistance: totals.totalDistance.toFixed(1),
      totalTime: Math.round(totals.totalTime / 60), // Convert to hours
      avgSpeed: totals.totalTime > 0 ? (totals.totalDistance / (totals.totalTime / 60)).toFixed(1) : 0,
      efficiency: (totals.efficiency / movementSummaries.length).toFixed(1)
    };
  };

  const stats = calculateStats();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Location Tracker</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track and monitor engineer locations, routes, and movement patterns
        </p>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={format(selectedDate, 'yyyy-MM-dd')}
                  onChange={handleDateChange}
                  className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                />
                <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Engineer Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Engineers</label>
              <EngineerSelector
                engineers={engineersData?.results || []}
                selectedEngineers={selectedEngineers}
                onSelectionChange={handleEngineerSelect}
                loading={engineersLoading}
              />
            </div>

            {/* Actions */}
            <div className="flex items-end gap-2">
              <Button
                variant={showLiveTracking ? 'default' : 'outline'}
                onClick={() => setShowLiveTracking(!showLiveTracking)}
                className="flex-1"
              >
                <Activity className="w-4 h-4 mr-2" />
                {showLiveTracking ? 'Live' : 'History'}
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Distance</p>
                <p className="text-2xl font-bold">{stats.totalDistance} km</p>
              </div>
              <MapPin className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Travel Time</p>
                <p className="text-2xl font-bold">{stats.totalTime} hrs</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Speed</p>
                <p className="text-2xl font-bold">{stats.avgSpeed} km/h</p>
              </div>
              <Activity className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Efficiency</p>
                <p className="text-2xl font-bold">{stats.efficiency}%</p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="map" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="map">Map View</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Location Map</CardTitle>
                <Select value={mapView} onValueChange={(value: any) => setMapView(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tracking">Tracking</SelectItem>
                    <SelectItem value="heatmap">Heat Map</SelectItem>
                    <SelectItem value="clusters">Clusters</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[600px]">
                <LocationTrackingMap
                  locations={locationHistory?.locations || []}
                  currentLocations={showLiveTracking ? currentLocations?.engineers : undefined}
                  clusters={mapView === 'clusters' ? locationClusters?.clusters : undefined}
                  view={mapView}
                  selectedEngineers={selectedEngineers}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Movement Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <LocationHistory
                locations={locationHistory?.locations || []}
                engineers={selectedEngineers}
                loading={historyLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Analytics content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Time at Locations</CardTitle>
              </CardHeader>
              <CardContent>
                {locationClusters?.clusters && (
                  <div className="space-y-3">
                    {locationClusters.clusters.slice(0, 5).map(cluster => (
                      <div key={cluster.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <div>
                          <p className="font-medium">{cluster.location_name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {cluster.visit_count} visits • {Math.round(cluster.average_duration_minutes)} min avg
                          </p>
                        </div>
                        <Badge>{cluster.location_type}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Movement Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                {movementSummaries && movementSummaries.length > 0 && (
                  <div className="space-y-3">
                    {movementSummaries.map((summary, index) => (
                      <div key={index} className="p-3 border rounded">
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: summary.engineer.color }}
                          />
                          <p className="font-medium">{summary.engineer.name}</p>
                        </div>
                        {summary.summaries?.[0] && (
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Distance:</span>
                              <span className="ml-2">{summary.summaries[0].total_distance_km?.toFixed(1)} km</span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Locations:</span>
                              <span className="ml-2">{summary.summaries[0].unique_locations_visited}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Live tracking indicator */}
      {showLiveTracking && currentLocations && (
        <div className="fixed bottom-4 right-4">
          <Badge variant="default" className="animate-pulse">
            <Activity className="w-3 h-3 mr-1" />
            Live Tracking: {currentLocations.count} engineers online
          </Badge>
        </div>
      )}
    </div>
  );
};

export default LocationTrackerPage;