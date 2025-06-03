interface OfflineOperation {
  id?: number;
  operation_type: string;
  data: any;
  created_at: string;
  retry_count: number;
  error?: string;
}

interface FormSubmission {
  offline_uuid: string;
  job_id: number;
  form_template_id: number;
  form_data: Record<string, any>;
  sync_status: 'pending' | 'synced' | 'failed';
  submitted_at: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  device_info?: Record<string, any>;
}

class StorageService {
  private dbName = 'EngineerDB';
  private version = 1;
  private db: IDBDatabase | null = null;
  
  private stores = {
    formSubmissions: 'formSubmissions',
    routes: 'routes',
    formTemplates: 'formTemplates',
    syncQueue: 'syncQueue',
    cache: 'cache'
  };

  async init(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Form submissions store
        if (!db.objectStoreNames.contains(this.stores.formSubmissions)) {
          const store = db.createObjectStore(this.stores.formSubmissions, { 
            keyPath: 'offline_uuid' 
          });
          store.createIndex('job_id', 'job_id');
          store.createIndex('sync_status', 'sync_status');
          store.createIndex('submitted_at', 'submitted_at');
        }
        
        // Routes cache
        if (!db.objectStoreNames.contains(this.stores.routes)) {
          const store = db.createObjectStore(this.stores.routes, { 
            keyPath: 'id' 
          });
          store.createIndex('engineer_id', 'engineer_id');
          store.createIndex('date', 'date');
        }
        
        // Form templates cache
        if (!db.objectStoreNames.contains(this.stores.formTemplates)) {
          const store = db.createObjectStore(this.stores.formTemplates, { 
            keyPath: 'id' 
          });
          store.createIndex('form_type', 'form_type');
        }
        
        // Sync queue
        if (!db.objectStoreNames.contains(this.stores.syncQueue)) {
          const store = db.createObjectStore(this.stores.syncQueue, { 
            keyPath: 'id',
            autoIncrement: true
          });
          store.createIndex('operation_type', 'operation_type');
          store.createIndex('created_at', 'created_at');
        }

        // General cache store
        if (!db.objectStoreNames.contains(this.stores.cache)) {
          const store = db.createObjectStore(this.stores.cache, {
            keyPath: 'key'
          });
          store.createIndex('expires_at', 'expires_at');
        }
      };
    });
  }

  private async ensureDb(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  async saveFormSubmission(formData: Omit<FormSubmission, 'offline_uuid' | 'sync_status' | 'submitted_at'>): Promise<FormSubmission> {
    const db = await this.ensureDb();
    const transaction = db.transaction([this.stores.formSubmissions], 'readwrite');
    const store = transaction.objectStore(this.stores.formSubmissions);
    
    const submission: FormSubmission = {
      offline_uuid: this.generateUUID(),
      ...formData,
      sync_status: 'pending',
      submitted_at: new Date().toISOString()
    };
    
    await this.promisifyRequest(store.add(submission));
    
    // Add to sync queue
    await this.addToSyncQueue('form_submission', submission);
    
    return submission;
  }

  async addToSyncQueue(operationType: string, data: any): Promise<void> {
    const db = await this.ensureDb();
    const transaction = db.transaction([this.stores.syncQueue], 'readwrite');
    const store = transaction.objectStore(this.stores.syncQueue);
    
    const operation: OfflineOperation = {
      operation_type: operationType,
      data: data,
      created_at: new Date().toISOString(),
      retry_count: 0
    };
    
    await this.promisifyRequest(store.add(operation));
  }

  async getPendingOperations(): Promise<OfflineOperation[]> {
    const db = await this.ensureDb();
    const transaction = db.transaction([this.stores.syncQueue], 'readonly');
    const store = transaction.objectStore(this.stores.syncQueue);
    
    const operations = await this.promisifyRequest(store.getAll());
    return operations.filter(op => op.retry_count < 3); // Max 3 retries
  }

  async getPendingOperationsCount(): Promise<number> {
    const operations = await this.getPendingOperations();
    return operations.length;
  }

  async getFailedOperationsCount(): Promise<number> {
    const db = await this.ensureDb();
    const transaction = db.transaction([this.stores.syncQueue], 'readonly');
    const store = transaction.objectStore(this.stores.syncQueue);
    
    const operations = await this.promisifyRequest(store.getAll());
    return operations.filter(op => op.retry_count >= 3).length;
  }

  async markOperationSynced(operationId: number): Promise<void> {
    const db = await this.ensureDb();
    const transaction = db.transaction([this.stores.syncQueue], 'readwrite');
    const store = transaction.objectStore(this.stores.syncQueue);
    
    await this.promisifyRequest(store.delete(operationId));
  }

  async incrementRetryCount(operationId: number, error: string): Promise<void> {
    const db = await this.ensureDb();
    const transaction = db.transaction([this.stores.syncQueue], 'readwrite');
    const store = transaction.objectStore(this.stores.syncQueue);
    
    const operation = await this.promisifyRequest(store.get(operationId));
    if (operation) {
      operation.retry_count++;
      operation.error = error;
      await this.promisifyRequest(store.put(operation));
    }
  }

  // Cache methods
  async cacheData(key: string, data: any, ttlMinutes: number = 60): Promise<void> {
    const db = await this.ensureDb();
    const transaction = db.transaction([this.stores.cache], 'readwrite');
    const store = transaction.objectStore(this.stores.cache);
    
    const cacheEntry = {
      key,
      data,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString()
    };
    
    await this.promisifyRequest(store.put(cacheEntry));
  }

  async getCachedData(key: string): Promise<any> {
    const db = await this.ensureDb();
    const transaction = db.transaction([this.stores.cache], 'readonly');
    const store = transaction.objectStore(this.stores.cache);
    
    const entry = await this.promisifyRequest(store.get(key));
    
    if (entry && new Date(entry.expires_at) > new Date()) {
      return entry.data;
    }
    
    // Clean up expired entry
    if (entry) {
      const deleteTransaction = db.transaction([this.stores.cache], 'readwrite');
      const deleteStore = deleteTransaction.objectStore(this.stores.cache);
      await this.promisifyRequest(deleteStore.delete(key));
    }
    
    return null;
  }

  async clearExpiredCache(): Promise<void> {
    const db = await this.ensureDb();
    const transaction = db.transaction([this.stores.cache], 'readwrite');
    const store = transaction.objectStore(this.stores.cache);
    const index = store.index('expires_at');
    
    const now = new Date().toISOString();
    const range = IDBKeyRange.upperBound(now);
    const cursor = index.openCursor(range);
    
    await new Promise((resolve, reject) => {
      cursor.onsuccess = () => {
        const result = cursor.result;
        if (result) {
          store.delete(result.primaryKey);
          result.continue();
        } else {
          resolve(null);
        }
      };
      cursor.onerror = () => reject(cursor.error);
    });
  }

  // Route cache methods
  async cacheRoute(route: any): Promise<void> {
    const db = await this.ensureDb();
    const transaction = db.transaction([this.stores.routes], 'readwrite');
    const store = transaction.objectStore(this.stores.routes);
    
    await this.promisifyRequest(store.put(route));
  }

  async getCachedRoutes(engineerId: number, date?: string): Promise<any[]> {
    const db = await this.ensureDb();
    const transaction = db.transaction([this.stores.routes], 'readonly');
    const store = transaction.objectStore(this.stores.routes);
    const index = store.index('engineer_id');
    
    const routes = await this.promisifyRequest(index.getAll(engineerId));
    
    if (date) {
      return routes.filter(route => route.date === date);
    }
    
    return routes;
  }

  // Form template cache methods
  async cacheFormTemplates(templates: any[]): Promise<void> {
    const db = await this.ensureDb();
    const transaction = db.transaction([this.stores.formTemplates], 'readwrite');
    const store = transaction.objectStore(this.stores.formTemplates);
    
    for (const template of templates) {
      await this.promisifyRequest(store.put(template));
    }
  }

  async getCachedFormTemplates(): Promise<any[]> {
    const db = await this.ensureDb();
    const transaction = db.transaction([this.stores.formTemplates], 'readonly');
    const store = transaction.objectStore(this.stores.formTemplates);
    
    return await this.promisifyRequest(store.getAll());
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export default new StorageService();