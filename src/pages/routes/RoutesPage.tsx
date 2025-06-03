import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import engineerService from '../../services/engineerService';
import RouteOptimizer from '../../components/engineer/routes/RouteOptimizer';
import RouteManager from '../../components/engineer/routes/RouteManager';
import WeeklyOptimizer from '../../components/engineer/routes/WeeklyOptimizer';
import NearbyPlaces from '../../components/engineer/maps/NearbyPlaces';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';

const RoutesPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('current');
  const engineerId = user?.engineer_id || parseInt(localStorage.getItem('currentEngineerId') || '0');

  // Fetch current routes
  const { data: routes, isLoading: routesLoading, refetch: refetchRoutes } = useQuery(
    ['engineerRoutes', engineerId],
    () => engineerService.getRoutes({ engineer: engineerId }),
    {
      enabled: !!engineerId
    }
  );

  // Fetch available jobs for optimization
  const { data: availableJobs, isLoading: jobsLoading } = useQuery(
    ['availableJobs'],
    async () => {
      // This would be a real API call to get unassigned jobs
      // For now, returning mock data
      return [
        {
          id: 1,
          title: 'Solar Panel Inspection',
          site: {
            id: 1,
            site_name: 'Green Energy Site A',
            address: '123 Solar Street',
            postcode: 'SW1A 1AA',
            latitude: 51.5074,
            longitude: -0.1278
          },
          priority: 'high',
          estimated_duration: 45,
          due_date: new Date().toISOString()
        },
        {
          id: 2,
          title: 'Meter Reading',
          site: {
            id: 2,
            site_name: 'Eco Power Station B',
            address: '456 Wind Avenue',
            postcode: 'SW1A 2BB',
            latitude: 51.5174,
            longitude: -0.1378
          },
          priority: 'medium',
          estimated_duration: 30,
          due_date: new Date().toISOString()
        },
        {
          id: 3,
          title: 'System Maintenance',
          site: {
            id: 3,
            site_name: 'Solar Farm C',
            address: '789 Renewable Road',
            postcode: 'SW1A 3CC',
            latitude: 51.4974,
            longitude: -0.1178
          },
          priority: 'urgent',
          estimated_duration: 60,
          due_date: new Date().toISOString()
        }
      ];
    }
  );

  // Get engineer data
  const { data: engineer } = useQuery(
    ['engineer', engineerId],
    () => engineerService.getEngineer(engineerId),
    {
      enabled: !!engineerId
    }
  );

  const handleRouteOptimized = async (optimizedRoute: any) => {
    // Create new route with optimized jobs
    try {
      await engineerService.createRoute({
        engineer_id: engineerId,
        route_name: `Route - ${new Date().toLocaleDateString()}`,
        date: new Date().toISOString().split('T')[0],
        jobs: optimizedRoute.optimized_order.map((item: any) => item.job_id)
      });
      refetchRoutes();
      setActiveTab('current');
    } catch (error) {
      console.error('Failed to create route:', error);
    }
  };

  const currentRoute = routes?.find((r: any) => 
    r.date === new Date().toISOString().split('T')[0] && 
    r.status !== 'completed'
  );

  const pastRoutes = routes?.filter((r: any) => 
    r.date < new Date().toISOString().split('T')[0] || 
    r.status === 'completed'
  );

  if (!engineerId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert>
          <p>Engineer access required to view routes.</p>
        </Alert>
      </div>
    );
  }

  if (routesLoading || jobsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading routes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Route Management</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Optimize and manage your daily routes
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="current">Current</TabsTrigger>
          <TabsTrigger value="optimize">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="nearby">Nearby</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-6">
          {currentRoute ? (
            <RouteManager 
              route={currentRoute} 
              onJobsReordered={refetchRoutes}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500 mb-4">No active route for today</p>
                <Button onClick={() => setActiveTab('optimize')}>
                  Create New Route
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="optimize" className="mt-6">
          {engineer && availableJobs && (
            <RouteOptimizer
              engineer={engineer}
              availableJobs={availableJobs}
              onRouteOptimized={handleRouteOptimized}
            />
          )}
        </TabsContent>

        <TabsContent value="weekly" className="mt-6">
          {engineer && availableJobs && (
            <WeeklyOptimizer
              engineerId={engineerId}
              availableJobs={availableJobs}
              onScheduleCreated={(schedule) => {
                // Handle weekly schedule creation
                refetchRoutes();
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="nearby" className="mt-6">
          <NearbyPlaces />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Route History</h3>
            {pastRoutes && pastRoutes.length > 0 ? (
              pastRoutes.map((route: any) => (
                <Card key={route.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{route.route_name}</h4>
                        <p className="text-sm text-gray-500">
                          {new Date(route.date).toLocaleDateString()} • {route.total_jobs} jobs
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium
                          ${route.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'}`}>
                          {route.status}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          {route.completed_jobs}/{route.total_jobs} completed
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">No route history available</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RoutesPage;