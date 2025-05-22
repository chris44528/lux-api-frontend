import React, { useState, useRef, useEffect } from 'react';

const menuItems = [
  { label: 'Add Note', section: 'Site Actions', icon: '📄' },
  { label: 'Test Meter', section: 'Site Actions', icon: '🔄' },
  { label: 'Change Sim', section: 'Site Actions', icon: '📱' },
  { label: 'Change Meter', section: 'Site Actions', icon: '√' },
  { label: 'Compare Readings', section: 'Site Actions', icon: '📊' },
  { label: 'Text Message', section: 'Site Actions', icon: '💬' },
  { label: 'Update Readings & Joblogic', section: 'Site Actions', icon: '🔁' },
  { label: 'Add Alert', section: 'Alerts', icon: '🔔' },
  { label: 'Manage Alerts', section: 'Alerts', icon: '❗' },
  { label: 'Site Reading Report', section: 'Reports & Advanced', icon: '🗒️' },
  { label: 'Deactivate Site', section: 'Reports & Advanced', icon: '🛑' },
  { label: 'Meter History', section: 'Reports & Advanced', icon: '⏱️' },
  { label: 'Advanced Monitoring', section: 'Reports & Advanced', icon: '⚡' },
  { label: 'Call Records', section: 'Reports & Advanced', icon: '📞' },
  { label: 'Job Management', section: 'Reports & Advanced', icon: '👜' },
];

const sectionOrder = [
  'Site Actions',
  'Alerts',
  'Reports & Advanced',
];

interface ActionsDropdownProps {
  onAddNote?: () => void;
  onTestMeter?: () => void;
  onChangeSim?: () => void;
  onChangeMeter?: () => void;
  onCompareReadings?: () => void;
  onAddAlert?: () => void;
  onManageAlerts?: () => void;
  onMeterHistory?: () => void;
  onTextMessage?: () => void;
  onSiteReadingReport?: () => void;
  onAdvancedMonitoring?: () => void;
}

const ActionsDropdown: React.FC<ActionsDropdownProps> = ({
  onAddNote,
  onTestMeter,
  onChangeSim,
  onChangeMeter,
  onCompareReadings,
  onAddAlert,
  onManageAlerts,
  onMeterHistory,
  onTextMessage,
  onSiteReadingReport,
  onAdvancedMonitoring,
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="bg-green-600 text-white px-4 py-2 rounded font-semibold"
        onClick={() => setOpen((v) => !v)}
      >
        Actions
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white border rounded shadow-lg z-50">
          {sectionOrder.map((section) => (
            <div key={section}>
              <div className="px-4 py-2 text-xs font-bold text-gray-500 border-b bg-gray-50">{section}</div>
              {menuItems.filter((item) => item.section === section).map((item) => (
                <button
                  key={item.label}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                  onClick={() => {
                    setOpen(false);
                    if (item.label === 'Add Note' && onAddNote) {
                      onAddNote();
                    } else if (item.label === 'Test Meter' && onTestMeter) {
                      onTestMeter();
                    } else if (item.label === 'Change Sim' && onChangeSim) {
                      onChangeSim();
                    } else if (item.label === 'Change Meter' && onChangeMeter) {
                      onChangeMeter();
                    } else if (item.label === 'Compare Readings' && onCompareReadings) {
                      onCompareReadings();
                    } else if (item.label === 'Text Message' && onTextMessage) {
                      onTextMessage();
                    } else if (item.label === 'Add Alert' && onAddAlert) {
                      onAddAlert();
                    } else if (item.label === 'Manage Alerts' && onManageAlerts) {
                      onManageAlerts();
                    } else if (item.label === 'Meter History' && onMeterHistory) {
                      onMeterHistory();
                    } else if (item.label === 'Site Reading Report' && onSiteReadingReport) {
                      onSiteReadingReport();
                    } else if (item.label === 'Advanced Monitoring' && onAdvancedMonitoring) {
                      onAdvancedMonitoring();
                    } else {
                      alert(`Clicked: ${item.label}`);
                    }
                  }}
                >
                  <span className="w-5 text-lg flex-shrink-0">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionsDropdown; 