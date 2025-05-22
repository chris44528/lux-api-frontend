import React, { useState, useRef, useEffect } from 'react';

// For Ecotricity users, we only show Test Meter
const menuItems = [
  { label: 'Test Meter', section: 'Site Actions', icon: '🔄' },
];

const sectionOrder = [
  'Site Actions',
];

interface EcotricityActionsDropdownProps {
  onTestMeter?: () => void;
}

const EcotricityActionsDropdown: React.FC<EcotricityActionsDropdownProps> = ({
  onTestMeter,
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
                    if (item.label === 'Test Meter' && onTestMeter) {
                      onTestMeter();
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

export default EcotricityActionsDropdown; 