import React, { useState } from 'react';
import { requestSiteReadingReport } from '../services/api';

interface SiteReadingReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string;
  siteName?: string;
  siteReference?: string;
  availableMeters?: Array<{ meter_serial: string; export_meter?: boolean }>;
}

const SiteReadingReportModal: React.FC<SiteReadingReportModalProps> = ({
  isOpen,
  onClose,
  siteId,
  siteName = '',
  siteReference = '',
  availableMeters = []
}) => {
  // Set default dates (last 30 days)
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [selectedMeter, setSelectedMeter] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate dates
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError('End date must be after start date');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await requestSiteReadingReport(siteId, {
        start_date: startDate,
        end_date: endDate,
        meter_serial: selectedMeter !== 'all' ? selectedMeter : undefined
      });

      // Show success message
      alert(response.message || 'Report generation started. You will receive an email when it\'s ready.');
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'An error occurred while requesting the report';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    if (startDate && newEndDate && new Date(newEndDate) < new Date(startDate)) {
      setError('End date must be after start date');
      return;
    }
    setError('');
    setEndDate(newEndDate);
  };

  if (!isOpen) return null;

  // Get generation meters (non-export meters)
  const generationMeters = availableMeters.filter(meter => !meter.export_meter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md">
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold dark:text-white">Generate Site Reading Report</h2>
          {siteName && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {siteName} {siteReference ? `(${siteReference})` : ''}
            </p>
          )}
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 px-4 py-3 rounded">
              <div className="flex">
                <svg className="h-5 w-5 text-blue-400 dark:text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>The report will be generated in the background and sent to your email address when ready.</p>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                required
              />
            </div>
            
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={handleEndDateChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                required
              />
            </div>

            {generationMeters.length > 0 && (
              <div>
                <label htmlFor="meterSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Meter
                </label>
                <select
                  id="meterSelect"
                  value={selectedMeter}
                  onChange={(e) => setSelectedMeter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                >
                  <option value="all">All Meters</option>
                  {generationMeters.map(meter => (
                    <option key={meter.meter_serial} value={meter.meter_serial}>
                      {meter.meter_serial}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t dark:border-gray-700 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 dark:bg-green-600 text-white rounded hover:bg-green-600 dark:hover:bg-green-700 disabled:opacity-50 flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Requesting...
                </>
              ) : (
                'Generate Report'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SiteReadingReportModal; 