import { api } from './api';

// Types
export interface AgedCase {
  id: number;
  site: number;
  site_details?: any;
  job: number | null;
  job_details?: any;
  case_type: 'no_communication' | 'zero_generation' | 'low_performance' | 'connection_issue';
  case_type_display: string;
  age_days: number;
  escalation_tier: number;
  status: 'active' | 'resolved' | 'escalated' | 'abandoned';
  status_display: string;
  daily_savings_loss: string;
  total_savings_loss: string;
  expected_daily_generation: string;
  last_contact_attempt: string | null;
  successful_contacts: number;
  failed_contacts: number;
  customer_responded: boolean;
  last_engagement: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface AgedCaseMetrics {
  total_cases: number;
  new_today: number;
  escalated_today: number;
  total_savings_loss: string;
  average_age: number;
  avg_response_rate: number;
  by_tier: {
    [key: number]: {
      count: number;
      avg_age: number;
      total_loss: string;
    };
  };
  by_type: {
    [key: string]: {
      count: number;
      display: string;
      avg_age: number;
    };
  };
  response_rates_by_tier: {
    [key: number]: {
      case_response_rate: number;
      comm_response_rate: number;
      total_cases: number;
      total_sent: number;
      total_responded: number;
    };
  };
}

export interface AgedCaseCommunication {
  id: number;
  aged_case: number;
  channel: 'sms' | 'email' | 'whatsapp' | 'phone';
  channel_display: string;
  template_used: number;
  template_name: string;
  message_content: string;
  personalized_values: Record<string, any>;
  sent_at: string;
  delivered: boolean;
  opened: boolean;
  clicked: boolean;
  responded: boolean;
  response_received_at: string | null;
  response_content: string | null;
  response_sentiment: string | null;
  whatsapp_message_sid: string | null;
}

export interface AgedCaseTemplate {
  id: number;
  name: string;
  channel: 'sms' | 'email' | 'whatsapp' | 'phone';
  escalation_tier: number;
  case_type: string | null;
  subject: string;
  content: string;
  send_count: number;
  open_rate: number;
  response_rate: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgedCaseSettings {
  id: number;
  name: string;
  tier_1_templates: Record<string, number>;
  tier_2_templates: Record<string, number>;
  tier_3_templates: Record<string, number>;
  tier_4_templates: Record<string, number>;
  tier_1_frequency: string;
  tier_2_frequency: string;
  tier_3_frequency: string;
  tier_4_frequency: string;
  tier_1_escalation_days: number;
  tier_2_escalation_days: number;
  tier_3_escalation_days: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  updated_by: number | null;
  updated_by_details?: any;
}

export interface AgedCaseHistory {
  id: number;
  aged_case: number;
  action: string;
  user: number | null;
  user_details?: any;
  from_tier: number | null;
  to_tier: number | null;
  channel: string | null;
  notes: string;
  created_at: string;
}

export interface BulkActionRequest {
  case_ids: number[];
  action: 'send_communication' | 'resolve' | 'abandon';
  channel?: 'sms' | 'email' | 'whatsapp' | 'auto';
  notes?: string;
}

export interface AgedCaseFilters {
  status?: string;
  tier?: number;
  case_type?: string;
  min_age_days?: number;
  max_age_days?: number;
  has_responded?: boolean;
  search?: string;
  created_after?: string;
  created_before?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// API Service
class AgedCasesService {
  // Aged Cases
  async getAgedCases(filters?: AgedCaseFilters) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get<PaginatedResponse<AgedCase>>(`/aged-cases/?${params}`);
    return response.data.results; // Return just the results array
  }

  async getAgedCase(id: number) {
    const response = await api.get<AgedCase>(`/aged-cases/${id}/`);
    return response.data;
  }

  async getAgedCasesQueue(filters?: AgedCaseFilters) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get<PaginatedResponse<AgedCase>>(`/aged-cases/queue/?${params}`);
    return response.data.results; // Return just the results array
  }

  async getMetrics() {
    const response = await api.get<AgedCaseMetrics>('/aged-cases/metrics/');
    return response.data;
  }

  async sendCommunication(caseId: number, channel: 'sms' | 'email' | 'whatsapp' | 'auto' = 'auto') {
    const response = await api.post(`/aged-cases/${caseId}/send_communication/`, { channel });
    return response.data;
  }

  async resolveCase(caseId: number, notes: string = '') {
    const response = await api.post(`/aged-cases/${caseId}/resolve/`, { notes });
    return response.data;
  }

  async bulkAction(request: BulkActionRequest) {
    const response = await api.post('/aged-cases/bulk_action/', request);
    return response.data;
  }

  async getCommunications(caseId: number) {
    const response = await api.get<AgedCaseCommunication[]>(`/aged-cases/${caseId}/communications/`);
    return response.data;
  }

  async getHistory(caseId: number) {
    const response = await api.get<AgedCaseHistory[]>(`/aged-cases/${caseId}/history/`);
    return response.data;
  }

  // Templates
  async getTemplates(tier?: number, channel?: string, activeOnly: boolean = true) {
    const params = new URLSearchParams();
    if (tier) params.append('tier', String(tier));
    if (channel) params.append('channel', channel);
    params.append('active', String(activeOnly));
    
    const response = await api.get<PaginatedResponse<AgedCaseTemplate>>(`/aged-case-templates/?${params}`);
    return response.data.results;
  }

  async getTemplate(id: number) {
    const response = await api.get<AgedCaseTemplate>(`/aged-case-templates/${id}/`);
    return response.data;
  }

  async createTemplate(template: Partial<AgedCaseTemplate>) {
    const response = await api.post<AgedCaseTemplate>('/aged-case-templates/', template);
    return response.data;
  }

  async updateTemplate(id: number, template: Partial<AgedCaseTemplate>) {
    const response = await api.patch<AgedCaseTemplate>(`/aged-case-templates/${id}/`, template);
    return response.data;
  }

  async deleteTemplate(id: number) {
    await api.delete(`/aged-case-templates/${id}/`);
  }

  // Settings
  async getActiveSettings() {
    const response = await api.get<AgedCaseSettings>('/aged-case-settings/active/');
    return response.data;
  }

  async getAllSettings() {
    const response = await api.get<PaginatedResponse<AgedCaseSettings>>('/aged-case-settings/');
    return response.data.results;
  }

  async updateSettings(settings: Partial<AgedCaseSettings>) {
    const response = await api.post<AgedCaseSettings>('/aged-case-settings/set_active/', settings);
    return response.data;
  }

  async getTemplatesByTier() {
    const response = await api.get<Record<number, any[]>>('/aged-case-settings/templates/');
    return response.data;
  }

  // URL Tracking
  async trackClick(trackingId: string, action: string) {
    const response = await api.post('/aged-cases/track-click/', {
      tracking_id: trackingId,
      action: action
    });
    return response.data;
  }
}

export const agedCasesService = new AgedCasesService();