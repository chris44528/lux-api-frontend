import api from './api';

export interface Transfer {
  id: number;
  site: number;
  site_name: string;
  site_address: string;
  site_details: any;
  unique_token: string;
  homeowner_email: string;
  status: 'pending' | 'submitted' | 'under_review' | 'needs_info' | 'approved' | 'rejected' | 'completed' | 'expired' | 'extended';
  status_display: string;
  token_created_at: string;
  token_expires_at: string;
  token_extended_count: number;
  days_until_expiry: number;
  is_urgent: boolean;
  can_be_extended: boolean;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  reviewed_at: string | null;
  approved_at: string | null;
  assigned_to: number | null;
  assigned_to_name: string | null;
  created_by: number | null;
  created_by_name: string | null;
  reviewed_by: number | null;
  reviewed_by_name: string | null;
  sender_email: string;
  sale_completion_date: string | null;
  legal_proprietor_1: string;
  legal_proprietor_2: string;
  legal_proprietor_3: string;
  phone_number: string;
  mobile_number: string;
  form_email: string;
  postal_address: string;
  evidence_document_type: string;
  evidence_uploaded: boolean;
  rejection_reason: string;
  rejection_notes: string;
  account_created: boolean;
  welcome_email_sent: boolean;
  validation_score: number | null;
  documents: TransferDocument[];
  notifications: TransferNotification[];
  reviews: TransferReview[];
  info_requests: InfoRequest[];
}

export interface TransferDocument {
  id: number;
  file: string;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  uploaded_by_name: string;
  file_url: string;
}

export interface TransferNotification {
  id: number;
  notification_type: string;
  notification_type_display: string;
  sent_to: string;
  sent_at: string;
  sent_by_name: string;
  subject: string;
}

export interface TransferReview {
  id: number;
  reviewer: number;
  reviewer_name: string;
  action: string;
  action_display: string;
  notes: string;
  created_at: string;
}

export interface InfoRequest {
  id: number;
  requested_at: string;
  requested_by: number;
  requested_by_name: string;
  reason: string;
  specific_fields: any;
  deadline: string;
  responded_at: string | null;
  response: string;
  reminder_count: number;
}

export interface TransferListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Transfer[];
}

export interface TransferDashboard {
  total: number;
  pending: number;
  completed: number;
  expired: number;
  urgent: number;
  assigned_to_me: number;
  unassigned: number;
  recent_activity: Transfer[];
}

export interface InitiateTransferData {
  site_id: number;
  homeowner_email: string;
  use_existing_email: boolean;
}

export interface ExtendTokenData {
  days: number;
  reason?: string;
}

export interface PublicTransferData {
  sale_completion_date?: string;
  legal_proprietor_1?: string;
  legal_proprietor_2?: string;
  legal_proprietor_3?: string;
  phone_number?: string;
  mobile_number?: string;
  form_email?: string;
  postal_address?: string;
  evidence_document_type?: string;
}

class TransferService {
  // Staff endpoints
  async getTransfers(params?: {
    status?: string;
    urgent?: boolean;
    assigned_to?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<TransferListResponse> {
    const response = await api.get('/transfers/', { params });
    return response.data;
  }

  async getTransfer(id: number): Promise<Transfer> {
    const response = await api.get(`/transfers/${id}/`);
    return response.data;
  }

  async initiateTransfer(data: InitiateTransferData): Promise<Transfer> {
    const response = await api.post('/transfers/initiate/', data);
    return response.data;
  }

  async extendToken(id: number, data: ExtendTokenData): Promise<Transfer> {
    const response = await api.post(`/transfers/${id}/extend_token/`, data);
    return response.data;
  }

  async assignTransfer(id: number, userId: number | null): Promise<Transfer> {
    const response = await api.post(`/transfers/${id}/assign/`, { user_id: userId });
    return response.data;
  }

  async getDashboard(): Promise<TransferDashboard> {
    const response = await api.get('/transfers/dashboard/');
    return response.data;
  }

  // Public endpoints (no auth required)
  async validateToken(token: string): Promise<{
    valid: boolean;
    reason?: string;
    message?: string;
    contact_email?: string;
    transfer?: PublicTransferData;
    site_name?: string;
    site_address?: string;
  }> {
    const response = await api.get(`/transfers/validate/${token}/`);
    return response.data;
  }

  async submitForm(token: string, data: PublicTransferData): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await api.post(`/transfers/submit/${token}/`, data);
    return response.data;
  }

  async uploadDocument(token: string, file: File): Promise<TransferDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_name', file.name);

    const response = await api.post(`/transfers/upload/${token}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Phase 2 endpoints
  async getTransferById(id: string): Promise<Transfer> {
    const response = await api.get(`/transfers/${id}/`);
    return response.data;
  }

  async getValidation(id: string): Promise<ValidationResult> {
    const response = await api.get(`/transfers/${id}/validation/`);
    return response.data;
  }

  async approveTransfer(id: number, data: ApprovalData): Promise<Transfer> {
    const response = await api.post(`/transfers/${id}/approve/`, data);
    return response.data;
  }

  async rejectTransfer(id: number, data: RejectionData): Promise<Transfer> {
    const response = await api.post(`/transfers/${id}/reject/`, data);
    return response.data;
  }

  async requestInfo(id: number, data: InfoRequestData): Promise<InfoRequest> {
    const response = await api.post(`/transfers/${id}/request_info/`, data);
    return response.data;
  }

  async getAnalytics(days: number = 30): Promise<TransferAnalytics> {
    const response = await api.get('/transfers/analytics/', { params: { days } });
    return response.data;
  }
}

export interface ValidationResult {
  overall_score: number;
  is_valid: boolean;
  checks: {
    [key: string]: {
      passed: boolean;
      severity: 'error' | 'warning' | 'ok';
      message: string;
      [key: string]: any;
    };
  };
  issues: string[];
  warnings: string[];
  timestamp: string;
}

export interface ApprovalData {
  notes?: string;
  create_account: boolean;
  send_welcome_email: boolean;
}

export interface RejectionData {
  reason: 'invalid_docs' | 'wrong_property' | 'duplicate' | 'no_response' | 'other';
  notes: string;
  send_notification: boolean;
}

export interface InfoRequestData {
  reason: string;
  specific_fields?: any;
  deadline_days?: number;
  preset_reasons?: string[];
}

export interface TransferAnalytics {
  total_submissions: number;
  status_breakdown: { [key: string]: number };
  approval_rate: number;
  rejection_rate: number;
  average_days_to_complete: number | null;
  rejection_reasons: Array<{ rejection_reason: string; count: number }>;
  monthly_trends: Array<{
    month: string;
    submissions: number;
    approvals: number;
    rejections: number;
  }>;
  pending_reviews: number;
  needs_info: number;
}

export default new TransferService();