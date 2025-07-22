import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  Skeleton,
  Tooltip,
  Badge,
  LinearProgress,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  alpha,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  AlertTitle,
} from '@mui/material';
import {
  Save,
  ExpandMore,
  Add,
  Delete,
  Edit,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Info,
  Email,
  Sms,
  WhatsApp,
  Phone,
  Refresh,
  ContentCopy,
  Preview,
  Schedule,
  TrendingUp,
  Settings as SettingsIcon,
  ArrowForward,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { agedCasesService, AgedCaseSettings, AgedCaseTemplate } from '../../services/agedCasesService';

// Channel configuration
const channelConfig = {
  email: { icon: Email, color: '#1976d2', label: 'Email' },
  sms: { icon: Sms, color: '#388e3c', label: 'SMS' },
  whatsapp: { icon: WhatsApp, color: '#25d366', label: 'WhatsApp' },
  phone: { icon: Phone, color: '#f50057', label: 'Phone' },
};

// Tier configuration
const tierConfig = {
  1: { color: 'info', label: 'Friendly Reminder', description: 'Initial contact attempts' },
  2: { color: 'warning', label: 'Detailed Breakdown', description: 'Escalated communication' },
  3: { color: 'error', label: 'Urgent Action', description: 'Critical stage' },
  4: { color: 'error', label: 'Final Notice', description: 'Maximum escalation' },
};

interface TemplatePreviewDialogProps {
  open: boolean;
  onClose: () => void;
  template: AgedCaseTemplate | null;
}

const TemplatePreviewDialog: React.FC<TemplatePreviewDialogProps> = ({ open, onClose, template }) => {
  if (!template) return null;

  const ChannelIcon = channelConfig[template.channel]?.icon || Info;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <ChannelIcon sx={{ color: channelConfig[template.channel]?.color }} />
          {template.name}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box mb={2}>
          <Stack direction="row" spacing={1}>
            <Chip 
              label={`Tier ${template.escalation_tier}`}
              color={tierConfig[template.escalation_tier]?.color as any}
              size="small"
            />
            <Chip 
              label={template.channel.toUpperCase()}
              size="small"
            />
            {template.active && <Chip label="Active" color="success" size="small" />}
          </Stack>
        </Box>
        
        {template.subject && (
          <Box mb={2}>
            <Typography variant="subtitle2" color="textSecondary">Subject:</Typography>
            <Typography variant="body1">{template.subject}</Typography>
          </Box>
        )}
        
        <Box mb={2}>
          <Typography variant="subtitle2" color="textSecondary">Content:</Typography>
          <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {template.content}
            </Typography>
          </Paper>
        </Box>

        <Box display="flex" justifyContent="space-between" mt={2}>
          <Box>
            <Typography variant="caption" color="textSecondary">
              Sent {template.send_count} times
            </Typography>
          </Box>
          <Box>
            {template.open_rate > 0 && (
              <Chip 
                label={`${template.open_rate.toFixed(1)}% open rate`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ mr: 1 }}
              />
            )}
            {template.response_rate > 0 && (
              <Chip 
                label={`${template.response_rate.toFixed(1)}% response rate`}
                size="small"
                color="success"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

interface TemplateCardProps {
  template: AgedCaseTemplate;
  tries: number;
  onTriesChange: (tries: number) => void;
  onToggleActive: () => void;
  onPreview: () => void;
  disabled: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  tries,
  onTriesChange,
  onToggleActive,
  onPreview,
  disabled,
}) => {
  const theme = useTheme();
  const ChannelIcon = channelConfig[template.channel]?.icon || Info;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        sx={{ 
          height: '100%',
          opacity: template.active ? 1 : 0.6,
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: theme.shadows[4],
          }
        }}
      >
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <ChannelIcon sx={{ color: channelConfig[template.channel]?.color, fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight="bold">
                  {template.name}
                </Typography>
              </Box>
              
              <Box display="flex" gap={1} mb={2}>
                <Chip 
                  label={`Tier ${template.escalation_tier}`}
                  size="small"
                  color={tierConfig[template.escalation_tier]?.color as any}
                />
                <Chip 
                  label={template.channel}
                  size="small"
                  variant="outlined"
                />
              </Box>

              {template.subject && (
                <Typography variant="body2" color="textSecondary" noWrap sx={{ mb: 1 }}>
                  {template.subject}
                </Typography>
              )}

              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Typography variant="body2" color="textSecondary">
                  Send times:
                </Typography>
                <ToggleButtonGroup
                  value={tries}
                  exclusive
                  onChange={(e, newValue) => newValue && onTriesChange(newValue)}
                  size="small"
                  disabled={disabled || !template.active}
                >
                  {[1, 2, 3, 4, 5].map((num) => (
                    <ToggleButton key={num} value={num}>
                      {num}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>

              <Box display="flex" gap={2}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <TrendingUp fontSize="small" color="action" />
                  <Typography variant="caption" color="textSecondary">
                    {template.send_count} sent
                  </Typography>
                </Box>
                {template.response_rate > 0 && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <CheckCircle fontSize="small" color="success" />
                    <Typography variant="caption" color="success.main">
                      {template.response_rate.toFixed(1)}% response
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            <Box display="flex" flexDirection="column" gap={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={template.active}
                    onChange={onToggleActive}
                    disabled={disabled}
                    color="primary"
                  />
                }
                label=""
              />
              <IconButton size="small" onClick={onPreview}>
                <Preview />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const AgedCaseSettingsV2: React.FC = () => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const [editingSettings, setEditingSettings] = useState<AgedCaseSettings | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<AgedCaseTemplate | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'templates'>('general');
  const [retryCount, setRetryCount] = useState(0);

  // Fetch active settings with retry logic
  const { data: settings, isLoading: settingsLoading, error: settingsError, refetch: refetchSettings } = useQuery({
    queryKey: ['agedCaseSettings'],
    queryFn: () => agedCasesService.getActiveSettings(),
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: () => setRetryCount(prev => prev + 1),
  });

  // Fetch templates with retry logic
  const { data: templates, isLoading: templatesLoading, error: templatesError, refetch: refetchTemplates } = useQuery({
    queryKey: ['agedCaseTemplates'],
    queryFn: () => agedCasesService.getTemplates(),
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (settings: Partial<AgedCaseSettings>) => 
      agedCasesService.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agedCaseSettings'] });
      setEditingSettings(null);
      setShowSuccess(true);
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, template }: { id: number; template: Partial<AgedCaseTemplate> }) =>
      agedCasesService.updateTemplate(id, template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agedCaseTemplates'] });
    },
  });

  const handleSettingsChange = (field: keyof AgedCaseSettings, value: any) => {
    if (editingSettings) {
      setEditingSettings({ ...editingSettings, [field]: value });
    }
  };

  const handleTemplateConfigChange = (tier: number, templateName: string, tries: number) => {
    if (editingSettings) {
      const tierKey = `tier_${tier}_templates` as keyof AgedCaseSettings;
      const currentConfig = editingSettings[tierKey] as Record<string, number>;
      setEditingSettings({
        ...editingSettings,
        [tierKey]: {
          ...currentConfig,
          [templateName]: tries,
        },
      });
    }
  };

  const startEditingSettings = () => {
    if (settings) {
      setEditingSettings({ ...settings });
    }
  };

  const saveSettings = () => {
    if (editingSettings) {
      updateSettingsMutation.mutate(editingSettings);
    }
  };

  const cancelEditingSettings = () => {
    setEditingSettings(null);
  };

  const toggleTemplateActive = (template: AgedCaseTemplate) => {
    updateTemplateMutation.mutate({
      id: template.id,
      template: { active: !template.active },
    });
  };

  const handleRefresh = () => {
    refetchSettings();
    refetchTemplates();
    setRetryCount(0);
  };

  // Error state
  if (settingsError || templatesError) {
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
          <AlertTitle>Connection Error</AlertTitle>
          Unable to load settings. This might be due to network issues or server timeout.
          {retryCount > 0 && (
            <Typography variant="caption" display="block" mt={1}>
              Retry attempt: {retryCount}
            </Typography>
          )}
        </Alert>
      </Box>
    );
  }

  // Loading state
  if (settingsLoading || templatesLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} key={i}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  const displaySettings = editingSettings || settings;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Aged Cases Configuration
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage escalation rules and communication templates
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <IconButton onClick={handleRefresh} color="primary">
            <Refresh />
          </IconButton>
          {!editingSettings ? (
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={startEditingSettings}
            >
              Edit Settings
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                onClick={cancelEditingSettings}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={saveSettings}
                disabled={updateSettingsMutation.isPending}
              >
                Save Changes
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Tab Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <ToggleButtonGroup
          value={activeTab}
          exclusive
          onChange={(e, newValue) => newValue && setActiveTab(newValue)}
        >
          <ToggleButton value="general">
            <SettingsIcon sx={{ mr: 1 }} />
            General Settings
          </ToggleButton>
          <ToggleButton value="templates">
            <Email sx={{ mr: 1 }} />
            Templates
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* General Settings Tab */}
      {activeTab === 'general' && (
        <Grid container spacing={3}>
          {/* Communication Frequencies */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Communication Frequencies
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Configure how often messages are sent at each escalation tier
              </Typography>
              
              <Grid container spacing={2}>
                {[1, 2, 3, 4].map((tier) => (
                  <Grid item xs={12} sm={6} md={3} key={tier}>
                    <Card variant="outlined" sx={{ p: 2, backgroundColor: alpha(theme.palette.primary.main, 0.02) }}>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <Chip 
                          label={`TIER ${tier}`}
                          size="small"
                          color={tierConfig[tier].color as any}
                        />
                        <Typography variant="caption" color="textSecondary">
                          {tierConfig[tier].description}
                        </Typography>
                      </Box>
                      
                      <FormControl fullWidth size="small">
                        <InputLabel>Frequency</InputLabel>
                        <Select
                          value={displaySettings?.[`tier_${tier}_frequency` as keyof AgedCaseSettings] || ''}
                          onChange={(e) => handleSettingsChange(`tier_${tier}_frequency` as keyof AgedCaseSettings, e.target.value)}
                          disabled={!editingSettings}
                          label="Frequency"
                        >
                          <MenuItem value="daily">
                            <Box display="flex" alignItems="center" gap={1}>
                              <Schedule fontSize="small" />
                              Daily
                            </Box>
                          </MenuItem>
                          <MenuItem value="every_2_days">Every 2 Days</MenuItem>
                          <MenuItem value="daily_alternating">Daily Alternating</MenuItem>
                          <MenuItem value="twice_daily">Twice Daily</MenuItem>
                          <MenuItem value="three_times_daily">Three Times Daily</MenuItem>
                        </Select>
                      </FormControl>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>

          {/* Escalation Thresholds */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Escalation Thresholds
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Days without response before moving to the next tier
              </Typography>
              
              <Grid container spacing={3} alignItems="center">
                {[1, 2, 3].map((tier, index) => (
                  <React.Fragment key={tier}>
                    <Grid item xs={12} sm={3}>
                      <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                          Tier {tier} → Tier {tier + 1}
                        </Typography>
                        <TextField
                          fullWidth
                          type="number"
                          value={displaySettings?.[`tier_${tier}_escalation_days` as keyof AgedCaseSettings] || ''}
                          onChange={(e) => handleSettingsChange(`tier_${tier}_escalation_days` as keyof AgedCaseSettings, parseInt(e.target.value))}
                          disabled={!editingSettings}
                          InputProps={{
                            endAdornment: <Typography variant="caption">days</Typography>,
                          }}
                          inputProps={{ min: 1, max: 90 }}
                        />
                      </Card>
                    </Grid>
                    {index < 2 && (
                      <Grid item xs={12} sm={1} sx={{ textAlign: 'center' }}>
                        <ArrowForward color="action" />
                      </Grid>
                    )}
                  </React.Fragment>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <Box>
          {[1, 2, 3, 4].map((tier) => {
            const tierTemplates = templates?.filter(t => t.escalation_tier === tier) || [];
            const tierSettings = displaySettings?.[`tier_${tier}_templates` as keyof AgedCaseSettings] as Record<string, number>;
            
            return (
              <Accordion key={tier} defaultExpanded={tier === 1}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" gap={2} width="100%">
                    <Chip 
                      label={`TIER ${tier}`}
                      color={tierConfig[tier].color as any}
                    />
                    <Typography variant="h6">
                      {tierConfig[tier].label}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      ({tierTemplates.length} templates)
                    </Typography>
                    <Box flexGrow={1} />
                    <Badge 
                      badgeContent={tierTemplates.filter(t => t.active).length} 
                      color="success"
                      sx={{ mr: 2 }}
                    >
                      <Typography variant="caption" color="textSecondary">
                        Active
                      </Typography>
                    </Badge>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {tierTemplates.map((template) => {
                      const tries = tierSettings?.[template.name] || 1;
                      
                      return (
                        <Grid item xs={12} md={6} key={template.id}>
                          <TemplateCard
                            template={template}
                            tries={tries}
                            onTriesChange={(newTries) => handleTemplateConfigChange(tier, template.name, newTries)}
                            onToggleActive={() => toggleTemplateActive(template)}
                            onPreview={() => setPreviewTemplate(template)}
                            disabled={!editingSettings}
                          />
                        </Grid>
                      );
                    })}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      )}

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          Settings saved successfully!
        </Alert>
      </Snackbar>

      {/* Template Preview Dialog */}
      <TemplatePreviewDialog
        open={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        template={previewTemplate}
      />
    </Box>
  );
};

export default AgedCaseSettingsV2;