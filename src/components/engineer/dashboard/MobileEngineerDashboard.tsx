import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Briefcase, Home, User, Bell } from 'lucide-react';
import { api } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { useGeolocation } from '../../../hooks/useGeolocation';
import syncManager from '../../../services/sync/syncManager';
import { Card, CardContent } from '../../ui/card';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';

interface RecentSite {
  id: number;
  site_name: string;
  address: string;
  postcode: string;
  last_visited: string;
  job_count?: number;
}

const MobileEngineerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const { location } = useGeolocation();

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

  // Subscribe to sync status
  useEffect(() => {
    const unsubscribe = syncManager.subscribe(setSyncStatus);
    syncManager.startAutoSync();
    
    return () => {
      unsubscribe();
    };
  }, []);

  // Fetch recent sites
  const { data: recentSites, isLoading: sitesLoading } = useQuery({
    queryKey: ['recentSites', user?.id],
    queryFn: async () => {
      const response = await api.get('/sites/recent/', {
        params: { limit: 10 }
      });
      return response.data as RecentSite[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Search sites
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['siteSearch', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const response = await api.get('/sites/', {
        params: { search: searchQuery }
      });
      return response.data.results;
    },
    enabled: searchQuery.length >= 2,
  });

  const handleSiteClick = (siteId: number) => {
    navigate(`/engineer/site/${siteId}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by react-query
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              LUX Engineer
            </h1>
            <div className="flex items-center gap-2">
              {isOffline && (
                <Badge variant="secondary" className="text-xs">
                  Offline
                </Badge>
              )}
              {syncStatus?.pending > 0 && (
                <Badge variant="outline" className="text-xs">
                  {syncStatus.pending} pending
                </Badge>
              )}
            </div>
          </div>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="search"
              placeholder="Search sites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4"
            />
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20">
        {/* Search Results */}
        {searchQuery && (
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-3">Search Results</h2>
            {searchLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((site: any) => (
                  <Card
                    key={site.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleSiteClick(site.id)}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{site.site_name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {site.address}, {site.postcode}
                      </p>
                      {site.fit_id && (
                        <p className="text-xs text-gray-500 mt-1">
                          FIT ID: {site.fit_id}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">
                No sites found matching "{searchQuery}"
              </p>
            )}
          </div>
        )}

        {/* Recent Sites (when not searching) */}
        {!searchQuery && (
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-3">Recent Sites</h2>
            {sitesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              </div>
            ) : recentSites && recentSites.length > 0 ? (
              <div className="space-y-2">
                {recentSites.map((site) => (
                  <Card
                    key={site.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleSiteClick(site.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold">{site.site_name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {site.address}, {site.postcode}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Last visited: {new Date(site.last_visited).toLocaleDateString()}
                          </p>
                        </div>
                        {site.job_count && site.job_count > 0 && (
                          <Badge variant="secondary">
                            {site.job_count} job{site.job_count > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">No recent sites</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Sites you visit will appear here
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => navigate('/engineer/routes')}
                >
                  <MapPin className="h-6 w-6" />
                  <span>View Routes</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => navigate('/engineer/forms')}
                >
                  <Briefcase className="h-6 w-6" />
                  <span>Forms</span>
                </Button>
              </div>
            </div>

            {/* Location Status */}
            {location && (
              <div className="mt-6 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  📍 Location services active
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-4 gap-1">
          <button
            className="flex flex-col items-center justify-center py-2 px-3 text-green-600"
            onClick={() => navigate('/engineer/dashboard')}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button
            className="flex flex-col items-center justify-center py-2 px-3 text-gray-500"
            onClick={() => navigate('/engineer/routes')}
          >
            <MapPin className="h-5 w-5" />
            <span className="text-xs mt-1">Routes</span>
          </button>
          <button
            className="flex flex-col items-center justify-center py-2 px-3 text-gray-500"
            onClick={() => navigate('/engineer/forms')}
          >
            <Briefcase className="h-5 w-5" />
            <span className="text-xs mt-1">Forms</span>
          </button>
          <button
            className="flex flex-col items-center justify-center py-2 px-3 text-gray-500"
            onClick={() => navigate('/engineer/settings')}
          >
            <User className="h-5 w-5" />
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default MobileEngineerDashboard;