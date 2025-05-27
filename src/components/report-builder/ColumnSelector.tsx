import React from 'react';
import { DatabaseTable } from '../../types/api';

interface ColumnSelectorProps {
  tables: DatabaseTable[];
  selectedTables: string[];
  selectedColumns: string[];
  onColumnSelect: (columns: string[]) => void;
}

const ColumnSelector: React.FC<ColumnSelectorProps> = ({
  tables,
  selectedTables,
  selectedColumns,
  onColumnSelect
}) => {
  // Filter tables to only show selected ones
  const filteredTables = tables.filter(table => selectedTables.includes(table.id));
  
  const toggleColumnSelect = (columnId: string) => {
    const newSelectedColumns = selectedColumns.includes(columnId)
      ? selectedColumns.filter(id => id !== columnId)
      : [...selectedColumns, columnId];
    
    onColumnSelect(newSelectedColumns);
  };
  
  const selectAllColumnsForTable = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    const tableColumnIds = table.columns.map(col => col.id);
    
    // Add all columns that aren't already selected
    const newSelectedColumns = [
      ...selectedColumns,
      ...tableColumnIds.filter(id => !selectedColumns.includes(id))
    ];
    
    onColumnSelect(newSelectedColumns);
  };
  
  const deselectAllColumnsForTable = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    const tableColumnIds = table.columns.map(col => col.id);
    
    // Remove all columns from this table
    const newSelectedColumns = selectedColumns.filter(
      id => !tableColumnIds.includes(id)
    );
    
    onColumnSelect(newSelectedColumns);
  };
  
  return (
    <div className="mt-6 space-y-2">
      <h3 className="font-medium text-gray-700 dark:text-gray-300">Available Columns</h3>
      
      {filteredTables.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 p-4 border rounded dark:border-gray-600">
          Please select at least one table to see available columns.
        </p>
      ) : (
        <div className="space-y-4">
          {filteredTables.map(table => (
            <div key={table.id} className="border rounded dark:border-gray-600">
              <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 flex justify-between items-center">
                <span className="font-medium dark:text-gray-200">{table.name}</span>
                <div className="space-x-2">
                  <button 
                    onClick={() => selectAllColumnsForTable(table.id)}
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    type="button"
                  >
                    Select All
                  </button>
                  <button 
                    onClick={() => deselectAllColumnsForTable(table.id)}
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    type="button"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              
              <div className="p-3 max-h-60 overflow-y-auto dark:bg-gray-800">
                {table.columns.map(column => (
                  <div key={column.id} className="flex items-center mb-2 last:mb-0">
                    <input
                      type="checkbox"
                      id={`column-${column.id}`}
                      checked={selectedColumns.includes(column.id)}
                      onChange={() => toggleColumnSelect(column.id)}
                      className="mr-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label 
                      htmlFor={`column-${column.id}`}
                      className="text-sm cursor-pointer flex-1 dark:text-gray-300"
                    >
                      {column.name}
                      {column.description && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 block">
                          {column.description}
                        </span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ColumnSelector; 