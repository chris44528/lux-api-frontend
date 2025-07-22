import axios, { AxiosInstance } from 'axios';

interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitude_accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp?: string;
  activity_type?: string;
  battery_level?: number;
  is_charging?: boolean;
  network_type?: string;
  sync_id?: string;
}

interface LocationHistory {
  id: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitude_accuracy?: number;
  heading?: number;
  speed?: number;
  recorded_at: string;
  received_at: string;
  activity_type?: string;
  battery_level?: number;
  is_charging?: boolean;
  network_type?: string;
  job_info?: {
    id: number;
    title: string;
    site_name: string;
  };
  route_info?: {
    id: number;
    date: string;
    status: string;
  };
}

interface LocationCluster {
  id: number;
  center_latitude: number;
  center_longitude: number;
  radius_meters: number;
  visit_count: number;
  total_duration_minutes: number;
  average_duration_minutes: number;
  location_name: string;
  location_type: string;
  site_info?: {
    id: number;
    name: string;
    reference: string;
  };
  first_visit: string;
  last_visit: string;
  typical_arrival_time?: string;
  typical_departure_time?: string;
}

interface MovementSummary {
  date: string;
  total_distance_km: number;
  total_driving_time_minutes: number;
  total_stationary_time_minutes: number;
  unique_locations_visited: number;
  total_location_updates: number;
  first_movement_time?: string;
  last_movement_time?: string;
  average_speed_kmh?: number;
  time_at_job_sites_minutes: number;
  unproductive_time_minutes: number;
  efficiency_percentage: number;
  location_accuracy_average?: number;
  data_gaps_count: number;
}

interface EngineerLocation {
  engineer_id: number;
  employee_id: string;
  name: string;
  status: string;
  latitude?: number;
  longitude?: number;
  last_update: string;
  time_since_update: number;
}

interface LocationHistoryParams {
  date?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}

interface MovementSummaryParams {
  date?: string;
  days?: number;
}

interface BulkLocationUpdate {
  locations: LocationUpdate[];
}

class LocationTrackingService {
  private api: AxiosInstance;

  constructor() {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    this.api = axios.create({
      baseURL: `${baseURL}/api/v1/engineer/location`,
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
  }

  // Update current location
  async updateLocation(location: LocationUpdate) {
    const response = await this.api.post('/update/', location);
    return response.data;
  }

  // Bulk update locations
  async bulkUpdateLocations(updates: BulkLocationUpdate) {
    const response = await this.api.post('/bulk-update/', updates);
    return response.data;
  }

  // Get location history
  async getLocationHistory(params: LocationHistoryParams = {}) {
    const response = await this.api.get<{
      count: number;
      locations: LocationHistory[];
    }>('/history/', { params });
    return response.data;
  }

  // Get location history for specific engineer
  async getEngineerLocationHistory(engineerId: number, params: LocationHistoryParams = {}) {
    // This would need to be implemented on the backend to filter by engineer
    const allHistory = await this.getLocationHistory(params);
    // For now, we'll get all history - backend should handle engineer filtering
    return allHistory;
  }

  // Get frequently visited locations
  async getLocationClusters() {
    const response = await this.api.get<{
      count: number;
      clusters: LocationCluster[];
    }>('/clusters/');
    return response.data;
  }

  // Get movement summary
  async getMovementSummary(params: MovementSummaryParams = {}) {
    const response = await this.api.get<{
      summaries: MovementSummary[];
      aggregates: {
        total_distance_km: number;
        average_daily_distance_km: number;
        days_with_data: number;
      };
    }>('/summary/', { params });
    return response.data;
  }

  // Get current locations of all engineers (managers only)
  async getCurrentEngineerLocations(minutes: number = 15) {
    const response = await this.api.get<{
      count: number;
      engineers: EngineerLocation[];
      threshold_minutes: number;
    }>('/current-locations/', { 
      params: { minutes } 
    });
    return response.data;
  }

  // Helper method to format location for display
  formatLocation(lat: number, lng: number, accuracy?: number): string {
    const latStr = lat.toFixed(6);
    const lngStr = lng.toFixed(6);
    if (accuracy) {
      return `${latStr}, ${lngStr} (±${Math.round(accuracy)}m)`;
    }
    return `${latStr}, ${lngStr}`;
  }

  // Helper method to calculate distance between two points
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of earth in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Helper to get path between locations
  getPathFromHistory(locations: LocationHistory[]): google.maps.LatLngLiteral[] {
    return locations
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
      .map(loc => ({
        lat: parseFloat(loc.latitude.toString()),
        lng: parseFloat(loc.longitude.toString())
      }));
  }

  // Helper to group locations by time
  groupLocationsByHour(locations: LocationHistory[]): Map<string, LocationHistory[]> {
    const groups = new Map<string, LocationHistory[]>();
    
    locations.forEach(loc => {
      const date = new Date(loc.recorded_at);
      const hourKey = `${date.toISOString().split('T')[0]} ${date.getHours()}:00`;
      
      if (!groups.has(hourKey)) {
        groups.set(hourKey, []);
      }
      groups.get(hourKey)!.push(loc);
    });

    return groups;
  }

  // Get speed statistics
  getSpeedStats(locations: LocationHistory[]): {
    average: number;
    max: number;
    moving_time: number;
    stationary_time: number;
  } {
    let totalSpeed = 0;
    let maxSpeed = 0;
    let speedCount = 0;
    let movingTime = 0;
    let stationaryTime = 0;

    const sorted = locations.sort((a, b) => 
      new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      
      const timeDiff = (new Date(curr.recorded_at).getTime() - 
                       new Date(prev.recorded_at).getTime()) / 1000 / 60; // minutes
      
      if (curr.speed !== null && curr.speed !== undefined) {
        const speedKmh = curr.speed * 3.6; // m/s to km/h
        totalSpeed += speedKmh;
        speedCount++;
        maxSpeed = Math.max(maxSpeed, speedKmh);
        
        if (speedKmh > 1) { // Moving if > 1 km/h
          movingTime += timeDiff;
        } else {
          stationaryTime += timeDiff;
        }
      }
    }

    return {
      average: speedCount > 0 ? totalSpeed / speedCount : 0,
      max: maxSpeed,
      moving_time: Math.round(movingTime),
      stationary_time: Math.round(stationaryTime)
    };
  }
}

export default new LocationTrackingService();