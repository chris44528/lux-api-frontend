import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const NotFound: React.FC = () => {
  const [countdown, setCountdown] = useState(10);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (user) {
            navigate('/dashboard');
          } else {
            navigate('/');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, user]);

  const getRedirectPath = () => {
    return user ? '/dashboard' : '/';
  };

  const getRedirectText = () => {
    return user ? 'dashboard' : 'homepage';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 text-center">
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-[#1b5e20] mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Oops! Page Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            The page you're looking for cannot be found. Please use the link below to get back to safety.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to={getRedirectPath()}
            className="inline-block bg-[#1b5e20] text-white px-6 py-3 rounded-lg hover:bg-[#154a19] transition-colors font-medium"
          >
            Return to {getRedirectText()}
          </Link>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>You will be automatically redirected in</p>
            <span className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded font-mono text-lg mt-1">
              {countdown}s
            </span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;