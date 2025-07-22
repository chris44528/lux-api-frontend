import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useToast } from '../hooks/use-toast';
import emailTemplateService, {
  EmailTemplate,
  EmailTemplateDetail,
  EmailTemplateCategory,
  RenderTemplateResponse
} from '../services/emailTemplateService';
import { api } from '../services/api';
import { Send, AlertCircle, Plus, Info } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { EmailAccountSelector } from './EmailAccountSelector';

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

interface VariableInfo {
  name: string;
  value: string;
  description: string;
  hasValue: boolean;
}

const EmailTemplateModal: React.FC<EmailTemplateModalProps> = ({ 
  isOpen, 
  onClose, 
  siteId, 
  customer, 
  site 
}) => {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Data states
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | ''>('');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplateDetail | null>(null);
  
  // Email composition states
  const [recipientEmail, setRecipientEmail] = useState(customer?.email || '');
  const [ccEmails, setCcEmails] = useState('');
  const [subject, setSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [availableVariables, setAvailableVariables] = useState<VariableInfo[]>([]);
  const [selectedEmailAccountId, setSelectedEmailAccountId] = useState<number | null>(null);
  
  // System variables that are always available
  const systemVariables: Record<string, { value: string; description: string }> = {
    'Date': { 
      value: new Date().toLocaleDateString('en-GB'), 
      description: 'Current date' 
    },
    'Time': { 
      value: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), 
      description: 'Current time' 
    },
    'CompanyName': { 
      value: 'A Shade Greener', 
      description: 'Company name' 
    },
    'CompanyPhone': { 
      value: '0800 123 4567', 
      description: 'Company phone number' 
    },
    'CompanyAddress': { 
      value: 'Sterling House, Maple Court, Maple Road, Tankersley S75 3DP', 
      description: 'Company address' 
    }
  };
  
  // Load templates on mount
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      initializeVariables();
    }
  }, [isOpen]);
  
  // Handle template selection
  useEffect(() => {
    if (selectedTemplateId && typeof selectedTemplateId === 'number') {
      loadTemplateDetails(selectedTemplateId);
    }
  }, [selectedTemplateId]);
  
  const loadTemplates = async () => {
    try {
      const templatesData = await emailTemplateService.getTemplates({ is_active: true });
      console.log('Loaded templates:', templatesData);
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load email templates'
      });
      setTemplates([]);
    }
  };
  
  const loadTemplateDetails = async (templateId: number) => {
    try {
      const template = await emailTemplateService.getTemplate(templateId);
      setSelectedTemplate(template);
      
      // Populate subject and body with template content
      const renderedSubject = renderTemplateContent(template.subject);
      const renderedBody = renderTemplateContent(template.body + '\n\n' + template.footer);
      
      setSubject(renderedSubject);
      setEmailBody(renderedBody);
      
      // Update available variables based on template
      updateAvailableVariables(template.variables);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load template details'
      });
    }
  };
  
  const initializeVariables = () => {
    // Initialize with all possible variables
    const allVariables: VariableInfo[] = [
      // Customer variables
      {
        name: 'CustomerName',
        value: customer?.customer_name || customer?.owner || '',
        description: 'Customer full name',
        hasValue: !!(customer?.customer_name || customer?.owner)
      },
      {
        name: 'CustomerEmail',
        value: customer?.email || '',
        description: 'Customer email address',
        hasValue: !!customer?.email
      },
      {
        name: 'CustomerPhone',
        value: customer?.phone || customer?.mobile || '',
        description: 'Customer phone number',
        hasValue: !!(customer?.phone || customer?.mobile)
      },
      {
        name: 'CustomerAddress',
        value: customer?.owner_address || '',
        description: 'Customer address',
        hasValue: !!customer?.owner_address
      },
      
      // Site variables
      {
        name: 'SiteName',
        value: site?.site_name || '',
        description: 'Site name',
        hasValue: !!site?.site_name
      },
      {
        name: 'SiteAddress',
        value: site?.address || '',
        description: 'Site address',
        hasValue: !!site?.address
      },
      {
        name: 'SiteReference',
        value: site?.site_name || '',  // Using site_name as per user request
        description: 'Site name',
        hasValue: !!site?.site_name
      },
      {
        name: 'FitId',
        value: site?.fit_id || '',
        description: 'FIT ID',
        hasValue: !!site?.fit_id
      },
      {
        name: 'Postcode',
        value: site?.postcode || '',
        description: 'Site postcode',
        hasValue: !!site?.postcode
      },
      
      // System variables
      ...Object.entries(systemVariables).map(([name, info]) => ({
        name,
        value: info.value,
        description: info.description,
        hasValue: true
      }))
    ];
    
    setAvailableVariables(allVariables);
  };
  
  const updateAvailableVariables = (templateVariables: string[]) => {
    // Update which variables are used in the template
    setAvailableVariables(prev => prev.map(v => ({
      ...v,
      isUsed: templateVariables.includes(v.name)
    })));
  };
  
  const renderTemplateContent = (content: string): string => {
    let rendered = content;
    
    availableVariables.forEach(variable => {
      const regex = new RegExp(`@@${variable.name}@@`, 'g');
      if (variable.hasValue && variable.value) {
        rendered = rendered.replace(regex, variable.value);
      }
    });
    
    return rendered;
  };
  
  const insertVariable = (varName: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const variableText = `@@${varName}@@`;
    
    const newText = text.substring(0, start) + variableText + text.substring(end);
    setEmailBody(newText);
    
    // Set cursor position after the inserted variable
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variableText.length, start + variableText.length);
    }, 0);
  };
  
  const getMissingVariables = (): string[] => {
    const missingVars: string[] = [];
    const contentToCheck = subject + ' ' + emailBody;
    
    availableVariables.forEach(variable => {
      const regex = new RegExp(`@@${variable.name}@@`, 'g');
      if (contentToCheck.match(regex) && !variable.hasValue) {
        missingVars.push(variable.name);
      }
    });
    
    return missingVars;
  };
  
  const highlightMissingVariables = (text: string): React.ReactNode => {
    let highlightedText = text;
    const missingVars = getMissingVariables();
    
    // First escape HTML to prevent XSS
    highlightedText = highlightedText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    
    // Replace line breaks with <br>
    highlightedText = highlightedText.replace(/\n/g, '<br>');
    
    // Highlight missing variables
    missingVars.forEach(varName => {
      const regex = new RegExp(`(@@${varName}@@)`, 'g');
      highlightedText = highlightedText.replace(regex, '<span class="text-red-600 font-semibold">$1</span>');
    });
    
    return <div dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };
  
  const handleSendEmail = async () => {
    const missingVars = getMissingVariables();
    
    if (missingVars.length > 0) {
      toast({
        title: 'Missing Variables',
        description: `Please provide values for: ${missingVars.join(', ')}`
      });
      return;
    }
    
    if (!recipientEmail) {
      toast({
        title: 'Error',
        description: 'Please enter recipient email address'
      });
      return;
    }
    
    setSending(true);
    try {
      // Prepare the request payload
      const payload: any = {
        recipient_email: recipientEmail,
        cc_emails: ccEmails.split(',').map(e => e.trim()).filter(Boolean),
        subject: subject,
        body: emailBody,
        site_id: parseInt(siteId)
      };

      // Add email_account_id if one is selected
      if (selectedEmailAccountId) {
        payload.email_account_id = selectedEmailAccountId;
      }

      // Send the email
      await api.post('/email-templates/templates/send_custom/', payload);
      
      toast({
        title: 'Success',
        description: 'Email sent successfully'
      });
      
      onClose();
    } catch (error: any) {
      // Handle specific error cases
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to send email';
      
      if (errorMessage.includes('permission')) {
        toast({
          title: 'Permission Denied',
          description: 'You do not have permission to send from this email account',
          variant: 'destructive'
        });
      } else if (errorMessage.includes('limit')) {
        toast({
          title: 'Rate Limit Exceeded',
          description: errorMessage,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        });
      }
    } finally {
      setSending(false);
    }
  };
  
  const handleClose = () => {
    // Reset state
    setSelectedTemplateId('');
    setSelectedTemplate(null);
    setRecipientEmail(customer?.email || '');
    setCcEmails('');
    setSubject('');
    setEmailBody('');
    setSelectedEmailAccountId(null);
    
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <DialogTitle>Compose Email</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-3 gap-6 p-6 flex-1 overflow-hidden">
          {/* Left side - Email composition */}
          <div className="col-span-2 space-y-4 overflow-y-auto pr-4 h-full">
            {/* Template selector */}
            <div>
              <Label>Email Template</Label>
              <select
                className="w-full border rounded px-3 py-2 mt-1"
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">-- Select a template (optional) --</option>
                {Array.isArray(templates) && templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.category_name})
                  </option>
                ))}
              </select>
            </div>

            {/* Email Account Selector */}
            <EmailAccountSelector
              selectedAccountId={selectedEmailAccountId}
              onAccountSelect={setSelectedEmailAccountId}
              disabled={sending}
            />
            
            {/* Recipients */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>To *</Label>
                <Input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  required
                />
              </div>
              <div>
                <Label>CC</Label>
                <Input
                  value={ccEmails}
                  onChange={(e) => setCcEmails(e.target.value)}
                  placeholder="cc1@example.com, cc2@example.com"
                />
              </div>
            </div>
            
            {/* Subject */}
            <div>
              <Label>Subject *</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject"
                className="mt-1"
              />
            </div>
            
            {/* Email body */}
            <div>
              <Label>Email Content</Label>
              <Textarea
                ref={textareaRef}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={15}
                className="mt-1 font-mono text-sm"
                placeholder="Type your email content here..."
              />
              
              {/* Missing variables warning */}
              {getMissingVariables().length > 0 && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Missing variable values:</p>
                    <p className="text-sm text-red-600">
                      {getMissingVariables().join(', ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Preview section */}
            {(subject || emailBody) && (
              <Card className="bg-gray-50 dark:bg-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Subject:</p>
                    <p className="text-sm">{highlightMissingVariables(subject)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Body:</p>
                    <div className="text-sm">{highlightMissingVariables(emailBody)}</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Right side - Variables panel */}
          <div className="col-span-1 border-l pl-6 h-full overflow-hidden">
            <Card className="h-full flex flex-col overflow-hidden">
              <CardHeader className="pb-3 flex-shrink-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Available Variables
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Click to insert at cursor position
                </p>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full">
                  <div className="space-y-4 px-6 pb-4">
                    {/* Customer Variables */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-gray-700">Customer</h4>
                      <div className="space-y-1">
                        {availableVariables.filter(v => v.name.startsWith('Customer')).map(variable => (
                          <div
                            key={variable.name}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer group"
                            onClick={() => insertVariable(variable.name)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <code className={`text-xs ${!variable.hasValue ? 'text-red-600' : 'text-blue-600'}`}>
                                  @@{variable.name}@@
                                </code>
                                <p className="text-xs text-gray-500 mt-1">{variable.description}</p>
                                {variable.value && (
                                  <p className="text-xs text-gray-400 mt-1 truncate">
                                    Current: {variable.value}
                                  </p>
                                )}
                              </div>
                              <Plus className="h-4 w-4 text-gray-400 group-hover:text-gray-600 ml-2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Site Variables */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-gray-700">Site</h4>
                      <div className="space-y-1">
                        {availableVariables.filter(v => v.name.startsWith('Site') || v.name === 'FitId' || v.name === 'Postcode').map(variable => (
                          <div
                            key={variable.name}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer group"
                            onClick={() => insertVariable(variable.name)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <code className={`text-xs ${!variable.hasValue ? 'text-red-600' : 'text-blue-600'}`}>
                                  @@{variable.name}@@
                                </code>
                                <p className="text-xs text-gray-500 mt-1">{variable.description}</p>
                                {variable.value && (
                                  <p className="text-xs text-gray-400 mt-1 truncate">
                                    Current: {variable.value}
                                  </p>
                                )}
                              </div>
                              <Plus className="h-4 w-4 text-gray-400 group-hover:text-gray-600 ml-2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* System Variables */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-gray-700">System</h4>
                      <div className="space-y-1">
                        {availableVariables.filter(v => systemVariables[v.name]).map(variable => (
                          <div
                            key={variable.name}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer group"
                            onClick={() => insertVariable(variable.name)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <code className="text-xs text-blue-600">
                                  @@{variable.name}@@
                                </code>
                                <p className="text-xs text-gray-500 mt-1">{variable.description}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  Current: {variable.value}
                                </p>
                              </div>
                              <Plus className="h-4 w-4 text-gray-400 group-hover:text-gray-600 ml-2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Footer with action buttons */}
        <div className="flex justify-end gap-3 p-6 border-t flex-shrink-0">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendEmail} 
            disabled={sending || !recipientEmail || !subject || !emailBody}
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
      </DialogContent>
    </Dialog>
  );
};

export default EmailTemplateModal;