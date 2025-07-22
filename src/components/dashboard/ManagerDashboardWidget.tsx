import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { isManagerUser } from '../../utils/userPermissions';
import { ManagerDashboardWidgetConfig } from '../../types/dashboard';
import { Widget } from './Widget';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, AlertTriangle, Activity } from 'lucide-react';

interface ManagerDashboardWidgetProps {
  config: ManagerDashboardWidgetConfig;
}

export const ManagerDashboardWidget: React.FC<ManagerDashboardWidgetProps> = ({ config }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    // Check if user is in Manager group
    setIsManager(isManagerUser(user));
  }, [user]);

  if (!isManager) {
    return (
      <Widget config={config}>
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
          <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Manager Access Required</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            This widget is only available to users in the Manager group.
          </p>
        </div>
      </Widget>
    );
  }

  // Mock data for demonstration - replace with actual API calls
  const teamPerformanceData = [
    { name: 'Team A', tasks: 24, efficiency: 92 },
    { name: 'Team B', tasks: 18, efficiency: 88 },
    { name: 'Team C', tasks: 22, efficiency: 95 },
    { name: 'Team D', tasks: 20, efficiency: 90 },
  ];

  const stats = {
    totalTeamMembers: 42,
    activeProjects: 12,
    pendingApprovals: 5,
    weeklyGrowth: 8.5,
  };

  return (
    <Widget config={config}>
      <div className="h-full flex flex-col">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.totalTeamMembers}
              </span>
            </div>
            <div className="text-xs text-blue-800 dark:text-blue-300 mt-1">Team Members</div>
          </div>

          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.activeProjects}
              </span>
            </div>
            <div className="text-xs text-purple-800 dark:text-purple-300 mt-1">Active Projects</div>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800">
            <div className="flex items-center justify-between">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {stats.pendingApprovals}
              </span>
            </div>
            <div className="text-xs text-amber-800 dark:text-amber-300 mt-1">Pending Approvals</div>
          </div>

          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                +{stats.weeklyGrowth}%
              </span>
            </div>
            <div className="text-xs text-green-800 dark:text-green-300 mt-1">Weekly Growth</div>
          </div>
        </div>

        {/* Team Performance Chart */}
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Team Performance</h4>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={teamPerformanceData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:opacity-20" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11, fill: 'currentColor' }}
                axisLine={false}
                tickLine={false}
                className="text-gray-600 dark:text-gray-400"
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  fontSize: '12px',
                  backgroundColor: 'rgb(255, 255, 255)',
                  border: '1px solid rgb(229, 231, 235)',
                  borderRadius: '6px'
                }}
                wrapperClassName="!bg-white dark:!bg-gray-800 !border-gray-200 dark:!border-gray-700"
              />
              <Bar dataKey="efficiency" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Actions */}
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/users')}
              className="flex-1 py-2 px-3 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors"
            >
              Manage Team
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="flex-1 py-2 px-3 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-md transition-colors"
            >
              View Reports
            </button>
          </div>
        </div>
      </div>
    </Widget>
  );
};