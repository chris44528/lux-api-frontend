import React, { useState, useEffect, useCallback } from 'react';
import { 
  fetchTableSchema, 
  executeReportQuery, 
  exportToExcel 
} from '../../services/api';
import { 
  DatabaseTable, 
  ReportFilter, 
  ReportDateRange
} from '../../types/api';
import TableSelector from './TableSelector';
import ColumnSelector from './ColumnSelector';
import FilterBuilder from './FilterBuilder';
import PreviewTable from './PreviewTable';
import { Download, RefreshCw } from 'lucide-react';

const ReportBuilder: React.FC = () => {
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [dateRange, setDateRange] = useState<ReportDateRange>({
    startDate: null,
    endDate: null
  });
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columnLabels, setColumnLabels] = useState<Record<string, string>>({});
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(100);
  const [columnAliases, setColumnAliases] = useState<Record<string, string>>({});
  
  // Load database schema
  useEffect(() => {
    const loadSchema = async () => {
      setSchemaLoading(true);
      setError(null);
      
      try {
        const schema = await fetchTableSchema();
        setTables(schema);
        
        // Create column labels mapping
        const labels: Record<string, string> = {};
        schema.forEach((table: DatabaseTable) => {
          table.columns.forEach((column) => {
            labels[column.id] = `${table.name} - ${column.name}`;
          });
        });
        setColumnLabels(labels);
      } catch (error) {
        console.error('Error loading database schema:', error);
        setError('Failed to load database schema. Please try again later.');
      } finally {
        setSchemaLoading(false);
      }
    };
    
    loadSchema();
  }, []);
  
  // Handle preview data loading
  const handlePreview = useCallback(async (page = 1) => {
    if (selectedTables.length === 0 || selectedColumns.length === 0) {
      setError('Please select at least one table and one column to preview data.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await executeReportQuery({
        tables: selectedTables,
        columns: selectedColumns,
        filters,
        dateRange,
        page,
        pageSize
      });
      
      setPreviewData(result.results || []);
      setTotalResults(result.count || 0);
      setCurrentPage(page);
      
      // Store column aliases if provided
      if (result.column_aliases) {
        setColumnAliases(result.column_aliases);
      }
      
      // Check if any columns were invalid
      if (result.valid_columns && result.valid_columns.length < selectedColumns.length) {
        const invalidColumns = selectedColumns.filter(col => {
          // Check if this column has an alias in the valid columns
          if (result.column_aliases && result.column_aliases[col]) {
            return !result.valid_columns.includes(result.column_aliases[col]);
          }
          return !result.valid_columns.includes(col);
        });
        
        if (invalidColumns.length > 0) {
          const invalidColumnNames = invalidColumns.map(col => {
            const [table, column] = col.split('.');
            return `${table}.${column}`;
          });
          setError(`Some columns were not found in the database and were excluded: ${invalidColumnNames.join(', ')}`);
        }
      }
      
      if (result.results.length === 0) {
        setError('No data found for the selected criteria.');
      }
    } catch (error) {
      console.error('Error executing query:', error);
      setError('Failed to execute query. Please check your selections and try again.');
      setPreviewData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedTables, selectedColumns, filters, dateRange, pageSize]);
  
  // Handle export to Excel
  const handleExport = useCallback(async () => {
    if (selectedTables.length === 0 || selectedColumns.length === 0) {
      setError('Please select at least one table and one column to export data.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await exportToExcel({
        tables: selectedTables,
        columns: selectedColumns,
        filters,
        dateRange,
        filename: `report-${new Date().toISOString().split('T')[0]}.xlsx`
      });
      
      // Success message
      setError(null);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setError('Failed to export data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [selectedTables, selectedColumns, filters, dateRange]);
  
  // Calculate total pages
  const totalPages = Math.ceil(totalResults / pageSize);
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    handlePreview(newPage);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold dark:text-gray-100">Report Builder</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => handlePreview(currentPage)}
              disabled={loading || schemaLoading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              type="button"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Preview Results
            </button>
            <button
              onClick={handleExport}
              disabled={loading || previewData.length === 0}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              type="button"
            >
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar for table/column selection */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-md shadow p-4">
              <TableSelector 
                tables={tables} 
                selectedTables={selectedTables}
                onTableSelect={setSelectedTables}
              />
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-md shadow p-4">
              <ColumnSelector 
                tables={tables}
                selectedTables={selectedTables}
                selectedColumns={selectedColumns}
                onColumnSelect={setSelectedColumns}
              />
            </div>
          </div>
          
          {/* Main content area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Filter section */}
            <div className="bg-white dark:bg-gray-800 rounded-md shadow p-4">
              <FilterBuilder 
                tables={tables}
                selectedTables={selectedTables}
                filters={filters}
                dateRange={dateRange}
                onFilterChange={setFilters}
                onDateRangeChange={setDateRange}
              />
            </div>
            
            {/* Preview section */}
            <div className="bg-white dark:bg-gray-800 rounded-md shadow p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium dark:text-gray-100">Preview Results</h2>
                {totalResults > 0 && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {previewData.length} of {totalResults} results
                  </span>
                )}
              </div>
              
              <PreviewTable 
                data={previewData}
                columns={selectedColumns}
                loading={loading}
                columnLabels={columnLabels}
              />
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <nav className="flex items-center">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                      className="px-3 py-1 rounded-l border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                      type="button"
                    >
                      Previous
                    </button>
                    
                    <div className="px-4 py-1 border-t border-b border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                      Page {currentPage} of {totalPages}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || loading}
                      className="px-3 py-1 rounded-r border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                      type="button"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportBuilder; 