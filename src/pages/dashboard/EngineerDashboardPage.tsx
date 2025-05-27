import React, { useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { useNavigate } from 'react-router-dom';
import { searchSites } from '../../services/api';
import { debounce } from 'lodash';

// Interface for site results
interface Site {
  Site_id?: number;
  site_id?: number;
  Site_Name?: string;
  site_name?: string;
  id?: string;
  lastVisited?: string;
  postcode?: string;
  address?: string;
}

function EngineerDashboardPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Site[]>([]);
  
  // Recent sites (in a real app, would come from an API)
  const recentSites = [
    { id: 'NEWM05709X', lastVisited: '07/02/2025 14:08' },
    { id: 'BWTEST/5/22', lastVisited: '07/02/2025 14:08' },
    { id: 'ULLA60929X', lastVisited: '07/02/2025 14:08' }
  ];
  
  // Debounced search function to avoid too many API calls
  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      if (!term || term.length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      
      setIsSearching(true);
      try {
        const response = await searchSites(term);
        
        if (response && response.results) {
          setSearchResults(response.results);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    []
  );
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.length >= 2) {
      debouncedSearch(term);
    } else {
      setSearchResults([]);
    }
  };
  
  // Handle site selection
  const handleSiteClick = (site: Site) => {
    // Get the site ID, accounting for different property names
    const siteId = site.Site_id || site.site_id || site.id;
    if (siteId) {
      // In a real app, you would add this site to recent sites
      // Navigate to site details page
      navigate(`/site/${siteId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Engineer Dashboard</h1>
        
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search sites by name, address, or postcode..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          {searchTerm.length > 0 && searchTerm.length < 2 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enter at least 2 characters to search</p>
          )}
        </div>
        
        {/* Search Results */}
        {searchTerm.trim().length >= 2 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">
              Search Results
              {!isSearching && searchResults.length > 0 && (
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                  ({searchResults.length} site{searchResults.length !== 1 ? 's' : ''})
                </span>
              )}
            </h2>
            <Card className="dark:bg-gray-800">
              <CardContent className="p-0">
                {isSearching ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {searchResults.map((site) => (
                      <li 
                        key={site.Site_id || site.site_id} 
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={() => handleSiteClick(site)}
                      >
                        <div className="font-medium text-blue-600 dark:text-blue-400">
                          {site.Site_Name || site.site_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {site.postcode ? `${site.address || ''} ${site.postcode}` : 'ID: ' + (site.Site_id || site.site_id)}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    No sites found matching "{searchTerm}". Try another search term.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Recent Sites - always shown */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">
            Recently Visited Sites 
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
              ({recentSites.length})
            </span>
          </h2>
          <Card className="dark:bg-gray-800">
            <CardContent className="p-0">
              {recentSites.length > 0 ? (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentSites.map((site) => (
                    <li 
                      key={site.id} 
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => handleSiteClick(site)}
                    >
                      <div className="font-medium text-blue-600 dark:text-blue-400">{site.id}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Last visited: {site.lastVisited}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No recently visited sites.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 py-4 text-center text-gray-500 dark:text-gray-400 text-sm border-t dark:border-gray-700">
        © 2025 A Shade Greener. All rights reserved.
      </footer>
    </div>
  );
}

export default EngineerDashboardPage; 