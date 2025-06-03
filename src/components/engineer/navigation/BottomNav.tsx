import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/engineer/dashboard', label: 'Home', icon: '🏠' },
    { path: '/engineer/routes', label: 'Routes', icon: '🗺️' },
    { path: '/engineer/forms/new', label: 'Forms', icon: '📝' },
    { path: '/engineer/history', label: 'History', icon: '📊' },
    { path: '/engineer/settings', label: 'More', icon: '⚙️' },
  ];

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center py-2 px-3 flex-1 transition-colors
              ${isActive(item.path) 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            <span className="text-xl mb-1">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;