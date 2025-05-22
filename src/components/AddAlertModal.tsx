import React, { useState, useEffect } from 'react';
import { getAlertTypes, createSiteAlert, AlertType } from '../services/api';

interface AddAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string;
  onSuccess: () => void;
}

const AddAlertModal: React.FC<AddAlertModalProps> = ({
  isOpen,
  onClose,
  siteId,
  onSuccess,
}) => {
  const [message, setMessage] = useState('');
  const [alertType, setAlertType] = useState<string>('info');
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
        // Set default alert type to the first one if available
        if (Object.keys(alert_types).length > 0) {
          setAlertType(Object.keys(alert_types)[0]);
        }
      } catch (err) {
        console.error('Error fetching alert types:', err);
      }
    };

    fetchAlertTypes();
  }, []);

  const resetForm = () => {
    setMessage('');
    setAlertType(Object.keys(alertTypes).length > 0 ? Object.keys(alertTypes)[0] : 'info');
    setExpirationType('date');
    setExpiryDate('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        alert_type: alertType,
        expires_at: expirationType === 'date' ? expiryDate : null,
        never_expire: expirationType === 'never',
      };

      // Make API call to create alert using the service function
      await createSiteAlert(siteId, payload);

      // Reset form and close modal on success
      resetForm();
      onSuccess();
      onClose();
    } catch (err) {
      setError('An error occurred while creating the alert');
      console.error('Error creating alert:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when modal is opened
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, alertTypes]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Add Site Alert</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Alert Message*
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                required
              />
            </div>
            
            <div>
              <label htmlFor="alertType" className="block text-sm font-medium text-gray-700 mb-1">
                Alert Type
              </label>
              <select
                id="alertType"
                value={alertType}
                onChange={(e) => setAlertType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(alertTypes).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <span className="ml-2">Set expiry date</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="never"
                    checked={expirationType === 'never'}
                    onChange={() => setExpirationType('never')}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Never expires</span>
                </label>
              </div>
            </div>
            
            {expirationType === 'date' && (
              <div>
                <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date*
                </label>
                <input
                  type="date"
                  id="expiryDate"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                  required={expirationType === 'date'}
                />
              </div>
            )}
          </div>
          
          <div className="p-4 border-t flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAlertModal; 