import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Save,
  ExpandMore,
  Add,
  Delete,
  Edit,
} from '@mui/icons-material';
import { agedCasesService, AgedCaseSettings, AgedCaseTemplate } from '../../services/agedCasesService';

interface TemplateConfig {
  [key: string]: number;
}

const AgedCaseSettingsComponent: React.FC = () => {
  const queryClient = useQueryClient();
  const [editingSettings, setEditingSettings] = useState<AgedCaseSettings | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AgedCaseTemplate | null>(null);

  // Fetch active settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['agedCaseSettings'],
    queryFn: () => agedCasesService.getActiveSettings(),
  });

  // Fetch templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['agedCaseTemplates'],
    queryFn: () => agedCasesService.getTemplates(),
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (settings: Partial<AgedCaseSettings>) => 
      agedCasesService.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agedCaseSettings'] });
      setEditingSettings(null);
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
      const currentConfig = editingSettings[tierKey] as TemplateConfig;
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

  if (settingsLoading || templatesLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const displaySettings = editingSettings || settings;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Aged Cases Settings
      </Typography>

      {/* Current Settings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Current Configuration: {displaySettings?.name}
          </Typography>
          {!editingSettings ? (
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={startEditingSettings}
            >
              Edit Settings
            </Button>
          ) : (
            <Box>
              <Button
                variant="outlined"
                onClick={cancelEditingSettings}
                sx={{ mr: 1 }}
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
            </Box>
          )}
        </Box>

        <Grid container spacing={3}>
          {/* Communication Frequencies */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Communication Frequencies
            </Typography>
            <Grid container spacing={2}>
              {[1, 2, 3, 4].map((tier) => (
                <Grid item xs={12} sm={6} md={3} key={tier}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Tier {tier} Frequency</InputLabel>
                    <Select
                      value={displaySettings?.[`tier_${tier}_frequency` as keyof AgedCaseSettings] || ''}
                      onChange={(e) => handleSettingsChange(`tier_${tier}_frequency` as keyof AgedCaseSettings, e.target.value)}
                      disabled={!editingSettings}
                      label={`Tier ${tier} Frequency`}
                    >
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="every_2_days">Every 2 Days</MenuItem>
                      <MenuItem value="daily_alternating">Daily Alternating</MenuItem>
                      <MenuItem value="twice_daily">Twice Daily</MenuItem>
                      <MenuItem value="three_times_daily">Three Times Daily</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              ))}
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          {/* Escalation Thresholds */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Escalation Thresholds (Days with No Response)
            </Typography>
            <Grid container spacing={2}>
              {[1, 2, 3].map((tier) => (
                <Grid item xs={12} sm={4} key={tier}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label={`Tier ${tier} → ${tier + 1}`}
                    value={displaySettings?.[`tier_${tier}_escalation_days` as keyof AgedCaseSettings] || ''}
                    onChange={(e) => handleSettingsChange(`tier_${tier}_escalation_days` as keyof AgedCaseSettings, parseInt(e.target.value))}
                    disabled={!editingSettings}
                  />
                </Grid>
              ))}
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          {/* Template Rotation Settings */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Template Rotation Settings
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Configure how many times each template should be sent before rotating to the next one.
            </Alert>
            
            {[1, 2, 3, 4].map((tier) => (
              <Accordion key={tier} defaultExpanded={tier === 1}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography>Tier {tier} Templates</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Template Name</TableCell>
                          <TableCell>Channel</TableCell>
                          <TableCell>Times to Send</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {templates?.filter(t => t.escalation_tier === tier && t.active).map((template) => {
                          const tierConfig = displaySettings?.[`tier_${tier}_templates` as keyof AgedCaseSettings] as TemplateConfig;
                          const tries = tierConfig?.[template.name] || 1;
                          
                          return (
                            <TableRow key={template.id}>
                              <TableCell>{template.name}</TableCell>
                              <TableCell>
                                <Chip
                                  label={template.channel}
                                  size="small"
                                  color={
                                    template.channel === 'whatsapp' ? 'success' :
                                    template.channel === 'email' ? 'primary' :
                                    template.channel === 'sms' ? 'info' : 'default'
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  type="number"
                                  size="small"
                                  value={tries}
                                  onChange={(e) => handleTemplateConfigChange(tier, template.name, parseInt(e.target.value) || 1)}
                                  disabled={!editingSettings}
                                  inputProps={{ min: 1, max: 10 }}
                                  sx={{ width: 80 }}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            ))}
          </Grid>
        </Grid>
      </Paper>

      {/* Template Management */}
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Communication Templates
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {templates?.map((template) => (
            <Grid item xs={12} md={6} key={template.id}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {template.name}
                      </Typography>
                      <Box display="flex" gap={1} mt={0.5}>
                        <Chip
                          label={`Tier ${template.escalation_tier}`}
                          size="small"
                          color={
                            template.escalation_tier === 1 ? 'info' :
                            template.escalation_tier === 2 ? 'warning' :
                            template.escalation_tier >= 3 ? 'error' : 'default'
                          }
                        />
                        <Chip
                          label={template.channel}
                          size="small"
                          color={
                            template.channel === 'whatsapp' ? 'success' :
                            template.channel === 'email' ? 'primary' :
                            template.channel === 'sms' ? 'info' : 'default'
                          }
                        />
                        {!template.active && (
                          <Chip label="Inactive" size="small" />
                        )}
                      </Box>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => toggleTemplateActive(template)}
                    >
                      {template.active ? <Delete /> : <Add />}
                    </IconButton>
                  </Box>

                  {template.subject && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Subject:</strong> {template.subject}
                    </Typography>
                  )}

                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      maxHeight: 100,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {template.content}
                  </Typography>

                  <Box display="flex" justifyContent="space-between" mt={2}>
                    <Typography variant="caption" color="text.secondary">
                      Sent: {template.send_count} times
                    </Typography>
                    <Box>
                      {template.open_rate > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
                          Open: {template.open_rate.toFixed(1)}%
                        </Typography>
                      )}
                      {template.response_rate > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          Response: {template.response_rate.toFixed(1)}%
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
};

export default AgedCaseSettingsComponent;