import React, { useState } from 'react';
import { DatabaseTable, DatabaseColumn } from '../../types/api';
import { ChevronRight, ChevronDown, Check, Square } from 'lucide-react';

interface EnhancedColumnSelectorProps {
  tables: DatabaseTable[];
  selectedTables: string[];
  selectedColumns: string[];
  onColumnSelect: (columns: string[]) => void;
  groupBy: string[];
  onGroupByChange: (groupBy: string[]) => void;
}

const EnhancedColumnSelector: React.FC<EnhancedColumnSelectorProps> = ({
  tables,
  selectedTables,
  selectedColumns,
  onColumnSelect,
  groupBy,
  onGroupByChange
}) => {
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [showGroupBy, setShowGroupBy] = useState(false);
  
  // Get columns for selected tables
  const getAvailableColumns = () => {
    const columns: Array<{ table: DatabaseTable; column: DatabaseColumn }> = [];
    
    tables.forEach(table => {
      if (selectedTables.includes(table.id)) {
        table.columns.forEach(column => {
          columns.push({ table, column });
        });
      }
    });
    
    return columns;
  };
  
  // Toggle table expansion
  const toggleTableExpansion = (tableId: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableId)) {
      newExpanded.delete(tableId);
    } else {
      newExpanded.add(tableId);
    }
    setExpandedTables(newExpanded);
  };
  
  // Toggle column selection
  const toggleColumn = (columnId: string) => {
    if (selectedColumns.includes(columnId)) {
      onColumnSelect(selectedColumns.filter(c => c !== columnId));
      // Also remove from group by if it was there
      if (groupBy.includes(columnId)) {
        onGroupByChange(groupBy.filter(c => c !== columnId));
      }
    } else {
      onColumnSelect([...selectedColumns, columnId]);
    }
  };
  
  // Toggle group by column
  const toggleGroupBy = (columnId: string) => {
    if (groupBy.includes(columnId)) {
      onGroupByChange(groupBy.filter(c => c !== columnId));
    } else {
      // Can only group by selected columns
      if (selectedColumns.includes(columnId)) {
        onGroupByChange([...groupBy, columnId]);
      }
    }
  };
  
  // Select all columns from a table
  const selectAllFromTable = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    const tableColumnIds = table.columns.map(c => c.id);
    const otherColumns = selectedColumns.filter(c => !tableColumnIds.includes(c));
    
    onColumnSelect([...otherColumns, ...tableColumnIds]);
  };
  
  // Deselect all columns from a table
  const deselectAllFromTable = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    const tableColumnIds = table.columns.map(c => c.id);
    onColumnSelect(selectedColumns.filter(c => !tableColumnIds.includes(c)));
    onGroupByChange(groupBy.filter(c => !tableColumnIds.includes(c)));
  };
  
  // Check if all columns from a table are selected
  const areAllColumnsSelected = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return false;
    
    return table.columns.every(c => selectedColumns.includes(c.id));
  };
  
  // Group columns by table
  const columnsByTable = tables
    .filter(table => selectedTables.includes(table.id))
    .map(table => ({
      table,
      columns: table.columns,
      selectedCount: table.columns.filter(c => selectedColumns.includes(c.id)).length
    }));
  
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Available Columns
      </h3>
      
      {selectedTables.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Please select at least one table to see available columns.
        </p>
      ) : (
        <>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {columnsByTable.map(({ table, columns, selectedCount }) => (
              <div key={table.id} className="border border-gray-200 dark:border-gray-600 rounded">
                <div
                  className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => toggleTableExpansion(table.id)}
                >
                  <div className="flex items-center space-x-2">
                    {expandedTables.has(table.id) ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="text-sm font-medium dark:text-gray-200">
                      {table.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({selectedCount}/{columns.length})
                    </span>
                  </div>
                  <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => selectAllFromTable(table.id)}
                      className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      type="button"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => deselectAllFromTable(table.id)}
                      className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      type="button"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                
                {expandedTables.has(table.id) && (
                  <div className="border-t border-gray-200 dark:border-gray-600 max-h-48 overflow-y-auto">
                    {columns.map(column => (
                      <div
                        key={column.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <label className="flex items-center space-x-2 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={selectedColumns.includes(column.id)}
                            onChange={() => toggleColumn(column.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                          />
                          <span className="text-sm dark:text-gray-200">
                            {column.name}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({column.type})
                          </span>
                        </label>
                        {column.supports_aggregation && (
                          <span className="text-xs text-green-600 dark:text-green-400" title="Supports aggregation">
                            Σ
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Group By Section */}
          <div className="border-t pt-4">
            <button
              onClick={() => setShowGroupBy(!showGroupBy)}
              className="flex items-center justify-between w-full text-sm font-medium text-gray-700 dark:text-gray-300"
              type="button"
            >
              <span>Group By Columns</span>
              <span className="text-xs text-gray-500">
                {groupBy.length > 0 ? `(${groupBy.length} selected)` : ''}
              </span>
            </button>
            
            {showGroupBy && (
              <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                {selectedColumns.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Select columns first to enable grouping.
                  </p>
                ) : (
                  selectedColumns.map(columnId => {
                    const column = getAvailableColumns().find(c => c.column.id === columnId);
                    if (!column) return null;
                    
                    return (
                      <label
                        key={columnId}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={groupBy.includes(columnId)}
                          onChange={() => toggleGroupBy(columnId)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                        />
                        <span className="text-sm dark:text-gray-200">
                          {column.table.name} - {column.column.name}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default EnhancedColumnSelector;