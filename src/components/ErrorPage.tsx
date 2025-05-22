import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ErrorPageProps {
  errorCode: number;
  title?: string;
  message?: string;
  showRetry?: boolean;
  onRetry?: () => void;
}

const ErrorPage: React.FC<ErrorPageProps> = ({
  errorCode,
  title,
  message,
  showRetry = false,
  onRetry
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getDefaultTitle = (code: number): string => {
    switch (code) {
      case 403: return 'Access Forbidden';
      case 404: return 'Page Not Found';
      case 500: return 'Server Error';
      case 503: return 'Service Unavailable';
      default: return 'Error';
    }
  };

  const getDefaultMessage = (code: number): string => {
    switch (code) {
      case 403: return 'You don\'t have permission to access this resource.';
      case 404: return 'The page you\'re looking for cannot be found.';
      case 500: return 'Something went wrong on our end. Please try again later.';
      case 503: return 'The service is temporarily unavailable. Please try again later.';
      default: return 'An unexpected error occurred.';
    }
  };

  const getIcon = (code: number): string => {
    switch (code) {
      case 403: return '🚫';
      case 404: return '🔍';
      case 500: return '⚠️';
      case 503: return '🔧';
      default: return '❌';
    }
  };

  const displayTitle = title || getDefaultTitle(errorCode);
  const displayMessage = message || getDefaultMessage(errorCode);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mb-6">
          <div className="text-6xl mb-4">{getIcon(errorCode)}</div>
          <h1 className="text-6xl font-bold text-[#1b5e20] mb-2">{errorCode}</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {displayTitle}
          </h2>
          <p className="text-gray-600 mb-6">
            {displayMessage}
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex gap-3">
            <Link
              to={user ? '/dashboard' : '/'}
              className="flex-1 bg-[#1b5e20] text-white px-4 py-3 rounded-lg hover:bg-[#154a19] transition-colors font-medium"
            >
              🏠 Go Home
            </Link>
            <button
              onClick={() => navigate(-1)}
              className="flex-1 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              ← Go Back
            </button>
          </div>
          
          {showRetry && onRetry && (
            <button
              onClick={onRetry}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              🔄 Try Again
            </button>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;