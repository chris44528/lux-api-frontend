import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock, MapPin, AlertCircle } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  LineChart, Line, Cell
} from 'recharts';
import { RecentVisitedSitesWidget } from './RecentVisitedSitesWidget';
import { 
  getSystemStatusSummary, 
  getRecentActivities, 
  getSitePerformanceMetrics, 
  getSiteDistribution 
} from '@/services/api';
import { cn } from '@/lib/utils';

// System Status data type
interface SystemStatusData {
  status: string;
  message: string;
  lastUpdated: string;
  metrics: {
    totalSites: number;
    activeSites: number;
    sitesWithIssues: number;
    offlineSites: number;
  };
}

// Activity data type
interface ActivityData {
  id: string | number;
  type: string;
  description: string;
  timestamp: string;
  user?: string;
}

// Energy production data type
interface EnergyProductionData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
  }>;
}

// Site distribution data type
interface SiteDistributionData {
  labels: string[];
  data: number[];
  backgroundColor: string[];
}

export default function FixedDashboardPage() {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // System Overview State
  const [systemData, setSystemData] = useState<SystemStatusData | null>(null);
  const [systemLoading, setSystemLoading] = useState(true);
  const [systemError, setSystemError] = useState<string | null>(null);
  
  // Recent Activities State
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  
  // Energy Production State
  const [energyData, setEnergyData] = useState<EnergyProductionData | null>(null);
  const [energyLoading, setEnergyLoading] = useState(true);
  const [energyError, setEnergyError] = useState<string | null>(null);
  
  // Site Distribution State
  const [distributionData, setDistributionData] = useState<SiteDistributionData | null>(null);
  const [distributionLoading, setDistributionLoading] = useState(true);
  const [distributionError, setDistributionError] = useState<string | null>(null);

  // Fetch System Status
  const fetchSystemStatus = async () => {
    try {
      const result = await getSystemStatusSummary();
      setSystemData(result);
      setSystemError(null);
    } catch (err) {
      setSystemError("Failed to load system status");
    } finally {
      setSystemLoading(false);
    }
  };

  // Fetch Recent Activities
  const fetchActivities = async () => {
    try {
      const result = await getRecentActivities(5);
      setActivities(result);
      setActivitiesError(null);
    } catch (err) {
      setActivitiesError("Failed to load activities");
    } finally {
      setActivitiesLoading(false);
    }
  };

  // Fetch Energy Production
  const fetchEnergyProduction = async () => {
    try {
      const result = await getSitePerformanceMetrics({ period: "month" });
      setEnergyData(result);
      setEnergyError(null);
    } catch (err) {
      setEnergyError("Failed to load energy production data");
    } finally {
      setEnergyLoading(false);
    }
  };

  // Fetch Site Distribution
  const fetchSiteDistribution = async () => {
    try {
      const result = await getSiteDistribution("region");
      setDistributionData(result);
      setDistributionError(null);
    } catch (err) {
      setDistributionError("Failed to load site distribution data");
    } finally {
      setDistributionLoading(false);
    }
  };

  // Refresh all data
  const refreshDashboard = async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchSystemStatus(),
      fetchActivities(),
      fetchEnergyProduction(),
      fetchSiteDistribution()
    ]);
    setIsRefreshing(false);
  };

  // Initial load
  useEffect(() => {
    fetchSystemStatus();
    fetchActivities();
    fetchEnergyProduction();
    fetchSiteDistribution();

    // Set up intervals for auto-refresh
    const systemInterval = setInterval(fetchSystemStatus, 300000); // 5 minutes
    const activitiesInterval = setInterval(fetchActivities, 120000); // 2 minutes
    const energyInterval = setInterval(fetchEnergyProduction, 3600000); // 1 hour
    const distributionInterval = setInterval(fetchSiteDistribution, 86400000); // 1 day

    return () => {
      clearInterval(systemInterval);
      clearInterval(activitiesInterval);
      clearInterval(energyInterval);
      clearInterval(distributionInterval);
    };
  }, []);

  // Calculate health percentage
  const healthPercentage = systemData 
    ? ((systemData.metrics.activeSites / systemData.metrics.totalSites) * 100).toFixed(1)
    : '0';

  // Process energy data for chart
  const processEnergyData = () => {
    if (!energyData || !energyData.labels || !energyData.datasets || energyData.datasets.length === 0) {
      return { chartData: [], totalEnergy: 0, peakValue: 0, peakDate: "" };
    }

    const labels = energyData.labels;
    const values = energyData.datasets[0].data;
    
    const chartData = labels.map((label, index) => ({
      name: label,
      value: +(values[index] / 1000).toFixed(2) // Convert Wh to kWh
    }));
    
    const totalEnergy = values.reduce((sum, val) => sum + val, 0) / 1000; // kWh
    const peakValue = Math.max(...values) / 1000;
    const peakIndex = values.indexOf(peakValue * 1000);
    const peakDate = labels[peakIndex] || "";

    return { chartData, totalEnergy, peakValue, peakDate };
  };

  const { chartData: energyChartData, totalEnergy, peakValue, peakDate } = processEnergyData();

  // Process distribution data for chart
  const processDistributionData = () => {
    if (!distributionData || !distributionData.labels || !distributionData.data) {
      return [];
    }

    return distributionData.labels.map((label, index) => ({
      name: label,
      value: distributionData.data[index]
    }));
  };

  const distributionChartData = processDistributionData();

  // Quick Actions navigation
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Solar Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Monitoring solar installations and performance</p>
          </div>
          <Button 
            variant="outline" 
            onClick={refreshDashboard}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* System Overview - Top Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {systemLoading ? (
            <div className="col-span-full flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : systemError ? (
            <div className="col-span-full text-center text-red-500">{systemError}</div>
          ) : systemData ? (
            <>
              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Meters</p>
                      <p className="text-2xl font-bold">{systemData.metrics.totalSites.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center">
                      <div className="text-amber-600 dark:text-amber-400 text-xl">📊</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Meters</p>
                      <p className="text-2xl font-bold">{systemData.metrics.activeSites.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Meters assigned to sites</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                      <div className="text-green-600 dark:text-green-400 text-xl">✓</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">No Comms</p>
                      <p className="text-2xl font-bold">{systemData.metrics.offlineSites.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Today's missing reads</p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                      <div className="text-red-600 dark:text-red-400 text-xl">📡</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Zero Reads</p>
                      <p className="text-2xl font-bold">{systemData.metrics.sitesWithIssues.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                      <div className="text-orange-600 dark:text-orange-400 text-xl">!</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>

        {/* Second Row - Daily Production and Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-[1fr,400px]">
          {/* Daily Production Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Daily Production (Last 30 Days)</h3>
                <span className="text-sm text-muted-foreground">kWh per day</span>
              </div>
            </CardHeader>
            <CardContent>
              {energyLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : energyError ? (
                <div className="text-center text-red-500 h-64 flex items-center justify-center">{energyError}</div>
              ) : energyChartData.length > 0 ? (
                <div className="space-y-4">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={energyChartData} margin={{ top: 5, right: 20, bottom: 40, left: 10 }}>
                        <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} className="dark:opacity-20" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 10, fill: 'currentColor' }}
                          axisLine={false}
                          tickLine={false}
                          className="text-gray-600 dark:text-gray-400"
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          tick={{ fontSize: 10, fill: 'currentColor' }}
                          axisLine={false}
                          tickLine={false}
                          className="text-gray-600 dark:text-gray-400"
                          label={{ value: 'kWh', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: 'currentColor' } }}
                        />
                        <RechartsTooltip 
                          formatter={(value) => [`${value} kWh`, 'Daily Production']} 
                          contentStyle={{ 
                            fontSize: '12px',
                            backgroundColor: 'rgb(255, 255, 255)',
                            border: '1px solid rgb(229, 231, 235)',
                            borderRadius: '6px'
                          }}
                          wrapperClassName="!bg-white dark:!bg-gray-800 !border-gray-200 dark:!border-gray-700"
                        />
                        <Bar 
                          dataKey="value" 
                          fill="#F59E0B"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400">Peak Day</p>
                      <p className="text-lg font-bold">{peakValue.toFixed(1)} kWh</p>
                      <p className="text-xs text-muted-foreground">{peakDate}</p>
                    </div>
                    <div className="text-center border-x">
                      <p className="text-xs font-medium text-blue-600 dark:text-blue-400">30-Day Total</p>
                      <p className="text-lg font-bold">{totalEnergy.toFixed(0)} kWh</p>
                      <p className="text-xs text-green-500">+5.2%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-green-600 dark:text-green-400">Daily Average</p>
                      <p className="text-lg font-bold">{(totalEnergy / 30).toFixed(1)} kWh</p>
                      <p className="text-xs text-green-500">+1.3%</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-orange-500 h-64 flex items-center justify-center">
                  No energy production data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Quick Actions</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  onClick={() => handleNavigate('/sites')}
                >
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 text-blue-500 dark:text-blue-400 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">View Sites</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  onClick={() => handleNavigate('/jobs')}
                >
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 text-purple-500 dark:text-purple-400 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Manage Jobs</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-green-50 dark:hover:bg-green-900/20"
                  onClick={() => handleNavigate('/bio-mass')}
                >
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zM12 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zM12 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Bio-Mass</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                  onClick={() => handleNavigate('/reports')}
                >
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/40 text-orange-500 dark:text-orange-400 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Reports</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Third Row - Recently Visited Sites and Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recently Visited Sites */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Recently Visited Sites</h3>
            </CardHeader>
            <CardContent className="p-0">
              <RecentVisitedSitesWidget />
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Recent Activity</h3>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : activitiesError ? (
                <div className="text-center text-red-500 h-64 flex items-center justify-center">{activitiesError}</div>
              ) : activities.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {activities.map((activity) => (
                    <div 
                      key={activity.id} 
                      className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(activity.timestamp).toLocaleString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                            {activity.user && (
                              <>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{activity.user}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 h-64 flex items-center justify-center">
                  No recent activities
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Fourth Row - Signal Strength by Region */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Signal Strength by Region</h3>
          </CardHeader>
          <CardContent>
            {distributionLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : distributionError ? (
              <div className="text-center text-red-500 h-64 flex items-center justify-center">{distributionError}</div>
            ) : distributionChartData.length > 0 ? (
              <div className="space-y-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distributionChartData} layout="horizontal" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" className="dark:opacity-20" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12, fill: 'currentColor' }}
                        className="text-gray-600 dark:text-gray-400"
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        tickFormatter={(value) => `${value}%`} 
                        tick={{ fill: 'currentColor' }} 
                        className="text-gray-600 dark:text-gray-400" 
                      />
                      <RechartsTooltip 
                        formatter={(value: any) => [`${value}%`, 'Signal Strength']} 
                        contentStyle={{ 
                          fontSize: '12px',
                          backgroundColor: 'rgb(255, 255, 255)',
                          border: '1px solid rgb(229, 231, 235)',
                          borderRadius: '6px'
                        }}
                        wrapperClassName="!bg-white dark:!bg-gray-800 !border-gray-200 dark:!border-gray-700"
                      />
                      <Bar 
                        dataKey="value" 
                        fill="#8884d8" 
                        radius={[4, 4, 0, 0]}
                      >
                        {distributionChartData.map((entry, index) => {
                          let color = "#EF4444"; // Poor
                          if (entry.value >= 80) color = "#10B981"; // Good
                          else if (entry.value >= 50) color = "#FBBF24"; // Fair
                          
                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-green-500"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Good (80-100%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-amber-400"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Fair (50-79%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Poor (0-49%)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 h-64 flex items-center justify-center">
                No distribution data available
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}