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
  start_time?: string;
  end_time?: string;
}

interface EngineerAvailability {
  id: number;
  name: string;
  employee_id: string;
  max_weekly_hours: number;
  estimated_job_hours: number;
  availability_dates: Array<{
    date: string;
    distance_km: number;
    remaining_weekly_hours: number;
    hours_worked_this_week: number;
    can_accommodate_jobs: boolean;
    would_cause_overtime: boolean;
    no_route: boolean;
  }>;
}

interface EngineersByLocationResponse {
  jobs: Array<{ id: number; title: string }>;
  location: { latitude: number; longitude: number };
  available_engineers: EngineerAvailability[];
  total_job_duration_hours: number;
}

interface RouteTimelineItem {
  type: 'start' | 'travel' | 'job' | 'break' | 'end';
  time: string;
  duration_minutes: number;
  description: string;
  location?: string;
  is_travel: boolean;
  distance_km?: number;
  job_id?: number;
  job_type?: string;
  priority?: string;
  is_completed?: boolean;
}

interface RouteTimelineResponse {
  timeline: RouteTimelineItem[];
  summary: {
    total_work_hours: number;
    total_travel_hours: number;
    total_job_hours: number;
    job_count: number;
    completion_percentage: number;
  };
  engineer: {
    id: number;
    name: string;
    employee_id: string;
  };
  weekly_hours: {
    week_start: string;
    max_weekly_hours: number;
    hours_worked: number;
    remaining_hours: number;
  };
}

interface AllocateJobsRequest {
  engineer_id: number;
  job_ids: number[];
  date: string;
  override_hours_limit?: boolean;
}

interface AllocateJobsResponse {
  status: 'success' | 'error';
  route_id?: number;
  jobs_allocated?: number;
  total_duration_hours?: number;
  weekly_hours_status?: {
    hours_allocated: number;
    max_weekly_hours: number;
    is_overtime: boolean;
  };
  error?: string;
  details?: {
    remaining_hours: number;
    required_hours: number;
    would_cause_overtime: boolean;
    overtime_hours: number;
  };
}

class EngineerService {
  private api: AxiosInstance;
  private baseURL = '/api/v1/engineer';

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
    // Extract non-static jobs
    const nonStaticJobs = allocationData.jobs.filter(j => !j.is_static);
    
    // Prepare the payload for route optimization endpoint
    const optimizationPayload = {
      engineer_id: allocationData.engineer_id,
      date: allocationData.date,
      job_ids: nonStaticJobs.map(job => job.id),
      start_time: allocationData.start_time || '08:00',
      end_time: allocationData.end_time || '17:00',
      use_enhanced_optimization: true,
      include_traffic: true,
      include_breaks: true,
      prefer_clusters: true,
      constraints: {
        max_distance_km: 200,
        service_time_minutes: 45,
        max_hours_per_day: 8,
        break_interval_hours: 4,
        break_duration_minutes: 30
      }
    };
    
    // If we have optimized route data with coordinates, include start location
    if (allocationData.jobs.length > 0 && allocationData.jobs[0].arrival_time) {
      // Route is already optimized, just save it
      const routeData: any = {
        engineer_id: allocationData.engineer_id,
        date: allocationData.date,
        status: 'planned',
        notes: `Route created with ${nonStaticJobs.length} jobs`,
        optimized_order: []
      };
      
      // Calculate total distance and duration
      let totalDistance = 0;
      let totalDuration = 0;
      
      allocationData.jobs.forEach(job => {
        if (job.distance_from_previous) {
          totalDistance += job.distance_from_previous;
        }
        if (job.estimated_duration) {
          totalDuration += job.estimated_duration;
        }
        if (job.travel_time) {
          totalDuration += job.travel_time;
        }
      });
      
      if (totalDistance > 0) {
        routeData.total_distance_km = Math.round(totalDistance * 100) / 100;
      }
      if (totalDuration > 0) {
        routeData.estimated_duration_minutes = Math.round(totalDuration);
      }
      
      // Include job order information
      routeData.job_ids = nonStaticJobs.map(job => job.id);
      routeData.optimized_order = nonStaticJobs.map((job, index) => ({
        job_id: job.id,
        sequence_order: job.order || index + 1,
        arrival_time: job.arrival_time,
        departure_time: job.departure_time,
        travel_time_minutes: job.travel_time,
        distance_from_previous: job.distance_from_previous
      }));
    }
    
    // Post to route optimization endpoint
    const response = await this.api.post('/route-optimization/', optimizationPayload);
    
    return response.data;
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

  // Get engineers by location
  async getEngineersByLocation(data: {
    job_ids: number[];
    date?: string;
    max_distance_km?: number;
  }): Promise<EngineersByLocationResponse> {
    const response = await this.api.post('/engineers-by-location/', data);
    return response.data;
  }

  // Get route timeline
  async getRouteTimeline(routeId: number): Promise<RouteTimelineResponse> {
    const response = await this.api.get(`/route-timeline/${routeId}/`);
    return response.data;
  }

  // Allocate jobs to engineer
  async allocateJobs(data: AllocateJobsRequest): Promise<AllocateJobsResponse> {
    const response = await this.api.post('/allocate-jobs/', data);
    return response.data;
  }

  // Cache management (placeholder - will be implemented with IndexedDB)
  private async getCachedData(url: string): Promise<any> {
    // This will be implemented with IndexedDB storage service
    return null;
  }

  // Engineer Management
  async getUsersWithoutProfiles() {
    const response = await this.api.get('/users-without-profiles/');
    return response.data;
  }

  async createEngineerFromUser(data: {
    user_id: number;
    employee_id?: string;
    phone_number?: string;
    specialization?: string;
    skills?: string[];
    certifications?: Array<{ name: string; expiry: string }>;
    status?: string;
    home_address?: string;
  }) {
    const response = await this.api.post('/create-from-user/', data);
    return response.data;
  }

  async updateEngineer(id: number, data: any) {
    const response = await this.api.patch(`/engineers/${id}/`, data);
    return response.data;
  }
}

export default new EngineerService();