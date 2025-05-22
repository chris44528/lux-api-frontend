import { useCallback, useEffect, useState } from 'react';
import { Search, Gauge, WifiOff, Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { DashboardResponse, SiteData } from '../types/api';
import { DashboardHeader } from './JobManagement/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Define the structure of the API response based on the actual data
interface ApiSiteResponse {
  site_id: number;
  site_name: string;
  address: string;
  postcode: string;
  account: string;
  fco: string;
  fit_id: string;
  region?: string;
  install_date?: string;
  panel_size?: string;
  last_reading?: string;
  last_reading_date?: string;
  meter_serial?: string;
}

const StaffDashboardView = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DashboardResponse>({
    filtered_sites: [],
    total_reads: 0,
    no_comms: 0,
    zero_reads: 0,
    current_filter: 'all',
    pagination: {
      current_page: 1,
      num_pages: 1,
      has_next: false,
      has_previous: false
    },
    metrics_last_updated: null
  });

  const fetchSites = useCallback(async (term = '', page = 1) => {
    setIsLoading(true);
    console.log('Fetching sites with term:', term);
    try {
      const params = {
        search: term,
        filter: 'all',
        page: page.toString(),
        ordering: '-Site_id'
      };
      console.log('API request params:', params);
      const response = await api.get('/sites/', { params });
      
      console.log('Search response data:', response.data);

      if (response.data) {
        // Transform the API response data into our expected format
        const transformedSites: SiteData[] = response.data.results.map((site: ApiSiteResponse) => {
          // Log each site to debug the structure
          console.log('Processing site:', site);
          
          return {
            site: {
              site_id: site.site_id?.toString() || '',
              site_name: site.site_name || '',
              address: site.address || '',
              postcode: site.postcode || '',
              fit_id: site.fit_id || '',
              fco: site.fco || '',
              region: site.region || '',
              install_date: site.install_date || null,
              panel_size: site.panel_size?.toString() || '0'
            },
            latest_read: site.last_reading || null,
            last_updated: site.last_reading_date || new Date().toISOString(),
            is_zero_read: false,
            is_old_reading: false,
            meter_serial: site.meter_serial || ''
          };
        });

        const transformedData: DashboardResponse = {
          filtered_sites: transformedSites,
          total_reads: response.data.count || 0,
          no_comms: 0,
          zero_reads: 0,
          current_filter: 'all',
          pagination: {
            current_page: page,
            num_pages: Math.ceil((response.data.count || 0) / 20),
            has_next: !!response.data.next,
            has_previous: !!response.data.previous
          },
          metrics_last_updated: new Date().toISOString()
        };

        console.log('Transformed data:', transformedData);
        setData(transformedData);
        setCurrentPage(page);
      } else {
        console.warn('No data in response');
      }
    } catch (err) {
      console.error('Error fetching sites:', err);
      if ((err as { response?: { status: number } })?.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Use an effect for the debounced search instead of debounce function
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        console.log('Debounced search triggered with term:', searchTerm);
        fetchSites(searchTerm, 1);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm, fetchSites]);

  useEffect(() => {
    console.log('Dashboard mounted, checking token...');
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/login');
      return;
    }
    console.log('Token found, fetching sites...');
    fetchSites();
  }, [fetchSites, navigate]);

  console.log('Dashboard rendering with state:', {
    isLoading,
    sitesCount: data?.filtered_sites?.length,
    currentPage
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('Search input changed:', value);
    setSearchTerm(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Solar Sites</h1>

        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Enter Site Name/Address/PostCode"
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reads</CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.total_reads || 0}</div>
              <p className="text-xs text-muted-foreground">Total site readings</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">No Comms</CardTitle>
              <WifiOff className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.no_comms || 0}</div>
              <p className="text-xs text-muted-foreground">Sites with no communication</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Zero Reads</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.zero_reads || 0}</div>
              <p className="text-xs text-muted-foreground">Sites with no readings</p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : data?.filtered_sites && data.filtered_sites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.filtered_sites.map((siteData, index) => (
              <div 
                key={`site-${siteData.site.site_id}-${index}`}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{siteData.site.site_name}</h3>
                    <p className="text-gray-600">{siteData.site.address}</p>
                    <p className="text-gray-500">{siteData.site.postcode}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">System Size: {siteData.site.panel_size} kW</p>
                    <p className="text-sm text-gray-600">
                      Latest Read: {siteData.latest_read ? `${Number(siteData.latest_read).toFixed(2)} kWh` : 'No data'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Last Updated: {new Date(siteData.last_updated).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/site/${siteData.site.site_id}`)}
                    className="w-full py-2 bg-green-700 hover:bg-[#16a34a] text-white rounded transition-colors duration-200"
                  >
                    See Site Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {isLoading ? 'Loading...' : 'No sites found'}
          </div>
        )}

        {data?.pagination?.num_pages > 1 && (
          <div className="flex justify-center mt-8 gap-2">
            {/* Pagination controls */}
            <button 
              disabled={!data.pagination.has_previous}
              onClick={() => fetchSites(searchTerm, currentPage - 1)}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">Page {currentPage} of {data.pagination.num_pages}</span>
            <button 
              disabled={!data.pagination.has_next}
              onClick={() => fetchSites(searchTerm, currentPage + 1)}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default StaffDashboardView; 