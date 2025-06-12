import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, FileText, Eye, ChevronDown, ChevronUp, Edit2, Filter } from 'lucide-react';
import { LegalEnquiry, LEGAL_ENQUIRY_RECEIVERS, LEGAL_ENQUIRY_TYPES, LEGAL_ENQUIRY_TRANSACTIONS, DEED_VARIATION_PROGRESS_OPTIONS, LEGAL_ENQUIRY_STATUS_OPTIONS } from '../../types/legal';
import { legalService } from '../../services/legalService';

interface LegalEnquiryHistoryProps {
  siteId: string;
  onBack: () => void;
  onEdit?: (enquiry: LegalEnquiry) => void;
}

const LegalEnquiryHistory: React.FC<LegalEnquiryHistoryProps> = ({ siteId, onBack, onEdit }) => {
  const [enquiries, setEnquiries] = useState<LegalEnquiry[]>([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState<LegalEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEnquiry, setExpandedEnquiry] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchEnquiries();
  }, [siteId]);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const data = await legalService.getLegalEnquiries(siteId, statusFilter !== 'all' ? statusFilter : undefined);
      setEnquiries(data);
      setFilteredEnquiries(data);
    } catch (err) {
      setError('Failed to load legal enquiry history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredEnquiries(enquiries);
    } else {
      setFilteredEnquiries(enquiries.filter(e => e.status === statusFilter));
    }
  }, [statusFilter, enquiries]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getDisplayValue = (value: string, options: { value: string; label: string }[]) => {
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  const toggleExpanded = (enquiryId: number) => {
    setExpandedEnquiry(expandedEnquiry === enquiryId ? null : enquiryId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Legal Tab
        </button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Legal Enquiry History</h2>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <label htmlFor="status-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter by Status:
          </label>
        </div>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Enquiries</option>
          {LEGAL_ENQUIRY_STATUS_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="ml-auto text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredEnquiries.length} of {enquiries.length} enquiries
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {!loading && !error && filteredEnquiries.length === 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {statusFilter === 'all' 
              ? 'No legal enquiries found for this site.' 
              : `No ${statusFilter.replace('_', ' ')} enquiries found.`}
          </p>
        </div>
      )}

      {!loading && !error && filteredEnquiries.length > 0 && (
        <div className="space-y-4">
          {filteredEnquiries.map((enquiry) => {
            const isExpanded = expandedEnquiry === enquiry.id;
            
            return (
              <div key={enquiry.id} className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => toggleExpanded(enquiry.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {getDisplayValue(enquiry.enquiry_type, LEGAL_ENQUIRY_TYPES)}
                          </p>
                          {/* Status Badge */}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            enquiry.status === 'open' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              : enquiry.status === 'in_progress'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            {getDisplayValue(enquiry.status || 'open', LEGAL_ENQUIRY_STATUS_OPTIONS)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Received: {formatDate(enquiry.enquiry_receive_date)} • 
                          By: {getDisplayValue(enquiry.enquiry_received_by, LEGAL_ENQUIRY_RECEIVERS)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Created: {formatDate(enquiry.created_at)}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
                    {/* Edit Button */}
                    {onEdit && (
                      <div className="flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(enquiry);
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit Enquiry
                        </button>
                      </div>
                    )}
                    
                    {/* Legal Enquiry Details */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Legal Enquiry Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Type:</span>{' '}
                          <span className="text-gray-900 dark:text-gray-100">
                            {getDisplayValue(enquiry.enquiry_type, LEGAL_ENQUIRY_TYPES)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Transaction:</span>{' '}
                          <span className="text-gray-900 dark:text-gray-100">
                            {getDisplayValue(enquiry.enquiry_transaction, LEGAL_ENQUIRY_TRANSACTIONS)}
                          </span>
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-gray-500 dark:text-gray-400">Solicitor Email:</span>{' '}
                          <span className="text-gray-900 dark:text-gray-100">
                            {enquiry.solicitor_email || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* GDPR Compliance */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">GDPR Compliance</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Authority Form Sent:</span>{' '}
                          <span className="text-gray-900 dark:text-gray-100">
                            {formatDate(enquiry.authority_form_sent_date)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Authority Form Received:</span>{' '}
                          <span className="text-gray-900 dark:text-gray-100">
                            {formatDate(enquiry.authority_form_received_date)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Payments */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Payments</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Payment Value:</span>{' '}
                          <span className="text-gray-900 dark:text-gray-100">
                            {enquiry.payment_value || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Payment Received:</span>{' '}
                          <span className="text-gray-900 dark:text-gray-100">
                            {formatDate(enquiry.payment_received_date)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Payee:</span>{' '}
                          <span className="text-gray-900 dark:text-gray-100">
                            {enquiry.payment_payee || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Invoice Request Created:</span>{' '}
                          <span className="text-gray-900 dark:text-gray-100">
                            {formatDate(enquiry.invoice_request_created_date)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Deed of Variation */}
                    {enquiry.deed_variation_progress && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Deed of Variation</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Progress:</span>{' '}
                            <span className="text-gray-900 dark:text-gray-100">
                              {getDisplayValue(enquiry.deed_variation_progress, DEED_VARIATION_PROGRESS_OPTIONS)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Progress Date:</span>{' '}
                            <span className="text-gray-900 dark:text-gray-100">
                              {formatDate(enquiry.deed_variation_progress_date)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Document/Information Request */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Document/Information Request</h4>
                      <div className="text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Documents/Information Issued:</span>{' '}
                        <span className="text-gray-900 dark:text-gray-100">
                          {formatDate(enquiry.documents_information_issued_date)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LegalEnquiryHistory;