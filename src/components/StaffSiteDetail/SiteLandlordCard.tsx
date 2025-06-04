import React from 'react';

interface SiteLandlordCardProps {
  site: any;
  customer: any;
}

const SiteLandlordCard: React.FC<SiteLandlordCardProps> = ({ site, customer }) => (
  <div className="bg-white dark:bg-gray-800 rounded shadow dark:shadow-gray-700 p-8">
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Site Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 gap-y-2 text-sm text-gray-900 dark:text-gray-100">
        <div className="break-words min-w-0"><strong>Site Name:</strong> {site?.site_name || ''}</div>
        <div className="break-words min-w-0"><strong>Address:</strong> {site?.address || ''}</div>
        <div className="break-words min-w-0"><strong>Postcode:</strong> {site?.postcode || ''}</div>
        <div className="break-words min-w-0"><strong>Region:</strong> {site?.region || ''}</div>
        <div className="break-words min-w-0"><strong>Install Date:</strong> {site?.install_date || ''}</div>
        <div className="break-words min-w-0"><strong>FIT ID:</strong> {site?.fit_id || ''}</div>
        <div className="break-words min-w-0"><strong>FCO:</strong> {site?.fco || ''}</div>
        <div className="break-words min-w-0"><strong>Loan Number:</strong> {customer?.loan_num || 'n/a'}</div>
        <div className="break-words min-w-0"><strong>Inverter Number:</strong> {site?.inverter_num || ''}</div>
        <div className="break-words min-w-0"><strong>Inverter Exchange Date:</strong> {site?.inverter_exchange_date || ''}</div>
        <div className="break-words min-w-0"><strong>Last Reading Taken:</strong> {site?.last_reading || ''}</div>
        <div className="break-words min-w-0"><strong>Last Reading Date:</strong> {site?.last_reading_date || ''}</div>
      </div>
    </div>
    <div>
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Landlord Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 gap-y-2 text-sm text-gray-900 dark:text-gray-100">
        <div className="break-words min-w-0"><strong>Name:</strong> {customer?.owner || ''}</div>
        <div className="break-words min-w-0"><strong>Phone:</strong> {customer?.phone || ''}</div>
        <div className="break-words min-w-0"><strong>Email:</strong> {customer?.email || ''}</div>
        <div className="break-words min-w-0"><strong>Address:</strong> {customer?.owner_address || ''}</div>
      </div>
    </div>
  </div>
);

export default SiteLandlordCard; 