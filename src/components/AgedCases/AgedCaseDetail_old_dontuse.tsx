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
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  IconButton,
  Tabs,
  Tab,
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
  TrendingUp,
  Warning,
  History,
  Message,
  AttachMoney,
  WbSunny,
  Link as LinkIcon,
} from '@mui/icons-material';
import { agedCasesService, AgedCase, AgedCaseCommunication, AgedCaseHistory } from '../../services/agedCasesService';

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
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const AgedCaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentTab, setCurrentTab] = useState(0);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<'auto' | 'sms' | 'email' | 'whatsapp'>('auto');
  const [resolveNotes, setResolveNotes] = useState('');

  const caseId = parseInt(id || '0');

  // Fetch aged case details
  const { data: agedCase, isLoading: caseLoading } = useQuery({
    queryKey: ['agedCase', caseId],
    queryFn: () => agedCasesService.getAgedCase(caseId),
    enabled: !!caseId,
  });

  // Fetch communications
  const { data: communications } = useQuery({
    queryKey: ['agedCaseCommunications', caseId],
    queryFn: () => agedCasesService.getCommunications(caseId),
    enabled: !!caseId,
  });

  // Fetch history
  const { data: history } = useQuery({
    queryKey: ['agedCaseHistory', caseId],
    queryFn: () => agedCasesService.getHistory(caseId),
    enabled: !!caseId,
  });

  // Send communication mutation
  const sendCommunicationMutation = useMutation({
    mutationFn: (channel: 'auto' | 'sms' | 'email' | 'whatsapp') => 
      agedCasesService.sendCommunication(caseId, channel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agedCase', caseId] });
      queryClient.invalidateQueries({ queryKey: ['agedCaseCommunications', caseId] });
      setSendDialogOpen(false);
    },
  });

  // Resolve case mutation
  const resolveCaseMutation = useMutation({
    mutationFn: (notes: string) => agedCasesService.resolveCase(caseId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agedCase', caseId] });
      setResolveDialogOpen(false);
      navigate('/aged-cases');
    },
  });

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Email />;
      case 'sms':
        return <Sms />;
      case 'whatsapp':
        return <WhatsApp />;
      case 'phone':
        return <Phone />;
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

  if (caseLoading || !agedCase) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={() => navigate('/aged-cases')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4">
              {agedCase.site_details?.site_name || 'Aged Case'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {agedCase.site_details?.address}
            </Typography>
          </Box>
        </Box>
        <Box>
          <Button
            variant="contained"
            startIcon={<Send />}
            onClick={() => setSendDialogOpen(true)}
            sx={{ mr: 1 }}
            disabled={agedCase.status === 'resolved'}
          >
            Send Communication
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircle />}
            onClick={() => setResolveDialogOpen(true)}
            disabled={agedCase.status === 'resolved'}
          >
            Mark Resolved
          </Button>
        </Box>
      </Box>

      {/* Status Alert */}
      {agedCase.status === 'resolved' && (
        <Alert severity="success" sx={{ mb: 3 }}>
          This case was resolved on {new Date(agedCase.resolved_at!).toLocaleDateString()}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Warning color="action" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Status
                </Typography>
              </Box>
              <Chip
                label={`Tier ${agedCase.escalation_tier}`}
                color={getTierColor(agedCase.escalation_tier)}
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                {agedCase.age_days} days offline
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <AttachMoney color="error" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Financial Impact
                </Typography>
              </Box>
              <Typography variant="h5" color="error">
                £{parseFloat(agedCase.total_savings_loss).toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                £{parseFloat(agedCase.daily_savings_loss).toFixed(2)}/day
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <WbSunny color="action" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Expected Generation
                </Typography>
              </Box>
              <Typography variant="h5">
                {parseFloat(agedCase.expected_daily_generation).toFixed(1)} kWh
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Daily average
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Message color="action" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Communications
                </Typography>
              </Box>
              <Typography variant="h5">
                {agedCase.successful_contacts + agedCase.failed_contacts}
              </Typography>
              <Typography variant="body2" color={agedCase.customer_responded ? 'success.main' : 'text.secondary'}>
                {agedCase.customer_responded ? 'Customer responded' : 'No response yet'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper>
        <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Communications" />
          <Tab label="History" />
          <Tab label="Case Details" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          <TabPanel value={currentTab} index={0}>
            {/* Communications Timeline */}
            {communications && communications.length > 0 ? (
              <Timeline>
                {communications.map((comm) => (
                  <TimelineItem key={comm.id}>
                    <TimelineOppositeContent color="text.secondary">
                      {new Date(comm.sent_at).toLocaleString()}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot color={comm.responded ? 'success' : 'grey'}>
                        {getChannelIcon(comm.channel)}
                      </TimelineDot>
                      <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent>
                      <Paper elevation={2} sx={{ p: 2 }}>
                        <Box display="flex" alignItems="center" mb={1}>
                          <Typography variant="subtitle1" fontWeight="bold" sx={{ mr: 1 }}>
                            {comm.template_name}
                          </Typography>
                          {comm.delivered && <Chip label="Delivered" size="small" color="success" sx={{ mx: 0.5 }} />}
                          {comm.opened && <Chip label="Opened" size="small" color="info" sx={{ mx: 0.5 }} />}
                          {comm.clicked && <Chip label="Clicked" size="small" color="primary" sx={{ mx: 0.5 }} />}
                          {comm.responded && <Chip label="Responded" size="small" color="success" sx={{ mx: 0.5 }} />}
                        </Box>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {comm.message_content}
                        </Typography>
                        {comm.response_content && (
                          <Box mt={2} p={1} bgcolor="action.hover" borderRadius={1}>
                            <Typography variant="caption" color="text.secondary">
                              Customer Response:
                            </Typography>
                            <Typography variant="body2">
                              {comm.response_content}
                            </Typography>
                          </Box>
                        )}
                      </Paper>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            ) : (
              <Typography color="text.secondary">No communications sent yet</Typography>
            )}
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            {/* History Timeline */}
            {history && history.length > 0 ? (
              <Timeline>
                {history.map((event) => (
                  <TimelineItem key={event.id}>
                    <TimelineOppositeContent color="text.secondary">
                      {new Date(event.created_at).toLocaleString()}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot color={event.action === 'escalated' ? 'warning' : 'primary'}>
                        <History />
                      </TimelineDot>
                      <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {event.action.charAt(0).toUpperCase() + event.action.slice(1)}
                      </Typography>
                      {event.from_tier && event.to_tier && (
                        <Typography variant="body2">
                          Tier {event.from_tier} → Tier {event.to_tier}
                        </Typography>
                      )}
                      {event.notes && (
                        <Typography variant="body2" color="text.secondary">
                          {event.notes}
                        </Typography>
                      )}
                      {event.user_details && (
                        <Typography variant="caption" color="text.secondary">
                          by {event.user_details.username}
                        </Typography>
                      )}
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            ) : (
              <Typography color="text.secondary">No history available</Typography>
            )}
          </TabPanel>

          <TabPanel value={currentTab} index={2}>
            {/* Case Details */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Case Information
                </Typography>
                <Box mb={2}>
                  <Typography variant="body2"><strong>Case Type:</strong> {agedCase.case_type_display}</Typography>
                  <Typography variant="body2"><strong>Status:</strong> {agedCase.status_display}</Typography>
                  <Typography variant="body2"><strong>Created:</strong> {new Date(agedCase.created_at).toLocaleDateString()}</Typography>
                  <Typography variant="body2"><strong>Last Updated:</strong> {new Date(agedCase.updated_at).toLocaleDateString()}</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Job Information
                </Typography>
                {agedCase.job_details ? (
                  <Box mb={2}>
                    <Typography variant="body2"><strong>Job Title:</strong> {agedCase.job_details.title}</Typography>
                    <Typography variant="body2"><strong>Description:</strong> {agedCase.job_details.description}</Typography>
                    <Typography variant="body2"><strong>Priority:</strong> {agedCase.job_details.priority}</Typography>
                    <Typography variant="body2"><strong>Status:</strong> {agedCase.job_details.status}</Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">No job linked</Typography>
                )}
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Communication Statistics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2"><strong>Successful Contacts:</strong> {agedCase.successful_contacts}</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2"><strong>Failed Contacts:</strong> {agedCase.failed_contacts}</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2"><strong>Last Contact:</strong> {agedCase.last_contact_attempt ? new Date(agedCase.last_contact_attempt).toLocaleDateString() : 'Never'}</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2"><strong>Last Engagement:</strong> {agedCase.last_engagement ? new Date(agedCase.last_engagement).toLocaleDateString() : 'Never'}</Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </TabPanel>
        </Box>
      </Paper>

      {/* Send Communication Dialog */}
      <Dialog open={sendDialogOpen} onClose={() => setSendDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Communication</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Channel</InputLabel>
            <Select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value as any)}
              label="Channel"
            >
              <MenuItem value="auto">Auto (System decides)</MenuItem>
              <MenuItem value="sms">SMS</MenuItem>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="whatsapp">WhatsApp</MenuItem>
            </Select>
          </FormControl>
          <Alert severity="info" sx={{ mt: 2 }}>
            The system will automatically select the appropriate template based on the current tier and previous communications.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => sendCommunicationMutation.mutate(selectedChannel)}
            disabled={sendCommunicationMutation.isPending}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resolve Case Dialog */}
      <Dialog open={resolveDialogOpen} onClose={() => setResolveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Resolve Case</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Resolution Notes"
            value={resolveNotes}
            onChange={(e) => setResolveNotes(e.target.value)}
            sx={{ mt: 2 }}
            placeholder="Describe how the issue was resolved..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => resolveCaseMutation.mutate(resolveNotes)}
            disabled={resolveCaseMutation.isPending}
          >
            Mark Resolved
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AgedCaseDetail;