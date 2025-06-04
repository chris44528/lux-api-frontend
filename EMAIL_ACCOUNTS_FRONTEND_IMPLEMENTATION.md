# Email Accounts Frontend Implementation

## Overview
This document summarizes the frontend updates implemented to support the multi-email account system.

## Completed Tasks

### 1. Created EmailAccountSelector Component
**File**: `src/components/EmailAccountSelector.tsx`

**Features**:
- Dropdown component for selecting email accounts
- Fetches available accounts from `/email-templates/available_email_accounts/`
- Shows account name, email address, and default status
- Displays rate limit warnings when usage is above 90%
- Handles loading states and errors gracefully
- Shows which email address will be used for sending

**Props**:
- `selectedAccountId`: Currently selected account ID (number | null)
- `onAccountSelect`: Callback when account is selected
- `className`: Optional CSS class
- `disabled`: Disable the selector

### 2. Updated EmailTemplateModal Component
**File**: `src/components/EmailTemplateModal.tsx`

**Changes**:
- Added EmailAccountSelector component to the UI
- Added `selectedEmailAccountId` state
- Updated email sending payload to include `email_account_id` when selected
- Enhanced error handling for permission and rate limit errors
- Reset email account selection when modal closes

### 3. Updated Email Template Service
**File**: `src/services/emailTemplateService.ts`

**Changes**:
- Added `email_account_id?: number` to `SendEmailRequest` interface
- This ensures consistency across all email sending methods

## API Integration

### Email Account Selection
```typescript
// Fetch available email accounts
GET /api/email-templates/available_email_accounts/

// Response format
[
  {
    "id": 1,
    "name": "Customer Support",
    "email_address": "support@company.com",
    "is_active": true,
    "is_default": true,
    "can_current_user_send": true,
    "daily_limit": 1000,
    "hourly_limit": 100,
    "emails_sent_today": 50,
    "emails_sent_this_hour": 10
  }
]
```

### Sending Email with Account Selection
```typescript
// Send custom email
POST /api/email-templates/send-custom/
{
  "recipient_email": "customer@example.com",
  "email_account_id": 2,  // Optional - null uses default
  "cc_emails": ["manager@example.com"],
  "subject": "Your Subject",
  "body": "Email content",
  "site_id": 123
}

// Send template-based email
POST /api/email-templates/templates/{id}/send_email/
{
  "recipient_email": "customer@example.com",
  "email_account_id": 2,  // Optional - null uses default
  "cc_emails": ["manager@example.com"],
  "variables": { "CustomerName": "John Doe" },
  "save_log": true
}
```

## Error Handling

The implementation handles these specific error cases:

1. **Permission Errors**: Shows "You do not have permission to send from this email account"
2. **Rate Limit Errors**: Shows the specific rate limit message from the backend
3. **Connection Errors**: Shows generic error message
4. **No Available Accounts**: Gracefully falls back to default account

## UI/UX Features

1. **Visual Indicators**:
   - Star icon (⭐) for default account
   - Warning icon (⚠️) for accounts near rate limits
   - Disabled state for inactive accounts or no permission

2. **Loading States**:
   - Shows "Loading accounts..." while fetching
   - Disables selector during email sending

3. **Informative Display**:
   - Shows selected account's email address
   - Displays rate limit warnings above 90% usage
   - Clear error messages for various failure scenarios

## 4. Created Email Account Management Interface
**File**: `src/components/Settings/EmailAccountManagement.tsx`

**Features**:
- Full CRUD operations for email accounts
- Support for multiple account types: SMTP, Office 365, Gmail, SendGrid, AWS SES
- Secure password/API key input with show/hide toggle
- Connection testing functionality
- Usage statistics with visual charts
- Rate limit display with color-coded progress bars
- Active/inactive status management
- Default account designation

**API Endpoints Used**:
- `GET /api/email-accounts/` - List all accounts
- `POST /api/email-accounts/` - Create new account
- `PATCH /api/email-accounts/{id}/` - Update account
- `DELETE /api/email-accounts/{id}/` - Delete account
- `POST /api/email-accounts/{id}/test_connection/` - Test connection
- `GET /api/email-accounts/{id}/usage_stats/` - Get usage statistics

## 5. Updated Settings Navigation
**File**: `src/pages/settings/modern-page.tsx`

**Changes**:
- Added Email Accounts to System Configuration category
- Added navigation tab with Mail icon
- Integrated EmailAccountManagement component

## Optional Future Enhancements

1. **Email Template Settings Test Email**:
   - The test email feature in `EmailTemplatesSettings.tsx` could be enhanced to include email account selection
   - Currently uses the default account for test emails

2. **Advanced Permission Management**:
   - UI for managing which users/groups can use specific email accounts
   - Currently handled through backend admin

3. **Incoming Email Account Management**:
   - Interface for configuring incoming email accounts for email-to-job conversion
   - Would use `/api/email-accounts/incoming-email-accounts/` endpoints

4. **Email Processing Rules**:
   - UI for creating and managing email processing rules
   - Would use `/api/email-accounts/email-processing-rules/` endpoints

## Testing Checklist

- [x] Email account dropdown loads and displays accounts
- [x] Default account is indicated with star icon
- [x] Rate limit warnings appear when usage > 90%
- [x] Email sends with selected account
- [x] Email sends with default when none selected
- [x] Permission errors are handled gracefully
- [x] Rate limit errors show specific messages
- [x] Loading states work correctly
- [x] Account selection resets when modal closes