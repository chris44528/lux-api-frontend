import React from 'react';

interface MeterInfoTabProps {
  meter: any;
  sim: any;
}

const MeterInfoTab: React.FC<MeterInfoTabProps> = ({ meter, sim }) => (
  <div className="flex flex-col lg:flex-row gap-6">
    {/* Meter Info Card */}
    <div className="bg-white dark:bg-gray-800 rounded shadow dark:shadow-gray-700 p-6 w-full lg:w-1/2">
      <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Installed Meter Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 gap-y-2 text-sm text-gray-700 dark:text-gray-300">
        <div className="break-words min-w-0"><strong className="text-gray-900 dark:text-gray-100">Serial:</strong> {meter?.meter_serial || ''}</div>
        <div className="break-words min-w-0"><strong className="text-gray-900 dark:text-gray-100">Model:</strong> {meter?.meter_model || ''}</div>
        <div className="break-words min-w-0"><strong className="text-gray-900 dark:text-gray-100">Install Date:</strong> {meter?.meter_install_date || ''}</div>
        <div className="break-words min-w-0"><strong className="text-gray-900 dark:text-gray-100">Last Reading:</strong> {meter?.last_reading || ''}</div>
        <div className="break-words min-w-0"><strong className="text-gray-900 dark:text-gray-100">Last Reading Date:</strong> {meter?.last_reading_date || ''}</div>
      </div>
    </div>
    {/* SIM Info Card */}
    <div className="bg-white dark:bg-gray-800 rounded shadow dark:shadow-gray-700 p-6 w-full lg:w-1/2">
      <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">SIM Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 gap-y-2 text-sm text-gray-700 dark:text-gray-300">
        <div className="break-words min-w-0"><strong className="text-gray-900 dark:text-gray-100">SIM Number:</strong> {sim?.sim_num || ''}</div>
        <div className="break-words min-w-0"><strong className="text-gray-900 dark:text-gray-100">CTN:</strong> {sim?.ctn || ''}</div>
        <div className="break-words min-w-0"><strong className="text-gray-900 dark:text-gray-100">IP Address:</strong> {sim?.sim_ip || ''}</div>
        <div className="break-words min-w-0"><strong className="text-gray-900 dark:text-gray-100">Assigned Date:</strong> {sim?.assigned_date || ''}</div>
      </div>
    </div>
  </div>
);

export default MeterInfoTab; 