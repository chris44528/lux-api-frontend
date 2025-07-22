import { api } from './api';

export interface PostcardTemplate {
  id: number;
  name: string;
  template_id: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostcardRequest {
  id: number;
  job: {
    id: number;
    title: string;
    client: string;
    address: string;
    site: {
      site_id: number;
      site_name: string;
      postcode: string;
    };
  };
  template: PostcardTemplate | null;
  postcard_number: number;
  status: 'requested' | 'sent' | 'delivered' | 'failed' | 'cancelled';
  requested_date: string;
  sent_date: string | null;
  delivered_date: string | null;
  tracking_id: string;
  docmail_order_id: string;
  error_message: string;
  created_by: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  } | null;
  recipient_name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  postcode: string;
}

export interface PendingPostcardsResponse {
  count: number;
  postcards: PostcardRequest[];
}

export interface BulkUpdateRequest {
  postcard_ids: number[];
  status: string;
  notes?: string;
}

export interface BulkUpdateResponse {
  updated: number;
  errors: string[];
}

class PostcardService {
  /**
   * Get all pending postcards for label printing
   */
  async getPendingPostcards(): Promise<PendingPostcardsResponse> {
    const response = await api.get('/postcards/pending_labels/');
    return response.data;
  }

  /**
   * Generate PDF labels for selected postcards
   */
  async generateLabels(postcardIds?: number[]): Promise<Blob> {
    let url = '/postcards/generate_labels/';
    if (postcardIds && postcardIds.length > 0) {
      const params = postcardIds.map(id => `ids[]=${id}`).join('&');
      url += `?${params}`;
    }
    
    const response = await api.get(url, {
      responseType: 'blob',
    });
    
    return response.data;
  }

  /**
   * Mark postcards as sent after printing labels
   */
  async markAsSent(postcardIds: number[], notes?: string): Promise<BulkUpdateResponse> {
    const data: BulkUpdateRequest = {
      postcard_ids: postcardIds,
      status: 'sent',
      notes: notes || 'Labels printed and sent',
    };
    
    const response = await api.post('/postcards/mark_as_sent/', data);
    return response.data;
  }

  /**
   * Get postcards for a specific job
   */
  async getJobPostcards(jobId: string | number): Promise<PostcardRequest[]> {
    const response = await api.get('/postcards/job_postcards/', {
      params: { job_id: jobId }
    });
    return response.data;
  }

  /**
   * Request a postcard for a job
   */
  async requestPostcard(jobId: number, postcardNumber: number, templateId?: number): Promise<PostcardRequest> {
    const response = await api.post('/postcards/request_postcard/', {
      job_id: jobId,
      postcard_number: postcardNumber,
      template_id: templateId,
    });
    return response.data;
  }
}

export default new PostcardService();