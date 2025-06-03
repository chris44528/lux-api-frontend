import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';

interface RouteJob {
  id: number;
  job: {
    id: number;
    title: string;
    site: {
      site_name: string;
      address: string;
      postcode: string;
    };
    priority: string;
    status: string;
  };
  sequence_order: number;
  estimated_arrival: string;
  estimated_duration: number;
  status: string;
}

interface RouteCardProps {
  route: {
    id: number;
    route_name: string;
    date: string;
    status: string;
    total_jobs: number;
    completed_jobs: number;
    total_distance: number;
    estimated_duration: number;
    route_jobs: RouteJob[];
  };
  onJobSelect: (jobId: number) => void;
  onStartRoute: () => void;
}

const RouteCard: React.FC<RouteCardProps> = ({ route, onJobSelect, onStartRoute }) => {
  const progress = route.total_jobs > 0 ? (route.completed_jobs / route.total_jobs) * 100 : 0;

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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{route.route_name}</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {new Date(route.date).toLocaleDateString()} • {route.total_jobs} jobs
            </p>
          </div>
          {route.status === 'planned' && (
            <Button onClick={onStartRoute} size="sm">
              Start Route
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress</span>
            <span>{route.completed_jobs} of {route.total_jobs} completed</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Route Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <p className="text-sm text-gray-500 dark:text-gray-400">Distance</p>
            <p className="font-bold">{route.total_distance.toFixed(1)} km</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <p className="text-sm text-gray-500 dark:text-gray-400">Est. Duration</p>
            <p className="font-bold">{Math.round(route.estimated_duration / 60)} hrs</p>
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm mb-2">Jobs</h4>
          {route.route_jobs.map((routeJob) => (
            <div
              key={routeJob.id}
              onClick={() => onJobSelect(routeJob.job.id)}
              className={`p-3 border rounded cursor-pointer transition-colors
                ${routeJob.status === 'completed' 
                  ? 'bg-gray-50 dark:bg-gray-800 opacity-60' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      #{routeJob.sequence_order} - {routeJob.job.site.site_name}
                    </span>
                    <Badge variant={getPriorityColor(routeJob.job.priority)} className="text-xs">
                      {routeJob.job.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {routeJob.job.site.address}, {routeJob.job.site.postcode}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    ETA: {new Date(routeJob.estimated_arrival).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })} • {routeJob.estimated_duration} min
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(routeJob.status)}`}>
                  {routeJob.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RouteCard;