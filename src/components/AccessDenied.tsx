import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Home, ArrowLeft } from 'lucide-react';

const AccessDenied: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { from?: string; permission?: string } | null;

  const handleGoBack = () => {
    // Try to go back to previous page, or go to dashboard
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          {/* Icon */}
          <div className="mx-auto w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
            <Shield className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Access Denied
          </h1>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            You don't have permission to access this page.
          </p>

          {/* Additional Info */}
          {state?.from && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              Attempted to access: <span className="font-mono">{state.from}</span>
            </p>
          )}

          {state?.permission && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              Required permission: <span className="font-mono">{state.permission}</span>
            </p>
          )}

          <p className="text-sm text-gray-500 dark:text-gray-500 mb-8">
            If you believe you should have access to this page, please contact your administrator.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleGoBack}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
            <button
              onClick={handleGoHome}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Home className="w-4 h-4" />
              Go to Dashboard
            </button>
          </div>
        </div>

        {/* Contact Info */}
        <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          Need help? Contact support at{' '}
          <a href="mailto:support@lux.com" className="text-blue-600 dark:text-blue-400 hover:underline">
            support@lux.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default AccessDenied;