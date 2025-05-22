import React from 'react';

interface PreviewTableProps {
  data: Record<string, unknown>[];
  columns: string[];
  loading: boolean;
  columnLabels?: Record<string, string>;
}

const PreviewTable: React.FC<PreviewTableProps> = ({ 
  data, 
  columns, 
  loading,
  columnLabels = {} 
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No data to preview. Select tables and columns, then click "Preview Results".</p>
      </div>
    );
  }
  
  // Get column headers from the data
  const headers = columns.length > 0 
    ? columns.map(col => col.split('.')[1]) // Extract just the column name part
    : Object.keys(data[0]);
  
  // Format value for display
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'N/A';
    
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    
    return String(value);
  };
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {headers.map(header => {
              // Find the full column path for this header
              const fullColumnPath = columns.find(col => col.endsWith(`.${header}`)) || header;
              
              return (
                <th
                  key={header}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {columnLabels[fullColumnPath] || header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {headers.map(header => (
                <td
                  key={`${rowIndex}-${header}`}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                >
                  {formatValue(row[header])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PreviewTable; 