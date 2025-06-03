import React, { useState } from 'react';
import { Calendar, User, FileText, CreditCard, Home, Info, ArrowLeft, Save } from 'lucide-react';
import { 
  LegalEnquiryFormData, 
  LEGAL_ENQUIRY_RECEIVERS, 
  LEGAL_ENQUIRY_TYPES, 
  LEGAL_ENQUIRY_TRANSACTIONS,
  DEED_VARIATION_PROGRESS_OPTIONS 
} from '../../types/legal';
import { legalService } from '../../services/legalService';

interface LegalEnquiryFormProps {
  siteId: string;
  onBack: () => void;
  onSuccess: () => void;
}

const LegalEnquiryForm: React.FC<LegalEnquiryFormProps> = ({ siteId, onBack, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<LegalEnquiryFormData>({
    enquiry_receive_date: '',
    enquiry_received_by: '',
    enquiry_type: '',
    enquiry_transaction: '',
    solicitor_email: '',
    authority_form_sent_date: null,
    authority_form_received_date: null,
    payment_value: '',
    payment_received_date: null,
    payment_payee: '',
    invoice_request_created_date: null,
    deed_variation_progress: '',
    deed_variation_progress_date: null,
    documents_information_issued_date: null,
  });

  const handleInputChange = (field: keyof LegalEnquiryFormData, value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate required fields
    if (!formData.enquiry_receive_date || !formData.enquiry_received_by || 
        !formData.enquiry_type || !formData.enquiry_transaction) {
      setError('Please fill in all required fields in the Legal Enquiry section.');
      return;
    }

    setLoading(true);
    try {
      await legalService.createLegalEnquiry(siteId, formData);
      onSuccess();
    } catch (err: any) {
      // Extract error message from the response if available
      const errorMessage = err?.response?.data?.detail || 
                          err?.response?.data?.message || 
                          err?.response?.data?.error ||
                          'Failed to create legal enquiry. Please try again.';
      setError(errorMessage);
      console.error('Error creating legal enquiry:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderDateCheckbox = (
    label: string, 
    field: keyof LegalEnquiryFormData, 
    icon: React.ReactNode
  ) => {
    const value = formData[field] as string | null;
    const isChecked = value !== null && value !== '';
    
    return (
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={(e) => {
            if (e.target.checked) {
              handleInputChange(field, new Date().toISOString().split('T')[0]);
            } else {
              handleInputChange(field, null);
            }
          }}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600"
        />
        <div className="flex-1">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            {icon}
            {label}
          </label>
          {isChecked && (
            <input
              type="date"
              value={value || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm"
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Legal Tab
        </button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">New Legal Enquiry</h2>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Legal Enquiry Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Legal Enquiry
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Legal Enquiry Receive Date *
            </label>
            <input
              type="date"
              required
              value={formData.enquiry_receive_date}
              onChange={(e) => handleInputChange('enquiry_receive_date', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Legal Enquiry Received by *
            </label>
            <select
              required
              value={formData.enquiry_received_by}
              onChange={(e) => handleInputChange('enquiry_received_by', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm"
            >
              <option value="">Select...</option>
              {LEGAL_ENQUIRY_RECEIVERS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Legal Enquiry Type *
            </label>
            <select
              required
              value={formData.enquiry_type}
              onChange={(e) => handleInputChange('enquiry_type', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm"
            >
              <option value="">Select...</option>
              {LEGAL_ENQUIRY_TYPES.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Legal Enquiry Transaction *
            </label>
            <select
              required
              value={formData.enquiry_transaction}
              onChange={(e) => handleInputChange('enquiry_transaction', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm"
            >
              <option value="">Select...</option>
              {LEGAL_ENQUIRY_TRANSACTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Solicitor Email
            </label>
            <input
              type="email"
              value={formData.solicitor_email}
              onChange={(e) => handleInputChange('solicitor_email', e.target.value)}
              placeholder="solicitor@example.com or N/A"
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* GDPR Compliance Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5" />
          GDPR Compliance
        </h3>
        <div className="space-y-4">
          {renderDateCheckbox('Authority Form Sent', 'authority_form_sent_date', <Calendar className="w-4 h-4" />)}
          {renderDateCheckbox('Authority Form Received', 'authority_form_received_date', <Calendar className="w-4 h-4" />)}
        </div>
      </div>

      {/* Payments Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payments
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              LE Payment Value
            </label>
            <input
              type="text"
              value={formData.payment_value}
              onChange={(e) => handleInputChange('payment_value', e.target.value)}
              placeholder="Enter fee amount"
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm"
            />
          </div>
          
          <div className="space-y-2">
            {renderDateCheckbox('LE Payment Received', 'payment_received_date', <Calendar className="w-4 h-4" />)}
            {formData.payment_received_date && (
              <input
                type="text"
                value={formData.payment_payee}
                onChange={(e) => handleInputChange('payment_payee', e.target.value)}
                placeholder="Enter payee name"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm"
              />
            )}
          </div>
          
          {renderDateCheckbox('LE Invoice Request Created', 'invoice_request_created_date', <Calendar className="w-4 h-4" />)}
        </div>
      </div>

      {/* Deed of Variation Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Home className="w-5 h-5" />
          Deed of Variation
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              LE Deed of Variation Progress
            </label>
            <select
              value={formData.deed_variation_progress}
              onChange={(e) => handleInputChange('deed_variation_progress', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm"
            >
              <option value="">Select...</option>
              {DEED_VARIATION_PROGRESS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          
          {formData.deed_variation_progress && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                LE Deed of Variation Progress Date
              </label>
              <input
                type="date"
                value={formData.deed_variation_progress_date || ''}
                onChange={(e) => handleInputChange('deed_variation_progress_date', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Document/Information Request Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Document/Information Request
        </h3>
        <div className="space-y-4">
          {renderDateCheckbox('Documents/Information Issued', 'documents_information_issued_date', <Calendar className="w-4 h-4" />)}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Legal Enquiry'}
        </button>
      </div>
    </form>
  );
};

export default LegalEnquiryForm;