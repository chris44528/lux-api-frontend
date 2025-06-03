import React, { useState, useEffect } from 'react';
import EngineerDashboard from '../../components/engineer/dashboard/EngineerDashboard';
import MobileEngineerDashboard from '../../components/engineer/dashboard/MobileEngineerDashboard';
import { useAuth } from '../../hooks/useAuth';

const EngineerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  
  // Get engineer ID from user context
  const engineerId = user?.engineer_id || parseInt(localStorage.getItem('currentEngineerId') || '0');

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!engineerId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Engineer Access Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            This account is not associated with an engineer profile.
          </p>
        </div>
      </div>
    );
  }

  // Use MobileEngineerDashboard for mobile devices
  if (isMobile) {
    return <MobileEngineerDashboard />;
  }

  return <EngineerDashboard engineerId={engineerId} />;
};

export default EngineerDashboardPage;