import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select } from './ui/select';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useToast } from '../hooks/use-toast';
import emailTemplateService, {
  EmailTemplate,
  EmailTemplateDetail,
  EmailTemplateCategory,
  RenderTemplateResponse
} from '../services/emailTemplateService';
import { Search, Send, Eye, RefreshCw } from 'lucide-react';

interface EmailTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string;
  customer?: {
    owner?: string;
    phone?: string;
    mobile?: string;
    email?: string;
    owner_address?: string;
    customer_name?: string;
  };
  site?: {
    site_name?: string;
    site_reference?: string;
    postcode?: string;
    address?: string;
    fit_id?: string;
  };
}

const EmailTemplateModal: React.FC<EmailTemplateModalProps> = ({ 
  isOpen, 
  onClose, 
  siteId, 
  customer, 
  site 
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState('select');
  
  // Data states
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [categories, setCategories] = useState<EmailTemplateCategory[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplateDetail | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  
  // Email composition states
  const [recipientEmail, setRecipientEmail] = useState(customer?.email || '');
  const [ccEmails, setCcEmails] = useState('');
  const [bccEmails, setBccEmails] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<RenderTemplateResponse | null>(null);
  
  // Filter templates
  const filteredTemplates = templates.filter(t => {
    const matchesSearch = !searchTerm || 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    
    return matchesSearch && matchesCategory && t.is_active;
  });
  
  // Load templates and categories on mount
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);
  
  // Initialize variables when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      initializeVariables();
    }
  }, [selectedTemplate]);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const [templatesData, categoriesData] = await Promise.all([
        emailTemplateService.getTemplates({ is_active: true }),
        emailTemplateService.getCategories()
      ]);
      
      setTemplates(templatesData);
      setCategories(categoriesData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load email templates'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const initializeVariables = () => {
    if (!selectedTemplate) return;
    
    const vars: Record<string, string> = {};
    
    // Initialize with site and customer data
    selectedTemplate.variables.forEach(varName => {
      switch (varName) {
        // Customer variables
        case 'CustomerName':
          vars[varName] = customer?.customer_name || customer?.owner || '';
          break;
        case 'CustomerEmail':
          vars[varName] = customer?.email || '';
          break;
        case 'CustomerPhone':
          vars[varName] = customer?.phone || customer?.mobile || '';
          break;
        case 'CustomerAddress':
          vars[varName] = customer?.owner_address || '';
          break;
          
        // Site variables
        case 'SiteName':
          vars[varName] = site?.site_name || '';
          break;
        case 'SiteAddress':
          vars[varName] = site?.address || '';
          break;
        case 'SiteReference':
          vars[varName] = site?.site_reference || '';
          break;
        case 'FitId':
          vars[varName] = site?.fit_id || '';
          break;
        case 'Postcode':
          vars[varName] = site?.postcode || '';
          break;
          
        // System variables
        case 'Date':
          vars[varName] = new Date().toLocaleDateString('en-GB');
          break;
        case 'Time':
          vars[varName] = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          break;
          
        // Default empty for unknown variables
        default:
          vars[varName] = '';
      }
    });
    
    setVariables(vars);
    updatePreview(vars);
  };
  
  const handleSelectTemplate = async (template: EmailTemplate) => {
    try {
      const fullTemplate = await emailTemplateService.getTemplate(template.id);
      setSelectedTemplate(fullTemplate);
      setActiveTab('compose');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load template details'
      });
    }
  };
  
  const updatePreview = async (updatedVars?: Record<string, string>) => {
    if (!selectedTemplate) return;
    
    try {
      const previewData = await emailTemplateService.renderTemplate({
        template_id: selectedTemplate.id,
        variables: updatedVars || variables
      });
      setPreview(previewData);
    } catch (error) {
      console.error('Failed to update preview:', error);
    }
  };
  
  const handleVariableChange = (varName: string, value: string) => {
    const newVars = { ...variables, [varName]: value };
    setVariables(newVars);
    updatePreview(newVars);
  };
  
  const handleSendEmail = async () => {
    if (!selectedTemplate || !recipientEmail) {
      toast({
        title: 'Error',
        description: 'Please select a template and enter recipient email'
      });
      return;
    }
    
    setSending(true);
    try {
      const ccList = ccEmails.split(',').map(e => e.trim()).filter(Boolean);
      const bccList = bccEmails.split(',').map(e => e.trim()).filter(Boolean);
      
      await emailTemplateService.sendEmail({
        template_id: selectedTemplate.id,
        recipient_email: recipientEmail,
        cc_emails: ccList.length > 0 ? ccList : undefined,
        bcc_emails: bccList.length > 0 ? bccList : undefined,
        variables: variables,
        save_log: true
      });
      
      toast({
        title: 'Success',
        description: 'Email sent successfully'
      });
      
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to send email'
      });
    } finally {
      setSending(false);
    }
  };
  
  const handleClose = () => {
    // Reset state
    setSelectedTemplate(null);
    setActiveTab('select');
    setRecipientEmail(customer?.email || '');
    setCcEmails('');
    setBccEmails('');
    setVariables({});
    setPreview(null);
    setSearchTerm('');
    setSelectedCategory('all');
    
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Send Email from Template</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="select">Select Template</TabsTrigger>
            <TabsTrigger value="compose" disabled={!selectedTemplate}>
              Compose Email {selectedTemplate && `(${selectedTemplate.name})`}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="select" className="mt-4 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search templates..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <select
                    className="border rounded px-3 py-2"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(
                      e.target.value === 'all' ? 'all' : Number(e.target.value)
                    )}
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid gap-3 max-h-[400px] overflow-y-auto">
                  {filteredTemplates.map(template => (
                    <Card 
                      key={template.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{template.name}</h4>
                          <Badge variant="secondary">
                            {categories.find(c => c.id === template.category)?.name}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{template.subject}</p>
                        <div className="flex justify-between items-center">
                          <div className="flex gap-2">
                            {template.variables.slice(0, 3).map(v => (
                              <Badge key={v} variant="outline" className="text-xs">
                                @@{v}@@
                              </Badge>
                            ))}
                            {template.variables.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.variables.length - 3} more
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Used {template.usage_count} times
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {filteredTemplates.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No templates found
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="compose" className="mt-4 space-y-4">
            {selectedTemplate && preview && (
              <div className="grid grid-cols-2 gap-4 h-[500px]">
                {/* Left side - Form */}
                <div className="space-y-4 overflow-y-auto pr-2">
                  <div>
                    <Label>To</Label>
                    <Input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="recipient@example.com"
                    />
                  </div>
                  
                  <div>
                    <Label>CC (comma separated)</Label>
                    <Input
                      value={ccEmails}
                      onChange={(e) => setCcEmails(e.target.value)}
                      placeholder="cc1@example.com, cc2@example.com"
                    />
                  </div>
                  
                  <div>
                    <Label>BCC (comma separated)</Label>
                    <Input
                      value={bccEmails}
                      onChange={(e) => setBccEmails(e.target.value)}
                      placeholder="bcc1@example.com, bcc2@example.com"
                    />
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">Template Variables</h4>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updatePreview()}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Refresh
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {selectedTemplate.variables.map(varName => (
                        <div key={varName}>
                          <Label className="text-sm">{varName}</Label>
                          <Input
                            value={variables[varName] || ''}
                            onChange={(e) => handleVariableChange(varName, e.target.value)}
                            placeholder={`Enter ${varName}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Right side - Preview */}
                <div className="border rounded-lg p-4 bg-muted/50 overflow-y-auto">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Email Preview
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Subject:</p>
                      <p className="font-medium">{preview.rendered.subject}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Content:</p>
                      <div className="whitespace-pre-wrap bg-white dark:bg-gray-900 p-4 rounded border text-sm">
                        {preview.rendered.full_content}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSendEmail} 
                disabled={sending || !recipientEmail}
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EmailTemplateModal;