import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select } from '../ui/select';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Alert, AlertDescription } from '../ui/alert';
import { useToast } from '../../hooks/use-toast';
import { api } from '../../services/api';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  TestTube, 
  Mail, 
  Shield,
  BarChart,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Clock,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import Office365SetupGuide from './Office365SetupGuide';

interface EmailAccount {
  id: number;
  name: string;
  email_address: string;
  account_type: 'smtp' | 'office365' | 'office365_graph' | 'gmail' | 'sendgrid' | 'aws_ses';
  provider?: string; // Backend uses 'provider' field
  is_active: boolean;
  is_default: boolean;
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  use_tls?: boolean;
  use_ssl?: boolean;
  graph_tenant_id?: string;
  graph_client_id?: string;
  daily_limit?: number;
  hourly_limit?: number;
  emails_sent_today?: number;
  emails_sent_this_hour?: number;
  allowed_users?: number[];
  allowed_groups?: number[];
  created_at: string;
  updated_at: string;
  last_used_at?: string;
}

interface UsageStats {
  total_sent: number;
  sent_today: number;
  sent_this_hour: number;
  success_rate: number;
  last_7_days: { date: string; count: number }[];
}

const EmailAccountManagement: React.FC = () => {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<EmailAccount | null>(null);
  const [showPasswordFields, setShowPasswordFields] = useState<{ [key: string]: boolean }>({});
  const [testingAccount, setTestingAccount] = useState<number | null>(null);
  const [showStatsModal, setShowStatsModal] = useState<EmailAccount | null>(null);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [showOffice365Guide, setShowOffice365Guide] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email_address: '',
    account_type: 'smtp' as EmailAccount['account_type'],
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    use_tls: true,
    use_ssl: false,
    api_key: '',
    graph_tenant_id: '',
    graph_client_id: '',
    graph_client_secret: '',
    daily_limit: 1000,
    hourly_limit: 100,
    is_active: true,
    is_default: false
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/email-accounts/');
      // Ensure we always have an array
      const accountsData = Array.isArray(response.data) ? response.data : 
                          (response.data?.results ? response.data.results : []);
      setAccounts(accountsData);
    } catch (error) {
      console.error('Error fetching email accounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load email accounts',
        variant: 'destructive'
      });
      setAccounts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      name: '',
      email_address: '',
      account_type: 'smtp',
      smtp_host: '',
      smtp_port: 587,
      smtp_username: '',
      smtp_password: '',
      use_tls: true,
      use_ssl: false,
      api_key: '',
      graph_tenant_id: '',
      graph_client_id: '',
      graph_client_secret: '',
      daily_limit: 1000,
      hourly_limit: 100,
      is_active: true,
      is_default: false
    });
    setShowCreateModal(true);
    setEditingAccount(null);
  };

  const handleEdit = (account: EmailAccount) => {
    // Map provider to account_type if needed
    const accountType = account.provider === 'office365_graph' ? 'office365_graph' : account.account_type;
    
    setFormData({
      name: account.name,
      email_address: account.email_address,
      account_type: accountType,
      smtp_host: account.smtp_host || '',
      smtp_port: account.smtp_port || 587,
      smtp_username: account.smtp_username || '',
      smtp_password: '', // Don't pre-fill password
      use_tls: account.use_tls || false,
      use_ssl: account.use_ssl || false,
      api_key: '', // Don't pre-fill API key
      graph_tenant_id: account.graph_tenant_id || '',
      graph_client_id: account.graph_client_id || '',
      graph_client_secret: '', // Don't pre-fill secret
      daily_limit: account.daily_limit || 1000,
      hourly_limit: account.hourly_limit || 100,
      is_active: account.is_active,
      is_default: account.is_default
    });
    setEditingAccount(account);
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    try {
      const payload: any = {
        name: formData.name,
        email_address: formData.email_address,
        provider: formData.account_type, // Backend uses 'provider' field
        daily_limit: formData.daily_limit,
        hourly_limit: formData.hourly_limit,
        is_active: formData.is_active,
        is_default: formData.is_default
      };

      // Add type-specific fields
      if (formData.account_type === 'smtp') {
        payload.smtp_host = formData.smtp_host;
        payload.smtp_port = formData.smtp_port;
        payload.smtp_username = formData.smtp_username;
        payload.use_tls = formData.use_tls;
        payload.use_ssl = formData.use_ssl;
        if (formData.smtp_password) {
          payload.smtp_password = formData.smtp_password;
        }
      } else if (['sendgrid', 'aws_ses'].includes(formData.account_type)) {
        if (formData.api_key) {
          payload.api_key = formData.api_key;
        }
      } else if (formData.account_type === 'office365') {
        payload.smtp_host = 'smtp.office365.com';
        payload.smtp_port = 587;
        payload.smtp_username = formData.email_address;
        payload.use_tls = true;
        if (formData.smtp_password) {
          payload.smtp_password = formData.smtp_password;
        }
      } else if (formData.account_type === 'office365_graph') {
        payload.graph_tenant_id = formData.graph_tenant_id;
        payload.graph_client_id = formData.graph_client_id;
        if (formData.graph_client_secret) {
          payload.password = formData.graph_client_secret; // Backend stores this in password field
        }
      } else if (formData.account_type === 'gmail') {
        payload.smtp_host = 'smtp.gmail.com';
        payload.smtp_port = 587;
        payload.smtp_username = formData.email_address;
        payload.use_tls = true;
        if (formData.smtp_password) {
          payload.smtp_password = formData.smtp_password;
        }
      }

      if (editingAccount) {
        await api.patch(`/email-accounts/${editingAccount.id}/`, payload);
        toast({
          title: 'Success',
          description: 'Email account updated successfully'
        });
      } else {
        await api.post('/email-accounts/', payload);
        toast({
          title: 'Success',
          description: 'Email account created successfully'
        });
      }

      setShowCreateModal(false);
      fetchAccounts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to save email account',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this email account?')) return;

    try {
      await api.delete(`/email-accounts/${id}/`);
      toast({
        title: 'Success',
        description: 'Email account deleted successfully'
      });
      fetchAccounts();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete email account',
        variant: 'destructive'
      });
    }
  };

  const handleTestConnection = async (id: number) => {
    setTestingAccount(id);
    try {
      const response = await api.post(`/email-accounts/${id}/test_connection/`);
      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Connection test successful!'
        });
      } else {
        toast({
          title: 'Connection Failed',
          description: response.data.error || 'Connection test failed',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to test connection',
        variant: 'destructive'
      });
    } finally {
      setTestingAccount(null);
    }
  };

  const fetchStats = async (account: EmailAccount) => {
    try {
      const response = await api.get(`/email-accounts/${account.id}/usage_stats/`);
      setStats(response.data);
      setShowStatsModal(account);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load usage statistics',
        variant: 'destructive'
      });
    }
  };

  const getAccountTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      smtp: 'SMTP',
      office365: 'Office 365',
      office365_graph: 'Office 365 (Graph API)',
      gmail: 'Gmail',
      sendgrid: 'SendGrid',
      aws_ses: 'AWS SES'
    };
    return labels[type] || type;
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (!limit) return 0;
    return Math.round((used / limit) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Email Accounts</h2>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Email Account
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {accounts && accounts.length > 0 && accounts.map((account) => (
            <Card key={account.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">{account.name}</h3>
                      {account.is_default && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                      <Badge variant={account.is_active ? 'default' : 'secondary'}>
                        {account.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">
                        {getAccountTypeLabel(account.provider || account.account_type)}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">
                      {account.email_address}
                    </p>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Daily Usage</p>
                        <div className="flex items-center gap-2">
                          <span>{account.emails_sent_today || 0} / {account.daily_limit || '∞'}</span>
                          {account.daily_limit && (
                            <div className="flex-1 max-w-[100px]">
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all ${
                                    getUsagePercentage(account.emails_sent_today || 0, account.daily_limit) > 90 
                                      ? 'bg-red-500' 
                                      : getUsagePercentage(account.emails_sent_today || 0, account.daily_limit) > 75 
                                      ? 'bg-yellow-500' 
                                      : 'bg-green-500'
                                  }`}
                                  style={{ width: `${getUsagePercentage(account.emails_sent_today || 0, account.daily_limit)}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-muted-foreground">Hourly Usage</p>
                        <div className="flex items-center gap-2">
                          <span>{account.emails_sent_this_hour || 0} / {account.hourly_limit || '∞'}</span>
                          {account.hourly_limit && (
                            <div className="flex-1 max-w-[100px]">
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all ${
                                    getUsagePercentage(account.emails_sent_this_hour || 0, account.hourly_limit) > 90 
                                      ? 'bg-red-500' 
                                      : getUsagePercentage(account.emails_sent_this_hour || 0, account.hourly_limit) > 75 
                                      ? 'bg-yellow-500' 
                                      : 'bg-green-500'
                                  }`}
                                  style={{ width: `${getUsagePercentage(account.emails_sent_this_hour || 0, account.hourly_limit)}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {account.last_used_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Last used: {new Date(account.last_used_at).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection(account.id)}
                      disabled={testingAccount === account.id}
                    >
                      {testingAccount === account.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                      ) : (
                        <TestTube className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchStats(account)}
                    >
                      <BarChart className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(account)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(account.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {accounts.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No email accounts configured</p>
                <Button onClick={handleCreate} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Email Account
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? 'Edit Email Account' : 'Create Email Account'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Account Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Customer Support"
                />
              </div>
              <div>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={formData.email_address}
                  onChange={(e) => setFormData({ ...formData, email_address: e.target.value })}
                  placeholder="support@company.com"
                />
              </div>
            </div>

            <div>
              <Label>Account Type</Label>
              <select
                className="w-full border rounded px-3 py-2 mt-1"
                value={formData.account_type}
                onChange={(e) => setFormData({ ...formData, account_type: e.target.value as any })}
              >
                <option value="smtp">SMTP</option>
                <option value="office365">Office 365 (SMTP)</option>
                <option value="office365_graph">Office 365 (Graph API)</option>
                <option value="gmail">Gmail</option>
                <option value="sendgrid">SendGrid</option>
                <option value="aws_ses">AWS SES</option>
              </select>
              {formData.account_type === 'office365_graph' && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowOffice365Guide(true)}
                >
                  <HelpCircle className="h-4 w-4 mr-1" />
                  Setup Guide
                </Button>
              )}
            </div>

            {/* SMTP Settings */}
            {formData.account_type === 'smtp' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>SMTP Host</Label>
                    <Input
                      value={formData.smtp_host}
                      onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
                      placeholder="smtp.example.com"
                    />
                  </div>
                  <div>
                    <Label>SMTP Port</Label>
                    <Input
                      type="number"
                      value={formData.smtp_port}
                      onChange={(e) => setFormData({ ...formData, smtp_port: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Username</Label>
                  <Input
                    value={formData.smtp_username}
                    onChange={(e) => setFormData({ ...formData, smtp_username: e.target.value })}
                  />
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <Switch
                      checked={formData.use_tls}
                      onCheckedChange={(checked) => setFormData({ ...formData, use_tls: checked })}
                    />
                    Use TLS
                  </label>
                  <label className="flex items-center gap-2">
                    <Switch
                      checked={formData.use_ssl}
                      onCheckedChange={(checked) => setFormData({ ...formData, use_ssl: checked })}
                    />
                    Use SSL
                  </label>
                </div>
              </>
            )}

            {/* Graph API Settings */}
            {formData.account_type === 'office365_graph' && (
              <>
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Graph API requires an Azure App Registration. Click the Setup Guide above for detailed instructions.
                  </AlertDescription>
                </Alert>

                <div>
                  <Label>Tenant ID</Label>
                  <Input
                    value={formData.graph_tenant_id}
                    onChange={(e) => setFormData({ ...formData, graph_tenant_id: e.target.value })}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Your Azure AD Directory (tenant) ID</p>
                </div>

                <div>
                  <Label>Client ID</Label>
                  <Input
                    value={formData.graph_client_id}
                    onChange={(e) => setFormData({ ...formData, graph_client_id: e.target.value })}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Application (client) ID from your app registration</p>
                </div>

                <div>
                  <Label>Client Secret {editingAccount && '(leave blank to keep current)'}</Label>
                  <div className="relative">
                    <Input
                      type={showPasswordFields.graphSecret ? 'text' : 'password'}
                      value={formData.graph_client_secret}
                      onChange={(e) => setFormData({ ...formData, graph_client_secret: e.target.value })}
                      placeholder={editingAccount ? '••••••••' : 'Enter client secret'}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-2"
                      onClick={() => setShowPasswordFields({ ...showPasswordFields, graphSecret: !showPasswordFields.graphSecret })}
                    >
                      {showPasswordFields.graphSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Secret value from your app registration</p>
                </div>
              </>
            )}

            {/* Password field for SMTP, Office365, Gmail */}
            {['smtp', 'office365', 'gmail'].includes(formData.account_type) && (
              <div>
                <Label>Password {editingAccount && '(leave blank to keep current)'}</Label>
                <div className="relative">
                  <Input
                    type={showPasswordFields.password ? 'text' : 'password'}
                    value={formData.smtp_password}
                    onChange={(e) => setFormData({ ...formData, smtp_password: e.target.value })}
                    placeholder={editingAccount ? '••••••••' : 'Enter password'}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-2"
                    onClick={() => setShowPasswordFields({ ...showPasswordFields, password: !showPasswordFields.password })}
                  >
                    {showPasswordFields.password ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* API Key for SendGrid, AWS SES */}
            {['sendgrid', 'aws_ses'].includes(formData.account_type) && (
              <div>
                <Label>API Key {editingAccount && '(leave blank to keep current)'}</Label>
                <div className="relative">
                  <Input
                    type={showPasswordFields.apiKey ? 'text' : 'password'}
                    value={formData.api_key}
                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                    placeholder={editingAccount ? '••••••••' : 'Enter API key'}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-2"
                    onClick={() => setShowPasswordFields({ ...showPasswordFields, apiKey: !showPasswordFields.apiKey })}
                  >
                    {showPasswordFields.apiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Daily Limit</Label>
                <Input
                  type="number"
                  value={formData.daily_limit}
                  onChange={(e) => setFormData({ ...formData, daily_limit: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Hourly Limit</Label>
                <Input
                  type="number"
                  value={formData.hourly_limit}
                  onChange={(e) => setFormData({ ...formData, hourly_limit: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                Active
              </label>
              <label className="flex items-center gap-2">
                <Switch
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                />
                Default Account
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingAccount ? 'Update' : 'Create'} Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Modal */}
      {showStatsModal && stats && (
        <Dialog open={!!showStatsModal} onOpenChange={() => setShowStatsModal(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Usage Statistics - {showStatsModal.name}</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Sent</p>
                  <p className="text-2xl font-bold">{stats.total_sent}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Sent Today</p>
                  <p className="text-2xl font-bold">{stats.sent_today}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">{stats.success_rate}%</p>
                </CardContent>
              </Card>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Last 7 Days</h4>
              <div className="h-48 flex items-end gap-1">
                {stats.last_7_days.map((day, index) => {
                  const maxCount = Math.max(...stats.last_7_days.map(d => d.count));
                  const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-primary rounded-t transition-all"
                        style={{ height: `${height}%` }}
                      />
                      <p className="text-xs mt-1">{day.date}</p>
                      <p className="text-xs text-muted-foreground">{day.count}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Office 365 Setup Guide Modal */}
      <Dialog open={showOffice365Guide} onOpenChange={setShowOffice365Guide}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Office 365 Graph API Setup Guide</DialogTitle>
          </DialogHeader>
          <Office365SetupGuide />
          <DialogFooter>
            <Button onClick={() => setShowOffice365Guide(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailAccountManagement;