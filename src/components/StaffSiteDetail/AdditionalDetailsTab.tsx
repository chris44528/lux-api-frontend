import React from 'react';
import { Calendar, Home, FileText, User, Package, CheckCircle2, XCircle } from 'lucide-react';

interface ActAdditionalFields {
  id: number;
  survey_date: string;
  survey_returned_date: string;
  home_visit_date: string;
  home_visitor_name: string;
  lightweight: boolean;
  number_of_pannels: string;
}

interface AdditionalDetailsTabProps {
  additionalFields: ActAdditionalFields | null | undefined;
}

const AdditionalDetailsTab: React.FC<AdditionalDetailsTabProps> = ({ additionalFields }) => {
  if (!additionalFields) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
        <FileText className="w-5 h-5 mr-2" />
        <span>No additional details available for this site.</span>
      </div>
    );
  }

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

  const fields = [
    {
      label: 'Survey Date',
      value: formatDate(additionalFields.survey_date),
      icon: <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500" />
    },
    {
      label: 'Survey Returned Date',
      value: formatDate(additionalFields.survey_returned_date),
      icon: <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500" />
    },
    {
      label: 'Home Visit Date',
      value: formatDate(additionalFields.home_visit_date),
      icon: <Home className="w-5 h-5 text-gray-400 dark:text-gray-500" />
    },
    {
      label: 'Home Visitor Name',
      value: additionalFields.home_visitor_name || 'Not specified',
      icon: <User className="w-5 h-5 text-gray-400 dark:text-gray-500" />
    },
    {
      label: 'Lightweight',
      value: (
        <div className="flex items-center gap-2">
          {additionalFields.lightweight ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-green-700 dark:text-green-400 font-medium">Yes</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-red-700 dark:text-red-400 font-medium">No</span>
            </>
          )}
        </div>
      ),
      icon: <Package className="w-5 h-5 text-gray-400 dark:text-gray-500" />
    },
    {
      label: 'Number of Panels',
      value: additionalFields.number_of_pannels || 'Not specified',
      icon: <Package className="w-5 h-5 text-gray-400 dark:text-gray-500" />
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field, index) => (
          <div
            key={index}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {field.icon}
              </div>
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {field.label}
                </dt>
                <dd className="text-base text-gray-900 dark:text-gray-100">
                  {typeof field.value === 'string' ? field.value : field.value}
                </dd>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
              Additional Site Information
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              This information is related to site surveys and installations. All dates are displayed in DD/MM/YYYY format.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdditionalDetailsTab;