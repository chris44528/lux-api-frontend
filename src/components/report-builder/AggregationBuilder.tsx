import React from 'react';
import { DatabaseTable, AggregationConfig } from '../../types/api';
import { Plus, X } from 'lucide-react';

interface AggregationBuilderProps {
  tables: DatabaseTable[];
  selectedTables: string[];
  aggregations: AggregationConfig[];
  onAggregationsChange: (aggregations: AggregationConfig[]) => void;
}

const AGGREGATION_FUNCTIONS = [
  { value: 'SUM', label: 'Sum', supportedTypes: ['IntegerField', 'FloatField', 'DecimalField', 'BigIntegerField'] },
  { value: 'AVG', label: 'Average', supportedTypes: ['IntegerField', 'FloatField', 'DecimalField', 'BigIntegerField'] },
  { value: 'COUNT', label: 'Count', supportedTypes: ['all'] },
  { value: 'COUNT_DISTINCT', label: 'Count Distinct', supportedTypes: ['all'] },
  { value: 'MIN', label: 'Minimum', supportedTypes: ['IntegerField', 'FloatField', 'DecimalField', 'BigIntegerField', 'DateField', 'DateTimeField'] },
  { value: 'MAX', label: 'Maximum', supportedTypes: ['IntegerField', 'FloatField', 'DecimalField', 'BigIntegerField', 'DateField', 'DateTimeField'] }
];

const AggregationBuilder: React.FC<AggregationBuilderProps> = ({
  tables,
  selectedTables,
  aggregations,
  onAggregationsChange
}) => {
  // Get available columns for aggregation
  const getAvailableColumns = () => {
    const columns: Array<{ id: string; label: string; type: string }> = [];
    
    // Add COUNT(*) option
    columns.push({
      id: '*',
      label: 'All Records (*)',
      type: 'all'
    });
    
    tables.forEach(table => {
      if (selectedTables.includes(table.id)) {
        table.columns.forEach(column => {
          columns.push({
            id: column.id,
            label: `${table.name} - ${column.name}`,
            type: column.type
          });
        });
      }
    });
    
    return columns;
  };
  
  // Get functions available for a column type
  const getAvailableFunctions = (columnId: string) => {
    if (columnId === '*') {
      return [{ value: 'COUNT', label: 'Count' }];
    }
    
    const column = getAvailableColumns().find(c => c.id === columnId);
    if (!column) return [];
    
    return AGGREGATION_FUNCTIONS.filter(func => 
      func.supportedTypes.includes('all') || 
      func.supportedTypes.includes(column.type)
    );
  };
  
  // Add new aggregation
  const addAggregation = () => {
    const availableColumns = getAvailableColumns();
    if (availableColumns.length === 0) return;
    
    const firstColumn = availableColumns[0];
    const availableFunctions = getAvailableFunctions(firstColumn.id);
    
    if (availableFunctions.length === 0) return;
    
    const newAggregation: AggregationConfig = {
      function: availableFunctions[0].value as any,
      column: firstColumn.id,
      alias: `${availableFunctions[0].value.toLowerCase()}_${firstColumn.id.replace('.', '_')}`
    };
    
    onAggregationsChange([...aggregations, newAggregation]);
  };
  
  // Update aggregation
  const updateAggregation = (index: number, updates: Partial<AggregationConfig>) => {
    const newAggregations = [...aggregations];
    newAggregations[index] = { ...newAggregations[index], ...updates };
    
    // Update alias if function or column changed
    if (updates.function || updates.column) {
      const func = updates.function || newAggregations[index].function;
      const col = updates.column || newAggregations[index].column;
      newAggregations[index].alias = `${func.toLowerCase()}_${col.replace('.', '_')}`;
    }
    
    onAggregationsChange(newAggregations);
  };
  
  // Remove aggregation
  const removeAggregation = (index: number) => {
    onAggregationsChange(aggregations.filter((_, i) => i !== index));
  };
  
  const availableColumns = getAvailableColumns();
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Aggregations
        </h4>
        <button
          onClick={addAggregation}
          disabled={availableColumns.length === 0}
          className="text-blue-600 hover:text-blue-700 text-sm disabled:opacity-50 dark:text-blue-400 dark:hover:text-blue-300"
          type="button"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      
      {aggregations.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No aggregations added. Click + to add one.
        </p>
      ) : (
        <div className="space-y-2">
          {aggregations.map((agg, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-600 rounded p-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Aggregation {index + 1}
                </span>
                <button
                  onClick={() => removeAggregation(index)}
                  className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              {/* Function selection */}
              <select
                value={agg.function}
                onChange={(e) => updateAggregation(index, { 
                  function: e.target.value as AggregationConfig['function'] 
                })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              >
                {getAvailableFunctions(agg.column).map(func => (
                  <option key={func.value} value={func.value}>
                    {func.label}
                  </option>
                ))}
              </select>
              
              {/* Column selection */}
              <select
                value={agg.column}
                onChange={(e) => {
                  const newColumn = e.target.value;
                  const availableFuncs = getAvailableFunctions(newColumn);
                  const currentFuncAvailable = availableFuncs.some(f => f.value === agg.function);
                  
                  updateAggregation(index, { 
                    column: newColumn,
                    function: currentFuncAvailable ? agg.function : availableFuncs[0].value as any
                  });
                }}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              >
                {availableColumns.map(col => (
                  <option key={col.id} value={col.id}>
                    {col.label}
                  </option>
                ))}
              </select>
              
              {/* Alias input */}
              <input
                type="text"
                value={agg.alias}
                onChange={(e) => updateAggregation(index, { alias: e.target.value })}
                placeholder="Column alias"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              />
            </div>
          ))}
        </div>
      )}
      
      {aggregations.length > 0 && (
        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/30 rounded text-xs text-blue-700 dark:text-blue-300">
          <strong>Note:</strong> When using aggregations with regular columns, you must specify group by columns.
        </div>
      )}
    </div>
  );
};

export default AggregationBuilder;