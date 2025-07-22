import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  LinearProgress,
  Avatar,
  AvatarGroup,
  Badge,
  Skeleton,
  Collapse,
  Stack,
  Fade,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp,
  Warning,
  CheckCircle,
  Email,
  Sms,
  WhatsApp,
  Phone,
  Refresh,
  Settings,
  FilterList,
  Send,
  Download,
  AccessTime,
  TrendingDown,
  Visibility,
  ArrowUpward,
  ArrowDownward,
  ExpandMore,
  ExpandLess,
  ErrorOutline,
  InfoOutlined,
  CheckCircleOutline,
  RadioButtonUnchecked,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { agedCasesService, AgedCase, AgedCaseMetrics, AgedCaseFilters } from '../../services/agedCasesService';

// Visual priority color scheme
const tierColors = {
  1: { bg: '#e3f2fd', border: '#1976d2', text: '#0d47a1' },
  2: { bg: '#fff3e0', border: '#ff9800', text: '#e65100' },
  3: { bg: '#ffebee', border: '#f44336', text: '#b71c1c' },
  4: { bg: '#f3e5f5', border: '#9c27b0', text: '#4a148c' },
};

const channelIcons = {
  email: Email,
  sms: Sms,
  whatsapp: WhatsApp,
  phone: Phone,
};

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  loading?: boolean;
  icon?: React.ReactNode;
  color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  trend, 
  trendValue, 
  loading,
  icon,
  color = 'primary'
}) => {
  const theme = useTheme();
  
  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" height={40} />
          <Skeleton variant="text" width="80%" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      sx={{ 
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        }
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold" color={color}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box sx={{ color: alpha(theme.palette[color]?.main || theme.palette.primary.main, 0.3) }}>
              {icon}
            </Box>
          )}
        </Box>
        {trend && (
          <Box display="flex" alignItems="center" mt={1}>
            {trend === 'up' ? (
              <ArrowUpward color="success" fontSize="small" />
            ) : trend === 'down' ? (
              <ArrowDownward color="error" fontSize="small" />
            ) : null}
            {trendValue && (
              <Typography variant="caption" color={trend === 'up' ? 'success.main' : 'error.main'}>
                {trendValue}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

interface CasePriorityCardProps {
  case: AgedCase;
  onAction: (action: 'send' | 'resolve' | 'view') => void;
}

const CasePriorityCard: React.FC<CasePriorityCardProps> = ({ case: agedCase, onAction }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const tierColor = tierColors[agedCase.escalation_tier] || tierColors[1];
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card
        sx={{
          border: `2px solid ${tierColor.border}`,
          backgroundColor: alpha(tierColor.bg, 0.5),
          mb: 2,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateX(8px)',
            boxShadow: theme.shadows[4],
          }
        }}
      >
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box flex={1}>
              {/* Header */}
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Chip
                  label={`TIER ${agedCase.escalation_tier}`}
                  size="small"
                  sx={{
                    backgroundColor: tierColor.border,
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                />
                <Chip
                  label={`${agedCase.age_days} DAYS`}
                  size="small"
                  color={agedCase.age_days > 30 ? 'error' : 'warning'}
                  icon={<AccessTime />}
                />
                {agedCase.customer_responded && (
                  <Chip
                    label="RESPONDED"
                    size="small"
                    color="success"
                    icon={<CheckCircleOutline />}
                  />
                )}
              </Box>

              {/* Site Info */}
              <Typography variant="h6" fontWeight="bold" color={tierColor.text}>
                {agedCase.site_details?.site_name || 'Unknown Site'}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {agedCase.site_details?.address || 'No address'}
              </Typography>

              {/* Financial Impact */}
              <Box display="flex" gap={3} mt={2}>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Total Loss
                  </Typography>
                  <Typography variant="h6" color="error" fontWeight="bold">
                    £{parseFloat(agedCase.total_savings_loss).toFixed(2)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Daily Loss
                  </Typography>
                  <Typography variant="body1" color="error">
                    £{parseFloat(agedCase.daily_savings_loss).toFixed(2)}/day
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Case Type
                  </Typography>
                  <Typography variant="body1">
                    {agedCase.case_type_display}
                  </Typography>
                </Box>
              </Box>

              {/* Communication History Preview */}
              <Box 
                mt={2} 
                display="flex" 
                alignItems="center" 
                gap={1}
                sx={{ cursor: 'pointer' }}
                onClick={() => setExpanded(!expanded)}
              >
                <Typography variant="caption" color="textSecondary">
                  Communication attempts: {agedCase.successful_contacts + agedCase.failed_contacts}
                </Typography>
                <IconButton size="small">
                  {expanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>

              <Collapse in={expanded}>
                <Box mt={1} p={2} bgcolor={alpha(theme.palette.background.paper, 0.8)} borderRadius={1}>
                  <Typography variant="body2" color="textSecondary">
                    Last contact: {agedCase.last_contact_attempt ? new Date(agedCase.last_contact_attempt).toLocaleString() : 'Never'}
                  </Typography>
                  <Box display="flex" gap={1} mt={1}>
                    <Chip label={`${agedCase.successful_contacts} successful`} size="small" color="success" variant="outlined" />
                    <Chip label={`${agedCase.failed_contacts} failed`} size="small" color="error" variant="outlined" />
                  </Box>
                </Box>
              </Collapse>
            </Box>

            {/* Action Buttons */}
            <Box display="flex" flexDirection="column" gap={1} ml={2}>
              <Tooltip title="Send Communication">
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Send />}
                  onClick={() => onAction('send')}
                  sx={{ 
                    backgroundColor: tierColor.border,
                    '&:hover': {
                      backgroundColor: tierColor.text,
                    }
                  }}
                >
                  Send
                </Button>
              </Tooltip>
              <Tooltip title="View Details">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Visibility />}
                  onClick={() => onAction('view')}
                >
                  View
                </Button>
              </Tooltip>
              <Tooltip title="Mark Resolved">
                <Button
                  variant="outlined"
                  size="small"
                  color="success"
                  startIcon={<CheckCircle />}
                  onClick={() => onAction('resolve')}
                >
                  Resolve
                </Button>
              </Tooltip>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface TierProgressProps {
  metrics: AgedCaseMetrics;
}

const TierProgress: React.FC<TierProgressProps> = ({ metrics }) => {
  const theme = useTheme();

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Escalation Pipeline
        </Typography>
        <Box display="flex" alignItems="center" gap={2} mt={2}>
          {[1, 2, 3, 4].map((tier, index) => {
            const tierData = metrics.by_tier[tier];
            const tierColor = tierColors[tier];
            
            return (
              <React.Fragment key={tier}>
                <Box flex={1} textAlign="center">
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      backgroundColor: tierColor.bg,
                      border: `3px solid ${tierColor.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto',
                      mb: 1,
                      position: 'relative',
                    }}
                  >
                    <Box textAlign="center">
                      <Typography variant="h5" fontWeight="bold" color={tierColor.text}>
                        {tierData?.count || 0}
                      </Typography>
                      <Typography variant="caption" color={tierColor.text}>
                        Tier {tier}
                      </Typography>
                    </Box>
                    {tierData?.count > 0 && (
                      <Badge
                        badgeContent={`${(metrics.response_rates_by_tier[tier]?.case_response_rate || 0).toFixed(0)}%`}
                        color="success"
                        sx={{
                          position: 'absolute',
                          top: -10,
                          right: -10,
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    £{parseFloat(tierData?.total_loss || '0').toFixed(0)}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Avg {tierData?.avg_age || 0}d
                  </Typography>
                </Box>
                {index < 3 && (
                  <ArrowForward
                    sx={{
                      color: alpha(theme.palette.text.secondary, 0.3),
                      fontSize: 30,
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
};

// Import ArrowForward icon
import { ArrowForward } from '@mui/icons-material';

const AgedCasesDashboardV2: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [filters, setFilters] = useState<AgedCaseFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Fetch metrics with error handling
  const { 
    data: metrics, 
    isLoading: metricsLoading, 
    error: metricsError,
    refetch: refetchMetrics 
  } = useQuery({
    queryKey: ['agedCasesMetrics'],
    queryFn: () => agedCasesService.getMetrics(),
    refetchInterval: 60000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Fetch aged cases with error handling
  const { 
    data: agedCases, 
    isLoading: casesLoading,
    error: casesError,
    refetch: refetchCases 
  } = useQuery({
    queryKey: ['agedCases', filters],
    queryFn: () => agedCasesService.getAgedCasesQueue(filters),
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    if (newValue === 0) {
      setFilters({});
    } else {
      setFilters({ tier: newValue });
    }
  };

  const handleCaseAction = async (caseId: number, action: 'send' | 'resolve' | 'view') => {
    switch (action) {
      case 'send':
        try {
          await agedCasesService.sendCommunication(caseId);
          refetchCases();
        } catch (error) {
          console.error('Error sending communication:', error);
        }
        break;
      case 'resolve':
        try {
          await agedCasesService.resolveCase(caseId);
          refetchCases();
          refetchMetrics();
        } catch (error) {
          console.error('Error resolving case:', error);
        }
        break;
      case 'view':
        navigate(`/aged-cases/${caseId}`);
        break;
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['agedCasesMetrics'] });
    queryClient.invalidateQueries({ queryKey: ['agedCases'] });
  };

  // Error state
  if (metricsError || casesError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          <Typography variant="h6">Connection Error</Typography>
          <Typography variant="body2">
            Unable to load aged cases data. This might be due to network issues or server timeout.
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Loading state
  if (metricsLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={150} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Aged Cases Command Center
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Monitor and manage offline solar installations
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <IconButton onClick={handleRefresh} color="primary">
            <Refresh />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<Settings />}
            onClick={() => navigate('/settings?category=aged-cases&tab=aged-cases-config')}
          >
            Settings
          </Button>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Cases"
            value={metrics?.total_cases || 0}
            subtitle={`${metrics?.new_today || 0} new today`}
            trend={metrics?.new_today > 0 ? 'up' : 'neutral'}
            icon={<Warning sx={{ fontSize: 40 }} />}
            color="warning"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Revenue Lost"
            value={`£${parseFloat(metrics?.total_savings_loss || '0').toFixed(0)}`}
            subtitle={`Avg ${metrics?.average_age || 0} days offline`}
            trend="down"
            trendValue="-12% vs last week"
            icon={<TrendingDown sx={{ fontSize: 40 }} />}
            color="error"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Response Rate"
            value={`${metrics?.avg_response_rate?.toFixed(1) || 0}%`}
            subtitle={`${metrics?.escalated_today || 0} escalated`}
            trend="up"
            trendValue="+5% vs last week"
            icon={<TrendingUp sx={{ fontSize: 40 }} />}
            color="success"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Critical Cases"
            value={metrics?.by_tier[4]?.count || 0}
            subtitle="Require immediate action"
            icon={<ErrorOutline sx={{ fontSize: 40 }} />}
            color="error"
          />
        </Grid>
      </Grid>

      {/* Tier Progression Visualization */}
      <Box mb={3}>
        <TierProgress metrics={metrics!} />
      </Box>

      {/* Priority Cases */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  All Cases
                  <Chip label={metrics?.total_cases || 0} size="small" />
                </Box>
              } 
            />
            {[1, 2, 3, 4].map((tier) => (
              <Tab
                key={tier}
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: tierColors[tier].border,
                      }}
                    />
                    Tier {tier}
                    <Chip 
                      label={metrics?.by_tier[tier]?.count || 0} 
                      size="small"
                      sx={{
                        backgroundColor: tierColors[tier].bg,
                        color: tierColors[tier].text,
                      }}
                    />
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Box>

        <Box sx={{ p: 3, maxHeight: 600, overflow: 'auto' }}>
          {casesLoading ? (
            <Box>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} variant="rectangular" height={150} sx={{ mb: 2 }} />
              ))}
            </Box>
          ) : (
            <AnimatePresence>
              {agedCases?.map((agedCase) => (
                <CasePriorityCard
                  key={agedCase.id}
                  case={agedCase}
                  onAction={(action) => handleCaseAction(agedCase.id, action)}
                />
              ))}
            </AnimatePresence>
          )}
          
          {!casesLoading && agedCases?.length === 0 && (
            <Box textAlign="center" py={4}>
              <CheckCircleOutline sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" color="textSecondary">
                No aged cases in this tier
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default AgedCasesDashboardV2;