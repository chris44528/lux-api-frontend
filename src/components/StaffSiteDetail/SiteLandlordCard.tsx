import React, { useState, useEffect } from 'react';
import { Switch } from '../ui/switch';
import { updateSite } from '../../services/api';

interface SiteLandlordCardProps {
  site: any;
  customer: any;
  isEditMode?: boolean;
  editedData?: {
    inverter_num?: string;
    inverter_exchange_date?: string;
    owner?: string;
    phone?: string;
    email?: string;
    owner_address?: string;
  };
  onEditChange?: (field: string, value: string) => void;
}

const SiteLandlordCard: React.FC<SiteLandlordCardProps> = ({ 
  site, 
  customer, 
  isEditMode = false, 
  editedData, 
  onEditChange 
}) => {
  const [lowRiso, setLowRiso] = useState(site?.low_riso || false);
  const [shading, setShading] = useState(site?.shading || false);
  const [trinaProject, setTrinaProject] = useState(site?.trina_project || false);
  const [updating, setUpdating] = useState(false);

  // Update local state when site prop changes
  useEffect(() => {
    setLowRiso(site?.low_riso || false);
    setShading(site?.shading || false);
    setTrinaProject(site?.trina_project || false);
  }, [site?.low_riso, site?.shading, site?.trina_project]);

  const handleToggleChange = async (field: 'low_riso' | 'shading' | 'trina_project', value: boolean) => {
    setUpdating(true);
    try {
      await updateSite(site?.id || site?.site_id, { [field]: value });
      // Update local state
      if (field === 'low_riso') setLowRiso(value);
      else if (field === 'shading') setShading(value);
      else if (field === 'trina_project') setTrinaProject(value);
    } catch (error) {
      console.error('Failed to update site:', error);
      // Revert on error
      if (field === 'low_riso') setLowRiso(!value);
      else if (field === 'shading') setShading(!value);
      else if (field === 'trina_project') setTrinaProject(!value);
    } finally {
      setUpdating(false);
    }
  };

  return (
  <div className={`bg-white dark:bg-gray-800 rounded shadow dark:shadow-gray-700 p-8 ${isEditMode ? 'ring-2 ring-blue-500' : ''}`}>
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
        Site Details
        {isEditMode && <span className="text-sm font-normal text-blue-600 dark:text-blue-400">(Editing)</span>}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 gap-y-2 text-sm text-gray-900 dark:text-gray-100">
        <div className="break-words min-w-0"><strong>Site Name:</strong> {site?.site_name || ''}</div>
        <div className="break-words min-w-0"><strong>Address:</strong> {site?.address || ''}</div>
        <div className="break-words min-w-0"><strong>Postcode:</strong> {site?.postcode || ''}</div>
        <div className="break-words min-w-0"><strong>Region:</strong> {site?.region || ''}</div>
        <div className="break-words min-w-0"><strong>Install Date:</strong> {site?.install_date || ''}</div>
        <div className="break-words min-w-0"><strong>FIT ID:</strong> {site?.fit_id || ''}</div>
        <div className="break-words min-w-0"><strong>FCO:</strong> {site?.fco || ''}</div>
        <div className="break-words min-w-0"><strong>Loan Number:</strong> {customer?.loan_num || 'n/a'}</div>
        <div className="break-words min-w-0">
          <strong>Inverter Number:</strong> 
          {isEditMode ? (
            <input
              type="text"
              value={editedData?.inverter_num ?? site?.inverter_num ?? ''}
              onChange={(e) => onEditChange?.('inverter_num', e.target.value)}
              className="ml-2 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-48 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          ) : (
            <span> {site?.inverter_num || ''}</span>
          )}
        </div>
        <div className="break-words min-w-0">
          <strong>Inverter Exchange Date:</strong> 
          {isEditMode ? (
            <input
              type="date"
              value={editedData?.inverter_exchange_date ?? site?.inverter_exchange_date ?? ''}
              onChange={(e) => onEditChange?.('inverter_exchange_date', e.target.value)}
              className="ml-2 px-2 py-1 border rounded text-sm w-40 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          ) : (
            <span> {site?.inverter_exchange_date || ''}</span>
          )}
        </div>
        <div className="break-words min-w-0"><strong>Last Reading Taken:</strong> {site?.last_reading || ''}</div>
        <div className="break-words min-w-0"><strong>Last Reading Date:</strong> {site?.last_reading_date || ''}</div>
      </div>
      {/* New row for toggle switches */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <Switch
            id="low-riso"
            checked={lowRiso}
            onCheckedChange={(checked) => handleToggleChange('low_riso', checked)}
            disabled={updating}
          />
          <label htmlFor="low-riso" className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
            Low RISO
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="shading"
            checked={shading}
            onCheckedChange={(checked) => handleToggleChange('shading', checked)}
            disabled={updating}
          />
          <label htmlFor="shading" className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
            Shading
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="trina-project"
            checked={trinaProject}
            onCheckedChange={(checked) => handleToggleChange('trina_project', checked)}
            disabled={updating}
          />
          <label htmlFor="trina-project" className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
            Trina Project
          </label>
        </div>
      </div>
    </div>
    <div>
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Landlord Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 gap-y-2 text-sm text-gray-900 dark:text-gray-100">
        <div className="break-words min-w-0">
          <strong>Name:</strong>
          {isEditMode ? (
            <input
              type="text"
              value={editedData?.owner ?? customer?.owner ?? ''}
              onChange={(e) => onEditChange?.('owner', e.target.value)}
              className="ml-2 px-2 py-1 border rounded text-sm w-40 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          ) : (
            <span> {customer?.owner || ''}</span>
          )}
        </div>
        <div className="break-words min-w-0">
          <strong>Phone:</strong>
          {isEditMode ? (
            <input
              type="tel"
              value={editedData?.phone ?? customer?.phone ?? ''}
              onChange={(e) => onEditChange?.('phone', e.target.value)}
              className="ml-2 px-2 py-1 border rounded text-sm w-40 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          ) : (
            <span> {customer?.phone || ''}</span>
          )}
        </div>
        <div className="break-words min-w-0">
          <strong>Email:</strong>
          {isEditMode ? (
            <input
              type="email"
              value={editedData?.email ?? customer?.email ?? ''}
              onChange={(e) => onEditChange?.('email', e.target.value)}
              className="ml-2 px-2 py-1 border rounded text-sm w-40 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          ) : (
            <span> {customer?.email || ''}</span>
          )}
        </div>
        <div className="break-words min-w-0">
          <strong>Address:</strong>
          {isEditMode ? (
            <input
              type="text"
              value={editedData?.owner_address ?? customer?.owner_address ?? ''}
              onChange={(e) => onEditChange?.('owner_address', e.target.value)}
              className="ml-2 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full max-w-xs dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          ) : (
            <span> {customer?.owner_address || ''}</span>
          )}
        </div>
      </div>
    </div>
  </div>
  );
};

export default SiteLandlordCard; 