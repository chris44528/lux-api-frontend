import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  PieChartIcon,
  Activity,
} from 'lucide-react';
import transferService from '@/services/transferService';

const COLORS = {
  pending: '#94a3b8',
  submitted: '#fbbf24',
  under_review: '#3b82f6',
  needs_info: '#f97316',
  approved: '#22c55e',
  rejected: '#ef4444',
  completed: '#10b981',
  expired: '#6b7280',
};

export default function TransferAnalytics() {
  const [timeRange, setTimeRange] = useState('30');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['transfer-analytics', timeRange],
    queryFn: () => transferService.getAnalytics(parseInt(timeRange)),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  // Prepare data for charts
  const statusData = Object.entries(analytics.status_breakdown).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
    value: count,
    color: COLORS[status as keyof typeof COLORS] || '#94a3b8',
  }));

  const rejectionData = analytics.rejection_reasons.map((item) => ({
    reason: item.rejection_reason.replace('_', ' '),
    count: item.count,
  }));

  const averageCompletionDays = analytics.average_days_to_complete
    ? analytics.average_days_to_complete.toFixed(1)
    : 'N/A';

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Transfer Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Insights and metrics for home owner transfers
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="180">Last 6 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_submissions}</div>
            <p className="text-xs text-muted-foreground">
              In the last {timeRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.approval_rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.status_breakdown.approved || 0} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageCompletionDays} days</div>
            <p className="text-xs text-muted-foreground">
              From creation to approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.pending_reviews}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.needs_info} need information
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border">
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-16 p-0 bg-gray-100 dark:bg-gray-800 rounded-t-lg">
            <TabsTrigger 
              value="status" 
              className="h-full rounded-none rounded-tl-lg border-r border-b-2 border-b-transparent bg-gray-100 dark:bg-gray-800 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:border-b-blue-600 data-[state=active]:border-r-transparent flex items-center justify-center gap-2 text-sm font-medium transition-colors"
            >
              <PieChartIcon className="h-5 w-5" />
              <span>Status Distribution</span>
            </TabsTrigger>
            <TabsTrigger 
              value="trends" 
              className="h-full rounded-none border-r border-b-2 border-b-transparent bg-gray-100 dark:bg-gray-800 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:border-b-blue-600 data-[state=active]:border-r-transparent flex items-center justify-center gap-2 text-sm font-medium transition-colors"
            >
              <TrendingUp className="h-5 w-5" />
              <span>Monthly Trends</span>
            </TabsTrigger>
            <TabsTrigger 
              value="rejections" 
              className="h-full rounded-none border-r border-b-2 border-b-transparent bg-gray-100 dark:bg-gray-800 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:border-b-blue-600 data-[state=active]:border-r-transparent flex items-center justify-center gap-2 text-sm font-medium transition-colors"
            >
              <XCircle className="h-5 w-5" />
              <span>Rejection Analysis</span>
            </TabsTrigger>
            <TabsTrigger 
              value="performance" 
              className="h-full rounded-none rounded-tr-lg border-b-2 border-b-transparent bg-gray-100 dark:bg-gray-800 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:border-b-blue-600 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
            >
              <Activity className="h-5 w-5" />
              <span>Performance</span>
            </TabsTrigger>
          </TabsList>

          <div className="p-6">
            <TabsContent value="status" className="space-y-4 mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Status Distribution</CardTitle>
              <CardDescription>
                Current status of all transfers in the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-4">
                  {statusData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
            </TabsContent>

            <TabsContent value="trends" className="space-y-4 mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Submission Trends</CardTitle>
              <CardDescription>
                Transfer submissions, approvals, and rejections over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analytics.monthly_trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="submissions"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Submissions"
                  />
                  <Line
                    type="monotone"
                    dataKey="approvals"
                    stroke="#22c55e"
                    strokeWidth={2}
                    name="Approvals"
                  />
                  <Line
                    type="monotone"
                    dataKey="rejections"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Rejections"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
            </TabsContent>

            <TabsContent value="rejections" className="space-y-4 mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Rejection Reasons</CardTitle>
              <CardDescription>
                Most common reasons for transfer rejections
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rejectionData.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No rejections in the selected period
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={rejectionData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="reason" type="category" width={150} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rejection Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {analytics.rejection_rate.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {analytics.status_breakdown.rejected || 0} of {analytics.total_submissions} transfers rejected
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Most Common Reason</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {rejectionData[0]?.reason || 'N/A'}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {rejectionData[0]?.count || 0} occurrences
                </p>
              </CardContent>
            </Card>
          </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4 mt-0">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Processing Efficiency</CardTitle>
                <CardDescription>
                  Key performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Average Processing Time</span>
                    <span className="text-sm">{averageCompletionDays} days</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (parseFloat(averageCompletionDays) / 30) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">First-Time Approval Rate</span>
                    <span className="text-sm">
                      {(
                        ((analytics.status_breakdown.approved || 0) /
                          (analytics.total_submissions || 1)) *
                        100
                      ).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${analytics.approval_rate}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Pending Review Backlog</span>
                    <span className="text-sm">{analytics.pending_reviews} transfers</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-orange-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (analytics.pending_reviews / (analytics.total_submissions || 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>
                  Summary of key metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">Total Completed</span>
                  <span className="font-medium">
                    {(analytics.status_breakdown.completed || 0) +
                      (analytics.status_breakdown.approved || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">Awaiting Information</span>
                  <span className="font-medium">{analytics.needs_info}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">Expired Transfers</span>
                  <span className="font-medium">
                    {analytics.status_breakdown.expired || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Success Rate</span>
                  <span className="font-medium text-green-600">
                    {(
                      100 -
                      analytics.rejection_rate -
                      ((analytics.status_breakdown.expired || 0) /
                        (analytics.total_submissions || 1)) *
                        100
                    ).toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}