import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { agedCasesService, AgedCase, AgedCaseMetrics, AgedCaseFilters } from '../../services/agedCasesService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`aged-cases-tabpanel-${index}`}
      aria-labelledby={`aged-cases-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AgedCasesDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [filters, setFilters] = useState<AgedCaseFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Fetch metrics
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['agedCasesMetrics'],
    queryFn: () => agedCasesService.getMetrics(),
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch aged cases
  const { data: agedCases, isLoading: casesLoading, refetch: refetchCases } = useQuery({
    queryKey: ['agedCases', filters],
    queryFn: () => agedCasesService.getAgedCasesQueue(filters),
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    if (newValue === 0) {
      setFilters({});
    } else {
      setFilters({ tier: newValue });
    }
  };

  const handleBulkSendCommunication = async () => {
    if (selectedRows.length === 0) return;
    
    try {
      await agedCasesService.bulkAction({
        case_ids: selectedRows,
        action: 'send_communication',
        channel: 'auto',
      });
      refetchCases();
      setSelectedRows([]);
    } catch (error) {
      console.error('Error sending bulk communications:', error);
    }
  };

  const handleBulkResolve = async () => {
    if (selectedRows.length === 0) return;
    
    try {
      await agedCasesService.bulkAction({
        case_ids: selectedRows,
        action: 'resolve',
        notes: 'Bulk resolved from dashboard',
      });
      refetchCases();
      refetchMetrics();
      setSelectedRows([]);
    } catch (error) {
      console.error('Error resolving cases:', error);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Email fontSize="small" />;
      case 'sms':
        return <Sms fontSize="small" />;
      case 'whatsapp':
        return <WhatsApp fontSize="small" />;
      case 'phone':
        return <Phone fontSize="small" />;
      default:
        return null;
    }
  };

  const getTierColor = (tier: number): "default" | "warning" | "error" | "primary" | "secondary" | "info" | "success" => {
    switch (tier) {
      case 1:
        return 'info';
      case 2:
        return 'warning';
      case 3:
        return 'error';
      case 4:
        return 'error';
      default:
        return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'site_details',
      headerName: 'Site',
      width: 200,
      renderCell: (params: GridRenderCellParams<AgedCase>) => (
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {params.row.site_details?.site_name || 'Unknown'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.site_details?.address || ''}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'case_type_display',
      headerName: 'Type',
      width: 150,
    },
    {
      field: 'age_days',
      headerName: 'Days Offline',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={`${params.value} days`}
          size="small"
          color={params.value > 30 ? 'error' : params.value > 14 ? 'warning' : 'default'}
        />
      ),
    },
    {
      field: 'escalation_tier',
      headerName: 'Tier',
      width: 80,
      renderCell: (params) => (
        <Chip
          label={`Tier ${params.value}`}
          size="small"
          color={getTierColor(params.value)}
        />
      ),
    },
    {
      field: 'total_savings_loss',
      headerName: 'Total Loss',
      width: 120,
      renderCell: (params) => (
        <Typography color="error" fontWeight="bold">
          £{parseFloat(params.value).toFixed(2)}
        </Typography>
      ),
    },
    {
      field: 'daily_savings_loss',
      headerName: 'Daily Loss',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2">
          £{parseFloat(params.value).toFixed(2)}/day
        </Typography>
      ),
    },
    {
      field: 'customer_responded',
      headerName: 'Responded',
      width: 100,
      renderCell: (params) => (
        params.value ? (
          <CheckCircle color="success" fontSize="small" />
        ) : (
          <Warning color="warning" fontSize="small" />
        )
      ),
    },
    {
      field: 'last_contact_attempt',
      headerName: 'Last Contact',
      width: 150,
      renderCell: (params) => {
        if (!params.value) return 'Never';
        const date = new Date(params.value);
        return date.toLocaleDateString();
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params: GridRenderCellParams<AgedCase>) => (
        <Box>
          <Button
            size="small"
            startIcon={<Send />}
            onClick={() => agedCasesService.sendCommunication(params.row.id)}
          >
            Send
          </Button>
          <Button
            size="small"
            color="success"
            onClick={() => agedCasesService.resolveCase(params.row.id)}
          >
            Resolve
          </Button>
        </Box>
      ),
    },
  ];

  if (metricsLoading || casesLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">
          Aged Cases Management
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<Settings />}
          onClick={() => navigate('/settings?category=aged-cases&tab=aged-cases-config')}
        >
          Settings
        </Button>
      </Box>

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Active Cases
              </Typography>
              <Typography variant="h4">
                {metrics?.total_cases || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {metrics?.new_today || 0} new today
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Savings Lost
              </Typography>
              <Typography variant="h4" color="error">
                £{parseFloat(metrics?.total_savings_loss || '0').toFixed(0)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Avg {metrics?.average_age || 0} days offline
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Response Rate
              </Typography>
              <Typography variant="h4">
                {metrics?.avg_response_rate?.toFixed(1) || 0}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {metrics?.escalated_today || 0} escalated today
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Tier Distribution
              </Typography>
              <Box>
                {[1, 2, 3, 4].map((tier) => (
                  <Box key={tier} display="flex" alignItems="center" justifyContent="space-between">
                    <Chip
                      label={`Tier ${tier}`}
                      size="small"
                      color={getTierColor(tier)}
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="body2">
                      {metrics?.by_tier[tier]?.count || 0}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs and Actions */}
      <Paper sx={{ mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab label={`All Cases (${metrics?.total_cases || 0})`} />
            <Tab label={`Tier 1 (${metrics?.by_tier[1]?.count || 0})`} />
            <Tab label={`Tier 2 (${metrics?.by_tier[2]?.count || 0})`} />
            <Tab label={`Tier 3 (${metrics?.by_tier[3]?.count || 0})`} />
            <Tab label={`Tier 4 (${metrics?.by_tier[4]?.count || 0})`} />
          </Tabs>
          
          <Box>
            <IconButton onClick={() => { refetchCases(); refetchMetrics(); }}>
              <Refresh />
            </IconButton>
            <IconButton onClick={() => setShowFilters(!showFilters)}>
              <FilterList />
            </IconButton>
          </Box>
        </Box>

        {/* Filters */}
        {showFilters && (
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  fullWidth
                  label="Case Type"
                  size="small"
                  value={filters.case_type || ''}
                  onChange={(e) => setFilters({ ...filters, case_type: e.target.value })}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="no_communication">No Communication</MenuItem>
                  <MenuItem value="zero_generation">Zero Generation</MenuItem>
                  <MenuItem value="low_performance">Low Performance</MenuItem>
                  <MenuItem value="connection_issue">Connection Issue</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  fullWidth
                  label="Response Status"
                  size="small"
                  value={filters.has_responded === undefined ? '' : filters.has_responded.toString()}
                  onChange={(e) => setFilters({ ...filters, has_responded: e.target.value === '' ? undefined : e.target.value === 'true' })}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="true">Responded</MenuItem>
                  <MenuItem value="false">No Response</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Min Days Offline"
                  size="small"
                  type="number"
                  value={filters.min_age_days || ''}
                  onChange={(e) => setFilters({ ...filters, min_age_days: parseInt(e.target.value) || undefined })}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Search"
                  size="small"
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Site name or address..."
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Bulk Actions */}
        {selectedRows.length > 0 && (
          <Box sx={{ p: 2, bgcolor: 'action.selected' }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {selectedRows.length} cases selected
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<Send />}
              onClick={handleBulkSendCommunication}
              sx={{ mr: 1 }}
            >
              Send Communication
            </Button>
            <Button
              variant="contained"
              size="small"
              color="success"
              startIcon={<CheckCircle />}
              onClick={handleBulkResolve}
            >
              Mark Resolved
            </Button>
          </Box>
        )}
      </Paper>

      {/* Data Grid */}
      <Paper>
        <DataGrid
          rows={agedCases || []}
          columns={columns}
          checkboxSelection
          disableRowSelectionOnClick
          onRowSelectionModelChange={(newSelection) => {
            setSelectedRows(newSelection as number[]);
          }}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
          pageSizeOptions={[10, 25, 50]}
          sx={{ height: 600 }}
        />
      </Paper>
    </Box>
  );
};

export default AgedCasesDashboard;