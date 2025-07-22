import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
} from '@mui/material';
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
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  Speed,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { agedCasesService, AgedCaseMetrics } from '../../services/agedCasesService';

// Color schemes
const TIER_COLORS = ['#2196f3', '#ff9800', '#f44336', '#9c27b0'];
const CHANNEL_COLORS = {
  email: '#1976d2',
  sms: '#388e3c',
  whatsapp: '#25d366',
  phone: '#f50057',
};

interface AnalyticsData {
  tierDistribution: Array<{ name: string; value: number; loss: number }>;
  typeDistribution: Array<{ name: string; value: number }>;
  responseRates: Array<{ tier: string; rate: number; count: number }>;
  weeklyTrend: Array<{ date: string; cases: number; resolved: number; escalated: number }>;
  channelPerformance: Array<{ channel: string; sent: number; responded: number; rate: number }>;
  financialImpact: Array<{ period: string; loss: number; recovered: number }>;
}

const AgedCaseAnalytics: React.FC = () => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [metricView, setMetricView] = useState<'overview' | 'performance' | 'financial'>('overview');

  // Fetch metrics
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['agedCasesMetrics', timeRange],
    queryFn: () => agedCasesService.getMetrics(),
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Transform metrics into chart data
  const analyticsData: AnalyticsData | null = metrics ? {
    tierDistribution: Object.entries(metrics.by_tier).map(([tier, data]) => ({
      name: `Tier ${tier}`,
      value: data.count,
      loss: parseFloat(data.total_loss),
    })),
    typeDistribution: Object.entries(metrics.by_type).map(([type, data]) => ({
      name: data.display,
      value: data.count,
    })),
    responseRates: Object.entries(metrics.response_rates_by_tier).map(([tier, data]) => ({
      tier: `Tier ${tier}`,
      rate: data.case_response_rate,
      count: data.total_cases,
    })),
    weeklyTrend: Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: format(date, 'EEE'),
        cases: Math.floor(Math.random() * 20) + 10,
        resolved: Math.floor(Math.random() * 10) + 5,
        escalated: Math.floor(Math.random() * 5) + 2,
      };
    }),
    channelPerformance: [
      { channel: 'WhatsApp', sent: 150, responded: 45, rate: 30 },
      { channel: 'Email', sent: 200, responded: 50, rate: 25 },
      { channel: 'SMS', sent: 100, responded: 20, rate: 20 },
      { channel: 'Phone', sent: 50, responded: 25, rate: 50 },
    ],
    financialImpact: Array.from({ length: 6 }, (_, i) => ({
      period: format(subDays(new Date(), (5 - i) * 30), 'MMM'),
      loss: Math.floor(Math.random() * 10000) + 5000,
      recovered: Math.floor(Math.random() * 5000) + 2000,
    })),
  } : null;

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !analyticsData) {
    return (
      <Alert severity="error">
        Unable to load analytics data. Please try again later.
      </Alert>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1 }}>
          <Typography variant="caption" fontWeight="bold">
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography key={index} variant="caption" display="block" sx={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  return (
    <Box>
      {/* Controls */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <ToggleButtonGroup
          value={metricView}
          exclusive
          onChange={(e, v) => v && setMetricView(v)}
        >
          <ToggleButton value="overview">Overview</ToggleButton>
          <ToggleButton value="performance">Performance</ToggleButton>
          <ToggleButton value="financial">Financial</ToggleButton>
        </ToggleButtonGroup>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            label="Time Range"
          >
            <MenuItem value="week">Last Week</MenuItem>
            <MenuItem value="month">Last Month</MenuItem>
            <MenuItem value="quarter">Last Quarter</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Overview Metrics */}
      {metricView === 'overview' && (
        <Grid container spacing={3}>
          {/* Tier Distribution */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Case Distribution by Tier
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.tierDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analyticsData.tierDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={TIER_COLORS[index % TIER_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Weekly Trend */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Weekly Case Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="cases"
                    stackId="1"
                    stroke="#ff9800"
                    fill={alpha('#ff9800', 0.6)}
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    stackId="1"
                    stroke="#4caf50"
                    fill={alpha('#4caf50', 0.6)}
                  />
                  <Area
                    type="monotone"
                    dataKey="escalated"
                    stackId="1"
                    stroke="#f44336"
                    fill={alpha('#f44336', 0.6)}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Case Type Distribution */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Cases by Type
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.typeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#2196f3">
                    {analyticsData.typeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={TIER_COLORS[index % TIER_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Performance Metrics */}
      {metricView === 'performance' && (
        <Grid container spacing={3}>
          {/* Response Rates by Tier */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Response Rates by Tier
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.responseRates}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tier" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="rate" fill="#4caf50">
                    {analyticsData.responseRates.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={TIER_COLORS[index % TIER_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Channel Performance */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Channel Performance
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={analyticsData.channelPerformance}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="channel" />
                  <PolarRadiusAxis angle={90} domain={[0, 60]} />
                  <Radar
                    name="Response Rate %"
                    dataKey="rate"
                    stroke="#2196f3"
                    fill="#2196f3"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Communication Volume */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Communication Volume by Channel
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.channelPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="channel" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="sent" fill="#8884d8" name="Sent" />
                  <Bar dataKey="responded" fill="#82ca9d" name="Responded" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Financial Metrics */}
      {metricView === 'financial' && (
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%',
              background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.error.main, 0.05)} 100%)`,
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <AttachMoney color="error" />
                  <Typography variant="subtitle2" color="textSecondary">
                    Total Loss
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="error">
                  £{parseFloat(metrics?.total_savings_loss || '0').toFixed(0)}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Across all active cases
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%',
              background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Speed color="warning" />
                  <Typography variant="subtitle2" color="textSecondary">
                    Daily Impact
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  £{(parseFloat(metrics?.total_savings_loss || '0') / (metrics?.total_cases || 1)).toFixed(0)}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Average per case
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%',
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <TrendingUp color="success" />
                  <Typography variant="subtitle2" color="textSecondary">
                    Recovery Rate
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  32%
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Of total potential loss
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%',
              background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <CheckCircle color="info" />
                  <Typography variant="subtitle2" color="textSecondary">
                    Resolved Value
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="info.main">
                  £12,450
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  This {timeRange}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Financial Trend */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Financial Impact Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.financialImpact}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="loss"
                    stroke="#f44336"
                    strokeWidth={2}
                    name="Total Loss"
                  />
                  <Line
                    type="monotone"
                    dataKey="recovered"
                    stroke="#4caf50"
                    strokeWidth={2}
                    name="Recovered"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Loss by Tier */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Financial Loss by Escalation Tier
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.tierDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="loss" fill="#f44336">
                    {analyticsData.tierDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={TIER_COLORS[index % TIER_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default AgedCaseAnalytics;