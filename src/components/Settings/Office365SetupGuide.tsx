import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  ExternalLink, 
  Copy, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

const Office365SetupGuide: React.FC = () => {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This guide will help you set up an Azure App Registration to send emails via Microsoft Graph API. 
          This method is more secure and reliable than using SMTP with username/password.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Step 1: Create an App Registration in Azure</CardTitle>
          <CardDescription>
            First, you'll need to create an app registration in your Azure Active Directory
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-3 list-decimal list-inside">
            <li className="space-y-2">
              <span>Sign in to the Azure Portal</span>
              <div className="ml-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://portal.azure.com', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Azure Portal
                </Button>
              </div>
            </li>
            <li>Navigate to <strong>Azure Active Directory</strong> → <strong>App registrations</strong></li>
            <li>Click <strong>New registration</strong></li>
            <li className="space-y-2">
              <span>Configure the application:</span>
              <ul className="ml-6 mt-2 space-y-1 list-disc">
                <li><strong>Name:</strong> LUX Email Service (or your preferred name)</li>
                <li><strong>Supported account types:</strong> Accounts in this organizational directory only</li>
                <li><strong>Redirect URI:</strong> Leave blank (not needed for this application)</li>
              </ul>
            </li>
            <li>Click <strong>Register</strong></li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 2: Note Your Application Details</CardTitle>
          <CardDescription>
            After registration, you'll need these values for configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Application (client) ID</p>
                  <p className="text-sm text-muted-foreground">Found on the Overview page</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard('[YOUR-CLIENT-ID]', 'Client ID placeholder')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Directory (tenant) ID</p>
                  <p className="text-sm text-muted-foreground">Also found on the Overview page</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard('[YOUR-TENANT-ID]', 'Tenant ID placeholder')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 3: Create a Client Secret</CardTitle>
          <CardDescription>
            The application needs a secret to authenticate
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-3 list-decimal list-inside">
            <li>In your app registration, go to <strong>Certificates & secrets</strong></li>
            <li>Click <strong>New client secret</strong></li>
            <li>Add a description (e.g., "LUX Email Service Secret")</li>
            <li>Choose an expiration period (recommended: 24 months)</li>
            <li>Click <strong>Add</strong></li>
            <li className="font-semibold text-red-600">
              IMPORTANT: Copy the secret value immediately - it won't be shown again!
            </li>
          </ol>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Store this secret securely. You'll need to renew it before expiration.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 4: Grant API Permissions</CardTitle>
          <CardDescription>
            The app needs permission to send emails on behalf of your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-3 list-decimal list-inside">
            <li>In your app registration, go to <strong>API permissions</strong></li>
            <li>Click <strong>Add a permission</strong></li>
            <li>Select <strong>Microsoft Graph</strong></li>
            <li>Select <strong>Application permissions</strong> (not Delegated)</li>
            <li className="space-y-2">
              <span>Search for and add these permissions:</span>
              <div className="ml-6 mt-2 space-y-2">
                <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <code className="text-sm">Mail.Send</code>
                  <span className="text-sm text-muted-foreground">- Allows sending emails</span>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <code className="text-sm">User.Read.All</code>
                  <span className="text-sm text-muted-foreground">- Optional: Allows reading user profiles</span>
                </div>
              </div>
            </li>
            <li>Click <strong>Add permissions</strong></li>
            <li className="font-semibold">
              Click <strong>Grant admin consent for [Your Organization]</strong>
              <p className="text-sm text-muted-foreground font-normal mt-1">
                This requires admin privileges. The Status column should show a green checkmark.
              </p>
            </li>
          </ol>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Without admin consent, the application won't be able to send emails.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 5: Configure in LUX</CardTitle>
          <CardDescription>
            Now you can use these credentials in your email account configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <p>When creating your email account in LUX:</p>
            <ol className="space-y-2 list-decimal list-inside ml-4">
              <li>Select <strong>Office 365 (Graph API)</strong> as the account type</li>
              <li>Enter your <strong>Tenant ID</strong></li>
              <li>Enter your <strong>Client ID</strong></li>
              <li>Enter your <strong>Client Secret</strong></li>
              <li>The email address should be the one you want to send from</li>
            </ol>
          </div>

          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Once configured, test the connection to ensure everything is working correctly.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <p className="font-medium">Common Issues:</p>
              <ul className="mt-2 space-y-2 list-disc list-inside text-sm">
                <li><strong>Authentication failed:</strong> Check that your tenant ID, client ID, and secret are correct</li>
                <li><strong>Insufficient privileges:</strong> Ensure admin consent was granted for the permissions</li>
                <li><strong>Email not sending:</strong> Verify the sender email address exists in your organization</li>
                <li><strong>Rate limiting:</strong> Microsoft Graph has rate limits - check your usage</li>
              </ul>
            </div>

            <div>
              <p className="font-medium">Useful Links:</p>
              <div className="mt-2 space-y-1">
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 justify-start"
                  onClick={() => window.open('https://docs.microsoft.com/en-us/graph/api/user-sendmail', '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Microsoft Graph Mail API Documentation
                </Button>
                <br />
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 justify-start"
                  onClick={() => window.open('https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade', '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Azure App Registrations
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Office365SetupGuide;