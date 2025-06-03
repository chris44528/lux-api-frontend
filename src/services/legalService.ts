import { api } from './api';
import { LegalEnquiry, LegalEnquiryFormData } from '../types/legal';

// API endpoints for legal enquiries
export const legalService = {
  // Get all legal enquiries for a site
  getLegalEnquiries: async (siteId: string): Promise<LegalEnquiry[]> => {
    try {
      const response = await api.get(`/legal-enquiries/?site_id=${siteId}`);
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
  }
};
