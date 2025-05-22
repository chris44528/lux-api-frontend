import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import userService from '../../services/userService';
import { getSiteDetail } from '../../services/api';
import StaffSiteDetailView from '../../components/StaffSiteDetailView';
import EngineerSiteDetailView from '../../components/EngineerSiteDetailView';

// Import SiteDetailResponse from types to use as proper type
import { SiteDetailResponse } from '../../types/api';

function SiteDetailPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const [viewType, setViewType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [siteData, setSiteData] = useState<SiteDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch site data and user view type simultaneously
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch site data - always needed
        const siteResponse = siteId 
          ? await getSiteDetail(siteId) 
          : Promise.reject(new Error('No site ID provided'));
          
        console.log('SiteDetailPage: Site data loaded:', siteResponse);
        setSiteData(siteResponse);
        
        // Try to get user view type, but don't let it block rendering if it fails
        try {
          const userViewTypeResponse = await userService.getUserViewType();
          console.log('SiteDetailPage: User view type from API:', userViewTypeResponse);
          setViewType(userViewTypeResponse);
        } catch (viewTypeErr) {
          console.error('Error determining user view type:', viewTypeErr);
          // Default to staff view if we can't determine the user type
          setViewType('staff');
        }
      } catch (err) {
        console.error('Error loading site data:', err);
        setError('Failed to load site data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [siteId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400 px-4 py-3 rounded">
            <p>Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!siteData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-400 px-4 py-3 rounded">
            <p>Site not found</p>
          </div>
        </div>
      </div>
    );
  }

  // Determine which view to show based on user role/view type
  // Default to staff view for safety if viewType is not explicitly 'engineer'
  const isEngineerView = viewType === 'engineer';
  console.log('SiteDetailPage: Rendering view based on viewType:', viewType, 'isEngineerView:', isEngineerView);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-4">
        {isEngineerView ? (
          <EngineerSiteDetailView site={siteData} includeHeader={false} />
        ) : (
          <StaffSiteDetailView site={siteData} includeHeader={false} />
        )}
      </div>
    </div>
  );
}

export default SiteDetailPage; 