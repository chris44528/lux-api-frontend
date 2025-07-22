import React, { useState, useEffect } from 'react';
import { Label } from './ui/label';
import { api } from '../services/api';
import { AlertCircle, Mail } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

export interface EmailAccount {
  id: number;
  name: string;
  email_address: string;
  is_active: boolean;
  is_default: boolean;
  can_current_user_send: boolean;
  daily_limit?: number;
  hourly_limit?: number;
  emails_sent_today?: number;
  emails_sent_this_hour?: number;
}

interface EmailAccountSelectorProps {
  selectedAccountId: number | null;
  onAccountSelect: (accountId: number | null) => void;
  className?: string;
  disabled?: boolean;
}

export const EmailAccountSelector: React.FC<EmailAccountSelectorProps> = ({
  selectedAccountId,
  onAccountSelect,
  className = '',
  disabled = false
}) => {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchEmailAccounts();
  }, []);

  const fetchEmailAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/email-templates/templates/available_email_accounts/');
      setAccounts(response.data || []);
    } catch (error) {
      console.error('Failed to fetch email accounts:', error);
      setError('Failed to load email accounts');
      toast({
        title: 'Error',
        description: 'Failed to load email accounts. Using default account.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getAccountWarning = (account: EmailAccount): string | null => {
    if (!account.is_active) return 'Inactive';
    
    if (account.daily_limit && account.emails_sent_today) {
      const dailyPercentage = (account.emails_sent_today / account.daily_limit) * 100;
      if (dailyPercentage >= 90) {
        return `${Math.round(dailyPercentage)}% of daily limit used`;
      }
    }
    
    if (account.hourly_limit && account.emails_sent_this_hour) {
      const hourlyPercentage = (account.emails_sent_this_hour / account.hourly_limit) * 100;
      if (hourlyPercentage >= 90) {
        return `${Math.round(hourlyPercentage)}% of hourly limit used`;
      }
    }
    
    return null;
  };

  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);

  return (
    <div className={className}>
      <Label className="flex items-center gap-2">
        <Mail className="h-4 w-4" />
        Send From
      </Label>
      
      <select
        className="w-full border rounded px-3 py-2 mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
        value={selectedAccountId || ''}
        onChange={(e) => onAccountSelect(e.target.value ? Number(e.target.value) : null)}
        disabled={disabled || loading}
      >
        <option value="">Default Email Account</option>
        
        {loading && <option disabled>Loading accounts...</option>}
        
        {!loading && accounts.length === 0 && (
          <option disabled>No email accounts available</option>
        )}
        
        {!loading && accounts.map(account => {
          const warning = getAccountWarning(account);
          return (
            <option 
              key={account.id} 
              value={account.id}
              disabled={!account.can_current_user_send || !account.is_active}
            >
              {account.name} ({account.email_address})
              {account.is_default && ' ⭐'}
              {warning && ` - ⚠️ ${warning}`}
              {!account.can_current_user_send && ' - No permission'}
            </option>
          );
        })}
      </select>
      
      {/* Show warning if selected account has high usage */}
      {selectedAccount && getAccountWarning(selectedAccount) && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">Rate Limit Warning</p>
            <p>{getAccountWarning(selectedAccount)}</p>
          </div>
        </div>
      )}
      
      {/* Show selected account details */}
      {selectedAccount && (
        <p className="text-xs text-gray-500 mt-1">
          Emails will be sent from: {selectedAccount.email_address}
        </p>
      )}
      
      {/* Error state */}
      {error && !loading && (
        <p className="text-xs text-red-600 mt-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default EmailAccountSelector;