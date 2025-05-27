import React, { useState, useEffect } from 'react';
import { SiteAlert, getAlertTypes, updateSiteAlert, AlertType } from '../services/api';

interface EditAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: SiteAlert | null;
  onSuccess: () => void;
}

const EditAlertModal: React.FC<EditAlertModalProps> = ({
  isOpen,
  onClose,
  alert,
  onSuccess,
}) => {
  const [message, setMessage] = useState('');
  const [alertType, setAlertType] = useState<string>('');
  const [expirationType, setExpirationType] = useState<'date' | 'never'>('date');
  const [expiryDate, setExpiryDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [alertTypes, setAlertTypes] = useState<AlertType>({});

  useEffect(() => {
    // Fetch alert types when component mounts
    const fetchAlertTypes = async () => {
      try {
        const { alert_types } = await getAlertTypes();
        setAlertTypes(alert_types);
      } catch (err) {
      }
    };

    fetchAlertTypes();
  }, []);

  // Initialize form with alert data when alert changes
  useEffect(() => {
    if (alert) {
      setMessage(alert.message);
      setAlertType(alert.alert_type);
      setExpirationType(alert.never_expire ? 'never' : 'date');
      setExpiryDate(alert.expires_at ? alert.expires_at.split('T')[0] : '');
    }
  }, [alert]);

  const resetForm = () => {
    if (!alert) return;
    
    setMessage(alert.message);
    setAlertType(alert.alert_type);
    setExpirationType(alert.never_expire ? 'never' : 'date');
    setExpiryDate(alert.expires_at ? alert.expires_at.split('T')[0] : '');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alert) return;
    
    setError('');

    // Validate form
    if (!message.trim()) {
      setError('Alert message is required');
      return;
    }

    if (expirationType === 'date' && !expiryDate) {
      setError('Expiry date is required when expiration type is set to date');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare payload
      const payload = {
        message: message.trim(),
        alert_type: alertType as 'info' | 'warning' | 'danger' | 'success',
        expires_at: expirationType === 'date' ? expiryDate : null,
        never_expire: expirationType === 'never',
      };

      // Make API call to update alert
      await updateSiteAlert(alert.id, payload);

      // Reset form and close modal on success
      onSuccess();
      onClose();
    } catch (err) {
      setError('An error occurred while updating the alert');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when modal is opened
  useEffect(() => {
    if (isOpen && alert) {
      resetForm();
    }
  }, [isOpen, alert]);

  if (!isOpen || !alert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md">
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold dark:text-white">Edit Site Alert</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            {error && (
              <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Alert Message*
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                required
              />
            </div>
            
            <div>
              <label htmlFor="alertType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Alert Type
              </label>
              <select
                id="alertType"
                value={alertType}
                onChange={(e) => setAlertType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(alertTypes).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expiration
              </label>
              <div className="flex items-center space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="date"
                    checked={expirationType === 'date'}
                    onChange={() => setExpirationType('date')}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 dark:text-gray-300">Set expiry date</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="never"
                    checked={expirationType === 'never'}
                    onChange={() => setExpirationType('never')}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 dark:text-gray-300">Never expires</span>
                </label>
              </div>
            </div>
            
            {expirationType === 'date' && (
              <div>
                <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Expiry Date*
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="expiryDate"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                    min={new Date().toISOString().split('T')[0]}
                    required={expirationType === 'date'}
                    onClick={(e) => {
                      // Try to trigger the date picker on click
                      const input = e.target as HTMLInputElement;
                      if (input.showPicker) {
                        input.showPicker();
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t dark:border-gray-700 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAlertModal; 