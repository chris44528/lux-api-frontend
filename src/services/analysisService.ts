import { api } from './api';

export interface SignalDistribution {
  [key: string]: number;  // e.g. "Poor": 15, "Good": 27
}

export interface NetworkCount {
  network_connection: string;
  count: number;
}

export interface ScatterDataPoint {
  id: number;
  meter_reading: number;
  reading_date: string;
  meter_serial_id: string;
  site_id_id: string;
  network_connection: string;
  signal_level: number;
}

export interface RegionData {
  name: string;
  site_count: number;
  reading_count: number;
  avg_signal_level: number;
  networks: string[];
  signal_quality: string;
}

export interface SiteData {
  site_id: number;
  site_name: string;
  region: string;
  reading_count: number;
  avg_signal_level: number;
  signal_quality: string;
  networks: string[];
  total_meter_reading: number;
}

export interface ConnectionAnalysisResponse {
  network_distribution: NetworkCount[];
  signal_distribution: SignalDistribution;
  region_data: RegionData[];
  site_data: SiteData[];
  scatter_data: ScatterDataPoint[];
  summary: {
    total_readings: number;
    avg_signal_level: number;
    period: {
      start_date: string | null;
      end_date: string | null;
    };
  };
}

export interface AnalysisFilters {
  startDate?: string;
  endDate?: string;
  region?: string;
  network?: string;
}

/**
 * Get connection analysis data from the API
 */
export const getConnectionAnalysis = async (
  filters: AnalysisFilters = {}
): Promise<ConnectionAnalysisResponse> => {
  try {
    const params = new URLSearchParams();
    
    if (filters.startDate) {
      params.append('start_date', filters.startDate);
    }
    
    if (filters.endDate) {
      params.append('end_date', filters.endDate);
    }
    
    if (filters.region) {
      params.append('region', filters.region);
    }
    
    if (filters.network) {
      params.append('network', filters.network);
    }
    
    const response = await api.get('/analysis/connection/', {
      params: Object.fromEntries(params),
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching connection analysis data:', error);
    throw error;
  }
};

/**
 * Get all available regions for filtering
 */
export const getRegions = async (): Promise<string[]> => {
  try {
    const response = await api.get('/analysis/regions/');
    return response.data;
  } catch (error) {
    console.error('Error fetching regions:', error);
    throw error;
  }
};

/**
 * Get all available network providers for filtering
 */
export const getNetworks = async (): Promise<string[]> => {
  try {
    const response = await api.get('/analysis/networks/');
    return response.data;
  } catch (error) {
    console.error('Error fetching networks:', error);
    throw error;
  }
}; 