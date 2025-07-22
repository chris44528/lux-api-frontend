import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Calendar, FileText, AlertCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import tempRemovalService, { TempRemoval } from '../../services/tempRemovalService';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import TempRemovalForm from './TempRemovalForm';

interface TempRemovalModalProps {
  siteId: number;
  siteName: string;
  siteReference: string;
  isOpen: boolean;
  onClose: () => void;
}

const TempRemovalModal: React.FC<TempRemovalModalProps> = ({
  siteId,
  siteName,
  siteReference,
  isOpen,
  onClose,
}) => {
  const [removals, setRemovals] = useState<TempRemoval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRemoval, setEditingRemoval] = useState<TempRemoval | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchRemovals();
    }
  }, [isOpen, siteId]);

  const fetchRemovals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tempRemovalService.getSiteTempRemovals(siteId);
      setRemovals(data);
    } catch (err) {
      setError('Failed to load removal records');
      console.error('Error fetching removals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this removal record?')) {
      return;
    }

    try {
      setDeletingId(id);
      await tempRemovalService.deleteTempRemoval(id);
      setRemovals(removals.filter(r => r.id !== id));
    } catch (err) {
      setError('Failed to delete removal record');
      console.error('Error deleting removal:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormSubmit = async (data: Omit<TempRemoval, 'id'>) => {
    try {
      if (editingRemoval) {
        const updated = await tempRemovalService.updateTempRemoval(editingRemoval.id!, data);
        setRemovals(removals.map(r => r.id === updated.id ? updated : r));
      } else {
        const created = await tempRemovalService.createTempRemoval({
          ...data,
          site: siteId
        });
        setRemovals([created, ...removals]);
      }
      setShowForm(false);
      setEditingRemoval(null);
    } catch (err) {
      setError('Failed to save removal record');
      console.error('Error saving removal:', err);
    }
  };

  const handleEdit = (removal: TempRemoval) => {
    setEditingRemoval(removal);
    setShowForm(true);
  };

  const handleMarkRefitted = async (removal: TempRemoval) => {
    const refitDate = window.prompt('Enter refit date (YYYY-MM-DD):', format(new Date(), 'yyyy-MM-dd'));
    if (!refitDate) return;

    try {
      const updated = await tempRemovalService.markRefitted(removal.id!, refitDate);
      setRemovals(removals.map(r => r.id === updated.id ? updated : r));
    } catch (err) {
      setError('Failed to mark as refitted');
      console.error('Error marking refitted:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Temporary Removals
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {siteName} ({siteReference})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Add/Edit Form */}
          {showForm ? (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  {editingRemoval ? 'Edit Removal Record' : 'Add New Removal Record'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TempRemovalForm
                  initialData={editingRemoval || undefined}
                  onSubmit={handleFormSubmit}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingRemoval(null);
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="mb-6">
              <Button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Removal Record
              </Button>
            </div>
          )}

          {/* Removals List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : removals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No temporary removal records found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {removals.map((removal) => (
                <Card key={removal.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant={removal.is_refitted ? 'secondary' : 'default'}>
                            {removal.is_refitted ? 'Refitted' : 'Removed'}
                          </Badge>
                          {removal.days_removed !== undefined && (
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {removal.days_removed} days
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Removal Date
                            </p>
                            <p className="font-medium">
                              {format(new Date(removal.removal_date), 'dd/MM/yyyy')}
                            </p>
                          </div>
                          
                          {removal.refit_date && (
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Refit Date
                              </p>
                              <p className="font-medium">
                                {format(new Date(removal.refit_date), 'dd/MM/yyyy')}
                              </p>
                            </div>
                          )}
                          
                          {removal.job_number && (
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Job Number
                              </p>
                              <p className="font-medium">{removal.job_number}</p>
                            </div>
                          )}
                        </div>
                        
                        {removal.notes && (
                          <div className="mt-3">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Notes</p>
                            <p className="text-sm mt-1">{removal.notes}</p>
                          </div>
                        )}
                        
                        <div className="mt-3 text-xs text-gray-500">
                          Created by {removal.created_by?.username || 'Unknown'} on{' '}
                          {removal.created_at && format(new Date(removal.created_at), 'dd/MM/yyyy HH:mm')}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {!removal.is_refitted && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkRefitted(removal)}
                            title="Mark as refitted"
                          >
                            <Calendar className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(removal)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(removal.id!)}
                          disabled={deletingId === removal.id}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TempRemovalModal;