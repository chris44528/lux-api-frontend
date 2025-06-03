import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Alert } from '../../ui/alert';

interface SyncStatusProps {
  syncStatus: {
    pending: number;
    failed: number;
    lastSync: string | null;
    isOnline: boolean;
    isSyncing: boolean;
  } | null;
  onForceSync: () => void;
}

const SyncStatus: React.FC<SyncStatusProps> = ({ syncStatus, onForceSync }) => {
  if (!syncStatus) return null;

  const getSyncStatusColor = () => {
    if (syncStatus.isSyncing) return 'text-blue-600';
    if (syncStatus.failed > 0) return 'text-red-600';
    if (syncStatus.pending > 0) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getSyncStatusText = () => {
    if (syncStatus.isSyncing) return 'Syncing...';
    if (!syncStatus.isOnline) return 'Offline';
    if (syncStatus.failed > 0) return `${syncStatus.failed} failed`;
    if (syncStatus.pending > 0) return `${syncStatus.pending} pending`;
    return 'All synced';
  };

  const getSyncIcon = () => {
    if (syncStatus.isSyncing) return '🔄';
    if (!syncStatus.isOnline) return '📴';
    if (syncStatus.failed > 0) return '❌';
    if (syncStatus.pending > 0) return '⏳';
    return '✅';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">Sync Status</CardTitle>
          <Button 
            size="sm" 
            variant="outline"
            onClick={onForceSync}
            disabled={!syncStatus.isOnline || syncStatus.isSyncing}
          >
            {syncStatus.isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getSyncIcon()}</span>
            <div>
              <p className={`font-medium ${getSyncStatusColor()}`}>
                {getSyncStatusText()}
              </p>
              {syncStatus.lastSync && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Last sync: {new Date(syncStatus.lastSync).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {syncStatus.failed > 0 && (
          <Alert variant="destructive" className="mt-3">
            <p className="text-sm">
              {syncStatus.failed} operations failed to sync. They will be retried automatically.
            </p>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default SyncStatus;