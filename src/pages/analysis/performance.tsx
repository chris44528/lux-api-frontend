import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell, Label
} from 'recharts';
import { ChevronDown, ChevronUp, Filter, AlertCircle, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { getPerformanceAnalysis, getRegions } from '@/services/analysisService';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface SitePerformance {
  site_id: number;
  site_name: string;
  monthly_performance: {
    month: string;
    actual: number;
    predicted: number;
    percentage: number;
  }[];
  average_performance?: number;
}

interface PerformanceSummary {
  total_sites: number;
  underperforming: number;
  overperforming: number;
  average_performance: number;
}

interface PerformanceAnalysisResponse {
  performance_summary: PerformanceSummary;
  site_performance: SitePerformance[];
}

const PerformanceAnalysis: React.FC = () => {
  const [data, setData] = useState<PerformanceAnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [regions, setRegions] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [performanceThreshold, setPerformanceThreshold] = useState<number>(80);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'detail'>('overview');
  
  // UI states
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    comparison: true,
    underperforming: true,
    monthly: true
  });

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: any = {
        performance_threshold: performanceThreshold
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
      
      const result = await getPerformanceAnalysis(params);
      
      // Calculate average performance for each site
      if (result.site_performance) {
        result.site_performance = result.site_performance.map((site: SitePerformance) => ({
          ...site,
          average_performance: site.monthly_performance.length > 0
            ? site.monthly_performance.reduce((sum, month) => sum + month.percentage, 0) / site.monthly_performance.length
            : 0
        }));
      }
      
      setData(result);
    } catch (err) {
      setError('Failed to load performance analysis data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load regions
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
  }, [selectedRegion, performanceThreshold, startDate, endDate]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 100) return '#10b981'; // green
    if (percentage >= 90) return '#84cc16'; // lime
    if (percentage >= 80) return '#fbbf24'; // amber
    if (percentage >= 70) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  const getPerformanceStatus = (percentage: number) => {
    if (percentage >= 100) return 'Excellent';
    if (percentage >= 90) return 'Good';
    if (percentage >= 80) return 'Fair';
    if (percentage >= 70) return 'Below Average';
    return 'Poor';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading performance analysis...</span>
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
  const monthlyAggregateData = data.site_performance.length > 0 
    ? data.site_performance[0].monthly_performance.map(month => {
        const actualSum = data.site_performance.reduce((sum, site) => {
          const monthData = site.monthly_performance.find(m => m.month === month.month);
          return sum + (monthData?.actual || 0);
        }, 0);
        
        const predictedSum = data.site_performance.reduce((sum, site) => {
          const monthData = site.monthly_performance.find(m => m.month === month.month);
          return sum + (monthData?.predicted || 0);
        }, 0);
        
        return {
          month: format(new Date(month.month), 'MMM yyyy'),
          actual: actualSum,
          predicted: predictedSum,
          percentage: predictedSum > 0 ? (actualSum / predictedSum) * 100 : 0
        };
      })
    : [];

  const underperformingSites = data.site_performance
    .filter(site => (site.average_performance || 0) < performanceThreshold)
    .sort((a, b) => (a.average_performance || 0) - (b.average_performance || 0));

  const overperformingSites = data.site_performance
    .filter(site => (site.average_performance || 0) >= 100)
    .sort((a, b) => (b.average_performance || 0) - (a.average_performance || 0));

  return (
    <div className="bg-gray-50 p-4 rounded-lg space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Performance Analysis Dashboard</h1>
        <p className="text-gray-600">Compare actual generation against PVGIS predictions to identify performance issues</p>
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
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">View Mode</label>
              <select 
                className="w-full border border-gray-300 rounded p-2"
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'overview' | 'detail')}
              >
                <option value="overview">Overview</option>
                <option value="detail">Site Details</option>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Performance Threshold</label>
              <select 
                className="w-full border border-gray-300 rounded p-2"
                value={performanceThreshold}
                onChange={(e) => setPerformanceThreshold(parseInt(e.target.value))}
              >
                <option value="70">70%</option>
                <option value="80">80%</option>
                <option value="90">90%</option>
                <option value="100">100%</option>
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
      
      {/* Summary Section */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('summary')}
        >
          <CardTitle className="flex items-center justify-between">
            <span>Performance Summary</span>
            {expandedSections.summary ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </CardTitle>
        </CardHeader>
        
        {expandedSections.summary && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-blue-700">Total Sites</div>
                    <div className="text-2xl font-bold">{data.performance_summary.total_sites}</div>
                  </div>
                  <Zap className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-green-700">Average Performance</div>
                    <div className="text-2xl font-bold">
                      {data.performance_summary.average_performance.toFixed(1)}%
                    </div>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-red-700">Underperforming</div>
                    <div className="text-2xl font-bold">{data.performance_summary.underperforming}</div>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-500" />
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-purple-700">Overperforming</div>
                    <div className="text-2xl font-bold">{data.performance_summary.overperforming}</div>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            </div>
            
            {/* Performance Distribution */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Performance Distribution</h3>
              <div className="space-y-2">
                {[
                  { label: 'Excellent (≥100%)', count: data.site_performance.filter(s => (s.average_performance || 0) >= 100).length, color: 'bg-green-500' },
                  { label: 'Good (90-99%)', count: data.site_performance.filter(s => (s.average_performance || 0) >= 90 && (s.average_performance || 0) < 100).length, color: 'bg-lime-500' },
                  { label: 'Fair (80-89%)', count: data.site_performance.filter(s => (s.average_performance || 0) >= 80 && (s.average_performance || 0) < 90).length, color: 'bg-yellow-500' },
                  { label: 'Below Average (70-79%)', count: data.site_performance.filter(s => (s.average_performance || 0) >= 70 && (s.average_performance || 0) < 80).length, color: 'bg-orange-500' },
                  { label: 'Poor (<70%)', count: data.site_performance.filter(s => (s.average_performance || 0) < 70).length, color: 'bg-red-500' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded ${item.color} mr-2`} />
                      <span className="text-sm text-gray-600">{item.label}</span>
                    </div>
                    <span className="text-sm font-medium">{item.count} sites</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
      
      {/* Actual vs Predicted Comparison */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('comparison')}
        >
          <CardTitle className="flex items-center justify-between">
            <span>Actual vs Predicted Generation</span>
            {expandedSections.comparison ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </CardTitle>
        </CardHeader>
        
        {expandedSections.comparison && (
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyAggregateData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8">
                    <Label value="Generation (kWh)" angle={-90} position="insideLeft" />
                  </YAxis>
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" domain={[0, 150]}>
                    <Label value="Performance (%)" angle={90} position="insideRight" />
                  </YAxis>
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Predicted (PVGIS)"
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="Actual Generation"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="percentage" 
                    stroke="#fbbf24" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Performance %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        )}
      </Card>
      
      {/* Underperforming Sites */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('underperforming')}
        >
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
              Underperforming Sites ({underperformingSites.length})
            </span>
            {expandedSections.underperforming ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </CardTitle>
        </CardHeader>
        
        {expandedSections.underperforming && (
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {underperformingSites.slice(0, 10).map((site, index) => (
                <div key={site.site_id} className="bg-white p-4 rounded-lg border hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{site.site_name}</h4>
                      <p className="text-sm text-gray-500">Site ID: {site.site_id}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold" style={{ color: getPerformanceColor(site.average_performance || 0) }}>
                        {(site.average_performance || 0).toFixed(1)}%
                      </div>
                      <Badge className="mt-1" variant="secondary">
                        {getPerformanceStatus(site.average_performance || 0)}
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={site.average_performance || 0} 
                    className="h-2"
                    style={{ 
                      '--progress-color': getPerformanceColor(site.average_performance || 0) 
                    } as React.CSSProperties}
                  />
                  <div className="mt-2 flex justify-between text-xs text-gray-500">
                    <span>Latest: {site.monthly_performance[site.monthly_performance.length - 1]?.percentage.toFixed(1)}%</span>
                    <span>{site.monthly_performance.length} months data</span>
                  </div>
                </div>
              ))}
              {underperformingSites.length > 10 && (
                <p className="text-center text-sm text-gray-500 py-2">
                  Showing top 10 of {underperformingSites.length} underperforming sites
                </p>
              )}
            </div>
          </CardContent>
        )}
      </Card>
      
      {/* Monthly Performance Details */}
      {viewMode === 'detail' && (
        <Card>
          <CardHeader 
            className="cursor-pointer"
            onClick={() => toggleSection('monthly')}
          >
            <CardTitle className="flex items-center justify-between">
              <span>Monthly Performance Details</span>
              {expandedSections.monthly ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </CardTitle>
          </CardHeader>
          
          {expandedSections.monthly && (
            <CardContent>
              <div className="space-y-4">
                {data.site_performance.slice(0, 5).map((site) => (
                  <div key={site.site_id} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">{site.site_name}</h4>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={site.monthly_performance}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" tickFormatter={(value) => format(new Date(value), 'MMM')} />
                          <YAxis />
                          <Tooltip 
                            formatter={(value: any, name: string) => {
                              if (name === 'percentage') return [`${value.toFixed(1)}%`, 'Performance'];
                              return [value.toFixed(1), name];
                            }}
                          />
                          <Bar dataKey="percentage" name="Performance %">
                            {site.monthly_performance.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getPerformanceColor(entry.percentage)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};

export default PerformanceAnalysis;