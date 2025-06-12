import React, { useState, useEffect } from 'react';
import { FileText, Filter, Download, Calendar, Users, DollarSign, Shield } from 'lucide-react';
import { legalService } from '../../services/legalService';
import { 
  LEGAL_ENQUIRY_STATUS_OPTIONS,
  LEGAL_ENQUIRY_TYPES,
  LEGAL_ENQUIRY_RECEIVERS,
  LEGAL_ENQUIRY_TRANSACTIONS
} from '../../types/legal';

interface LegalReportFilters {
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
}

const LegalReportPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [filters, setFilters] = useState<LegalReportFilters>({});
  const [showFilters, setShowFilters] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Multi-select states
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedReceivers, setSelectedReceivers] = useState<string[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const currentFilters = {
        ...filters,
        status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
        enquiry_type: selectedTypes.length > 0 ? selectedTypes : undefined,
        enquiry_received_by: selectedReceivers.length > 0 ? selectedReceivers : undefined,
        enquiry_transaction: selectedTransactions.length > 0 ? selectedTransactions : undefined,
      };
      const data = await legalService.getLegalEnquiriesReport(currentFilters);
      setReportData(data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const currentFilters = {
        ...filters,
        status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
        enquiry_type: selectedTypes.length > 0 ? selectedTypes : undefined,
        enquiry_received_by: selectedReceivers.length > 0 ? selectedReceivers : undefined,
        enquiry_transaction: selectedTransactions.length > 0 ? selectedTransactions : undefined,
      };
      const blob = await legalService.exportLegalEnquiriesToCSV(currentFilters);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `legal_enquiries_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleMultiSelectChange = (value: string, selected: string[], setSelected: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (selected.includes(value)) {
      setSelected(selected.filter(v => v !== value));
    } else {
      setSelected([...selected, value]);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB');
    } catch {
      return 'Invalid date';
    }
  };

  const formatCurrency = (value: string | number | null | undefined) => {
    if (!value) return '£0.00';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `£${num.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Legal Enquiries Report</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Comprehensive reporting and analysis of legal enquiries
          </p>
        </div>

        {/* Filters Section */}
        <div className="mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Filters</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Site Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Site Name
                </label>
                <input
                  type="text"
                  value={filters.site_name || ''}
                  onChange={(e) => setFilters({ ...filters, site_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Search by site name..."
                />
              </div>

              {/* Site ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Site ID
                </label>
                <input
                  type="text"
                  value={filters.site_id || ''}
                  onChange={(e) => setFilters({ ...filters, site_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Enter site ID..."
                />
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date From
                </label>
                <input
                  type="date"
                  value={filters.date_from || ''}
                  onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date To
                </label>
                <input
                  type="date"
                  value={filters.date_to || ''}
                  onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              {/* Status Multi-select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2">
                  {LEGAL_ENQUIRY_STATUS_OPTIONS.map(option => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(option.value)}
                        onChange={() => handleMultiSelectChange(option.value, selectedStatuses, setSelectedStatuses)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Enquiry Type Multi-select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enquiry Type
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2">
                  {LEGAL_ENQUIRY_TYPES.map(option => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(option.value)}
                        onChange={() => handleMultiSelectChange(option.value, selectedTypes, setSelectedTypes)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Receiver Multi-select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Received By
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2">
                  {LEGAL_ENQUIRY_RECEIVERS.map(option => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedReceivers.includes(option.value)}
                        onChange={() => handleMultiSelectChange(option.value, selectedReceivers, setSelectedReceivers)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Transaction Multi-select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transaction Type
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2">
                  {LEGAL_ENQUIRY_TRANSACTIONS.map(option => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.includes(option.value)}
                        onChange={() => handleMultiSelectChange(option.value, selectedTransactions, setSelectedTransactions)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Boolean Filters */}
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.payment_received === true}
                    onChange={(e) => setFilters({ 
                      ...filters, 
                      payment_received: e.target.checked ? true : undefined 
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Payment Received Only</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.gdpr_compliant === true}
                    onChange={(e) => setFilters({ 
                      ...filters, 
                      gdpr_compliant: e.target.checked ? true : undefined 
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">GDPR Compliant Only</span>
                </label>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={fetchReport}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Apply Filters
              </button>
              <button
                onClick={() => {
                  setFilters({});
                  setSelectedStatuses([]);
                  setSelectedTypes([]);
                  setSelectedReceivers([]);
                  setSelectedTransactions([]);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Summary Statistics */}
        {reportData?.results?.summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Enquiries</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {reportData.results.summary.total_enquiries}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Payment Value</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(reportData.results.summary.total_payment_value)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">GDPR Compliant</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {reportData.results.summary.open_enquiries} open / {reportData.results.summary.in_progress_enquiries} in progress
                  </p>
                </div>
                <Shield className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Resolution (days)</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {reportData.results.summary.average_resolution_days?.toFixed(1) || 'N/A'}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>
        )}

        {/* Export Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleExportCSV}
            disabled={exporting || loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export to CSV'}
          </button>
        </div>

        {/* Results Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : reportData?.results?.results && reportData.results.results.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Site
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Received
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      GDPR
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Days Since
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {reportData.results.results.map((enquiry: any) => (
                    <tr key={enquiry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {enquiry.site?.site_name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {enquiry.site?.site_id || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          enquiry.status === 'open' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : enquiry.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {enquiry.status_display}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {enquiry.enquiry_type_display}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {formatDate(enquiry.enquiry_receive_date)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {enquiry.enquiry_received_by_display}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {formatCurrency(enquiry.payment_value)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {enquiry.payment_status}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          enquiry.gdpr_compliance_status === 'compliant'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : enquiry.gdpr_compliance_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {enquiry.gdpr_compliance_status === 'compliant' ? 'Compliant' : 
                           enquiry.gdpr_compliance_status === 'pending' ? 'Pending' : 
                           'Non-compliant'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {enquiry.days_since_enquiry}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No legal enquiries found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LegalReportPage;