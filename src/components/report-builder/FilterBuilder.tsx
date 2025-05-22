import React from 'react';
import { Plus, X } from 'lucide-react';
import { DatabaseTable, ReportFilter, ReportDateRange } from '../../types/api';

interface FilterBuilderProps {
  tables: DatabaseTable[];
  selectedTables: string[];
  filters: ReportFilter[];
  dateRange: ReportDateRange;
  onFilterChange: (filters: ReportFilter[]) => void;
  onDateRangeChange: (dateRange: ReportDateRange) => void;
}

const FilterBuilder: React.FC<FilterBuilderProps> = ({
  tables,
  selectedTables,
  filters,
  dateRange,
  onFilterChange,
  onDateRangeChange
}) => {
  // Get all columns from selected tables
  const availableColumns = selectedTables.flatMap(tableId => {
    const table = tables.find(t => t.id === tableId);
    return table ? table.columns : [];
  });
  
  const addFilter = () => {
    onFilterChange([
      ...filters,
      { id: Date.now().toString(), column: '', operator: '=', value: '' }
    ]);
  };
  
  const removeFilter = (filterId: string | number) => {
    onFilterChange(filters.filter(f => f.id !== filterId));
  };
  
  const updateFilter = (filterId: string | number, field: keyof ReportFilter, value: string) => {
    onFilterChange(filters.map(filter => 
      filter.id === filterId ? { ...filter, [field]: value } : filter
    ));
  };
  
  const handleDateRangeChange = (field: keyof ReportDateRange, value: string) => {
    onDateRangeChange({
      ...dateRange,
      [field]: value || null
    });
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-gray-700">Filter Criteria</h3>
        <button
          onClick={addFilter}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
          type="button"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Filter
        </button>
      </div>
      
      {/* Date range filter (common for most reports) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={dateRange.startDate || ''}
            onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={dateRange.endDate || ''}
            onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>
      
      {/* Dynamic filters */}
      {filters.length > 0 ? (
        <div className="space-y-4">
          {filters.map(filter => (
            <div key={filter.id} className="flex items-center space-x-2">
              <select
                value={filter.column}
                onChange={(e) => updateFilter(filter.id, 'column', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Column</option>
                {availableColumns.map(column => (
                  <option key={column.id} value={column.id}>
                    {column.table_name}.{column.name}
                  </option>
                ))}
              </select>
              
              <select
                value={filter.operator}
                onChange={(e) => updateFilter(filter.id, 'operator', e.target.value)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="=">=</option>
                <option value="!=">!=</option>
                <option value=">">{'>'}</option>
                <option value="<">{'<'}</option>
                <option value=">=">{'≥'}</option>
                <option value="<=">{'≤'}</option>
                <option value="LIKE">LIKE</option>
                <option value="IN">IN</option>
              </select>
              
              <input
                type="text"
                value={filter.value}
                onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                placeholder="Value"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
              
              <button
                onClick={() => removeFilter(filter.id)}
                className="p-2 text-red-500 hover:text-red-700"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No filters added yet. Click "Add Filter" to create one.</p>
      )}
    </div>
  );
};

export default FilterBuilder; 