import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { DatabaseTable } from '../../types/api';

interface TableSelectorProps {
  tables: DatabaseTable[];
  selectedTables: string[];
  onTableSelect: (tables: string[]) => void;
}

const TableSelector: React.FC<TableSelectorProps> = ({ 
  tables, 
  selectedTables, 
  onTableSelect 
}) => {
  const [expandedTables, setExpandedTables] = useState<string[]>([]);
  
  const toggleTableExpand = (tableId: string) => {
    setExpandedTables(prev => 
      prev.includes(tableId) 
        ? prev.filter(id => id !== tableId)
        : [...prev, tableId]
    );
  };
  
  const toggleTableSelect = (tableId: string) => {
    const newSelectedTables = selectedTables.includes(tableId)
      ? selectedTables.filter(id => id !== tableId)
      : [...selectedTables, tableId];
    
    onTableSelect(newSelectedTables);
  };
  
  return (
    <div className="space-y-2">
      <h3 className="font-medium text-gray-700 dark:text-gray-300">Database Tables</h3>
      {tables.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 p-4 border rounded dark:border-gray-600">
          Loading tables...
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto border rounded dark:border-gray-600">
          {tables.map(table => (
            <div key={table.id} className="border-b last:border-b-0 dark:border-gray-700">
              <div 
                className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => toggleTableExpand(table.id)}
              >
                {expandedTables.includes(table.id) ? (
                  <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                )}
                
                <div className="flex items-center flex-1">
                  <input
                    type="checkbox"
                    id={`table-${table.id}`}
                    checked={selectedTables.includes(table.id)}
                    onChange={() => toggleTableSelect(table.id)}
                    className="mr-2 dark:bg-gray-700 dark:border-gray-600"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <label htmlFor={`table-${table.id}`} className="cursor-pointer dark:text-gray-300">
                    {table.name}
                  </label>
                </div>
              </div>
              
              {expandedTables.includes(table.id) && (
                <div className="pl-8 pr-3 py-2 bg-gray-50 dark:bg-gray-700 border-t dark:border-gray-600">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {table.description || `Contains ${table.columns.length} columns`}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TableSelector; 