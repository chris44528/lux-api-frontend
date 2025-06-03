# Engineer Management System - Frontend Implementation Guide

## Backend Implementation Status ✅

The backend implementation for the Engineer Management System has been completed and includes:

### ✅ Models Implemented
- **Engineer**: Enhanced technician profiles with skills, certifications, status tracking
- **Route**: Daily route planning with optimization data
- **RouteJob**: Job assignments within routes with timing data
- **FormTemplate**: Dynamic form definitions for field work
- **FormSubmission**: Form submissions with offline sync support
- **OfflineSyncQueue**: Queue system for offline data synchronization
- **EngineerPerformanceMetrics**: Performance tracking and analytics

### ✅ API Endpoints Available
```
Base URL: /api/engineer/

Engineers:
- GET /engineers/                           - List engineers
- POST /engineers/                          - Create engineer
- GET /engineers/{id}/                      - Get engineer details
- POST /engineers/{id}/update_status/       - Update status & location
- GET /engineers/{id}/schedule/             - Get schedule
- GET /engineers/{id}/performance/          - Get metrics

Routes:
- GET /routes/                              - List routes
- POST /routes/                             - Create route
- POST /routes/{id}/add_job/                - Add job to route
- POST /routes/{id}/reorder_jobs/           - Reorder jobs
- POST /routes/{id}/start_route/            - Start route

Form Templates:
- GET /form-templates/                      - List templates
- POST /form-templates/                     - Create template
- POST /form-templates/{id}/duplicate/      - Duplicate template

Form Submissions:
- GET /form-submissions/                    - List submissions
- POST /form-submissions/                   - Submit form
- GET /form-submissions/pending/            - Get pending sync

Optimization & Sync:
- POST /route-optimization/                 - Optimize route
- POST /sync-offline/                       - Bulk sync data
- GET /dashboard/{engineer_id}/             - Dashboard data
```

### ✅ Services Implemented
- **RouteOptimizer**: Distance-based optimization with Google Maps API support
- **OfflineSyncService**: Comprehensive offline data synchronization

---

## Frontend Implementation Requirements 🚀

### 1. Core Architecture Setup

#### Package Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "axios": "^1.3.0",
    "react-query": "^3.39.0",
    "@reduxjs/toolkit": "^1.9.0",
    "react-redux": "^8.0.0",
    "react-hook-form": "^7.43.0",
    "react-dnd": "^16.0.0",
    "react-dnd-html5-backend": "^16.0.0",
    "leaflet": "^1.9.0",
    "react-leaflet": "^4.2.0",
    "date-fns": "^2.29.0",
    "recharts": "^2.5.0",
    "react-dropzone": "^14.2.0",
    "signature_pad": "^4.1.0",
    "localforage": "^1.10.0",
    "workbox-webpack-plugin": "^6.5.0"
  }
}
```

#### Project Structure
```
src/
├── components/
│   ├── engineer/
│   │   ├── dashboard/
│   │   ├── routes/
│   │   ├── forms/
│   │   └── profile/
│   ├── forms/
│   │   ├── builder/
│   │   ├── renderer/
│   │   └── templates/
│   ├── maps/
│   └── common/
├── services/
│   ├── api/
│   ├── offline/
│   ├── location/
│   └── sync/
├── hooks/
├── utils/
├── store/
└── pages/
    ├── engineer/
    ├── admin/
    └── mobile/
```

### 2. Offline-First Implementation

#### Service Worker Setup
```javascript
// public/sw.js
const CACHE_NAME = 'engineer-app-v1';
const OFFLINE_CACHE = 'engineer-offline-v1';

const CACHE_URLS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Cache API responses
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/engineer/')) {
    event.respondWith(
      caches.open(OFFLINE_CACHE).then(cache => {
        return fetch(event.request)
          .then(response => {
            // Clone and cache successful responses
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => {
            // Return cached version when offline
            return cache.match(event.request);
          });
      })
    );
  }
});

// Background sync for form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  }
});
```

#### IndexedDB Service
```javascript
// services/offline/storageService.js
class StorageService {
  constructor() {
    this.dbName = 'EngineerDB';
    this.version = 1;
    this.stores = {
      formSubmissions: 'formSubmissions',
      routes: 'routes',
      formTemplates: 'formTemplates',
      syncQueue: 'syncQueue'
    };
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
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
      };
    });
  }

  async saveFormSubmission(formData) {
    const transaction = this.db.transaction([this.stores.formSubmissions], 'readwrite');
    const store = transaction.objectStore(this.stores.formSubmissions);
    
    const submission = {
      offline_uuid: this.generateUUID(),
      ...formData,
      sync_status: 'pending',
      submitted_at: new Date().toISOString()
    };
    
    await store.add(submission);
    
    // Add to sync queue
    await this.addToSyncQueue('form_submission', submission);
    
    return submission;
  }

  async addToSyncQueue(operationType, data) {
    const transaction = this.db.transaction([this.stores.syncQueue], 'readwrite');
    const store = transaction.objectStore(this.stores.syncQueue);
    
    await store.add({
      operation_type: operationType,
      data: data,
      created_at: new Date().toISOString(),
      retry_count: 0
    });
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

export default new StorageService();
```

### 3. API Integration Service

#### API Client Setup
```javascript
// services/api/engineerApi.js
import axios from 'axios';
import storageService from '../offline/storageService';

class EngineerAPI {
  constructor() {
    this.baseURL = '/api/engineer';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    // Add auth token interceptor
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Token ${token}`;
      }
      return config;
    });
    
    // Handle offline scenarios
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (!navigator.onLine) {
          // Try to get cached data
          const cachedData = await this.getCachedData(error.config.url);
          if (cachedData) {
            return { data: cachedData };
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Engineers
  async getEngineers(params = {}) {
    const response = await this.client.get('/engineers/', { params });
    return response.data;
  }

  async getEngineer(id) {
    const response = await this.client.get(`/engineers/${id}/`);
    return response.data;
  }

  async updateEngineerStatus(id, statusData) {
    const response = await this.client.post(`/engineers/${id}/update_status/`, statusData);
    return response.data;
  }

  async getEngineerSchedule(id, params = {}) {
    const response = await this.client.get(`/engineers/${id}/schedule/`, { params });
    return response.data;
  }

  // Routes
  async getRoutes(params = {}) {
    const response = await this.client.get('/routes/', { params });
    return response.data;
  }

  async createRoute(routeData) {
    const response = await this.client.post('/routes/', routeData);
    return response.data;
  }

  async optimizeRoute(optimizationData) {
    const response = await this.client.post('/route-optimization/', optimizationData);
    return response.data;
  }

  async startRoute(routeId) {
    const response = await this.client.post(`/routes/${routeId}/start_route/`);
    return response.data;
  }

  // Form Templates
  async getFormTemplates(params = {}) {
    const response = await this.client.get('/form-templates/', { params });
    return response.data;
  }

  async createFormTemplate(templateData) {
    const response = await this.client.post('/form-templates/', templateData);
    return response.data;
  }

  // Form Submissions
  async submitForm(formData) {
    try {
      const response = await this.client.post('/form-submissions/', formData);
      return response.data;
    } catch (error) {
      if (!navigator.onLine) {
        // Save offline
        return await storageService.saveFormSubmission(formData);
      }
      throw error;
    }
  }

  async getPendingSubmissions(engineerId) {
    const response = await this.client.get('/form-submissions/pending/', {
      params: { engineer: engineerId }
    });
    return response.data;
  }

  // Sync
  async syncOfflineData(syncData) {
    const response = await this.client.post('/sync-offline/', syncData);
    return response.data;
  }

  async getEngineerDashboard(engineerId) {
    const response = await this.client.get(`/dashboard/${engineerId}/`);
    return response.data;
  }

  async getCachedData(url) {
    // Implement cache lookup logic
    return null;
  }
}

export default new EngineerAPI();
```

### 4. Engineer Dashboard Component

```jsx
// components/engineer/dashboard/EngineerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import engineerAPI from '../../../services/api/engineerApi';
import RouteCard from './RouteCard';
import JobCard from './JobCard';
import FormList from './FormList';
import StatusIndicator from './StatusIndicator';
import OfflineIndicator from '../../common/OfflineIndicator';

const EngineerDashboard = ({ engineerId }) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const queryClient = useQueryClient();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch dashboard data
  const { data: dashboardData, isLoading, error } = useQuery(
    ['engineerDashboard', engineerId],
    () => engineerAPI.getEngineerDashboard(engineerId),
    {
      refetchInterval: isOffline ? false : 30000, // Refresh every 30s when online
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Status update mutation
  const statusMutation = useMutation(
    (statusData) => engineerAPI.updateEngineerStatus(engineerId, statusData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['engineerDashboard', engineerId]);
      }
    }
  );

  const handleStatusUpdate = (newStatus, location = null) => {
    const statusData = { status: newStatus };
    if (location) {
      statusData.latitude = location.latitude;
      statusData.longitude = location.longitude;
    }
    statusMutation.mutate(statusData);
  };

  if (isLoading) {
    return <div className="loading-spinner">Loading dashboard...</div>;
  }

  if (error && !dashboardData) {
    return <div className="error-message">Failed to load dashboard</div>;
  }

  const { engineer, today_route, pending_forms, sync_status } = dashboardData || {};

  return (
    <div className="engineer-dashboard">
      {isOffline && <OfflineIndicator />}
      
      <header className="dashboard-header">
        <div className="engineer-info">
          <h1>Welcome, {engineer?.technician?.full_name}</h1>
          <p className="employee-id">{engineer?.employee_id}</p>
        </div>
        
        <StatusIndicator 
          currentStatus={engineer?.status}
          onStatusChange={handleStatusUpdate}
          isOffline={isOffline}
        />
      </header>

      <div className="dashboard-grid">
        <div className="main-content">
          {today_route ? (
            <RouteCard 
              route={today_route}
              onJobSelect={(job) => navigateToJob(job)}
              onStartRoute={() => startRoute(today_route.id)}
            />
          ) : (
            <div className="no-route">
              <h3>No route assigned for today</h3>
              <p>Contact your supervisor for job assignments</p>
            </div>
          )}

          <div className="quick-actions">
            <button className="action-btn" onClick={() => openFormBuilder()}>
              📝 Submit Form
            </button>
            <button className="action-btn" onClick={() => reportIssue()}>
              ⚠️ Report Issue
            </button>
            <button className="action-btn" onClick={() => viewHistory()}>
              📊 View History
            </button>
          </div>
        </div>

        <aside className="sidebar">
          <div className="sync-status">
            <h3>Sync Status</h3>
            <div className={`sync-indicator ${sync_status?.pending_operations > 0 ? 'pending' : 'synced'}`}>
              {sync_status?.pending_operations > 0 ? (
                <span>⏳ {sync_status.pending_operations} pending</span>
              ) : (
                <span>✅ All synced</span>
              )}
            </div>
            <small>Last sync: {new Date(sync_status?.last_sync).toLocaleTimeString()}</small>
          </div>

          <FormList 
            pendingForms={pending_forms}
            onFormSelect={(form) => openForm(form)}
          />
        </aside>
      </div>
    </div>
  );
};

export default EngineerDashboard;
```

### 5. Dynamic Form Builder

```jsx
// components/forms/builder/FormBuilder.jsx
import React, { useState, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useForm } from 'react-hook-form';
import FormCanvas from './FormCanvas';
import ElementPalette from './ElementPalette';
import ElementProperties from './ElementProperties';

const FormBuilder = ({ onSave, initialTemplate = null }) => {
  const [elements, setElements] = useState(initialTemplate?.schema?.elements || []);
  const [selectedElement, setSelectedElement] = useState(null);
  const [formSettings, setFormSettings] = useState({
    name: initialTemplate?.name || '',
    form_type: initialTemplate?.form_type || 'pre_job',
    require_signature: initialTemplate?.require_signature || false,
    require_photo: initialTemplate?.require_photo || false,
    require_gps_location: initialTemplate?.require_gps_location || true,
  });

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: formSettings
  });

  const elementTypes = [
    { type: 'text', label: 'Text Input', icon: '📝', category: 'Input' },
    { type: 'number', label: 'Number', icon: '🔢', category: 'Input' },
    { type: 'email', label: 'Email', icon: '📧', category: 'Input' },
    { type: 'textarea', label: 'Text Area', icon: '📄', category: 'Input' },
    { type: 'select', label: 'Dropdown', icon: '📋', category: 'Selection' },
    { type: 'radio', label: 'Radio Buttons', icon: '⚪', category: 'Selection' },
    { type: 'checkbox', label: 'Checkboxes', icon: '☑️', category: 'Selection' },
    { type: 'date', label: 'Date Picker', icon: '📅', category: 'Input' },
    { type: 'time', label: 'Time Picker', icon: '⏰', category: 'Input' },
    { type: 'photo', label: 'Photo Upload', icon: '📷', category: 'Media' },
    { type: 'signature', label: 'Signature', icon: '✍️', category: 'Media' },
    { type: 'gps', label: 'GPS Location', icon: '📍', category: 'Location' },
    { type: 'meter_reading', label: 'Meter Reading', icon: '⚡', category: 'Specialized' },
    { type: 'header', label: 'Header', icon: '📰', category: 'Layout' },
    { type: 'paragraph', label: 'Paragraph', icon: '📖', category: 'Layout' },
    { type: 'divider', label: 'Divider', icon: '➖', category: 'Layout' },
  ];

  const addElement = useCallback((elementType, dropIndex = null) => {
    const newElement = {
      id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: elementType.type,
      label: elementType.label,
      name: `field_${elements.length + 1}`,
      required: false,
      placeholder: '',
      help_text: '',
      validation: {},
      options: elementType.type === 'select' || elementType.type === 'radio' || elementType.type === 'checkbox' 
        ? ['Option 1', 'Option 2'] : [],
      conditionalLogic: {
        enabled: false,
        conditions: []
      }
    };

    if (dropIndex !== null) {
      const newElements = [...elements];
      newElements.splice(dropIndex, 0, newElement);
      setElements(newElements);
    } else {
      setElements([...elements, newElement]);
    }
    
    setSelectedElement(newElement);
  }, [elements]);

  const updateElement = useCallback((elementId, updates) => {
    setElements(elements.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    ));
    
    if (selectedElement && selectedElement.id === elementId) {
      setSelectedElement({ ...selectedElement, ...updates });
    }
  }, [elements, selectedElement]);

  const deleteElement = useCallback((elementId) => {
    setElements(elements.filter(el => el.id !== elementId));
    if (selectedElement && selectedElement.id === elementId) {
      setSelectedElement(null);
    }
  }, [elements, selectedElement]);

  const moveElement = useCallback((dragIndex, hoverIndex) => {
    const newElements = [...elements];
    const draggedElement = newElements[dragIndex];
    newElements.splice(dragIndex, 1);
    newElements.splice(hoverIndex, 0, draggedElement);
    setElements(newElements);
  }, [elements]);

  const saveTemplate = handleSubmit((data) => {
    const templateData = {
      ...data,
      schema: {
        elements: elements,
        settings: formSettings
      }
    };
    onSave(templateData);
  });

  const previewForm = () => {
    // Open form preview modal
    setShowPreview(true);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="form-builder">
        <header className="builder-header">
          <div className="form-info">
            <input 
              {...register('name', { required: 'Form name is required' })}
              className="form-name-input"
              placeholder="Enter form name..."
            />
            {errors.name && <span className="error">{errors.name.message}</span>}
          </div>
          
          <div className="builder-actions">
            <button type="button" onClick={previewForm} className="btn btn-secondary">
              👁️ Preview
            </button>
            <button onClick={saveTemplate} className="btn btn-primary">
              💾 Save Template
            </button>
          </div>
        </header>

        <div className="builder-workspace">
          <div className="element-palette">
            <ElementPalette 
              elementTypes={elementTypes}
              onElementAdd={addElement}
            />
          </div>

          <div className="form-canvas">
            <FormCanvas 
              elements={elements}
              selectedElement={selectedElement}
              onElementSelect={setSelectedElement}
              onElementUpdate={updateElement}
              onElementDelete={deleteElement}
              onElementMove={moveElement}
              onElementAdd={addElement}
            />
          </div>

          <div className="element-properties">
            {selectedElement ? (
              <ElementProperties 
                element={selectedElement}
                onUpdate={(updates) => updateElement(selectedElement.id, updates)}
                onDelete={() => deleteElement(selectedElement.id)}
              />
            ) : (
              <div className="no-selection">
                <h3>Form Settings</h3>
                <div className="form-settings">
                  <label>
                    <input 
                      type="checkbox"
                      {...register('require_signature')}
                    />
                    Require Signature
                  </label>
                  <label>
                    <input 
                      type="checkbox"
                      {...register('require_photo')}
                    />
                    Require Photo
                  </label>
                  <label>
                    <input 
                      type="checkbox"
                      {...register('require_gps_location')}
                    />
                    Require GPS Location
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default FormBuilder;
```

### 6. Route Optimization Component

```jsx
// components/engineer/routes/RouteOptimizer.jsx
import React, { useState, useEffect } from 'react';
import { useMutation } from 'react-query';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import engineerAPI from '../../../services/api/engineerApi';

const RouteOptimizer = ({ engineer, availableJobs, onRouteOptimized }) => {
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [constraints, setConstraints] = useState({
    max_distance_km: 200,
    service_time_minutes: 30,
    start_time: '08:00',
    end_time: '17:00'
  });

  const optimizeMutation = useMutation(
    (optimizationData) => engineerAPI.optimizeRoute(optimizationData),
    {
      onSuccess: (data) => {
        setOptimizedRoute(data);
        setIsOptimizing(false);
        onRouteOptimized(data);
      },
      onError: (error) => {
        console.error('Route optimization failed:', error);
        setIsOptimizing(false);
      }
    }
  );

  const handleJobSelection = (job, isSelected) => {
    if (isSelected) {
      setSelectedJobs([...selectedJobs, job]);
    } else {
      setSelectedJobs(selectedJobs.filter(j => j.id !== job.id));
    }
  };

  const optimizeRoute = () => {
    if (selectedJobs.length === 0) return;

    setIsOptimizing(true);
    const optimizationData = {
      engineer_id: engineer.id,
      job_ids: selectedJobs.map(job => job.id),
      date: new Date().toISOString().split('T')[0],
      start_location: engineer.current_location ? {
        latitude: engineer.current_location.latitude,
        longitude: engineer.current_location.longitude
      } : null,
      constraints: constraints
    };

    optimizeMutation.mutate(optimizationData);
  };

  const getRoutePolyline = () => {
    if (!optimizedRoute || !optimizedRoute.optimized_order) return [];
    
    const points = [];
    if (engineer.current_location) {
      points.push([engineer.current_location.latitude, engineer.current_location.longitude]);
    }
    
    optimizedRoute.optimized_order.forEach(item => {
      if (item.coordinates) {
        points.push([item.coordinates.latitude, item.coordinates.longitude]);
      }
    });
    
    return points;
  };

  return (
    <div className="route-optimizer">
      <div className="optimizer-sidebar">
        <h3>Route Optimization</h3>
        
        <div className="constraints-section">
          <h4>Constraints</h4>
          <div className="constraint-input">
            <label>Max Distance (km):</label>
            <input 
              type="number"
              value={constraints.max_distance_km}
              onChange={(e) => setConstraints({
                ...constraints,
                max_distance_km: parseInt(e.target.value)
              })}
            />
          </div>
          <div className="constraint-input">
            <label>Service Time (min):</label>
            <input 
              type="number"
              value={constraints.service_time_minutes}
              onChange={(e) => setConstraints({
                ...constraints,
                service_time_minutes: parseInt(e.target.value)
              })}
            />
          </div>
        </div>

        <div className="jobs-section">
          <h4>Available Jobs ({availableJobs.length})</h4>
          <div className="jobs-list">
            {availableJobs.map(job => (
              <div key={job.id} className="job-item">
                <label>
                  <input 
                    type="checkbox"
                    checked={selectedJobs.some(j => j.id === job.id)}
                    onChange={(e) => handleJobSelection(job, e.target.checked)}
                  />
                  <div className="job-info">
                    <h5>{job.title}</h5>
                    <p>{job.address}</p>
                    <span className={`priority priority-${job.priority}`}>
                      {job.priority}
                    </span>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="optimization-actions">
          <button 
            onClick={optimizeRoute}
            disabled={selectedJobs.length === 0 || isOptimizing}
            className="btn btn-primary"
          >
            {isOptimizing ? '🔄 Optimizing...' : '🎯 Optimize Route'}
          </button>
          
          {optimizedRoute && (
            <div className="optimization-results">
              <h4>Optimization Results</h4>
              <div className="metrics">
                <div className="metric">
                  <span className="label">Total Distance:</span>
                  <span className="value">{optimizedRoute.total_distance} km</span>
                </div>
                <div className="metric">
                  <span className="label">Estimated Time:</span>
                  <span className="value">{Math.round(optimizedRoute.estimated_duration / 60)} hours</span>
                </div>
                <div className="metric">
                  <span className="label">Jobs:</span>
                  <span className="value">{optimizedRoute.optimized_order.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="map-container">
        <MapContainer 
          center={engineer.current_location ? 
            [engineer.current_location.latitude, engineer.current_location.longitude] : 
            [51.5074, -0.1278]} 
          zoom={10}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
          />
          
          {/* Engineer location */}
          {engineer.current_location && (
            <Marker position={[engineer.current_location.latitude, engineer.current_location.longitude]}>
              <Popup>
                <strong>{engineer.technician.full_name}</strong><br />
                Current Location
              </Popup>
            </Marker>
          )}
          
          {/* Job locations */}
          {selectedJobs.map((job, index) => {
            if (!job.site.latitude || !job.site.longitude) return null;
            
            const isOptimized = optimizedRoute?.optimized_order.some(item => item.job_id === job.id);
            const sequenceOrder = optimizedRoute?.optimized_order.find(item => item.job_id === job.id)?.sequence_order;
            
            return (
              <Marker 
                key={job.id}
                position={[job.site.latitude, job.site.longitude]}
                // icon={createJobIcon(isOptimized, sequenceOrder)}
              >
                <Popup>
                  <strong>{job.title}</strong><br />
                  {job.address}<br />
                  Priority: {job.priority}
                  {isOptimized && <><br />Order: #{sequenceOrder}</>}
                </Popup>
              </Marker>
            );
          })}
          
          {/* Optimized route polyline */}
          {optimizedRoute && (
            <Polyline 
              positions={getRoutePolyline()}
              pathOptions={{ color: 'blue', weight: 3 }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default RouteOptimizer;
```

### 7. Mobile PWA Configuration

#### Manifest.json
```json
{
  "name": "LUX Engineer App",
  "short_name": "LUX Engineer",
  "description": "Field engineer management application",
  "start_url": "/engineer",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1976d2",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "permissions": [
    "geolocation",
    "camera",
    "microphone"
  ]
}
```

#### PWA Hooks
```javascript
// hooks/usePWA.js
import { useState, useEffect } from 'react';

export const usePWA = () => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  return { isInstallable, installApp };
};

// hooks/useGeolocation.js
import { useState, useEffect } from 'react';

export const useGeolocation = (options = {}) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported');
      setLoading(false);
      return;
    }

    const watcher = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
        ...options
      }
    );

    return () => navigator.geolocation.clearWatch(watcher);
  }, []);

  return { location, error, loading };
};
```

### 8. Sync Management

```javascript
// services/sync/syncManager.js
import engineerAPI from '../api/engineerApi';
import storageService from '../offline/storageService';

class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.syncInterval = null;
    this.retryAttempts = 3;
  }

  async startAutoSync(intervalMs = 30000) {
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.syncPendingData();
      }
    }, intervalMs);
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async syncPendingData() {
    if (this.isSyncing) return;

    this.isSyncing = true;
    
    try {
      // Get pending operations from IndexedDB
      const pendingOperations = await storageService.getPendingOperations();
      
      if (pendingOperations.length === 0) {
        this.isSyncing = false;
        return { success: true, synced: 0 };
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
      const result = await engineerAPI.syncOfflineData(bulkData);
      
      // Update local storage based on results
      await this.processSyncResults(result, pendingOperations);
      
      this.isSyncing = false;
      return result;
      
    } catch (error) {
      console.error('Sync failed:', error);
      this.isSyncing = false;
      throw error;
    }
  }

  async processSyncResults(result, originalOperations) {
    // Mark successful operations as synced
    for (const success of result.successful) {
      const operation = originalOperations.find(op => 
        op.data.sync_uuid === success.sync_uuid
      );
      if (operation) {
        await storageService.markOperationSynced(operation.id);
      }
    }

    // Handle failed operations
    for (const failure of result.failed) {
      const operation = originalOperations.find(op => 
        op.data.sync_uuid === failure.sync_uuid
      );
      if (operation) {
        await storageService.incrementRetryCount(operation.id, failure.error);
      }
    }
  }

  getCurrentEngineerId() {
    // Get from localStorage or context
    return localStorage.getItem('currentEngineerId');
  }

  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      online: navigator.onLine,
      timestamp: new Date().toISOString()
    };
  }

  // Force sync trigger
  async forcSync() {
    if (!navigator.onLine) {
      throw new Error('Cannot sync while offline');
    }
    
    return await this.syncPendingData();
  }

  // Get sync status
  async getSyncStatus() {
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
}

export default new SyncManager();
```

---

## Next Steps for Frontend Implementation

1. **Setup Development Environment**
   - Install dependencies
   - Configure PWA settings
   - Setup service worker

2. **Implement Core Components**
   - Engineer dashboard
   - Route management
   - Form builder and renderer
   - Offline storage system

3. **Add Advanced Features**
   - GPS tracking
   - Photo capture
   - Signature capture
   - Map integration

4. **Testing & Optimization**
   - Offline functionality testing
   - Performance optimization
   - Mobile responsiveness
   - User acceptance testing

The backend is fully implemented and ready to support all these frontend features. The API endpoints are designed to handle both online and offline scenarios, with comprehensive sync capabilities.