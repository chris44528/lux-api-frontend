import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import engineerService from '../../../services/engineerService';
import syncManager from '../../../services/sync/syncManager';
import RouteCard from './RouteCard';
import SyncStatus from './SyncStatus';
import StatusIndicator from './StatusIndicator';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Alert } from '../../ui/alert';

interface EngineerDashboardProps {
  engineerId: number;
}

const EngineerDashboard: React.FC<EngineerDashboardProps> = ({ engineerId }) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Subscribe to sync status updates
  useEffect(() => {
    const unsubscribe = syncManager.subscribe(setSyncStatus);
    
    // Start auto sync
    syncManager.startAutoSync();
    
    return () => {
      unsubscribe();
      syncManager.stopAutoSync();
    };
  }, []);

  // Fetch dashboard data
  const { data: dashboardData, isLoading, error } = useQuery(
    ['engineerDashboard', engineerId],
    () => engineerService.getEngineerDashboard(engineerId),
    {
      refetchInterval: isOffline ? false : 30000, // Refresh every 30s when online
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Status update mutation
  const statusMutation = useMutation(
    (statusData: any) => engineerService.updateEngineerStatus(engineerId, statusData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['engineerDashboard', engineerId]);
      }
    }
  );

  const handleStatusUpdate = async (newStatus: string, location?: GeolocationPosition) => {
    const statusData: any = { status: newStatus };
    if (location) {
      statusData.latitude = location.coords.latitude;
      statusData.longitude = location.coords.longitude;
    }
    statusMutation.mutate(statusData);
  };

  const startRoute = async (routeId: number) => {
    try {
      await engineerService.startRoute(routeId);
      queryClient.invalidateQueries(['engineerDashboard', engineerId]);
    } catch (error) {
      console.error('Failed to start route:', error);
    }
  };

  const navigateToJob = (jobId: number) => {
    navigate(`/engineer/job/${jobId}`);
  };

  const openFormBuilder = () => {
    navigate('/engineer/forms/new');
  };

  const reportIssue = () => {
    navigate('/engineer/report-issue');
  };

  const viewHistory = () => {
    navigate('/engineer/history');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <p>Failed to load dashboard. Please try again.</p>
        </Alert>
      </div>
    );
  }

  const { engineer, today_route, pending_forms, sync_status } = dashboardData || {};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {isOffline && (
        <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-2 text-center">
          <span className="text-sm font-medium">📱 Offline Mode - Data will sync when connection is restored</span>
        </div>
      )}
      
      <header className="bg-white dark:bg-gray-800 shadow-sm p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Welcome, {engineer?.technician?.full_name || 'Engineer'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {engineer?.employee_id || 'ID: N/A'}
            </p>
          </div>
          
          <StatusIndicator 
            currentStatus={engineer?.status || 'offline'}
            onStatusChange={handleStatusUpdate}
            isOffline={isOffline}
          />
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Today's Route */}
        <div className="mb-6">
          {today_route ? (
            <RouteCard 
              route={today_route}
              onJobSelect={navigateToJob}
              onStartRoute={() => startRoute(today_route.id)}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No route assigned for today
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Contact your supervisor for job assignments
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={openFormBuilder}
                className="flex items-center justify-center gap-2"
              >
                <span>📝</span>
                <span>Submit Form</span>
              </Button>
              <Button 
                onClick={reportIssue}
                variant="outline"
                className="flex items-center justify-center gap-2"
              >
                <span>⚠️</span>
                <span>Report Issue</span>
              </Button>
              <Button 
                onClick={viewHistory}
                variant="outline"
                className="flex items-center justify-center gap-2"
              >
                <span>📊</span>
                <span>View History</span>
              </Button>
              <Button 
                onClick={() => navigate('/engineer/settings')}
                variant="outline"
                className="flex items-center justify-center gap-2"
              >
                <span>⚙️</span>
                <span>Settings</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sync Status */}
        <SyncStatus 
          syncStatus={syncStatus || sync_status}
          onForceSync={() => syncManager.forceSync()}
        />

        {/* Pending Forms */}
        {pending_forms && pending_forms.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Forms ({pending_forms.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pending_forms.slice(0, 5).map((form: any) => (
                  <div 
                    key={form.id}
                    className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => navigate(`/engineer/form/${form.id}`)}
                  >
                    <div>
                      <p className="font-medium text-sm">{form.form_template.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(form.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      Pending
                    </span>
                  </div>
                ))}
                {pending_forms.length > 5 && (
                  <Button 
                    variant="link" 
                    className="w-full"
                    onClick={() => navigate('/engineer/forms')}
                  >
                    View all {pending_forms.length} forms →
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EngineerDashboard;