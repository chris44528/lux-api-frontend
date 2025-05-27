import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Clock, Calendar, Loader2 } from 'lucide-react';
import jobService, { Job } from '../services/jobService';

interface SiteJobsProps {
  siteId: string;
  siteName?: string;  // Make siteName optional since we're not using it
}

const SiteJobs: React.FC<SiteJobsProps> = ({ siteId }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchJobs = async () => {
      if (!siteId) {
        setJobs([]);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        // Fetch jobs for this site using the site_id filter
        const response = await jobService.getJobs({ site_id: parseInt(siteId) });
        if (Array.isArray(response.results)) {
          setJobs(response.results);
        } else {
          setJobs([]);
          setError('Invalid data format received from server');
        }
      } catch (err) {
        setError('Failed to load jobs for this site');
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobs();
  }, [siteId]);
  
  // Helper function to get status badge color
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in progress':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'awaiting callback':
      case 'awaiting_callback':
        return 'bg-purple-100 text-purple-800';
      case 'booked':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Helper function to get priority badge color
  const getPriorityColor = (priority: string): string => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Format date nicely
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };
  
  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-green-700" />
        <span className="ml-2 text-gray-600">Loading jobs...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <p>{error}</p>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Open Jobs for this Site</h3>
        <Link 
          to={`/jobs?siteId=${siteId}`} 
          className="bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center"
        >
          <Plus className="h-4 w-4 mr-1" />
          New Job
        </Link>
      </div>
      
      {jobs.length > 0 ? (
        <div className="space-y-4">
          {jobs.map(job => (
            <div key={job.id} className="border rounded-md p-3 hover:bg-gray-50">
              <Link to={`/jobs/${job.id}`} className="block">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-lg">{job.title}</h4>
                  <div className="flex gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status.name)}`}>
                      {job.status.name.replace(/_/g, ' ')}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(job.priority)}`}>
                      {job.priority}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Queue: {job.queue.name}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Due: {formatDate(job.due_date)}</span>
                </div>
                <div className="flex items-center col-span-2">
                  <span>Assigned to: {job.assigned_to ? `${job.assigned_to.user.first_name} ${job.assigned_to.user.last_name}` : 'Unassigned'}</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <p>No jobs found for this site</p>
          <Link 
            to={`/jobs?siteId=${siteId}`} 
            className="inline-flex items-center mt-2 text-green-700 hover:text-green-800"
          >
            <Plus className="h-4 w-4 mr-1" />
            Create a new job
          </Link>
        </div>
      )}
    </div>
  );
};

export default SiteJobs; 