import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WifiOff, Activity, Calendar, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { api } from '@/services/api';
import { format } from 'date-fns';

interface DashboardData {
  summary: {
    total_no_coms: number;
    total_zero_reads: number;
    jobs_created_today: number;
    jobs_created_week: number;
    last_run: string | null;
  };
  recent_jobs: Array<{
    id: number;
    site_id: string;
    site_name: string;
    job_type: 'no_coms' | 'zero_reads';
    created_at: string;
    status: string;
    days_without_reading?: number;
    days_with_zero_increase?: number;
  }>;
  daily_stats: Array<{
    date: string;
    no_coms: number;
    zero_reads: number;
  }>;
}

export default function AutomationDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'all' | 'no_coms' | 'zero_reads'>('all');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/job-automation/dashboard/');
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading dashboard...</div>;
  }

  if (!data) {
    return <div className="text-center p-8 text-muted-foreground">No data available</div>;
  }

  const filteredJobs = data.recent_jobs.filter(job => 
    selectedType === 'all' || job.job_type === selectedType
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Coms Jobs</CardTitle>
            <WifiOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.total_no_coms}</div>
            <p className="text-xs text-muted-foreground">Currently open</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zero Reads Jobs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.total_zero_reads}</div>
            <p className="text-xs text-muted-foreground">Currently open</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.jobs_created_today}</div>
            <p className="text-xs text-muted-foreground">New jobs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Run</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {data.summary.last_run 
                ? format(new Date(data.summary.last_run), 'HH:mm')
                : 'Never'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {data.summary.last_run 
                ? format(new Date(data.summary.last_run), 'dd MMM')
                : 'Not run yet'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Stats Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Job Creation Trend (Last 7 Days)</CardTitle>
          <CardDescription>Daily breakdown of automated job creation</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.daily_stats}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="currentColor"
                className="text-gray-200 dark:text-gray-700"
              />
              <XAxis 
                dataKey="date" 
                stroke="currentColor"
                className="text-gray-600 dark:text-gray-400"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                stroke="currentColor"
                className="text-gray-600 dark:text-gray-400"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--foreground)'
                }}
                labelStyle={{ color: 'var(--foreground)' }}
              />
              <Bar dataKey="no_coms" fill="#ef4444" name="No Coms" />
              <Bar dataKey="zero_reads" fill="#f59e0b" name="Zero Reads" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Jobs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Automated Jobs</CardTitle>
              <CardDescription>Latest jobs created by the automation system</CardDescription>
            </div>
            <Button onClick={fetchDashboardData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
            <TabsList>
              <TabsTrigger value="all">All Jobs</TabsTrigger>
              <TabsTrigger value="no_coms">No Coms</TabsTrigger>
              <TabsTrigger value="zero_reads">Zero Reads</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedType} className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Site</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No jobs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{job.site_name}</div>
                            <div className="text-sm text-muted-foreground">{job.site_id}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={job.job_type === 'no_coms' ? 'destructive' : 'secondary'}>
                            {job.job_type === 'no_coms' ? (
                              <><WifiOff className="h-3 w-3 mr-1" /> No Coms</>
                            ) : (
                              <><Activity className="h-3 w-3 mr-1" /> Zero Reads</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{format(new Date(job.created_at), 'HH:mm')}</div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(job.created_at), 'dd MMM')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>
                            {job.status === 'open' ? (
                              <><AlertCircle className="h-3 w-3 mr-1" /> Open</>
                            ) : (
                              <><CheckCircle className="h-3 w-3 mr-1" /> {job.status}</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {job.job_type === 'no_coms' && job.days_without_reading && (
                            <span className="text-sm text-muted-foreground">
                              {job.days_without_reading} days no reading
                            </span>
                          )}
                          {job.job_type === 'zero_reads' && job.days_with_zero_increase && (
                            <span className="text-sm text-muted-foreground">
                              {job.days_with_zero_increase} days no increase
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}