import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import jobService, { Job } from '../../services/jobService';
import { formatDistanceToNow } from 'date-fns';

interface JobsTabProps {
  siteId: number;
}

const JobsTab: React.FC<JobsTabProps> = ({ siteId }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSiteJobs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await jobService.getJobsBySite(siteId);
        setJobs(response.results);
      } catch (err) {
        setError('Failed to load jobs for this site');
      } finally {
        setLoading(false);
      }
    };

    if (siteId) {
      fetchSiteJobs();
    }
  }, [siteId]);

  const getStatusColor = (status: { color: string; name: string }) => {
    return status.color || '#6B7280';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'low':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading jobs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-red-600 dark:text-red-400">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 dark:text-gray-400">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-lg font-medium">No jobs found</p>
          <p className="text-sm mt-1">There are no jobs associated with this site.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Site Jobs ({jobs.length})
        </h3>
        <Link
          to="/jobs"
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View all jobs →
        </Link>
      </div>
      
      <div className="space-y-3">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <Link
                    to={`/jobs/${job.id}`}
                    className="text-lg font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 truncate"
                  >
                    {job.title}
                  </Link>
                  <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${getStatusColor(job.status)}20`,
                      color: getStatusColor(job.status),
                    }}
                  >
                    {job.status.name}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {job.description}
                </p>
                
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Priority:</span>
                    <span className={`px-2 py-1 rounded ${getPriorityColor(job.priority)}`}>
                      {job.priority.charAt(0).toUpperCase() + job.priority.slice(1)}
                    </span>
                  </div>
                  
                  {job.queue && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Queue:</span>
                      <span>{job.queue.name}</span>
                    </div>
                  )}
                  
                  {job.type && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Type:</span>
                      <span>{job.type.name}</span>
                    </div>
                  )}
                  
                  {job.assigned_to && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Assigned to:</span>
                      <span>{job.assigned_to.user.first_name} {job.assigned_to.user.last_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-4">
                <span>Created {formatDate(job.created_at)}</span>
                {job.due_date && (
                  <span>Due {formatDate(job.due_date)}</span>
                )}
              </div>
              <Link
                to={`/jobs/${job.id}`}
                className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                View Job
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobsTab;