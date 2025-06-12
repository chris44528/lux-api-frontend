export interface LegalEnquiry {
  id: number;
  site_id: number;
  
  // Legal Enquiry Section
  enquiry_receive_date: string;
  enquiry_received_by: 'sharron_hackleton' | 'katie_hodgson' | 'shannon_leach';
  enquiry_type: 'cml_letter' | 'complaint_escalation' | 'deed_of_variation' | 
    'documents' | 'documents_and_information' | 'documents_info_deed' | 
    'non_chargeable' | 'other' | 'sar' | 'unregistered_lease';
  enquiry_transaction: 'sale' | 'remortgage' | 'equity_release' | 'other';
  solicitor_email: string;
  status: 'open' | 'in_progress' | 'closed';
  
  // GDPR Compliance Section
  authority_form_sent_date: string | null;
  authority_form_received_date: string | null;
  
  // Payments Section
  payment_value: string;
  payment_received_date: string | null;
  payment_payee: string;
  invoice_request_created_date: string | null;
  
  // Deed of Variation Section
  deed_variation_progress: 'sent_to_homeowner' | 'sent_to_solicitor' | 
    'requisition' | 'submitted_to_land_registry' | 'registered' | null;
  deed_variation_progress_date: string | null;
  
  // Document/Information Request Section
  documents_information_issued_date: string | null;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by: number;
}

export interface LegalEnquiryFormData {
  // Legal Enquiry Section
  enquiry_receive_date: string;
  enquiry_received_by: string;
  enquiry_type: string;
  enquiry_transaction: string;
  solicitor_email: string;
  status?: string;
  
  // GDPR Compliance Section
  authority_form_sent_date: string | null;
  authority_form_received_date: string | null;
  
  // Payments Section
  payment_value: string;
  payment_received_date: string | null;
  payment_payee: string;
  invoice_request_created_date: string | null;
  
  // Deed of Variation Section
  deed_variation_progress: string;
  deed_variation_progress_date: string | null;
  
  // Document/Information Request Section
  documents_information_issued_date: string | null;
}

// Options for dropdowns
export const LEGAL_ENQUIRY_RECEIVERS = [
  { value: 'sharron_hackleton', label: 'Sharron Hackleton' },
  { value: 'katie_hodgson', label: 'Katie Hodgson' },
  { value: 'shannon_leach', label: 'Shannon Leach' }
];

export const LEGAL_ENQUIRY_TYPES = [
  { value: 'cml_letter', label: 'CML Letter' },
  { value: 'complaint_escalation', label: 'Complaint/Escalation' },
  { value: 'deed_of_variation', label: 'Deed of Variation' },
  { value: 'documents', label: 'Documents' },
  { value: 'documents_and_information', label: 'Documents & Information' },
  { value: 'documents_info_deed', label: 'Documents & Information & Deed of Variation' },
  { value: 'non_chargeable', label: 'Non – chargeable' },
  { value: 'other', label: 'Other' },
  { value: 'sar', label: 'SAR' },
  { value: 'unregistered_lease', label: 'Unregistered Lease' }
];

export const LEGAL_ENQUIRY_TRANSACTIONS = [
  { value: 'sale', label: 'Sale' },
  { value: 'remortgage', label: 'Remortgage' },
  { value: 'equity_release', label: 'Equity Release' },
  { value: 'other', label: 'Other' }
];

export const DEED_VARIATION_PROGRESS_OPTIONS = [
  { value: 'sent_to_homeowner', label: 'Sent to homeowner for signing' },
  { value: 'sent_to_solicitor', label: 'Sent to solicitor for approval' },
  { value: 'requisition', label: 'Requisition' },
  { value: 'submitted_to_land_registry', label: 'Submitted to Land Registry' },
  { value: 'registered', label: 'Registered' }
];

export const LEGAL_ENQUIRY_STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'closed', label: 'Closed' }
];