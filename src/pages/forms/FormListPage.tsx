import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import engineerService from '../../services/engineerService';
import storageService from '../../services/offline/storageService';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';

const FormListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('templates');

  // Fetch form templates
  const { data: templates, isLoading: templatesLoading } = useQuery(
    'formTemplates',
    () => engineerService.getFormTemplates()
  );

  // Fetch pending submissions
  const { data: submissions, isLoading: submissionsLoading } = useQuery(
    'pendingSubmissions',
    async () => {
      const engineerId = parseInt(localStorage.getItem('currentEngineerId') || '0');
      return engineerService.getPendingSubmissions(engineerId);
    }
  );

  // Get offline pending forms
  const { data: offlineForms } = useQuery(
    'offlineForms',
    async () => {
      const pending = await storageService.getPendingOperations();
      return pending.filter(op => op.operation_type === 'form_submission');
    }
  );

  const createNewForm = () => {
    navigate('/engineer/forms/new');
  };

  const fillForm = (template: any) => {
    navigate('/engineer/forms/render', {
      state: { template }
    });
  };

  const editTemplate = (templateId: string) => {
    navigate(`/engineer/form/${templateId}`);
  };

  const duplicateTemplate = async (templateId: number) => {
    try {
      await engineerService.duplicateFormTemplate(templateId);
      // Refetch templates
    } catch (error) {
      console.error('Failed to duplicate template:', error);
    }
  };

  const getFormTypeColor = (formType: string) => {
    switch (formType) {
      case 'pre_job':
        return 'default';
      case 'post_job':
        return 'secondary';
      case 'meter_reading':
        return 'destructive';
      case 'site_inspection':
        return 'outline';
      case 'issue_report':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Forms</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Create, edit, and submit forms
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({(submissions?.length || 0) + (offlineForms?.length || 0)})
          </TabsTrigger>
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-6">
          <div className="mb-4">
            <Button onClick={createNewForm}>
              <span className="mr-2">➕</span>
              Create New Template
            </Button>
          </div>

          {templatesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading templates...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates?.map((template: any) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant={getFormTypeColor(template.form_type)}>
                        {template.form_type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {template.description || 'No description'}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {template.require_signature && (
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          ✍️ Signature
                        </span>
                      )}
                      {template.require_photo && (
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          📷 Photo
                        </span>
                      )}
                      {template.require_gps_location && (
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          📍 GPS
                        </span>
                      )}
                      {template.offline_capable && (
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          📱 Offline
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => fillForm(template)}
                        className="flex-1"
                      >
                        Fill Form
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => editTemplate(template.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => duplicateTemplate(template.id)}
                      >
                        📋
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          {submissionsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading pending forms...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Offline Forms */}
              {offlineForms && offlineForms.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">📱 Offline Forms</h3>
                  <div className="space-y-2">
                    {offlineForms.map((form) => (
                      <Card key={form.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{form.data.form_name || 'Untitled Form'}</p>
                              <p className="text-sm text-gray-500">
                                Submitted: {new Date(form.created_at).toLocaleString()}
                              </p>
                            </div>
                            <Badge variant="secondary">Pending Sync</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Server Pending Forms */}
              {submissions && submissions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">⏳ Pending Review</h3>
                  <div className="space-y-2">
                    {submissions.map((submission: any) => (
                      <Card key={submission.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{submission.form_template.name}</p>
                              <p className="text-sm text-gray-500">
                                Job: {submission.job?.title || 'N/A'} • 
                                Submitted: {new Date(submission.submitted_at).toLocaleString()}
                              </p>
                            </div>
                            <Badge>Pending</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {(!offlineForms || offlineForms.length === 0) && 
               (!submissions || submissions.length === 0) && (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-500">No pending forms</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="submitted" className="mt-6">
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">Submitted forms history coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FormListPage;