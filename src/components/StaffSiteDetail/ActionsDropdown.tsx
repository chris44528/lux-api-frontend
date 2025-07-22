import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useUIPermissionContext } from '../../contexts/UIPermissionContext';
import { useNavigate } from 'react-router-dom';

interface MenuItem {
  label: string;
  section: string;
  icon: string;
  permission: string;
  action?: string;
}

const allMenuItems: MenuItem[] = [
  { label: 'Edit Site', section: 'Site Actions', icon: '✏️', permission: 'sites.detail.edit', action: 'editSite' },
  { label: 'Test Meter', section: 'Site Actions', icon: '🔄', permission: 'sites.detail.actions.test_meter', action: 'testMeter' },
  { label: 'Change Sim', section: 'Site Actions', icon: '📱', permission: 'sites.detail.actions.change_sim', action: 'changeSim' },
  { label: 'Change Meter', section: 'Site Actions', icon: '√', permission: 'sites.detail.actions.change_meter', action: 'changeMeter' },
  { label: 'Compare Readings', section: 'Site Actions', icon: '📊', permission: 'sites.detail.actions.compare', action: 'compareReadings' },
  { label: 'Add Note', section: 'Site Actions', icon: '📝', permission: 'sites.detail.actions.add_note', action: 'addNote' },
  { label: 'Create Job', section: 'Site Actions', icon: '🔧', permission: 'sites.detail.actions.create_job', action: 'createJob' },
  { label: 'Temp Removal', section: 'Site Actions', icon: '🚫', permission: 'sites.detail.actions.temp_removal', action: 'tempRemoval' },
  { label: 'New Home Owner', section: 'Site Actions', icon: '🏠', permission: 'sites.detail.actions.new_home_owner', action: 'newHomeOwner' },
  { label: 'Text Message', section: 'Site Communication', icon: '💬', permission: 'sites.detail.actions.text_landlord', action: 'textMessage' },
  { label: 'Send Email', section: 'Site Communication', icon: '✉️', permission: 'sites.detail.actions.send_email', action: 'sendEmail' },
  { label: 'Add Alert', section: 'Alerts', icon: '🔔', permission: 'sites.detail.actions.alerts', action: 'addAlert' },
  { label: 'Manage Alerts', section: 'Alerts', icon: '❗', permission: 'sites.detail.actions.alerts', action: 'manageAlerts' },
  { label: 'Site Reading Report', section: 'Reports & Advanced', icon: '🗒️', permission: 'sites.detail.actions.export', action: 'siteReadingReport' },
  { label: 'Export Site Data', section: 'Reports & Advanced', icon: '💾', permission: 'sites.detail.actions.export', action: 'exportSite' },
  { label: 'Meter History', section: 'Reports & Advanced', icon: '⏱️', permission: 'sites.detail.actions.export', action: 'meterHistory' },
  { label: 'Advanced Monitoring', section: 'Reports & Advanced', icon: '⚡', permission: 'sites.detail.actions.monitoring', action: 'advancedMonitoring' },
];

const sectionOrder = [
  'Site Actions',
  'Site Communication',
  'Alerts',
  'Reports & Advanced',
];

interface ActionsDropdownProps {
  onEditSite?: () => void;
  onAddNote?: () => void;
  onTestMeter?: () => void;
  onChangeSim?: () => void;
  onChangeMeter?: () => void;
  onCompareReadings?: () => void;
  onAddAlert?: () => void;
  onManageAlerts?: () => void;
  onMeterHistory?: () => void;
  onTextMessage?: () => void;
  onSendEmail?: () => void;
  onSiteReadingReport?: () => void;
  onAdvancedMonitoring?: () => void;
  onCreateJob?: () => void;
  onExportSite?: () => void;
  onTempRemoval?: () => void;
  onNewHomeOwner?: () => void;
  siteId?: string;
}

const ActionsDropdown: React.FC<ActionsDropdownProps> = ({
  onEditSite,
  onAddNote,
  onTestMeter,
  onChangeSim,
  onChangeMeter,
  onCompareReadings,
  onAddAlert,
  onManageAlerts,
  onMeterHistory,
  onTextMessage,
  onSendEmail,
  onSiteReadingReport,
  onAdvancedMonitoring,
  onCreateJob,
  onExportSite,
  onTempRemoval,
  onNewHomeOwner,
  siteId,
}) => {
  const [open, setOpen] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  // Get permissions from context
  const { permissions, isLoaded } = useUIPermissionContext();
  
  // Filter menu items based on permissions
  const visibleMenuItems = useMemo(() => {
    if (!isLoaded) return [];
    
    // Filter items - only show if permission is explicitly true
    return allMenuItems.filter(item => permissions[item.permission] === true);
  }, [permissions, isLoaded]);
  
  // Group visible items by section
  const menuBySection = useMemo(() => {
    const grouped: Record<string, MenuItem[]> = {};
    
    visibleMenuItems.forEach(item => {
      if (!grouped[item.section]) {
        grouped[item.section] = [];
      }
      grouped[item.section].push(item);
    });
    
    return grouped;
  }, [visibleMenuItems]);
  
  // Create action handlers map
  const actionHandlers: Record<string, () => void> = {
    editSite: () => onEditSite?.(),
    testMeter: () => onTestMeter?.(),
    changeSim: () => onChangeSim?.(),
    changeMeter: () => onChangeMeter?.(),
    compareReadings: () => onCompareReadings?.(),
    textMessage: () => onTextMessage?.(),
    sendEmail: () => onSendEmail?.(),
    addNote: () => onAddNote?.(),
    createJob: () => {
      if (siteId) {
        navigate(`/jobs/new?siteId=${siteId}`);
      } else if (onCreateJob) {
        onCreateJob();
      }
    },
    addAlert: () => onAddAlert?.(),
    manageAlerts: () => onManageAlerts?.(),
    siteReadingReport: () => onSiteReadingReport?.(),
    exportSite: () => onExportSite?.(),
    meterHistory: () => onMeterHistory?.(),
    advancedMonitoring: () => onAdvancedMonitoring?.(),
    tempRemoval: () => onTempRemoval?.(),
    newHomeOwner: () => onNewHomeOwner?.(),
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Don't render if permissions aren't loaded yet
  if (!isLoaded) {
    return (
      <button className="bg-gray-400 text-white px-4 py-2 rounded font-semibold cursor-not-allowed" disabled>
        Loading...
      </button>
    );
  }
  
  if (visibleMenuItems.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        Actions
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-50">
          {sectionOrder.map((section) => {
            const sectionItems = menuBySection[section];
            if (!sectionItems || sectionItems.length === 0) return null;
            
            return (
              <div key={section}>
                <div className="px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  {section}
                </div>
                {sectionItems.map((item) => (
                  <button
                    key={item.label}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                    onClick={() => {
                      const handler = item.action ? actionHandlers[item.action] : null;
                      if (handler) {
                        // For test meter action, show immediate feedback
                        if (item.action === 'testMeter') {
                          setProcessingAction('testMeter');
                        }
                        // Call handler immediately
                        handler();
                        // Close dropdown after a brief delay to allow state updates
                        setTimeout(() => {
                          setOpen(false);
                          setProcessingAction(null);
                        }, 100);
                      } else {
                        console.warn(`No handler for action: ${item.label}`);
                        setOpen(false);
                      }
                    }}
                    disabled={processingAction === 'testMeter' && item.action === 'testMeter'}
                  >
                    <span className="w-5 text-lg flex-shrink-0">
                      {processingAction === 'testMeter' && item.action === 'testMeter' ? '⏳' : item.icon}
                    </span>
                    {item.label}
                    {processingAction === 'testMeter' && item.action === 'testMeter' && (
                      <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">Please wait...</span>
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default React.memo(ActionsDropdown); 