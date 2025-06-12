import { api } from './api';
import { LegalEnquiry, LegalEnquiryFormData } from '../types/legal';

// API endpoints for legal enquiries
export const legalService = {
  // Get all legal enquiries for a site
  getLegalEnquiries: async (siteId: string, status?: string): Promise<LegalEnquiry[]> => {
    try {
      let url = `/legal-enquiries/?site_id=${siteId}`;
      if (status) {
        url += `&status=${status}`;
      }
      const response = await api.get(url);
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching legal enquiries:', error);
      return [];
    }
  },

  // Get a single legal enquiry
  getLegalEnquiry: async (enquiryId: number): Promise<LegalEnquiry | null> => {
    try {
      const response = await api.get(`/legal-enquiries/${enquiryId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching legal enquiry:', error);
      return null;
    }
  },

  // Create a new legal enquiry
  createLegalEnquiry: async (siteId: string, data: LegalEnquiryFormData): Promise<LegalEnquiry | null> => {
    try {
      const response = await api.post('/legal-enquiries/', {
        site: parseInt(siteId),  // Changed from site_id to site
        ...data
      });
      return response.data;
    } catch (error) {
      console.error('Error creating legal enquiry:', error);
      throw error;
    }
  },

  // Update an existing legal enquiry
  updateLegalEnquiry: async (enquiryId: number, data: Partial<LegalEnquiryFormData>): Promise<LegalEnquiry | null> => {
    try {
      const response = await api.patch(`/legal-enquiries/${enquiryId}/`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating legal enquiry:', error);
      throw error;
    }
  },

  // Delete a legal enquiry
  deleteLegalEnquiry: async (enquiryId: number): Promise<boolean> => {
    try {
      await api.delete(`/legal-enquiries/${enquiryId}/`);
      return true;
    } catch (error) {
      console.error('Error deleting legal enquiry:', error);
      return false;
    }
  },

  // Get legal enquiries report with comprehensive filtering
  getLegalEnquiriesReport: async (filters?: {
    site_name?: string;
    site_id?: string;
    status?: string[];
    enquiry_type?: string[];
    enquiry_received_by?: string[];
    enquiry_transaction?: string[];
    date_from?: string;
    date_to?: string;
    payment_received?: boolean;
    gdpr_compliant?: boolean;
  }): Promise<any> => {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach(v => params.append(key, v));
            } else {
              params.set(key, String(value));
            }
          }
        });
      }
      
      const response = await api.get(`/legal-enquiries/report/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching legal enquiries report:', error);
      throw error;
    }
  },

  // Export legal enquiries to CSV
  exportLegalEnquiriesToCSV: async (filters?: any): Promise<Blob> => {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach(v => params.append(key, v));
            } else {
              params.set(key, String(value));
            }
          }
        });
      }
      
      const response = await api.get(`/legal-enquiries/export_csv/?${params.toString()}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting legal enquiries:', error);
      throw error;
    }
  },

  // Get summary statistics
  getLegalEnquiriesSummary: async (): Promise<any> => {
    try {
      const response = await api.get('/legal-enquiries/summary/');
      return response.data;
    } catch (error) {
      console.error('Error fetching legal enquiries summary:', error);
      throw error;
    }
  },

  // Get report grouped by receiver
  getLegalEnquiriesByReceiver: async (): Promise<any> => {
    try {
      const response = await api.get('/legal-enquiries/by_receiver/');
      return response.data;
    } catch (error) {
      console.error('Error fetching legal enquiries by receiver:', error);
      throw error;
    }
  }
};
