import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ScatterChart, Scatter 
} from 'recharts';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { getConnectionAnalysis, getRegions, getNetworks } from '@/services/analysisService';
import type {
  ConnectionAnalysisResponse,
  SiteData,
  RegionData,
  AnalysisFilters,
  NetworkCount,
  SignalDistribution
} from '@/services/analysisService';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Helper function for signal quality
const getSignalQuality = (level: number): string => {
  if (level < 15) return 'Poor';
  if (level < 20) return 'Average';
  if (level < 25) return 'Good';
  return 'Excellent';
};

// Get appropriate color for a signal quality
const getSignalColor = (quality: string): string => {
  switch (quality) {
    case 'Poor': return '#ff6b6b';
    case 'Average': return '#ffd166';
    case 'Good': return '#06d6a0';
    case 'Excellent': return '#118ab2';
    default: return '#073b4c';
  }
};

// Network colors
const NETWORK_COLORS: Record<string, string> = {
  'O2': '#0088FE',
  'Vodafone': '#FF8042',
  'EE': '#00C49F',
  'Three': '#8884d8',
};

const ConnectionAnalysis: React.FC = () => {
  const [data, setData] = useState<ConnectionAnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [regions, setRegions] = useState<string[]>([]);
  const [networks, setNetworks] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'site' | 'region'>('site');
  
  // UI states
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    signals: true,
    networks: true,
    sites: true
  });
  
  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const filters: AnalysisFilters = {};
      
      if (startDate) {
        filters.startDate = format(startDate, 'yyyy-MM-dd');
      }
      
      if (endDate) {
        filters.endDate = format(endDate, 'yyyy-MM-dd');
      }
      
      if (selectedRegion) {
        filters.region = selectedRegion;
      }
      
      if (selectedNetwork) {
        filters.network = selectedNetwork;
      }
      
      console.log("Fetching connection analysis with filters:", filters);
      const result = await getConnectionAnalysis(filters);
      console.log("Connection analysis response:", result);
      
      // Check if the result has the expected structure
      if (!result || !result.summary || !result.site_data || !result.region_data) {
        console.warn("Analysis API returned incomplete data structure:", result);
        setError('The analysis data is incomplete. Please check the server logs for more information.');
      } else if (result.site_data.length === 0 && result.region_data.length === 0) {
        console.warn("Analysis API returned empty datasets:", result);
        setError('No data available for analysis. This could be because there are no meter readings in the system or the selected filters return no results.');
      } else {
        setData(result);
      }
    } catch (err) {
      console.error('Error fetching connection analysis data:', err);
      setError('Failed to load analysis data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Load regions and networks for filtering
  const loadFilterOptions = async () => {
    try {
      console.log("Fetching regions and networks for filters");
      
      try {
        const regionsList = await getRegions();
        console.log("Regions API response:", regionsList);
        setRegions(regionsList || []);
      } catch (regionErr) {
        console.error('Error fetching regions:', regionErr);
      }
      
      try {
        const networksList = await getNetworks();
        console.log("Networks API response:", networksList);
        setNetworks(networksList || []);
      } catch (networkErr) {
        console.error('Error fetching networks:', networkErr);
      }
    } catch (err) {
      console.error('Error loading filter options:', err);
    }
  };
  
  // Initialize
  useEffect(() => {
    loadFilterOptions();
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Refetch when filters change
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRegion, selectedNetwork, startDate, endDate]);
  
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Generate data for components
  const getSignalDistributionData = (signalDistribution: SignalDistribution) => {
    return Object.keys(signalDistribution).map(quality => ({
      name: quality,
      value: signalDistribution[quality],
      color: getSignalColor(quality)
    }));
  };
  
  const getNetworkDistributionData = (networkDistribution: NetworkCount[]) => {
    return networkDistribution.map(item => ({
      name: item.network_connection,
      value: item.count,
      color: NETWORK_COLORS[item.network_connection] || '#8884d8'
    }));
  };
  
  const getSiteSignalData = (siteData: SiteData[]) => {
    return siteData
      .map(site => ({
        name: site.site_name,
        value: site.avg_signal_level,
        color: getSignalColor(site.signal_quality)
      }))
      .sort((a, b) => b.value - a.value);
  };
  
  const getRegionSignalData = (regionData: RegionData[]) => {
    return regionData.map(region => ({
      name: region.name,
      value: region.avg_signal_level,
      color: getSignalColor(region.signal_quality)
    }));
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading analysis data...</span>
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-red-700">{error || 'Failed to load data'}</p>
        <button 
          onClick={fetchData} 
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  // Prepare data for display
  const signalDistributionData = getSignalDistributionData(data.signal_distribution);
  const networkDistributionData = getNetworkDistributionData(data.network_distribution);
  const siteSignalData = getSiteSignalData(data.site_data);
  const regionSignalData = getRegionSignalData(data.region_data);
  
  // Calculate summary stats
  const totalReadings = data.summary.total_readings;
  const avgSignalLevel = data.summary.avg_signal_level.toFixed(1);
  
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Connection Analysis Dashboard</h1>
        <p className="text-gray-600">Analyze meter readings, signal levels, and network performance</p>
      </div>
      
      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold flex items-center">
            <Filter size={18} className="mr-2" />
            Filters
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">View Mode</label>
            <select 
              className="w-full border border-gray-300 rounded p-2"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'site' | 'region')}
            >
              <option value="site">Site View</option>
              <option value="region">Region View</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
            <select 
              className="w-full border border-gray-300 rounded p-2"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              <option value="">All Regions</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Network</label>
            <select 
              className="w-full border border-gray-300 rounded p-2"
              value={selectedNetwork}
              onChange={(e) => setSelectedNetwork(e.target.value)}
            >
              <option value="">All Networks</option>
              {networks.map(network => (
                <option key={network} value={network}>{network}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              className="w-full border border-gray-300 rounded p-2"
              placeholderText="Select start date"
              maxDate={endDate || new Date()}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              className="w-full border border-gray-300 rounded p-2"
              placeholderText="Select end date"
              minDate={startDate}
              maxDate={new Date()}
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={fetchData}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
      
      {/* Overview Section */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div 
          className="flex items-center justify-between mb-4 cursor-pointer"
          onClick={() => toggleSection('overview')}
        >
          <h2 className="text-lg font-semibold">Overview</h2>
          {expandedSections.overview ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
        
        {expandedSections.overview && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-700">Total Readings</div>
              <div className="text-2xl font-bold">{totalReadings}</div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-700">Avg Signal Level</div>
              <div className="text-2xl font-bold">{avgSignalLevel}</div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm text-yellow-700">Networks</div>
              <div className="text-2xl font-bold">{data.network_distribution.length}</div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-700">Sites</div>
              <div className="text-2xl font-bold">{data.site_data.length}</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Signal Quality Section */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div 
          className="flex items-center justify-between mb-4 cursor-pointer"
          onClick={() => toggleSection('signals')}
        >
          <h2 className="text-lg font-semibold">Signal Quality Analysis</h2>
          {expandedSections.signals ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
        
        {expandedSections.signals && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-md font-medium mb-3">Signal Quality Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={signalDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {signalDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Readings']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-4 gap-2 mt-4">
                <div className="bg-red-100 p-2 rounded text-center">
                  <div className="text-xs text-red-700">Poor</div>
                  <div className="font-bold">{data.signal_distribution.Poor || 0}</div>
                </div>
                <div className="bg-yellow-100 p-2 rounded text-center">
                  <div className="text-xs text-yellow-700">Average</div>
                  <div className="font-bold">{data.signal_distribution.Average || 0}</div>
                </div>
                <div className="bg-green-100 p-2 rounded text-center">
                  <div className="text-xs text-green-700">Good</div>
                  <div className="font-bold">{data.signal_distribution.Good || 0}</div>
                </div>
                <div className="bg-blue-100 p-2 rounded text-center">
                  <div className="text-xs text-blue-700">Excellent</div>
                  <div className="font-bold">{data.signal_distribution.Excellent || 0}</div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-md font-medium mb-3">Reading vs Signal Level</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  >
                    <CartesianGrid />
                    <XAxis 
                      type="number" 
                      dataKey="meter_reading" 
                      name="Meter Reading" 
                      domain={['auto', 'auto']} 
                      label={{ value: 'Meter Reading', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="signal_level" 
                      name="Signal Level" 
                      label={{ value: 'Signal Level', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      formatter={(value, name) => {
                        if (name === 'meter_reading') return [value.toFixed(2), 'Meter Reading'];
                        if (name === 'signal_level') return [value, 'Signal Level'];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    {networks.map(network => {
                      const networkData = data.scatter_data.filter(item => 
                        item.network_connection === network
                      );
                      
                      if (networkData.length === 0) return null;
                      
                      return (
                        <Scatter 
                          key={network}
                          name={network} 
                          data={networkData} 
                          fill={NETWORK_COLORS[network] || '#8884d8'} 
                        />
                      );
                    })}
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Network Analysis Section */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div 
          className="flex items-center justify-between mb-4 cursor-pointer"
          onClick={() => toggleSection('networks')}
        >
          <h2 className="text-lg font-semibold">Network Analysis</h2>
          {expandedSections.networks ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
        
        {expandedSections.networks && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-md font-medium mb-3">Network Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={networkDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {networkDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Readings']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div>
              <h3 className="text-md font-medium mb-3">Network Signal Levels</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.network_distribution.map(net => {
                      // Find average signal level for this network
                      const networkReadings = data.scatter_data.filter(
                        item => item.network_connection === net.network_connection
                      );
                      
                      const avgSignal = networkReadings.length > 0
                        ? networkReadings.reduce((sum, item) => sum + item.signal_level, 0) / networkReadings.length
                        : 0;
                        
                      return {
                        network: net.network_connection,
                        count: net.count,
                        avg_signal_level: avgSignal
                      };
                    })}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="network" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="avg_signal_level" 
                      name="Avg Signal Level" 
                      fill="#8884d8" 
                    >
                      {data.network_distribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={NETWORK_COLORS[entry.network_connection] || '#8884d8'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Site/Region Analysis Section */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div 
          className="flex items-center justify-between mb-4 cursor-pointer"
          onClick={() => toggleSection('sites')}
        >
          <h2 className="text-lg font-semibold">
            {viewMode === 'site' ? 'Site Analysis' : 'Region Analysis'}
          </h2>
          {expandedSections.sites ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
        
        {expandedSections.sites && (
          <>
            {viewMode === 'site' ? (
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <h3 className="text-md font-medium mb-3">Site Signal Levels</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={siteSignalData.slice(0, 10)} // Show top 10 sites by signal strength
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={60}
                        />
                        <Tooltip />
                        <Legend />
                        <Bar 
                          dataKey="value" 
                          name="Signal Level" 
                          fill="#8884d8"
                        >
                          {siteSignalData.slice(0, 10).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-xs text-gray-500 mt-2 text-center">
                    {siteSignalData.length > 10 ? "Showing top 10 sites by signal level" : "All sites by signal level"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <h3 className="text-md font-medium mb-3">Region Signal Levels</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={regionSignalData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar 
                          dataKey="value" 
                          name="Avg Signal Level" 
                          fill="#8884d8"
                        >
                          {regionSignalData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ConnectionAnalysis; 