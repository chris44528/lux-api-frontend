import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Tabs,
  Tab,
  Badge,
  Skeleton,
  LinearProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  ArrowBack,
  Send,
  CheckCircle,
  Email,
  Sms,
  WhatsApp,
  Phone,
  Warning,
  Error as ErrorIcon,
  TrendingUp,
  TrendingDown,
  AccessTime,
  AttachMoney,
  LocationOn,
  Person,
  History,
  Message,
  Refresh,
  OpenInNew,
  CheckCircleOutline,
  RadioButtonUnchecked,
  SentimentSatisfied,
  SentimentNeutral,
  SentimentDissatisfied,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { agedCasesService, AgedCase, AgedCaseCommunication, AgedCaseHistory } from '../../services/agedCasesService';

// Channel configuration
const channelConfig = {
  email: { icon: Email, color: '#1976d2' },
  sms: { icon: Sms, color: '#388e3c' },
  whatsapp: { icon: WhatsApp, color: '#25d366' },
  phone: { icon: Phone, color: '#f50057' },
};

// Tier colors
const tierColors = {
  1: { bg: '#e3f2fd', border: '#1976d2', text: '#0d47a1' },
  2: { bg: '#fff3e0', border: '#ff9800', text: '#e65100' },
  3: { bg: '#ffebee', border: '#f44336', text: '#b71c1c' },
  4: { bg: '#f3e5f5', border: '#9c27b0', text: '#4a148c' },
};

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
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

interface SendCommunicationDialogProps {
  open: boolean;
  onClose: () => void;
  onSend: (channel: string) => void;
  loading: boolean;
}

const SendCommunicationDialog: React.FC<SendCommunicationDialogProps> = ({
  open,
  onClose,
  onSend,
  loading
}) => {
  const [selectedChannel, setSelectedChannel] = useState<string>('auto');

  const handleSend = () => {
    onSend(selectedChannel);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Send Communication</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Select a communication channel or let the system choose automatically based on the escalation tier.
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Card 
              variant={selectedChannel === 'auto' ? 'outlined' : undefined}
              sx={{ 
                p: 2, 
                cursor: 'pointer',
                border: selectedChannel === 'auto' ? 2 : 0,
                borderColor: 'primary.main'
              }}
              onClick={() => setSelectedChannel('auto')}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <CheckCircle color="primary" />
                <Box>
                  <Typography variant="subtitle1">Automatic</Typography>
                  <Typography variant="caption" color="textSecondary">
                    System selects the best channel
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
          
          {Object.entries(channelConfig).map(([channel, config]) => (
            <Grid item xs={12} sm={6} key={channel}>
              <Card 
                variant={selectedChannel === channel ? 'outlined' : undefined}
                sx={{ 
                  p: 2, 
                  cursor: 'pointer',
                  border: selectedChannel === channel ? 2 : 0,
                  borderColor: config.color
                }}
                onClick={() => setSelectedChannel(channel)}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <config.icon sx={{ color: config.color }} />
                  <Typography variant="subtitle1">
                    {channel.charAt(0).toUpperCase() + channel.slice(1)}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button 
          onClick={handleSend} 
          variant="contained" 
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Send />}
        >
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const AgedCaseDetailV2: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState(0);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);

  // Fetch case details with error handling
  const { data: agedCase, isLoading: caseLoading, error: caseError, refetch: refetchCase } = useQuery({
    queryKey: ['agedCase', id],
    queryFn: () => agedCasesService.getAgedCase(parseInt(id!)),
    enabled: !!id,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Fetch communications
  const { data: communications, isLoading: commsLoading, error: commsError } = useQuery({
    queryKey: ['agedCaseCommunications', id],
    queryFn: () => agedCasesService.getCommunications(parseInt(id!)),
    enabled: !!id,
    retry: 3,
  });

  // Fetch history
  const { data: history, isLoading: historyLoading, error: historyError } = useQuery({
    queryKey: ['agedCaseHistory', id],
    queryFn: () => agedCasesService.getHistory(parseInt(id!)),
    enabled: !!id,
    retry: 3,
  });

  // Send communication mutation
  const sendCommunicationMutation = useMutation({
    mutationFn: (channel: string) => 
      agedCasesService.sendCommunication(parseInt(id!), channel as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agedCase', id] });
      queryClient.invalidateQueries({ queryKey: ['agedCaseCommunications', id] });
      queryClient.invalidateQueries({ queryKey: ['agedCaseHistory', id] });
      setSendDialogOpen(false);
    },
  });

  // Resolve case mutation
  const resolveCaseMutation = useMutation({
    mutationFn: (notes: string) => 
      agedCasesService.resolveCase(parseInt(id!), notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agedCase', id] });
      queryClient.invalidateQueries({ queryKey: ['agedCaseHistory', id] });
      setResolveDialogOpen(false);
      navigate('/aged-cases');
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['agedCase', id] });
    queryClient.invalidateQueries({ queryKey: ['agedCaseCommunications', id] });
    queryClient.invalidateQueries({ queryKey: ['agedCaseHistory', id] });
  };

  const getSentimentIcon = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positive':
        return <SentimentSatisfied color="success" />;
      case 'neutral':
        return <SentimentNeutral color="action" />;
      case 'negative':
        return <SentimentDissatisfied color="error" />;
      default:
        return null;
    }
  };

  // Error state
  if (caseError || commsError || historyError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error"
          action={
            <>
              <Button color="inherit" size="small" onClick={handleRefresh}>
                Retry
              </Button>
              <Button color="inherit" size="small" onClick={() => navigate('/aged-cases')}>
                Back
              </Button>
            </>
          }
        >
          <Typography variant="h6">Error Loading Case</Typography>
          <Typography variant="body2">
            Unable to load case details. Please check your connection and try again.
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Loading state
  if (caseLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="text" width={300} height={40} />
        </Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={120} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (!agedCase) return null;

  const tierColor = tierColors[agedCase.escalation_tier] || tierColors[1];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/aged-cases')} color="primary">
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {agedCase.site_details?.site_name || 'Case Details'}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              {agedCase.site_details?.address || 'No address'}
            </Typography>
          </Box>
        </Box>
        
        <Box display="flex" gap={2}>
          <IconButton onClick={handleRefresh} color="primary">
            <Refresh />
          </IconButton>
          {agedCase.status === 'active' && (
            <>
              <Button
                variant="outlined"
                startIcon={<Send />}
                onClick={() => setSendDialogOpen(true)}
              >
                Send Communication
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                onClick={() => setResolveDialogOpen(true)}
              >
                Resolve Case
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            borderLeft: `4px solid ${tierColor.border}`,
            backgroundColor: alpha(tierColor.bg, 0.3),
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Warning sx={{ color: tierColor.text }} />
                <Typography variant="subtitle2" color={tierColor.text}>
                  Escalation Tier
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color={tierColor.text}>
                Tier {agedCase.escalation_tier}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {agedCase.status_display}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <AccessTime color="action" />
                <Typography variant="subtitle2" color="textSecondary">
                  Days Offline
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {agedCase.age_days}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Since {format(new Date(agedCase.created_at), 'MMM d, yyyy')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TrendingDown color="error" />
                <Typography variant="subtitle2" color="textSecondary">
                  Total Loss
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="error">
                £{parseFloat(agedCase.total_savings_loss).toFixed(2)}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                £{parseFloat(agedCase.daily_savings_loss).toFixed(2)}/day
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Message color="action" />
                <Typography variant="subtitle2" color="textSecondary">
                  Communications
                </Typography>
              </Box>
              <Box display="flex" gap={2}>
                <Box>
                  <Typography variant="h6" color="success.main">
                    {agedCase.successful_contacts}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Sent
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box>
                  <Typography variant="h6" color={agedCase.customer_responded ? 'success.main' : 'warning.main'}>
                    {agedCase.customer_responded ? 'Yes' : 'No'}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Response
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={(e, v) => setCurrentTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                Communications
                <Badge badgeContent={communications?.length || 0} color="primary" />
              </Box>
            } 
          />
          <Tab label="History" />
          <Tab label="Site Details" />
        </Tabs>

        {/* Communications Tab */}
        <TabPanel value={currentTab} index={0}>
          {commsLoading ? (
            <Box p={3}>
              <CircularProgress />
            </Box>
          ) : communications?.length === 0 ? (
            <Box p={3} textAlign="center">
              <Typography color="textSecondary">
                No communications sent yet
              </Typography>
            </Box>
          ) : (
            <Timeline>
              {communications?.map((comm, index) => {
                const ChannelIcon = channelConfig[comm.channel]?.icon || Email;
                const channelColor = channelConfig[comm.channel]?.color || '#000';
                
                return (
                  <TimelineItem key={comm.id}>
                    <TimelineOppositeContent sx={{ py: 2 }}>
                      <Typography variant="body2" color="textSecondary">
                        {format(new Date(comm.sent_at), 'MMM d, yyyy')}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {format(new Date(comm.sent_at), 'h:mm a')}
                      </Typography>
                    </TimelineOppositeContent>
                    
                    <TimelineSeparator>
                      <TimelineDot sx={{ backgroundColor: channelColor }}>
                        <ChannelIcon sx={{ color: 'white', fontSize: 20 }} />
                      </TimelineDot>
                      {index < communications.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    
                    <TimelineContent sx={{ py: 2 }}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                            <Box>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {comm.template_name}
                              </Typography>
                              <Box display="flex" gap={1} mt={0.5}>
                                <Chip 
                                  label={comm.channel_display}
                                  size="small"
                                  sx={{ backgroundColor: alpha(channelColor, 0.1), color: channelColor }}
                                />
                                {comm.delivered && (
                                  <Chip 
                                    label="Delivered"
                                    size="small"
                                    icon={<CheckCircleOutline />}
                                    color="success"
                                    variant="outlined"
                                  />
                                )}
                                {comm.opened && (
                                  <Chip 
                                    label="Opened"
                                    size="small"
                                    icon={<Visibility />}
                                    color="info"
                                    variant="outlined"
                                  />
                                )}
                                {comm.clicked && (
                                  <Chip 
                                    label="Clicked"
                                    size="small"
                                    icon={<OpenInNew />}
                                    color="primary"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            </Box>
                            {comm.responded && getSentimentIcon(comm.response_sentiment)}
                          </Box>
                          
                          <Typography variant="body2" color="textSecondary" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                            {comm.message_content.substring(0, 200)}...
                          </Typography>
                          
                          {comm.responded && (
                            <Alert severity="success" sx={{ mt: 2 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Customer Response ({formatDistanceToNow(new Date(comm.response_received_at!), { addSuffix: true })})
                              </Typography>
                              <Typography variant="body2">
                                {comm.response_content}
                              </Typography>
                            </Alert>
                          )}
                        </CardContent>
                      </Card>
                    </TimelineContent>
                  </TimelineItem>
                );
              })}
            </Timeline>
          )}
        </TabPanel>

        {/* History Tab */}
        <TabPanel value={currentTab} index={1}>
          {historyLoading ? (
            <Box p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {history?.map((item) => (
                <ListItem key={item.id} divider>
                  <ListItemAvatar>
                    <Avatar sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1) }}>
                      <History color="primary" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={item.action}
                    secondary={
                      <>
                        {item.notes && <Typography variant="body2">{item.notes}</Typography>}
                        <Typography variant="caption" color="textSecondary">
                          {item.user_details?.full_name || 'System'} • {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </Typography>
                      </>
                    }
                  />
                  {item.to_tier && (
                    <ListItemSecondaryAction>
                      <Chip 
                        label={`Tier ${item.from_tier} → ${item.to_tier}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </TabPanel>

        {/* Site Details Tab */}
        <TabPanel value={currentTab} index={2}>
          <Box p={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Site Information
                </Typography>
                <List>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>
                        <LocationOn />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Address"
                      secondary={agedCase.site_details?.address || 'No address'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>
                        <Person />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Customer"
                      secondary={agedCase.site_details?.customer_name || 'Unknown'}
                    />
                  </ListItem>
                </List>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Case Information
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Case Type"
                      secondary={agedCase.case_type_display}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Expected Daily Generation"
                      secondary={`${agedCase.expected_daily_generation} kWh`}
                    />
                  </ListItem>
                  {agedCase.job_details && (
                    <ListItem>
                      <ListItemText
                        primary="Related Job"
                        secondary={`#${agedCase.job} - ${agedCase.job_details.status}`}
                      />
                    </ListItem>
                  )}
                </List>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Paper>

      {/* Send Communication Dialog */}
      <SendCommunicationDialog
        open={sendDialogOpen}
        onClose={() => setSendDialogOpen(false)}
        onSend={(channel) => sendCommunicationMutation.mutate(channel)}
        loading={sendCommunicationMutation.isPending}
      />

      {/* Resolve Case Dialog */}
      <Dialog open={resolveDialogOpen} onClose={() => setResolveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Resolve Case</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Mark this case as resolved. This will stop all future communications.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Resolution Notes"
            value={resolveNotes}
            onChange={(e) => setResolveNotes(e.target.value)}
            placeholder="Describe how the case was resolved..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => resolveCaseMutation.mutate(resolveNotes)}
            variant="contained"
            color="success"
            disabled={resolveCaseMutation.isPending}
            startIcon={resolveCaseMutation.isPending ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            Resolve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AgedCaseDetailV2;