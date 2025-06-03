import React, { useState } from 'react';
import { FileText, History, Plus } from 'lucide-react';
import LegalEnquiryForm from './LegalEnquiryForm';
import LegalEnquiryHistory from './LegalEnquiryHistory';

interface LegalTabProps {
  siteId: string;
}

type ViewMode = 'menu' | 'new-enquiry' | 'history';

const LegalTab: React.FC<LegalTabProps> = ({ siteId }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('menu');

  const handleNewEnquirySuccess = () => {
    setViewMode('history'); // Show history after successful creation
  };

  if (viewMode === 'new-enquiry') {
    return (
      <LegalEnquiryForm 
        siteId={siteId} 
        onBack={() => setViewMode('menu')}
        onSuccess={handleNewEnquirySuccess}
      />
    );
  }

  if (viewMode === 'history') {
    return (
      <LegalEnquiryHistory 
        siteId={siteId} 
        onBack={() => setViewMode('menu')}
      />
    );
  }

  // Menu view
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Legal Enquiries</h3>
        <p className="text-gray-500 dark:text-gray-400">Manage legal enquiries and documentation for this site</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* New Legal Enquiry Card */}
        <button
          onClick={() => setViewMode('new-enquiry')}
          className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 p-8 text-left border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
              <Plus className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">New Legal Enquiry</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create a new legal enquiry with all necessary documentation and tracking information
            </p>
          </div>
        </button>

        {/* See History Card */}
        <button
          onClick={() => setViewMode('history')}
          className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 p-8 text-left border border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-400"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
              <History className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">See History</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              View all past legal enquiries and their current status for this site
            </p>
          </div>
        </button>
      </div>

      {/* Information Section */}
      <div className="max-w-4xl mx-auto mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
              Legal Enquiry Management
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              This section allows you to create and track legal enquiries related to this site. 
              All enquiries are stored with complete audit trails including GDPR compliance, 
              payment tracking, and deed of variation progress.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalTab;