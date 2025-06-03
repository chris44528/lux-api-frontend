import axios, { AxiosInstance } from 'axios';

interface EngineerStatus {
  status: string;
  latitude?: number;
  longitude?: number;
}

interface RouteOptimizationData {
  engineer_id: number;
  job_ids?: number[];
  jobs?: Array<{
    id: number;
    latitude?: number;
    longitude?: number;
    duration: number;
  }>;
  date: string;
  start_location?: string | {
    latitude: number;
    longitude: number;
  };
  end_location?: string;
  constraints?: {
    max_distance_km: number;
    service_time_minutes: number;
    start_time: string;
    end_time: string;
  };
  use_enhanced_optimization?: boolean;
  include_traffic?: boolean;
  include_breaks?: boolean;
  prefer_clusters?: boolean;
}

interface FormSubmissionData {
  job_id: number;
  form_template_id: number;
  form_data: Record<string, any>;
  offline_uuid?: string;
  submitted_at?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  device_info?: Record<string, any>;
}

interface SyncData {
  operations: Array<{
    operation_type: string;
    [key: string]: any;
  }>;
  engineer_id: number;
  device_info: Record<string, any>;
}

interface RouteAllocationData {
  engineer_id: number;
  date: string;
  jobs: any[];
  start_location: string;
  end_location: string;
}

class EngineerService {
  private api: AxiosInstance;
  private baseURL = '/api/engineer';

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Add auth token interceptor
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Token ${token}`;
      }
      return config;
    });

    // Handle offline scenarios
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (!navigator.onLine && error.config) {
          // Try to get cached data for GET requests
          if (error.config.method === 'get') {
            const cachedData = await this.getCachedData(error.config.url);
            if (cachedData) {
              return { data: cachedData };
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Engineers
  async getEngineers(params = {}) {
    const response = await this.api.get('/engineers/', { params });
    return response.data;
  }

  async getEngineer(id: number) {
    const response = await this.api.get(`/engineers/${id}/`);
    return response.data;
  }

  async updateEngineerStatus(id: number, statusData: EngineerStatus) {
    const response = await this.api.post(`/engineers/${id}/update_status/`, statusData);
    return response.data;
  }

  async getEngineerSchedule(id: number, params = {}) {
    const response = await this.api.get(`/engineers/${id}/schedule/`, { params });
    return response.data;
  }

  async getEngineerPerformance(id: number) {
    const response = await this.api.get(`/engineers/${id}/performance/`);
    return response.data;
  }

  // Routes
  async getRoutes(params = {}) {
    const response = await this.api.get('/routes/', { params });
    return response.data;
  }

  async createRoute(routeData: any) {
    const response = await this.api.post('/routes/', routeData);
    return response.data;
  }

  async addJobToRoute(routeId: number, jobId: number) {
    const response = await this.api.post(`/routes/${routeId}/add_job/`, { job_id: jobId });
    return response.data;
  }

  async reorderJobs(routeId: number, jobOrder: number[]) {
    const response = await this.api.post(`/routes/${routeId}/reorder_jobs/`, { job_order: jobOrder });
    return response.data;
  }

  async startRoute(routeId: number) {
    const response = await this.api.post(`/routes/${routeId}/start_route/`);
    return response.data;
  }

  async optimizeRoute(optimizationData: RouteOptimizationData) {
    const response = await this.api.post('/route-optimization/', optimizationData);
    return response.data;
  }

  async saveRouteAllocation(allocationData: RouteAllocationData) {
    // Create a route with the allocated jobs
    const routeData = {
      engineer: allocationData.engineer_id,
      date: allocationData.date,
      status: 'assigned',
      start_location: allocationData.start_location,
      end_location: allocationData.end_location
    };
    
    const routeResponse = await this.api.post('/routes/', routeData);
    const routeId = routeResponse.data.id;
    
    // Add jobs to the route
    for (const job of allocationData.jobs) {
      await this.addJobToRoute(routeId, job.id);
    }
    
    return routeResponse.data;
  }

  // Form Templates
  async getFormTemplates(params = {}) {
    const response = await this.api.get('/form-templates/', { params });
    return response.data;
  }

  async createFormTemplate(templateData: any) {
    const response = await this.api.post('/form-templates/', templateData);
    return response.data;
  }

  async duplicateFormTemplate(templateId: number) {
    const response = await this.api.post(`/form-templates/${templateId}/duplicate/`);
    return response.data;
  }

  async getFormTemplate(templateId: string) {
    const response = await this.api.get(`/form-templates/${templateId}/`);
    return response.data;
  }

  async updateFormTemplate(templateId: string, templateData: any) {
    const response = await this.api.patch(`/form-templates/${templateId}/`, templateData);
    return response.data;
  }

  // Form Submissions
  async submitForm(formData: FormSubmissionData) {
    try {
      const response = await this.api.post('/form-submissions/', formData);
      return response.data;
    } catch (error) {
      if (!navigator.onLine) {
        // Save offline - will be handled by storage service
        throw { code: 'OFFLINE', formData };
      }
      throw error;
    }
  }

  async getFormSubmissions(params = {}) {
    const response = await this.api.get('/form-submissions/', { params });
    return response.data;
  }

  async getPendingSubmissions(engineerId: number) {
    const response = await this.api.get('/form-submissions/pending/', {
      params: { engineer: engineerId }
    });
    return response.data;
  }

  // Sync
  async syncOfflineData(syncData: SyncData) {
    const response = await this.api.post('/sync-offline/', syncData);
    return response.data;
  }

  // Dashboard
  async getEngineerDashboard(engineerId: number) {
    const response = await this.api.get(`/dashboard/${engineerId}/`);
    return response.data;
  }

  // Map Services
  async geocodeAddress(address: string) {
    const response = await this.api.post('/maps/geocode/', { address });
    return response.data;
  }

  async findNearbyPlaces(location: { lat: number; lng: number }, placeTypes: string[], radius: number = 5000) {
    const response = await this.api.post('/maps/nearby-places/', {
      location,
      place_types: placeTypes,
      radius
    });
    return response.data;
  }

  async getDirections(origin: any, destination: any, waypoints?: any[], options?: any) {
    const response = await this.api.post('/maps/directions/', {
      origin,
      destination,
      waypoints,
      ...options
    });
    return response.data;
  }

  // Weekly Optimization
  async optimizeWeeklySchedule(data: {
    engineer_id: number;
    job_ids: number[];
    start_date: string;
    constraints: any;
  }) {
    const response = await this.api.post('/optimize-weekly/', data);
    return response.data;
  }

  // Cache management (placeholder - will be implemented with IndexedDB)
  private async getCachedData(url: string): Promise<any> {
    // This will be implemented with IndexedDB storage service
    return null;
  }
}

export default new EngineerService();