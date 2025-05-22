import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FiInfo, FiAlertCircle, FiX } from 'react-icons/fi';
import { SiteAlert } from '../types/api';

// Support both the new props interface and the old one for backward compatibility
interface AlertBannerProps {
  alerts: SiteAlert[];
  onAddAlert?: () => void;
  onManageAlerts?: () => void;
}

const AlertBanner: React.FC<AlertBannerProps> = ({ 
  alerts, 
  onAddAlert, 
  onManageAlerts 
}) => {
  // Initialize with the alerts passed in props
  const [dismissedAlerts, setDismissedAlerts] = useState<number[]>([]);
  const [visibleAlerts, setVisibleAlerts] = useState<SiteAlert[]>(alerts);

  // Update visibleAlerts when alerts prop changes
  useEffect(() => {
    setVisibleAlerts(alerts.filter(alert => !dismissedAlerts.includes(alert.id)));
  }, [alerts, dismissedAlerts]);

  const handleDismiss = (alertId: number) => {
    setDismissedAlerts([...dismissedAlerts, alertId]);
    setVisibleAlerts(visibleAlerts.filter(alert => alert.id !== alertId));
  };

  if (visibleAlerts.length === 0) return null;

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <FiInfo className="text-blue-500" />;
      case 'warning':
        return <FiAlertCircle className="text-yellow-500" />;
      case 'danger':
        return <FiAlertCircle className="text-red-500" />;
      case 'success':
        return <FiInfo className="text-green-500" />;
      default:
        return <FiInfo className="text-blue-500" />;
    }
  };

  const getAlertTypeClasses = (type: string) => {
    switch (type) {
      case 'info':
        return 'border-blue-500 bg-blue-50';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50';
      case 'danger':
        return 'border-red-500 bg-red-50';
      case 'success':
        return 'border-green-500 bg-green-50';
      default:
        return 'border-blue-500 bg-blue-50';
    }
  };

  return (
    <div className="mb-4">
      <div className="bg-gray-100 border rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Site Alerts</h3>
          <div className="flex gap-2">
            {onAddAlert && (
              <button
                onClick={onAddAlert}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                Add Alert
              </button>
            )}
            {onManageAlerts && (
              <button
                onClick={onManageAlerts}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
              >
                Manage Alerts
              </button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          {visibleAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`border-l-4 p-3 relative ${getAlertTypeClasses(alert.alert_type)}`}
            >
              <button
                onClick={() => handleDismiss(alert.id)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                aria-label="Dismiss alert"
              >
                <FiX />
              </button>
              <div className="flex items-start gap-2 pr-6">
                <div className="mt-1">{getAlertTypeIcon(alert.alert_type)}</div>
                <div>
                  <p className="font-medium">{alert.message}</p>
                  <p className="text-sm text-gray-500">
                    Created by {alert.created_by} on{' '}
                    {format(new Date(alert.created_at), 'MMM d, yyyy')}
                    {alert.expires_at && (
                      <span>
                        {' '}
                        • Expires on {format(new Date(alert.expires_at), 'MMM d, yyyy')}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AlertBanner; 