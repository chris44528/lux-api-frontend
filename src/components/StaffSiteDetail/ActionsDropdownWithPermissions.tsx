import React, { useState, useEffect } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { 
  ChevronDown, 
  Wrench, 
  Smartphone, 
  StickyNote, 
  Briefcase, 
  FileDown, 
  Activity, 
  Bell, 
  GitCompare, 
  MessageSquare 
} from 'lucide-react';
import { useUIPermission } from '../../hooks/useUIPermission';

interface Action {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: string;
  onClick: () => void;
  separator?: boolean;
}

interface ActionsDropdownProps {
  onTestMeter: () => void;
  onChangeMeter: () => void;
  onChangeSim: () => void;
  onAddNote: () => void;
  onCreateJob: () => void;
  onExportSite: () => void;
  onAdvancedMonitoring: () => void;
  onManageAlerts: () => void;
  onCompareReadings: () => void;
  onTextLandlord: () => void;
  disabled?: boolean;
}

// Example implementation with granular UI permissions
export function ActionsDropdownWithPermissions({
  onTestMeter,
  onChangeMeter,
  onChangeSim,
  onAddNote,
  onCreateJob,
  onExportSite,
  onAdvancedMonitoring,
  onManageAlerts,
  onCompareReadings,
  onTextLandlord,
  disabled = false
}: ActionsDropdownProps) {
  const [visibleActions, setVisibleActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);

  // Define all possible actions with their permissions
  const allActions: Action[] = [
    {
      id: 'test_meter',
      label: 'Test Meter',
      icon: Wrench,
      permission: 'sites.detail.actions.test_meter',
      onClick: onTestMeter
    },
    {
      id: 'change_meter',
      label: 'Change Meter',
      icon: Wrench,
      permission: 'sites.detail.actions.change_meter',
      onClick: onChangeMeter
    },
    {
      id: 'change_sim',
      label: 'Change SIM',
      icon: Smartphone,
      permission: 'sites.detail.actions.change_sim',
      onClick: onChangeSim,
      separator: true
    },
    {
      id: 'add_note',
      label: 'Add Note',
      icon: StickyNote,
      permission: 'sites.detail.actions.add_note',
      onClick: onAddNote
    },
    {
      id: 'create_job',
      label: 'Create Job',
      icon: Briefcase,
      permission: 'sites.detail.actions.create_job',
      onClick: onCreateJob,
      separator: true
    },
    {
      id: 'export_site',
      label: 'Export Site Data',
      icon: FileDown,
      permission: 'sites.detail.actions.export_site',
      onClick: onExportSite
    },
    {
      id: 'advanced_monitoring',
      label: 'Advanced Monitoring',
      icon: Activity,
      permission: 'sites.detail.actions.advanced_monitoring',
      onClick: onAdvancedMonitoring
    },
    {
      id: 'manage_alerts',
      label: 'Manage Alerts',
      icon: Bell,
      permission: 'sites.detail.actions.manage_alerts',
      onClick: onManageAlerts
    },
    {
      id: 'compare_readings',
      label: 'Compare Readings',
      icon: GitCompare,
      permission: 'sites.detail.actions.compare_readings',
      onClick: onCompareReadings,
      separator: true
    },
    {
      id: 'text_landlord',
      label: 'Text Landlord',
      icon: MessageSquare,
      permission: 'sites.detail.actions.text_landlord',
      onClick: onTextLandlord
    }
  ];

  // Check permissions for each action
  useEffect(() => {
    async function checkPermissions() {
      setLoading(true);
      
      // In a real implementation, this would use the permission service
      // For now, we'll simulate the permission check
      const permissionChecks = await Promise.all(
        allActions.map(async (action) => {
          // This would be replaced with actual permission check:
          // const hasPermission = await uiPermissionService.hasPermission(action.permission);
          const hasPermission = await checkPermission(action.permission);
          return { action, hasPermission };
        })
      );

      // Filter to only visible actions
      const allowedActions = permissionChecks
        .filter(({ hasPermission }) => hasPermission)
        .map(({ action }) => action);

      setVisibleActions(allowedActions);
      setLoading(false);
    }

    checkPermissions();
  }, []);

  // Simulated permission check - replace with actual service call
  async function checkPermission(permission: string): Promise<boolean> {
    // This is a placeholder - in real implementation:
    // return uiPermissionService.hasPermission(permission);
    
    // For demo purposes, we'll allow some actions
    const allowedPermissions = [
      'sites.detail.actions.test_meter',
      'sites.detail.actions.add_note',
      'sites.detail.actions.create_job',
      'sites.detail.actions.export_site'
    ];
    
    return allowedPermissions.includes(permission);
  }

  // Don't render if no actions are available
  if (loading) {
    return (
      <Button variant="outline" disabled>
        <span className="animate-pulse">Loading...</span>
      </Button>
    );
  }

  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          Actions
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {visibleActions.map((action, index) => {
          const Icon = action.icon;
          const previousAction = index > 0 ? visibleActions[index - 1] : null;
          const showSeparator = previousAction?.separator && index > 0;

          return (
            <React.Fragment key={action.id}>
              {showSeparator && <DropdownMenuSeparator />}
              <DropdownMenuItem 
                onClick={action.onClick}
                className="cursor-pointer"
              >
                <Icon className="mr-2 h-4 w-4" />
                {action.label}
              </DropdownMenuItem>
            </React.Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Hook implementation example (to be moved to separate file)
export function useUIPermission(permission: string | string[]) {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated permission check
    const checkPermission = async () => {
      // In real implementation:
      // const result = await uiPermissionService.hasPermission(permission);
      
      // For demo:
      const allowedPermissions = [
        'sites.detail.actions.test_meter',
        'sites.detail.actions.add_note',
        'sites.detail.actions.create_job',
        'sites.detail.actions.export_site'
      ];
      
      if (Array.isArray(permission)) {
        setHasPermission(permission.some(p => allowedPermissions.includes(p)));
      } else {
        setHasPermission(allowedPermissions.includes(permission));
      }
      setLoading(false);
    };

    checkPermission();
  }, [permission]);

  return { hasPermission, loading };
}