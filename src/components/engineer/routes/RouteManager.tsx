import React, { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import engineerService from '../../../services/engineerService';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Alert } from '../../ui/alert';

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

interface SortableJobProps {
  routeJob: RouteJob;
  index: number;
}

const SortableJob: React.FC<SortableJobProps> = ({ routeJob, index }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: routeJob.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
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

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return '✅';
      case 'in_progress':
        return '🔄';
      case 'skipped':
        return '⏭️';
      default:
        return '⏳';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 bg-white dark:bg-gray-800 border rounded-lg ${
        isDragging ? 'shadow-lg' : 'shadow-sm'
      } ${routeJob.status === 'completed' ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="text-gray-400"
          >
            <path d="M7 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM13 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM13 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM13 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
          </svg>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold text-gray-500">#{index + 1}</span>
            <h4 className="font-medium">{routeJob.job.site.site_name}</h4>
            <Badge variant={getPriorityColor(routeJob.job.priority)}>
              {routeJob.job.priority}
            </Badge>
            <span className="text-lg">{getStatusIcon(routeJob.status)}</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {routeJob.job.site.address}, {routeJob.job.site.postcode}
          </p>
          <div className="flex gap-4 text-xs text-gray-500">
            <span>ETA: {new Date(routeJob.estimated_arrival).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}</span>
            <span>Duration: {routeJob.estimated_duration} min</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface RouteManagerProps {
  route: {
    id: number;
    route_name: string;
    date: string;
    status: string;
    route_jobs: RouteJob[];
  };
  onJobsReordered?: () => void;
}

const RouteManager: React.FC<RouteManagerProps> = ({ route, onJobsReordered }) => {
  const [routeJobs, setRouteJobs] = useState(route.route_jobs);
  const [hasChanges, setHasChanges] = useState(false);
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const reorderMutation = useMutation(
    (jobOrder: number[]) => engineerService.reorderJobs(route.id, jobOrder),
    {
      onSuccess: () => {
        setHasChanges(false);
        queryClient.invalidateQueries(['route', route.id]);
        onJobsReordered?.();
      }
    }
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setRouteJobs((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        setHasChanges(true);
        return newItems;
      });
    }
  };

  const saveOrder = () => {
    const jobOrder = routeJobs.map(rj => rj.job.id);
    reorderMutation.mutate(jobOrder);
  };

  const resetOrder = () => {
    setRouteJobs(route.route_jobs);
    setHasChanges(false);
  };

  const pendingJobs = routeJobs.filter(rj => rj.status === 'pending').length;
  const completedJobs = routeJobs.filter(rj => rj.status === 'completed').length;
  const inProgressJobs = routeJobs.filter(rj => rj.status === 'in_progress').length;

  return (
    <div className="space-y-4">
      {/* Route Summary */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{route.route_name}</CardTitle>
            <Badge variant={route.status === 'in_progress' ? 'default' : 'secondary'}>
              {route.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-xl font-bold">{pendingJobs}</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-xl font-bold text-blue-600">{inProgressJobs}</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-xl font-bold text-green-600">{completedJobs}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reorder Instructions */}
      {route.status !== 'completed' && (
        <Alert>
          <p className="text-sm">
            🔀 Drag and drop jobs to reorder them. Changes will update estimated arrival times.
          </p>
        </Alert>
      )}

      {/* Job List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Route Jobs ({routeJobs.length})</CardTitle>
            {hasChanges && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetOrder}
                >
                  Reset
                </Button>
                <Button
                  size="sm"
                  onClick={saveOrder}
                  disabled={reorderMutation.isLoading}
                >
                  {reorderMutation.isLoading ? 'Saving...' : 'Save Order'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={routeJobs.map(rj => rj.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {routeJobs.map((routeJob, index) => (
                  <SortableJob
                    key={routeJob.id}
                    routeJob={routeJob}
                    index={index}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      {reorderMutation.isError && (
        <Alert variant="destructive">
          <p>Failed to save route order. Please try again.</p>
        </Alert>
      )}
    </div>
  );
};

export default RouteManager;