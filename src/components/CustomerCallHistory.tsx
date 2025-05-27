import React, { useState, useEffect } from 'react';
import { getCustomerCalls, CustomerCall } from '../services/api';
import { format } from 'date-fns';
import { Phone, Plus, Clock, User, PenSquare, AlertCircle } from 'lucide-react';

interface CustomerCallHistoryProps {
  siteId: string;
}

const CustomerCallHistory: React.FC<CustomerCallHistoryProps> = ({ siteId }) => {
  const [calls, setCalls] = useState<CustomerCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const loadCalls = async () => {
      if (!siteId) {
        setCalls([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getCustomerCalls(parseInt(siteId));
        if (Array.isArray(data)) {
          setCalls(data);
        } else {
          setCalls([]);
          setError('Invalid data format received from server');
        }
      } catch (err) {
        setError('Failed to load call history');
        setCalls([]);
      } finally {
        setLoading(false);
      }
    };

    loadCalls();
  }, [siteId]);

  const formatDuration = (seconds: number | null): string => {
    if (seconds === null) return 'N/A';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    }
    
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case 'answered':
        return 'bg-green-100 text-green-800';
      case 'no_answer':
        return 'bg-red-100 text-red-800';
      case 'voicemail':
        return 'bg-blue-100 text-blue-800';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800';
      case 'callback':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy, HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  const formatStatusLabel = (status: string): string => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
        <span className="ml-2 text-gray-600">Loading call history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  const callsArray = Array.isArray(calls) ? calls : [];
  const totalCalls = callsArray.length;
  const answeredCalls = callsArray.filter(call => call.status === 'answered').length;
  const answeredPercentage = totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Call History</h3>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center"
        >
          <Plus className="h-4 w-4 mr-1" />
          Log Call
        </button>
      </div>
      
      {/* Call Stats Summary */}
      <div className="mb-4 grid grid-cols-3 gap-4">
        <div className="bg-gray-50 p-3 rounded-md">
          <div className="text-sm text-gray-500">Total Calls</div>
          <div className="text-xl font-bold">{totalCalls}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-md">
          <div className="text-sm text-gray-500">Answered</div>
          <div className="text-xl font-bold">{answeredCalls}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-md">
          <div className="text-sm text-gray-500">Answer Rate</div>
          <div className="text-xl font-bold">{answeredPercentage}%</div>
        </div>
      </div>
      
      {callsArray.length > 0 ? (
        <div className="space-y-4">
          {callsArray.map(call => (
            <div key={call.id} className="border rounded-md p-3 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium">{formatDate(call.call_date)}</h4>
                  <div className="text-sm text-gray-500">
                    {call.call_purpose || 'No purpose specified'}
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(call.status)}`}>
                  {formatStatusLabel(call.status)}
                </span>
              </div>
              
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 mr-1 text-gray-500" />
                  <span>{call.caller_name || 'Unknown caller'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-1 text-gray-500" />
                  <span>Duration: {formatDuration(call.call_duration)}</span>
                </div>
              </div>
              
              {call.notes && (
                <div className="mt-2 text-sm bg-gray-50 p-2 rounded">
                  <PenSquare className="h-4 w-4 mr-1 inline text-gray-500" />
                  {call.notes}
                </div>
              )}
              
              {call.follow_up_required && (
                <div className="mt-2 text-sm text-orange-700 bg-orange-50 p-2 rounded">
                  <AlertCircle className="h-4 w-4 mr-1 inline" />
                  Follow-up required {call.follow_up_date ? `by ${formatDate(call.follow_up_date)}` : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <Phone className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>No call history found for this site</p>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center mt-2 text-green-700 hover:text-green-800"
          >
            <Plus className="h-4 w-4 mr-1" />
            Log a new call
          </button>
        </div>
      )}
      
      {/* Add Modal logic would go here (not implemented in this basic version) */}
    </div>
  );
};

export default CustomerCallHistory; 