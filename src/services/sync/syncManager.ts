import engineerService from '../engineerService';
import storageService from '../offline/storageService';

interface SyncResult {
  successful: Array<{
    sync_uuid: string;
    [key: string]: any;
  }>;
  failed: Array<{
    sync_uuid: string;
    error: string;
    [key: string]: any;
  }>;
}

class SyncManager {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private retryAttempts = 3;
  private listeners: ((status: any) => void)[] = [];

  async startAutoSync(intervalMs = 30000): Promise<void> {
    // Clear any existing interval
    this.stopAutoSync();
    
    // Initial sync
    if (navigator.onLine) {
      this.syncPendingData();
    }
    
    // Set up interval
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.syncPendingData();
      }
    }, intervalMs);
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async syncPendingData(): Promise<{ success: boolean; synced: number; failed: number }> {
    if (this.isSyncing) {
      return { success: false, synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.notifyListeners();
    
    try {
      // Get pending operations from IndexedDB
      const pendingOperations = await storageService.getPendingOperations();
      
      if (pendingOperations.length === 0) {
        this.isSyncing = false;
        this.notifyListeners();
        return { success: true, synced: 0, failed: 0 };
      }

      // Group operations for bulk sync
      const bulkData = {
        operations: pendingOperations.map(op => ({
          operation_type: op.operation_type,
          ...op.data
        })),
        engineer_id: this.getCurrentEngineerId(),
        device_info: this.getDeviceInfo()
      };

      // Send to backend
      const result = await engineerService.syncOfflineData(bulkData);
      
      // Update local storage based on results
      await this.processSyncResults(result, pendingOperations);
      
      // Update last sync time
      localStorage.setItem('lastSyncTime', new Date().toISOString());
      
      this.isSyncing = false;
      this.notifyListeners();
      
      return {
        success: true,
        synced: result.successful.length,
        failed: result.failed.length
      };
      
    } catch (error) {
      console.error('Sync failed:', error);
      this.isSyncing = false;
      this.notifyListeners();
      throw error;
    }
  }

  private async processSyncResults(result: SyncResult, originalOperations: any[]): Promise<void> {
    // Mark successful operations as synced
    for (const success of result.successful) {
      const operation = originalOperations.find(op => 
        op.data.offline_uuid === success.sync_uuid ||
        op.data.sync_uuid === success.sync_uuid
      );
      if (operation) {
        await storageService.markOperationSynced(operation.id);
      }
    }

    // Handle failed operations
    for (const failure of result.failed) {
      const operation = originalOperations.find(op => 
        op.data.offline_uuid === failure.sync_uuid ||
        op.data.sync_uuid === failure.sync_uuid
      );
      if (operation) {
        await storageService.incrementRetryCount(operation.id, failure.error);
      }
    }
  }

  getCurrentEngineerId(): number {
    // Get from localStorage or context
    const engineerId = localStorage.getItem('currentEngineerId');
    return engineerId ? parseInt(engineerId) : 0;
  }

  getDeviceInfo(): Record<string, any> {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      online: navigator.onLine,
      timestamp: new Date().toISOString(),
      screen: {
        width: window.screen.width,
        height: window.screen.height
      }
    };
  }

  // Force sync trigger
  async forceSync(): Promise<{ success: boolean; synced: number; failed: number }> {
    if (!navigator.onLine) {
      throw new Error('Cannot sync while offline');
    }
    
    return await this.syncPendingData();
  }

  // Get sync status
  async getSyncStatus(): Promise<{
    pending: number;
    failed: number;
    lastSync: string | null;
    isOnline: boolean;
    isSyncing: boolean;
  }> {
    const pending = await storageService.getPendingOperationsCount();
    const failed = await storageService.getFailedOperationsCount();
    
    return {
      pending,
      failed,
      lastSync: localStorage.getItem('lastSyncTime'),
      isOnline: navigator.onLine,
      isSyncing: this.isSyncing
    };
  }

  // Subscribe to sync status changes
  subscribe(listener: (status: any) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private async notifyListeners(): Promise<void> {
    const status = await this.getSyncStatus();
    this.listeners.forEach(listener => listener(status));
  }

  // Request background sync
  async requestBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      try {
        await (registration as any).sync.register('background-sync');
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    }
  }
}

export default new SyncManager();