import React, { useState, useEffect } from 'react';
import { SiteAlert, getSiteAlerts, deactivateSiteAlert, deleteSiteAlert } from '../services/api';
import { format } from 'date-fns';

interface ManageAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string;
  onEdit: (alert: SiteAlert) => void;
  onSuccess: () => void;
}

const ManageAlertsModal: React.FC<ManageAlertsModalProps> = ({
  isOpen,
  onClose,
  siteId,
  onEdit,
  onSuccess,
}) => {
  const [alerts, setAlerts] = useState<SiteAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<number | null>(null);

  const fetchAlerts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getSiteAlerts(siteId, !showInactive);
      setAlerts(data);
    } catch (err) {
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAlerts();
    }
  }, [isOpen, siteId, showInactive]);

  const handleDeactivate = async (alertId: number) => {
    try {
      await deactivateSiteAlert(alertId);
      setConfirmDeactivate(null);
      fetchAlerts();
      onSuccess();
    } catch (err) {
      setError('Failed to deactivate alert');
    }
  };

  const handleDelete = async (alertId: number) => {
    try {
      await deleteSiteAlert(alertId);
      setConfirmDelete(null);
      fetchAlerts();
      onSuccess();
    } catch (err) {
      setError('Failed to delete alert');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (err) {
      return dateString;
    }
  };

  const getAlertTypeClass = (alertType: string) => {
    switch (alertType) {
      case 'info':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400';
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400';
      case 'danger':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400';
      case 'success':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold dark:text-white">Manage Site Alerts</h2>
          <div className="flex items-center">
            <label className="inline-flex items-center mr-4">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={() => setShowInactive(!showInactive)}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-sm dark:text-gray-300">Show inactive alerts</span>
            </label>
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-4 overflow-y-auto flex-grow">
          {error && (
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No alerts found
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`border dark:border-gray-700 rounded-lg p-4 ${!alert.is_active || alert.is_expired ? 'opacity-60' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getAlertTypeClass(alert.alert_type)}`}>
                          {alert.alert_type}
                        </span>
                        {!alert.is_active && (
                          <span className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded text-xs font-medium">
                            Inactive
                          </span>
                        )}
                        {alert.is_expired && (
                          <span className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded text-xs font-medium">
                            Expired
                          </span>
                        )}
                      </div>
                      <p className="text-gray-800 dark:text-gray-200 font-medium">{alert.message}</p>
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <p>Created by: {alert.created_by_username || 'Unknown'}</p>
                        <p>Created: {formatDate(alert.created_at)}</p>
                        <p>Expires: {alert.never_expire ? 'Never' : formatDate(alert.expires_at)}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {alert.is_active && !alert.is_expired && (
                        <>
                          <button
                            onClick={() => onEdit(alert)}
                            className="px-3 py-1 bg-blue-500 dark:bg-blue-600 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-700 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setConfirmDeactivate(alert.id)}
                            className="px-3 py-1 bg-yellow-500 dark:bg-yellow-600 text-white rounded hover:bg-yellow-600 dark:hover:bg-yellow-700 text-sm"
                          >
                            Deactivate
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setConfirmDelete(alert.id)}
                        className="px-3 py-1 bg-red-500 dark:bg-red-600 text-white rounded hover:bg-red-600 dark:hover:bg-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  {confirmDeactivate === alert.id && (
                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                      <p className="text-yellow-700 dark:text-yellow-400 mb-2">Are you sure you want to deactivate this alert?</p>
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setConfirmDeactivate(null)}
                          className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDeactivate(alert.id)}
                          className="px-3 py-1 bg-yellow-500 dark:bg-yellow-600 text-white rounded hover:bg-yellow-600 dark:hover:bg-yellow-700 text-sm"
                        >
                          Confirm Deactivate
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {confirmDelete === alert.id && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                      <p className="text-red-700 dark:text-red-400 mb-2">Are you sure you want to delete this alert?</p>
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(alert.id)}
                          className="px-3 py-1 bg-red-500 dark:bg-red-600 text-white rounded hover:bg-red-600 dark:hover:bg-red-700 text-sm"
                        >
                          Confirm Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageAlertsModal; 