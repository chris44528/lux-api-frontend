import React, { useState, useEffect, useCallback } from 'react';
import { 
  fetchTableSchemaV2, 
  executeReportQueryV2 as executeReportQuery, 
  exportToExcelV2 as exportToExcel,
  fetchReportTemplates,
  saveReportTemplate,
  updateReportTemplate,
  deleteReportTemplate,
  loadReportTemplate
} from '../../services/api';
import { 
  DatabaseTable, 
  ReportFilter, 
  ReportDateRange,
  ReportTemplate,
  AggregationConfig
} from '../../types/api';
import TableSelector from './TableSelector';
import EnhancedColumnSelector from './EnhancedColumnSelector';
import AggregationBuilder from './AggregationBuilder';
import FilterBuilder from './FilterBuilder';
import PreviewTable from './PreviewTable';
import TemplateManager from './TemplateManager';
import { Download, RefreshCw, Save, FolderOpen, AlertCircle } from 'lucide-react';

interface EnhancedReportBuilderProps {
  onError?: (error: string) => void;
}

const EnhancedReportBuilder: React.FC<EnhancedReportBuilderProps> = ({ onError }) => {
  // State management
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [aggregations, setAggregations] = useState<AggregationConfig[]>([]);
  const [groupBy, setGroupBy] = useState<string[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [dateRange, setDateRange] = useState<ReportDateRange>({
    startDate: null,
    endDate: null
  });
  const [orderBy, setOrderBy] = useState<Array<{ column: string; direction: 'ASC' | 'DESC' }>>([]);
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columnLabels, setColumnLabels] = useState<Record<string, string>>({});
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(100);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  
  // Template management
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [currentTemplateName, setCurrentTemplateName] = useState<string>('');
  const [isTemplateModified, setIsTemplateModified] = useState(false);
  
  // Advanced features
  const [showAggregations, setShowAggregations] = useState(false);
  const [availableApps, setAvailableApps] = useState<string[]>([]);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  
  // Load database schema
  useEffect(() => {
    const loadSchema = async () => {
      setSchemaLoading(true);
      setError(null);
      
      try {
        // Use v2 schema endpoint
        const data = await fetchTableSchemaV2();
        
        setTables(data.schema);
        setAvailableApps(data.apps);
        
        // Create column labels mapping
        const labels: Record<string, string> = {};
        data.schema.forEach((table: DatabaseTable) => {
          table.columns.forEach((column) => {
            labels[column.id] = `${table.name} - ${column.name}`;
          });
        });
        setColumnLabels(labels);
      } catch (error) {
        console.error('Error loading database schema:', error);
        const errorMsg = 'Failed to load database schema. Please try again later.';
        setError(errorMsg);
        if (onError) onError(errorMsg);
      } finally {
        setSchemaLoading(false);
      }
    };
    
    loadSchema();
    loadTemplates();
  }, [onError]);
  
  // Load templates
  const loadTemplates = async () => {
    try {
      const loadedTemplates = await fetchReportTemplates();
      setTemplates(loadedTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };
  
  // Handle preview with enhanced query
  const handlePreview = useCallback(async (page = 1) => {
    if (selectedTables.length === 0) {
      setError('Please select at least one table to preview data.');
      return;
    }
    
    if (selectedColumns.length === 0 && aggregations.length === 0) {
      setError('Please select at least one column or aggregation to preview data.');
      return;
    }
    
    // Validate aggregations with group by
    if (aggregations.length > 0 && selectedColumns.length > 0 && groupBy.length === 0) {
      setError('When using aggregations with regular columns, you must specify group by columns.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await executeReportQuery({
        tables: selectedTables,
        columns: selectedColumns,
        aggregations,
        groupBy,
        filters,
        dateRange,
        orderBy,
        page,
        pageSize
      }, true); // Use v2 endpoint
      
      setPreviewData(result.results || []);
      setTotalResults(result.count || 0);
      setCurrentPage(page);
      setExecutionTime(result.execution_time_ms || null);
      
      if (result.results.length === 0) {
        setError('No data found for the selected criteria.');
      }
    } catch (error: any) {
      console.error('Error executing query:', error);
      const errorMsg = error.details || 'Failed to execute query. Please check your selections and try again.';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      setPreviewData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedTables, selectedColumns, aggregations, groupBy, filters, dateRange, orderBy, pageSize, onError]);
  
  // Handle export with enhanced features
  const handleExport = useCallback(async (format: 'xlsx' | 'csv' = 'xlsx') => {
    if (selectedTables.length === 0) {
      setError('Please select at least one table to export data.');
      return;
    }
    
    if (selectedColumns.length === 0 && aggregations.length === 0) {
      setError('Please select at least one column or aggregation to export data.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await exportToExcel({
        tables: selectedTables,
        columns: selectedColumns,
        aggregations,
        groupBy,
        filters,
        dateRange,
        orderBy,
        format,
        filename: `report-${new Date().toISOString().split('T')[0]}.${format}`
      }, true); // Use v2 endpoint
      
      setError(null);
    } catch (error: any) {
      console.error('Error exporting:', error);
      const errorMsg = 'Failed to export data. Please try again later.';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [selectedTables, selectedColumns, aggregations, groupBy, filters, dateRange, orderBy, onError]);
  
  // Save current configuration as template
  const handleSaveTemplate = async (name: string, description: string, isPublic: boolean) => {
    try {
      const templateData = {
        name,
        description,
        tables: selectedTables,
        columns: selectedColumns,
        aggregations,
        groupBy,
        filters,
        dateRange,
        orderBy,
        is_public: isPublic
      };
      
      if (currentTemplateName && templates.find(t => t.name === currentTemplateName)) {
        // Update existing template
        await updateReportTemplate(
          templates.find(t => t.name === currentTemplateName)!.id,
          templateData
        );
      } else {
        // Create new template
        await saveReportTemplate(templateData);
      }
      
      setCurrentTemplateName(name);
      setIsTemplateModified(false);
      await loadTemplates();
      setError(null);
    } catch (error: any) {
      console.error('Error saving template:', error);
      const errorMsg = error.error || 'Failed to save template';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    }
  };
  
  // Load a template
  const handleLoadTemplate = async (templateId: number) => {
    try {
      const template = await loadReportTemplate(templateId);
      
      setSelectedTables(template.tables || []);
      setSelectedColumns(template.columns || []);
      setAggregations(template.aggregations || []);
      setGroupBy(template.groupBy || []);
      setFilters(template.filters || []);
      setDateRange(template.dateRange || { startDate: null, endDate: null });
      setOrderBy(template.orderBy || []);
      setCurrentTemplateName(template.name);
      setIsTemplateModified(false);
      
      // Auto-preview after loading
      setTimeout(() => handlePreview(1), 100);
    } catch (error: any) {
      console.error('Error loading template:', error);
      const errorMsg = 'Failed to load template';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    }
  };
  
  // Delete a template
  const handleDeleteTemplate = async (templateId: number) => {
    try {
      await deleteReportTemplate(templateId);
      await loadTemplates();
      if (templates.find(t => t.id === templateId)?.name === currentTemplateName) {
        setCurrentTemplateName('');
        setIsTemplateModified(false);
      }
    } catch (error: any) {
      console.error('Error deleting template:', error);
      const errorMsg = 'Failed to delete template';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    }
  };
  
  // Track modifications
  useEffect(() => {
    if (currentTemplateName) {
      setIsTemplateModified(true);
    }
  }, [selectedTables, selectedColumns, aggregations, groupBy, filters, dateRange, orderBy]);
  
  // Calculate total pages
  const totalPages = Math.ceil(totalResults / pageSize);
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    handlePreview(newPage);
  };
  
  // Filter tables by app
  const filteredTables = selectedApp 
    ? tables.filter(table => table.app === selectedApp)
    : tables;
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Enhanced Report Builder
              {currentTemplateName && (
                <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-400">
                  - {currentTemplateName}
                  {isTemplateModified && <span className="text-orange-500 ml-1">*</span>}
                </span>
              )}
            </h1>
            {executionTime !== null && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Query executed in {executionTime}ms
              </p>
            )}
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowTemplateManager(true)}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
              type="button"
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              Templates
            </button>
            <button
              onClick={() => handlePreview(currentPage)}
              disabled={loading || schemaLoading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
              type="button"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Preview Results
            </button>
            <div className="relative">
              <button
                onClick={() => handleExport('xlsx')}
                disabled={loading || previewData.length === 0}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 dark:bg-green-500 dark:hover:bg-green-600"
                type="button"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400 px-4 py-3 rounded flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        
        {/* App filter */}
        {availableApps.length > 1 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by App
            </label>
            <select
              value={selectedApp || ''}
              onChange={(e) => setSelectedApp(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            >
              <option value="">All Apps</option>
              {availableApps.map(app => (
                <option key={app} value={app}>{app}</option>
              ))}
            </select>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar for table/column selection */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-md shadow p-4">
              <TableSelector 
                tables={filteredTables} 
                selectedTables={selectedTables}
                onTableSelect={setSelectedTables}
              />
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-md shadow p-4">
              <EnhancedColumnSelector 
                tables={tables}
                selectedTables={selectedTables}
                selectedColumns={selectedColumns}
                onColumnSelect={setSelectedColumns}
                groupBy={groupBy}
                onGroupByChange={setGroupBy}
              />
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-md shadow p-4">
              <button
                onClick={() => setShowAggregations(!showAggregations)}
                className="w-full text-left flex justify-between items-center text-sm font-medium text-gray-700 dark:text-gray-300"
                type="button"
              >
                <span>Aggregations & Functions</span>
                <span>{showAggregations ? '−' : '+'}</span>
              </button>
              {showAggregations && (
                <div className="mt-4">
                  <AggregationBuilder
                    tables={tables}
                    selectedTables={selectedTables}
                    aggregations={aggregations}
                    onAggregationsChange={setAggregations}
                  />
                </div>
              )}
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
            
            {/* Order by section */}
            <div className="bg-white dark:bg-gray-800 rounded-md shadow p-4">
              <h3 className="text-lg font-medium mb-3 dark:text-gray-100">Sort Order</h3>
              <div className="space-y-2">
                {orderBy.map((order, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <select
                      value={order.column}
                      onChange={(e) => {
                        const newOrderBy = [...orderBy];
                        newOrderBy[index].column = e.target.value;
                        setOrderBy(newOrderBy);
                      }}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                    >
                      {selectedColumns.map(col => (
                        <option key={col} value={col}>{columnLabels[col] || col}</option>
                      ))}
                    </select>
                    <select
                      value={order.direction}
                      onChange={(e) => {
                        const newOrderBy = [...orderBy];
                        newOrderBy[index].direction = e.target.value as 'ASC' | 'DESC';
                        setOrderBy(newOrderBy);
                      }}
                      className="px-3 py-1 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="ASC">Ascending</option>
                      <option value="DESC">Descending</option>
                    </select>
                    <button
                      onClick={() => setOrderBy(orderBy.filter((_, i) => i !== index))}
                      className="px-2 py-1 text-red-600 hover:bg-red-50 rounded dark:text-red-400 dark:hover:bg-red-900/30"
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {selectedColumns.length > 0 && (
                  <button
                    onClick={() => setOrderBy([...orderBy, { column: selectedColumns[0], direction: 'ASC' }])}
                    className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded dark:text-blue-400 dark:hover:bg-blue-900/30"
                    type="button"
                  >
                    + Add Sort
                  </button>
                )}
              </div>
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
                columns={[...selectedColumns, ...aggregations.map(a => a.alias || `${a.function}_${a.column.replace('.', '_')}`)]}
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
                      className="px-3 py-1 rounded-l border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
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
                      className="px-3 py-1 rounded-r border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
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
        
        {/* Template Manager Modal */}
        {showTemplateManager && (
          <TemplateManager
            templates={templates}
            currentConfig={{
              tables: selectedTables,
              columns: selectedColumns,
              aggregations,
              groupBy,
              filters,
              dateRange,
              orderBy
            }}
            onLoad={handleLoadTemplate}
            onSave={handleSaveTemplate}
            onDelete={handleDeleteTemplate}
            onClose={() => setShowTemplateManager(false)}
          />
        )}
      </main>
    </div>
  );
};

export default EnhancedReportBuilder;