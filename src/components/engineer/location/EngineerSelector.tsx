import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Search, X, Users } from 'lucide-react';
import { Badge } from '../../ui/badge';

interface Engineer {
  id: number;
  user: {
    first_name: string;
    last_name: string;
  };
  employee_id: string;
  status: string;
}

interface SelectedEngineer {
  id: number;
  name: string;
  employee_id: string;
  color?: string;
}

interface EngineerSelectorProps {
  engineers: Engineer[];
  selectedEngineers: SelectedEngineer[];
  onSelectionChange: (engineers: SelectedEngineer[]) => void;
  loading?: boolean;
  maxSelection?: number;
}

const EngineerSelector: React.FC<EngineerSelectorProps> = ({
  engineers,
  selectedEngineers,
  onSelectionChange,
  loading,
  maxSelection = 6,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter engineers based on search
  const filteredEngineers = engineers.filter(engineer => {
    const fullName = `${engineer.user.first_name} ${engineer.user.last_name}`.toLowerCase();
    const employeeId = engineer.employee_id.toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return fullName.includes(search) || employeeId.includes(search);
  });

  // Handle engineer selection
  const handleEngineerToggle = (engineer: Engineer) => {
    const engineerData: SelectedEngineer = {
      id: engineer.id,
      name: `${engineer.user.first_name} ${engineer.user.last_name}`,
      employee_id: engineer.employee_id,
    };

    const isSelected = selectedEngineers.some(e => e.id === engineer.id);
    
    if (isSelected) {
      onSelectionChange(selectedEngineers.filter(e => e.id !== engineer.id));
    } else if (selectedEngineers.length < maxSelection) {
      onSelectionChange([...selectedEngineers, engineerData]);
    }
  };

  // Select all engineers
  const handleSelectAll = () => {
    const allEngineers = engineers.slice(0, maxSelection).map(engineer => ({
      id: engineer.id,
      name: `${engineer.user.first_name} ${engineer.user.last_name}`,
      employee_id: engineer.employee_id,
    }));
    onSelectionChange(allEngineers);
  };

  // Clear selection
  const handleClearSelection = () => {
    onSelectionChange([]);
  };

  // Remove specific engineer
  const handleRemoveEngineer = (engineerId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectionChange(selectedEngineers.filter(eng => eng.id !== engineerId));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Engineers Display */}
      <div
        className="min-h-[42px] px-3 py-2 border rounded-md cursor-pointer bg-white dark:bg-gray-800 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedEngineers.length === 0 ? (
          <div className="flex items-center justify-between text-gray-500">
            <span>Select engineers...</span>
            <ChevronDown className="w-4 h-4" />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {selectedEngineers.map(engineer => (
                <Badge
                  key={engineer.id}
                  variant="secondary"
                  className="text-xs flex items-center gap-1"
                >
                  {engineer.name}
                  <button
                    onClick={(e) => handleRemoveEngineer(engineer.id, e)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <ChevronDown className="w-4 h-4 flex-shrink-0 ml-2" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Search and Actions */}
          <div className="p-2 border-b dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search engineers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">
                {selectedEngineers.length} of {maxSelection} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Select All
                </button>
                <button
                  onClick={handleClearSelection}
                  className="text-gray-600 hover:text-gray-700 dark:text-gray-400"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Engineer List */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : filteredEngineers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No engineers found
              </div>
            ) : (
              <div className="py-1">
                {filteredEngineers.map(engineer => {
                  const isSelected = selectedEngineers.some(e => e.id === engineer.id);
                  const isDisabled = !isSelected && selectedEngineers.length >= maxSelection;

                  return (
                    <div
                      key={engineer.id}
                      className={`
                        px-3 py-2 cursor-pointer transition-colors
                        ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}
                        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      onClick={() => !isDisabled && handleEngineerToggle(engineer)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">
                            {engineer.user.first_name} {engineer.user.last_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {engineer.employee_id} • {engineer.status}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Max Selection Warning */}
          {selectedEngineers.length >= maxSelection && (
            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border-t dark:border-gray-700">
              <p className="text-xs text-yellow-800 dark:text-yellow-200 flex items-center gap-1">
                <Users className="w-3 h-3" />
                Maximum {maxSelection} engineers can be selected at once
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EngineerSelector;