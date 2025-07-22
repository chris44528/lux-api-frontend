import React, { useState, useEffect } from 'react';
import { X, Send, Clock, CheckCircle, AlertCircle, History as HistoryIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { api } from '../../services/api';

interface PostcardHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  postcardRequests: any[];
}

export const PostcardHistoryModal: React.FC<PostcardHistoryModalProps> = ({
  isOpen,
  onClose,
  jobId,
  postcardRequests
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedPostcard, setSelectedPostcard] = useState<number | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const fetchHistory = async (postcardId: number) => {
    setLoading(true);
    try {
      const response = await api.get(`/postcards/${postcardId}/history/`);
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch postcard history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPostcard) {
      fetchHistory(selectedPostcard);
    }
  }, [selectedPostcard]);

  useEffect(() => {
    // Select first postcard by default
    if (postcardRequests.length > 0 && !selectedPostcard) {
      setSelectedPostcard(postcardRequests[0].id);
    }
  }, [postcardRequests]);

  if (!isOpen) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'requested':
        return <Clock className="h-4 w-4" />;
      case 'sent':
        return <Send className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400';
      case 'sent':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <HistoryIcon className="h-5 w-5 text-gray-500" />
            <h2 className="text-xl font-semibold dark:text-white">Postcard History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-88px)]">
          {/* Postcard List */}
          <div className="w-1/3 border-r dark:border-gray-700 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                Postcards
              </h3>
              <div className="space-y-2">
                {postcardRequests.map((postcard) => (
                  <button
                    key={postcard.id}
                    onClick={() => setSelectedPostcard(postcard.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedPostcard === postcard.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium dark:text-white">
                        Postcard {postcard.postcard_number}
                      </span>
                      {getStatusIcon(postcard.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge className={`text-xs ${getStatusColor(postcard.status)}`}>
                        {postcard.status_display || postcard.status}
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(postcard.requested_date)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* History Timeline */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : history.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                    Status History
                  </h3>
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                    
                    {/* Timeline items */}
                    <div className="space-y-6">
                      {history.map((item, index) => (
                        <div key={item.id} className="relative flex items-start">
                          {/* Timeline dot */}
                          <div className={`absolute left-4 w-8 h-8 -ml-4 rounded-full flex items-center justify-center ${
                            index === 0 ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                          }`}>
                            {getStatusIcon(item.new_status)}
                          </div>
                          
                          {/* Content */}
                          <div className="ml-12 flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {item.old_status && (
                                  <>
                                    <Badge className={`text-xs ${getStatusColor(item.old_status)}`}>
                                      {item.old_status}
                                    </Badge>
                                    <span className="text-gray-500 dark:text-gray-400">→</span>
                                  </>
                                )}
                                <Badge className={`text-xs ${getStatusColor(item.new_status)}`}>
                                  {item.new_status}
                                </Badge>
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(item.changed_date)}
                              </span>
                            </div>
                            {item.notes && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                                {item.notes}
                              </p>
                            )}
                            {item.changed_by_username && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                By: {item.changed_by_username}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    No history available for this postcard
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};