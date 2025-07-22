import React, { useState } from 'react';
import { ReportTemplate } from '../../types/api';
import { Save, FolderOpen, Trash2, X, Globe, Lock, Clock, User } from 'lucide-react';

interface TemplateManagerProps {
  templates: ReportTemplate[];
  currentConfig: any;
  onLoad: (templateId: number) => void;
  onSave: (name: string, description: string, isPublic: boolean) => void;
  onDelete: (templateId: number) => void;
  onClose: () => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  templates,
  currentConfig,
  onLoad,
  onSave,
  onDelete,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'load' | 'save'>('load');
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  
  // Filter templates based on search
  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Handle save
  const handleSave = () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }
    
    onSave(templateName, templateDescription, isPublic);
    onClose();
  };
  
  // Handle delete with confirmation
  const handleDelete = (templateId: number) => {
    if (confirmDelete === templateId) {
      onDelete(templateId);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(templateId);
      // Reset confirmation after 3 seconds
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold dark:text-gray-100">
            Report Templates
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            type="button"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b dark:border-gray-700">
          <button
            onClick={() => setActiveTab('load')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'load'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
            type="button"
          >
            <FolderOpen className="inline h-4 w-4 mr-2" />
            Load Template
          </button>
          <button
            onClick={() => setActiveTab('save')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'save'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
            type="button"
          >
            <Save className="inline h-4 w-4 mr-2" />
            Save Template
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'load' ? (
            <div className="h-full flex flex-col">
              {/* Search */}
              <div className="p-4">
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
              </div>
              
              {/* Template list */}
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                {filteredTemplates.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No templates found
                  </p>
                ) : (
                  <div className="space-y-3">
                    {filteredTemplates.map(template => (
                      <div
                        key={template.id}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                {template.name}
                              </h3>
                              {template.is_public ? (
                                <Globe className="h-4 w-4 text-green-500" title="Public template" />
                              ) : (
                                <Lock className="h-4 w-4 text-gray-400" title="Private template" />
                              )}
                            </div>
                            {template.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {template.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-500">
                              <span className="flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                {template.created_by}
                              </span>
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDate(template.updated_at)}
                              </span>
                              {template.run_count > 0 && (
                                <span>
                                  Run {template.run_count} time{template.run_count > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => {
                                onLoad(template.id);
                                onClose();
                              }}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                              type="button"
                            >
                              Load
                            </button>
                            {template.is_owner && (
                              <button
                                onClick={() => handleDelete(template.id)}
                                className={`px-3 py-1 rounded text-sm ${
                                  confirmDelete === template.id
                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
                                }`}
                                type="button"
                              >
                                {confirmDelete === template.id ? 'Confirm' : 'Delete'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="My Custom Report"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    placeholder="Describe what this report template does..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  />
                </div>
                
                <div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Make this template public (visible to all users)
                    </span>
                  </label>
                </div>
                
                {/* Current configuration summary */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Configuration
                  </h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>• {currentConfig.tables.length} table(s) selected</p>
                    <p>• {currentConfig.columns.length} column(s) selected</p>
                    {currentConfig.aggregations.length > 0 && (
                      <p>• {currentConfig.aggregations.length} aggregation(s)</p>
                    )}
                    {currentConfig.filters.length > 0 && (
                      <p>• {currentConfig.filters.length} filter(s)</p>
                    )}
                    {currentConfig.groupBy.length > 0 && (
                      <p>• Grouped by {currentConfig.groupBy.length} column(s)</p>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!templateName.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    type="button"
                  >
                    Save Template
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateManager;