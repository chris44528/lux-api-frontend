import { api } from './api';

// Types for Email Template API
export interface EmailTemplateCategory {
  id: number;
  name: string;
  description: string;
  template_count: number;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplateVariable {
  id: number;
  name: string;
  formatted_name: string;
  description: string;
  source_model?: string;
  source_field?: string;
  default_value?: string;
  is_system: boolean;
}

export interface EmailTemplate {
  id: number;
  name: string;
  category: number;
  category_name?: string;
  subject: string;
  body?: string;
  footer?: string;
  is_active: boolean;
  created_by_name?: string;
  updated_at: string;
  usage_count: number;
  last_used_at?: string;
  variables: string[];
}

export interface EmailTemplateDetail extends EmailTemplate {
  body: string;
  footer: string;
}

export interface RenderTemplateRequest {
  template_id: number;
  variables: Record<string, string>;
}

export interface RenderTemplateResponse {
  template_id: number;
  template_name: string;
  variables_used: string[];
  available_variables: string[];
  rendered: {
    subject: string;
    body: string;
    footer: string;
    full_content: string;
  };
}

export interface SendEmailRequest {
  template_id: number;
  recipient_email: string;
  cc_emails?: string[];
  bcc_emails?: string[];
  variables: Record<string, string>;
  save_log?: boolean;
  email_account_id?: number;
}

export interface SendEmailResponse {
  success: boolean;
  message: string;
  recipient: string;
}

export interface PreviewTemplateRequest {
  subject: string;
  body: string;
  footer: string;
  variables?: Record<string, string>;
}

export interface UsageLog {
  id: number;
  template_id: number;
  template_name: string;
  user_id: number;
  user_name: string;
  recipient_email: string;
  cc_emails?: string[];
  bcc_emails?: string[];
  subject_rendered: string;
  body_rendered: string;
  variables_used: Record<string, string>;
  sent_at: string;
}

class EmailTemplateService {
  // Categories
  async getCategories(): Promise<EmailTemplateCategory[]> {
    const response = await api.get('/email-templates/categories/');
    // Handle both array and paginated responses
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && Array.isArray(response.data.results)) {
      return response.data.results;
    }
    console.error('Unexpected categories response format:', response.data);
    return [];
  }

  async createCategory(data: { name: string; description: string }): Promise<EmailTemplateCategory> {
    const response = await api.post('/email-templates/categories/', data);
    return response.data;
  }

  async updateCategory(id: number, data: { name: string; description: string }): Promise<EmailTemplateCategory> {
    const response = await api.patch(`/email-templates/categories/${id}/`, data);
    return response.data;
  }

  async deleteCategory(id: number): Promise<void> {
    await api.delete(`/email-templates/categories/${id}/`);
  }

  // Templates
  async getTemplates(params?: {
    is_active?: boolean;
    category?: number;
    search?: string;
    order?: 'most_used' | 'recent';
  }): Promise<EmailTemplate[]> {
    const response = await api.get('/email-templates/templates/', { params });
    // Handle both array and paginated responses
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && Array.isArray(response.data.results)) {
      return response.data.results;
    }
    console.error('Unexpected templates response format:', response.data);
    return [];
  }

  async getTemplate(id: number): Promise<EmailTemplateDetail> {
    const response = await api.get(`/email-templates/templates/${id}/`);
    return response.data;
  }

  async createTemplate(data: {
    name: string;
    category: number;
    subject: string;
    body: string;
    footer: string;
    is_active?: boolean;
  }): Promise<EmailTemplateDetail> {
    const response = await api.post('/email-templates/templates/', data);
    return response.data;
  }

  async updateTemplate(id: number, data: Partial<{
    name: string;
    category: number;
    subject: string;
    body: string;
    footer: string;
    is_active: boolean;
  }>): Promise<EmailTemplateDetail> {
    const response = await api.patch(`/email-templates/templates/${id}/`, data);
    return response.data;
  }

  async deleteTemplate(id: number): Promise<void> {
    await api.delete(`/email-templates/templates/${id}/`);
  }

  async duplicateTemplate(id: number): Promise<EmailTemplateDetail> {
    const response = await api.post(`/email-templates/templates/${id}/duplicate/`);
    return response.data;
  }

  async renderTemplate(request: RenderTemplateRequest): Promise<RenderTemplateResponse> {
    const response = await api.post(`/email-templates/templates/${request.template_id}/render/`, request);
    return response.data;
  }

  async previewTemplate(request: PreviewTemplateRequest): Promise<RenderTemplateResponse> {
    const response = await api.post('/email-templates/templates/preview/', request);
    return response.data;
  }

  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    const response = await api.post(`/email-templates/templates/${request.template_id}/send_email/`, request);
    return response.data;
  }

  async getUsageHistory(templateId: number): Promise<UsageLog[]> {
    const response = await api.get(`/email-templates/templates/${templateId}/usage_history/`);
    return response.data;
  }

  // Variables
  async getVariables(params?: { is_system?: boolean; search?: string }): Promise<EmailTemplateVariable[]> {
    const response = await api.get('/email-templates/variables/', { params });
    // Handle both array and paginated responses
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && Array.isArray(response.data.results)) {
      return response.data.results;
    }
    console.error('Unexpected variables response format:', response.data);
    return [];
  }

  async createVariable(data: {
    name: string;
    description: string;
    default_value?: string;
  }): Promise<EmailTemplateVariable> {
    const response = await api.post('/email-templates/variables/', data);
    return response.data;
  }

  async updateVariable(id: number, data: Partial<{
    name: string;
    description: string;
    default_value: string;
  }>): Promise<EmailTemplateVariable> {
    const response = await api.patch(`/email-templates/variables/${id}/`, data);
    return response.data;
  }

  async deleteVariable(id: number): Promise<void> {
    await api.delete(`/email-templates/variables/${id}/`);
  }

  // Usage Logs
  async getUsageLogs(params?: {
    template?: number;
    user?: number;
    date_from?: string;
    date_to?: string;
  }): Promise<UsageLog[]> {
    const response = await api.get('/email-templates/usage-logs/', { params });
    // Handle both array and paginated responses
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && Array.isArray(response.data.results)) {
      return response.data.results;
    }
    console.error('Unexpected usage logs response format:', response.data);
    return [];
  }
}

export default new EmailTemplateService();