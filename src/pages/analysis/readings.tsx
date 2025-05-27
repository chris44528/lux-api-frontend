import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell
} from 'recharts';
import { ChevronDown, ChevronUp, Filter, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { getReadingsAnalysis, getRegions } from '@/services/analysisService';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RegionData {
  name: string;
  total_readings: number;
  average_daily_generation: number;
  anomaly_count: number;
  performance_score: number;
}

interface Anomaly {
  site_id: number;
  site_name: string;
  anomaly_type: 'zero_generation' | 'low_generation' | 'no_readings';
  duration_days: number;
  severity?: 'low' | 'medium' | 'high';
}

interface ReadingsAnalysisResponse {
  regions: RegionData[];
  anomalies: Anomaly[];
  summary?: {
    total_sites: number;
    total_readings: number;
    avg_daily_generation: number;
    total_anomalies: number;
  };
}

const ReadingsAnalysis: React.FC = () => {
  const [data, setData] = useState<ReadingsAnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [regions, setRegions] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [anomalyThreshold, setAnomalyThreshold] = useState<number>(0.1);
  
  // UI states
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    byRegion: true,
    anomalies: true,
    performance: true
  });

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: any = {
        anomaly_threshold: anomalyThreshold
      };
      
      if (startDate) {
        params.start_date = format(startDate, 'yyyy-MM-dd');
      }
      
      if (endDate) {
        params.end_date = format(endDate, 'yyyy-MM-dd');
      }
      
      if (selectedRegion) {
        params.region = selectedRegion;
      }
      
      const result = await getReadingsAnalysis(params);
      setData(result);
    } catch (err) {
      setError('Failed to load readings analysis data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load regions for filtering
  useEffect(() => {
    const loadRegions = async () => {
      try {
        const regionsList = await getRegions();
        setRegions(regionsList || []);
      } catch (err) {
        console.error('Failed to load regions:', err);
      }
    };
    loadRegions();
  }, []);

  // Initial data load and refresh on filter changes
  useEffect(() => {
    fetchData();
  }, [selectedRegion, startDate, endDate, anomalyThreshold]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Helper functions
  const getAnomalySeverity = (anomaly: Anomaly): 'low' | 'medium' | 'high' => {
    if (anomaly.duration_days >= 7) return 'high';
    if (anomaly.duration_days >= 3) return 'medium';
    return 'low';
  };

  const getAnomalyColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#fbbf24';
      default: return '#6b7280';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return '#10b981';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading readings analysis...</span>
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

  // Prepare chart data
  const regionChartData = data.regions.map(region => ({
    name: region.name,
    readings: region.total_readings,
    avgGeneration: region.average_daily_generation,
    anomalies: region.anomaly_count,
    score: region.performance_score
  }));

  const anomalyByTypeData = data.anomalies.reduce((acc, anomaly) => {
    const type = anomaly.anomaly_type;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const anomalyChartData = Object.entries(anomalyByTypeData).map(([type, count]) => ({
    type: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    count
  }));

  return (
    <div className="bg-gray-50 p-4 rounded-lg space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Readings Analysis Dashboard</h1>
        <p className="text-gray-600">Analyze meter reading patterns, identify anomalies, and track performance metrics</p>
      </div>
      
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Filter size={18} className="mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <DatePicker
                selected={startDate}
                onChange={(date: Date | null) => setStartDate(date)}
                className="w-full border border-gray-300 rounded p-2"
                placeholderText="Select start date"
                maxDate={endDate || new Date()}
                isClearable
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <DatePicker
                selected={endDate}
                onChange={(date: Date | null) => setEndDate(date)}
                className="w-full border border-gray-300 rounded p-2"
                placeholderText="Select end date"
                minDate={startDate}
                maxDate={new Date()}
                isClearable
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Anomaly Threshold</label>
              <select 
                className="w-full border border-gray-300 rounded p-2"
                value={anomalyThreshold}
                onChange={(e) => setAnomalyThreshold(parseFloat(e.target.value))}
              >
                <option value="0.05">5%</option>
                <option value="0.1">10%</option>
                <option value="0.15">15%</option>
                <option value="0.2">20%</option>
              </select>
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
        </CardContent>
      </Card>
      
      {/* Overview Section */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('overview')}
        >
          <CardTitle className="flex items-center justify-between">
            <span>Overview</span>
            {expandedSections.overview ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </CardTitle>
        </CardHeader>
        
        {expandedSections.overview && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-blue-700">Total Readings</div>
                    <div className="text-2xl font-bold">{data.summary?.total_readings || 0}</div>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-green-700">Avg Daily Generation</div>
                    <div className="text-2xl font-bold">
                      {data.summary?.avg_daily_generation.toFixed(1) || 0} kWh
                    </div>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-yellow-700">Total Anomalies</div>
                    <div className="text-2xl font-bold">{data.anomalies.length}</div>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-purple-700">Sites Analyzed</div>
                    <div className="text-2xl font-bold">{data.summary?.total_sites || 0}</div>
                  </div>
                  <Activity className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
      
      {/* Readings by Region */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('byRegion')}
        >
          <CardTitle className="flex items-center justify-between">
            <span>Readings by Region</span>
            {expandedSections.byRegion ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </CardTitle>
        </CardHeader>
        
        {expandedSections.byRegion && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-md font-medium mb-3">Total Readings per Region</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={regionChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="readings" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-3">Average Daily Generation by Region</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={regionChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="avgGeneration" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={{ fill: '#10b981' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
      
      {/* Anomalies Section */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('anomalies')}
        >
          <CardTitle className="flex items-center justify-between">
            <span>Anomaly Detection</span>
            {expandedSections.anomalies ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </CardTitle>
        </CardHeader>
        
        {expandedSections.anomalies && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-md font-medium mb-3">Anomalies by Type</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={anomalyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-3">Top Anomalies</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {data.anomalies.slice(0, 10).map((anomaly, index) => {
                    const severity = getAnomalySeverity(anomaly);
                    return (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{anomaly.site_name}</p>
                          <p className="text-sm text-gray-600">
                            {anomaly.anomaly_type.replace(/_/g, ' ')} - {anomaly.duration_days} days
                          </p>
                        </div>
                        <Badge 
                          className={`
                            ${severity === 'high' ? 'bg-red-100 text-red-800' : ''}
                            ${severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${severity === 'low' ? 'bg-orange-100 text-orange-800' : ''}
                          `}
                        >
                          {severity}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
      
      {/* Performance Heatmap */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('performance')}
        >
          <CardTitle className="flex items-center justify-between">
            <span>Regional Performance</span>
            {expandedSections.performance ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </CardTitle>
        </CardHeader>
        
        {expandedSections.performance && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-md font-medium mb-3">Performance Scores by Region</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={regionChartData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="score">
                        {regionChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getPerformanceColor(entry.score)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-3">Performance Summary</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-green-700">High Performance (90%+)</span>
                      <span className="font-bold text-green-800">
                        {data.regions.filter(r => r.performance_score >= 90).length} regions
                      </span>
                    </div>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-yellow-700">Medium Performance (70-90%)</span>
                      <span className="font-bold text-yellow-800">
                        {data.regions.filter(r => r.performance_score >= 70 && r.performance_score < 90).length} regions
                      </span>
                    </div>
                  </div>
                  <div className="p-4 bg-red-50 rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-red-700">Low Performance (&lt;70%)</span>
                      <span className="font-bold text-red-800">
                        {data.regions.filter(r => r.performance_score < 70).length} regions
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default ReadingsAnalysis;