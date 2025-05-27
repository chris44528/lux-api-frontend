import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select } from '../ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useToast } from '../../hooks/use-toast';
import { Checkbox } from '../ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import emailTemplateService, { 
  EmailTemplate, 
  EmailTemplateDetail, 
  EmailTemplateCategory,
  EmailTemplateVariable,
  RenderTemplateResponse
} from '../../services/emailTemplateService';
import { Search, Plus, Edit, Copy, Trash2, Eye, Send, FileText, Variable } from 'lucide-react';

const EmailTemplatesSettings: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [activeTab, setActiveTab] = useState('templates');
  
  // Data states
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [categories, setCategories] = useState<EmailTemplateCategory[]>([]);
  const [variables, setVariables] = useState<EmailTemplateVariable[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<EmailTemplate[]>([]);
  
  // Modal states
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  
  // Form states
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplateDetail | null>(null);
  const [editingCategory, setEditingCategory] = useState<EmailTemplateCategory | null>(null);
  const [editingVariable, setEditingVariable] = useState<EmailTemplateVariable | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    category: 0,
    subject: '',
    body: '',
    footer: '',
    is_active: true
  });
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  });
  const [variableForm, setVariableForm] = useState({
    name: '',
    description: '',
    default_value: ''
  });
  
  // Preview and test states
  const [previewData, setPreviewData] = useState<RenderTemplateResponse | null>(null);
  const [testVariables, setTestVariables] = useState<Record<string, string>>({});
  const [testEmail, setTestEmail] = useState('');
  
  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);
  
  // Filter templates when search or category changes
  useEffect(() => {
    let filtered = templates;
    
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }
    
    setFilteredTemplates(filtered);
  }, [templates, searchTerm, selectedCategory]);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const [templatesData, categoriesData, variablesData] = await Promise.all([
        emailTemplateService.getTemplates(),
        emailTemplateService.getCategories(),
        emailTemplateService.getVariables()
      ]);
      
      setTemplates(templatesData);
      setCategories(categoriesData);
      setVariables(variablesData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load email templates data'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Template handlers
  const handleEditTemplate = async (template: EmailTemplate) => {
    try {
      const fullTemplate = await emailTemplateService.getTemplate(template.id);
      setEditingTemplate(fullTemplate);
      setTemplateForm({
        name: fullTemplate.name,
        category: fullTemplate.category,
        subject: fullTemplate.subject,
        body: fullTemplate.body,
        footer: fullTemplate.footer,
        is_active: fullTemplate.is_active
      });
      setShowTemplateModal(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load template details'
      });
    }
  };
  
  const handleSaveTemplate = async () => {
    try {
      if (editingTemplate) {
        await emailTemplateService.updateTemplate(editingTemplate.id, templateForm);
        toast({
          title: 'Success',
          description: 'Template updated successfully'
        });
      } else {
        await emailTemplateService.createTemplate(templateForm);
        toast({
          title: 'Success',
          description: 'Template created successfully'
        });
      }
      
      setShowTemplateModal(false);
      setEditingTemplate(null);
      setTemplateForm({
        name: '',
        category: 0,
        subject: '',
        body: '',
        footer: '',
        is_active: true
      });
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save template'
      });
    }
  };
  
  const handleDuplicateTemplate = async (id: number) => {
    try {
      await emailTemplateService.duplicateTemplate(id);
      toast({
        title: 'Success',
        description: 'Template duplicated successfully'
      });
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to duplicate template'
      });
    }
  };
  
  const handleDeleteTemplate = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await emailTemplateService.deleteTemplate(id);
        toast({
          title: 'Success',
          description: 'Template deleted successfully'
        });
        loadData();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete template'
        });
      }
    }
  };
  
  const handlePreviewTemplate = async (template: EmailTemplate) => {
    try {
      const fullTemplate = await emailTemplateService.getTemplate(template.id);
      
      // Initialize test variables with empty values
      const vars: Record<string, string> = {};
      fullTemplate.variables.forEach(v => {
        vars[v] = '';
      });
      setTestVariables(vars);
      
      // Get preview with empty variables
      const preview = await emailTemplateService.renderTemplate({
        template_id: template.id,
        variables: vars
      });
      
      setPreviewData(preview);
      setEditingTemplate(fullTemplate);
      setShowPreviewModal(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to preview template'
      });
    }
  };
  
  const handleUpdatePreview = async () => {
    if (!editingTemplate) return;
    
    try {
      const preview = await emailTemplateService.renderTemplate({
        template_id: editingTemplate.id,
        variables: testVariables
      });
      setPreviewData(preview);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update preview'
      });
    }
  };
  
  const handleTestEmail = async () => {
    if (!editingTemplate || !testEmail) return;
    
    try {
      await emailTemplateService.sendEmail({
        template_id: editingTemplate.id,
        recipient_email: testEmail,
        variables: testVariables,
        save_log: false
      });
      
      toast({
        title: 'Success',
        description: `Test email sent to ${testEmail}`
      });
      
      setShowTestModal(false);
      setTestEmail('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send test email'
      });
    }
  };
  
  // Category handlers
  const handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        await emailTemplateService.updateCategory(editingCategory.id, categoryForm);
        toast({
          title: 'Success',
          description: 'Category updated successfully'
        });
      } else {
        await emailTemplateService.createCategory(categoryForm);
        toast({
          title: 'Success',
          description: 'Category created successfully'
        });
      }
      
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '' });
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save category'
      });
    }
  };
  
  const handleDeleteCategory = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this category? Templates in this category will not be deleted.')) {
      try {
        await emailTemplateService.deleteCategory(id);
        toast({
          title: 'Success',
          description: 'Category deleted successfully'
        });
        loadData();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete category'
        });
      }
    }
  };
  
  // Variable handlers
  const handleSaveVariable = async () => {
    try {
      if (editingVariable) {
        await emailTemplateService.updateVariable(editingVariable.id, variableForm);
        toast({
          title: 'Success',
          description: 'Variable updated successfully'
        });
      } else {
        await emailTemplateService.createVariable(variableForm);
        toast({
          title: 'Success',
          description: 'Variable created successfully'
        });
      }
      
      setShowVariableModal(false);
      setEditingVariable(null);
      setVariableForm({ name: '', description: '', default_value: '' });
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save variable'
      });
    }
  };
  
  const handleDeleteVariable = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this variable?')) {
      try {
        await emailTemplateService.deleteVariable(id);
        toast({
          title: 'Success',
          description: 'Variable deleted successfully'
        });
        loadData();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete variable'
        });
      }
    }
  };
  
  // Helper to extract variables from text
  const extractVariables = (text: string): string[] => {
    const regex = /@@(\w+)@@/g;
    const matches = text.match(regex) || [];
    return [...new Set(matches.map(m => m.replace(/@@/g, '')))];
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Email Templates</h3>
          <p className="text-sm text-muted-foreground">
            Manage email templates with dynamic variables for automated communication
          </p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="variables">Variables</TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates" className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Search Templates</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-48">
              <Label>Filter by Category</Label>
              <select
                className="w-full border rounded px-3 py-2"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <Button onClick={() => {
              setEditingTemplate(null);
              setTemplateForm({
                name: '',
                category: categories[0]?.id || 0,
                subject: '',
                body: '',
                footer: '',
                is_active: true
              });
              setShowTemplateModal(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>
          
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map(template => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {categories.find(c => c.id === template.category)?.name || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{template.subject}</TableCell>
                    <TableCell>
                      <Badge variant={template.is_active ? 'success' : 'secondary'}>
                        {template.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{template.usage_count} times</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePreviewTemplate(template)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDuplicateTemplate(template.id)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium">Template Categories</h4>
            <Button size="sm" onClick={() => {
              setEditingCategory(null);
              setCategoryForm({ name: '', description: '' });
              setShowCategoryModal(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              New Category
            </Button>
          </div>
          
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Templates</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map(category => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.description}</TableCell>
                    <TableCell>{category.template_count}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingCategory(category);
                            setCategoryForm({
                              name: category.name,
                              description: category.description
                            });
                            setShowCategoryModal(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCategory(category.id)}
                          disabled={category.template_count > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        
        <TabsContent value="variables" className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium">Template Variables</h4>
            <Button size="sm" onClick={() => {
              setEditingVariable(null);
              setVariableForm({ name: '', description: '', default_value: '' });
              setShowVariableModal(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              New Variable
            </Button>
          </div>
          
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variable</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Default Value</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variables.map(variable => (
                  <TableRow key={variable.id}>
                    <TableCell className="font-mono">{variable.formatted_name}</TableCell>
                    <TableCell>{variable.description}</TableCell>
                    <TableCell>{variable.default_value || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={variable.is_system ? 'default' : 'secondary'}>
                        {variable.is_system ? 'System' : 'Custom'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {!variable.is_system && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingVariable(variable);
                              setVariableForm({
                                name: variable.name,
                                description: variable.description,
                                default_value: variable.default_value || ''
                              });
                              setShowVariableModal(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteVariable(variable.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Template Modal */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'New Template'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Template Name</Label>
                <Input
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="e.g., Welcome Email"
                />
              </div>
              <div>
                <Label>Category</Label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={templateForm.category}
                  onChange={(e) => setTemplateForm({ ...templateForm, category: Number(e.target.value) })}
                >
                  <option value={0}>Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <Label>Subject Line</Label>
              <Input
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                placeholder="e.g., Welcome to @@CompanyName@@"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use @@VariableName@@ format for dynamic content
              </p>
            </div>
            
            <div>
              <Label>Email Body</Label>
              <Textarea
                value={templateForm.body}
                onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                rows={10}
                placeholder="Dear @@CustomerName@@,&#10;&#10;Thank you for your inquiry..."
              />
            </div>
            
            <div>
              <Label>Footer (Signature)</Label>
              <Textarea
                value={templateForm.footer}
                onChange={(e) => setTemplateForm({ ...templateForm, footer: e.target.value })}
                rows={4}
                placeholder="Best regards,&#10;@@CompanyName@@"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="active"
                checked={templateForm.is_active}
                onCheckedChange={(checked) => 
                  setTemplateForm({ ...templateForm, is_active: checked as boolean })
                }
              />
              <Label htmlFor="active">Active (template can be used)</Label>
            </div>
            
            {/* Show detected variables */}
            {(templateForm.subject || templateForm.body || templateForm.footer) && (
              <div className="bg-muted p-3 rounded">
                <p className="text-sm font-medium mb-2">Detected Variables:</p>
                <div className="flex flex-wrap gap-2">
                  {[...new Set([
                    ...extractVariables(templateForm.subject),
                    ...extractVariables(templateForm.body),
                    ...extractVariables(templateForm.footer)
                  ])].map(v => (
                    <Badge key={v} variant="secondary">@@{v}@@</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate}>
              {editingTemplate ? 'Update' : 'Create'} Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Category Modal */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'New Category'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Category Name</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="e.g., Customer Service"
              />
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                rows={3}
                placeholder="Templates for customer service emails"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCategory}>
              {editingCategory ? 'Update' : 'Create'} Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Variable Modal */}
      <Dialog open={showVariableModal} onOpenChange={setShowVariableModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingVariable ? 'Edit Variable' : 'New Variable'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Variable Name</Label>
              <Input
                value={variableForm.name}
                onChange={(e) => setVariableForm({ ...variableForm, name: e.target.value.replace(/\s/g, '') })}
                placeholder="e.g., CompanyPhone"
              />
              <p className="text-xs text-muted-foreground mt-1">
                No spaces allowed. Will be used as @@{variableForm.name || 'VariableName'}@@
              </p>
            </div>
            
            <div>
              <Label>Description</Label>
              <Input
                value={variableForm.description}
                onChange={(e) => setVariableForm({ ...variableForm, description: e.target.value })}
                placeholder="Company contact phone number"
              />
            </div>
            
            <div>
              <Label>Default Value (Optional)</Label>
              <Input
                value={variableForm.default_value}
                onChange={(e) => setVariableForm({ ...variableForm, default_value: e.target.value })}
                placeholder="e.g., 0800 123 4567"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVariableModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveVariable}>
              {editingVariable ? 'Update' : 'Create'} Variable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview Template</DialogTitle>
          </DialogHeader>
          
          {previewData && editingTemplate && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Fill in Variables</h4>
                <div className="grid grid-cols-2 gap-3">
                  {editingTemplate.variables.map(varName => (
                    <div key={varName}>
                      <Label className="text-sm">{varName}</Label>
                      <Input
                        value={testVariables[varName] || ''}
                        onChange={(e) => setTestVariables({
                          ...testVariables,
                          [varName]: e.target.value
                        })}
                        placeholder={`Enter ${varName}`}
                      />
                    </div>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleUpdatePreview}
                  className="mt-2"
                >
                  Update Preview
                </Button>
              </div>
              
              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-medium mb-2">Email Preview</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Subject:</p>
                    <p className="font-medium">{previewData.rendered.subject}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Content:</p>
                    <div className="whitespace-pre-wrap bg-white dark:bg-gray-900 p-3 rounded border">
                      {previewData.rendered.full_content}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTestModal(true);
                    setShowPreviewModal(false);
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Email
                </Button>
                <Button onClick={() => setShowPreviewModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Test Email Modal */}
      <Dialog open={showTestModal} onOpenChange={setShowTestModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Recipient Email</Label>
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              The email will be sent with the current variable values from the preview.
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleTestEmail} disabled={!testEmail}>
              Send Test Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailTemplatesSettings;