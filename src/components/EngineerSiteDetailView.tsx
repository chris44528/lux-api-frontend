import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SiteDetailResponse } from '../types/api';
import engineerService from '../services/engineerService';
import storageService from '../services/offline/storageService';
import { Button } from './ui/button';
import { Alert } from './ui/alert';
import { Badge } from './ui/badge';

interface EngineerSiteDetailViewProps {
  site: SiteDetailResponse;
  includeHeader?: boolean;
  jobId?: number; // Optional job ID if viewing site in context of a job
}

function EngineerSiteDetailView({ site, includeHeader = false, jobId }: EngineerSiteDetailViewProps) {
  const [activeTab, setActiveTab] = useState('site');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [pendingForms, setPendingForms] = useState<any[]>([]);
  const navigate = useNavigate();

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

  useEffect(() => {
    // Fetch active jobs for this site
    fetchActiveJobs();
    fetchPendingForms();
  }, [site?.site?.id]);

  const fetchActiveJobs = async () => {
    try {
      // This would be a real API call
      // const jobs = await engineerService.getJobsForSite(site?.site?.id);
      // setActiveJobs(jobs);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    }
  };

  const fetchPendingForms = async () => {
    try {
      // Check for pending forms in local storage
      const pending = await storageService.getPendingOperations();
      const siteForms = pending.filter(op => 
        op.operation_type === 'form_submission' && 
        op.data.site_id === site?.site?.id
      );
      setPendingForms(siteForms);
    } catch (error) {
      console.error('Failed to fetch pending forms:', error);
    }
  };

  const handleTestMeter = () => {
    navigate(`/engineer/forms/new`, {
      state: {
        formType: 'meter_test',
        siteId: site?.site?.id,
        jobId: jobId,
        meterId: site?.meters?.[0]?.id
      }
    });
  };

  const handleAddReading = () => {
    navigate(`/engineer/forms/new`, {
      state: {
        formType: 'meter_reading',
        siteId: site?.site?.id,
        jobId: jobId,
        meterId: site?.meters?.[0]?.id,
        lastReading: site?.meters?.[0]?.last_reading
      }
    });
  };

  const handleRequestJob = () => {
    navigate(`/engineer/forms/new`, {
      state: {
        formType: 'job_request',
        siteId: site?.site?.id,
        siteDetails: {
          name: site?.site?.site_name,
          address: site?.site?.address,
          postcode: site?.site?.postcode
        }
      }
    });
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded shadow overflow-hidden">
      {isOffline && (
        <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-2 text-center">
          <span className="text-xs font-medium">📱 Offline - Data will sync when connected</span>
        </div>
      )}
      
      <div className="bg-gray-50 dark:bg-gray-700 p-4">
        <h1 className="text-xl font-bold text-center text-gray-900 dark:text-white">
          {site?.site?.site_name || 'Site Detail'}
        </h1>
        {site?.site?.fit_id && (
          <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-1">
            FIT ID: {site.site.fit_id}
          </p>
        )}
      </div>
      
      {/* Tab navigation */}
      <div className="flex border-b">
        <button
          className={`flex-1 py-2 px-4 text-center ${activeTab === 'site' 
            ? 'border-b-2 border-green-600 text-green-600 font-medium' 
            : 'text-gray-500'}`}
          onClick={() => setActiveTab('site')}
        >
          Site
        </button>
        <button
          className={`flex-1 py-2 px-4 text-center ${activeTab === 'customer' 
            ? 'border-b-2 border-green-600 text-green-600 font-medium' 
            : 'text-gray-500'}`}
          onClick={() => setActiveTab('customer')}
        >
          Customer
        </button>
        <button
          className={`flex-1 py-2 px-4 text-center ${activeTab === 'meter' 
            ? 'border-b-2 border-green-600 text-green-600 font-medium' 
            : 'text-gray-500'}`}
          onClick={() => setActiveTab('meter')}
        >
          Meter
        </button>
        <button
          className={`flex-1 py-2 px-4 text-center ${activeTab === 'readings' 
            ? 'border-b-2 border-green-600 text-green-600 font-medium' 
            : 'text-gray-500'}`}
          onClick={() => setActiveTab('readings')}
        >
          Readings
        </button>
        <button
          className={`flex-1 py-2 px-4 text-center ${activeTab === 'jobs' 
            ? 'border-b-2 border-green-600 text-green-600 font-medium' 
            : 'text-gray-500'}`}
          onClick={() => setActiveTab('jobs')}
        >
          Jobs
        </button>
      </div>
      
      {/* Tab content */}
      <div className="p-4">
        {activeTab === 'site' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="grid grid-cols-2 border-b pb-2">
                <span className="font-medium">Address:</span>
                <span>{site?.site?.address || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-2 border-b pb-2">
                <span className="font-medium">Postcode:</span>
                <span>{site?.site?.postcode || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-2 border-b pb-2">
                <span className="font-medium">Region:</span>
                <span>{site?.site?.region || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-2 border-b pb-2">
                <span className="font-medium">Install Date:</span>
                <span>{site?.site?.install_date || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-2 border-b pb-2">
                <span className="font-medium">FIT ID:</span>
                <span>{site?.site?.fit_id || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-2 border-b pb-2">
                <span className="font-medium">FCO:</span>
                <span>{site?.site?.fco || 'N/A'}</span>
              </div>
            </div>
            
            {/* Special flags */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className={`p-2 text-center text-sm rounded ${site?.site?.low_riso ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-500'}`}>
                Low RISO
              </div>
              <div className={`p-2 text-center text-sm rounded ${site?.site?.shading ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-500'}`}>
                Shading
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'customer' && (
          <div className="space-y-4">
            <div className="p-4 rounded bg-gray-50 text-center">
              <div className="font-bold text-lg mb-2">{site?.customer?.owner || 'N/A'}</div>
              <div className="mb-1">{site?.customer?.phone || 'N/A'}</div>
              <div className="mb-1">{site?.customer?.email || 'N/A'}</div>
              <div>{site?.customer?.owner_address || 'N/A'}</div>
            </div>
          </div>
        )}
        
        {activeTab === 'meter' && (
          <div className="space-y-4">
            <div className="p-4 rounded bg-gray-50">
              <h3 className="font-medium mb-3">Meter Details</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-2 border-b pb-2">
                  <span className="font-medium">Model:</span>
                  <span>{site?.meters?.[0]?.meter_model || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-2 border-b pb-2">
                  <span className="font-medium">Serial:</span>
                  <span>{site?.meters?.[0]?.meter_serial || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-2 border-b pb-2">
                  <span className="font-medium">Install Date:</span>
                  <span>{site?.meters?.[0]?.install_date || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-2 border-b pb-2">
                  <span className="font-medium">Last Reading:</span>
                  <span>{site?.meters?.[0]?.last_reading || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded bg-gray-50">
              <h3 className="font-medium mb-3">SIM Details</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-2 border-b pb-2">
                  <span className="font-medium">Number:</span>
                  <span>{site?.sim?.sim_num || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-2 border-b pb-2">
                  <span className="font-medium">CTN:</span>
                  <span>{site?.sim?.ctn || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-2 border-b pb-2">
                  <span className="font-medium">IP:</span>
                  <span>{site?.sim?.sim_ip || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'readings' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1 text-left text-xs">Date</th>
                    <th className="border px-2 py-1 text-left text-xs">Reading</th>
                    <th className="border px-2 py-1 text-left text-xs">Gen</th>
                  </tr>
                </thead>
                <tbody>
                  {site?.readings?.slice(0, 10).map((reading, index) => (
                    <tr key={index} className="border-b">
                      <td className="border px-2 py-1 text-xs">{reading.date}</td>
                      <td className="border px-2 py-1 text-xs">{reading.meter_reading}</td>
                      <td className="border px-2 py-1 text-xs">{reading.generation_increase || '-'}</td>
                    </tr>
                  ))}
                  {(!site?.readings || site.readings.length === 0) && (
                    <tr>
                      <td colSpan={3} className="border px-2 py-4 text-center text-sm text-gray-500">
                        No readings available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {activeTab === 'jobs' && (
          <div className="space-y-4">
            {activeJobs.length > 0 ? (
              <div className="space-y-2">
                {activeJobs.map((job) => (
                  <div 
                    key={job.id}
                    className="p-3 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => navigate(`/engineer/job/${job.id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{job.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Due: {new Date(job.due_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={job.priority === 'high' ? 'destructive' : 'default'}>
                        {job.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded bg-gray-50 dark:bg-gray-700 text-center">
                <p className="text-gray-500 dark:text-gray-400">No jobs currently assigned to this site</p>
              </div>
            )}
            <Button 
              className="w-full"
              onClick={handleRequestJob}
            >
              Request Job
            </Button>
          </div>
        )}
      </div>

      {/* Pending Forms Alert */}
      {pendingForms.length > 0 && (
        <div className="p-4 border-t">
          <Alert>
            <p className="text-sm">
              📋 {pendingForms.length} form{pendingForms.length > 1 ? 's' : ''} pending sync
            </p>
          </Alert>
        </div>
      )}
      
      {/* Action buttons */}
      <div className="p-4 border-t bg-gray-50 dark:bg-gray-700">
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={handleTestMeter}
            disabled={!site?.meters?.[0]}
          >
            Test Meter
          </Button>
          <Button 
            onClick={handleAddReading}
            variant="outline"
            disabled={!site?.meters?.[0]}
          >
            Add Reading
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EngineerSiteDetailView; 