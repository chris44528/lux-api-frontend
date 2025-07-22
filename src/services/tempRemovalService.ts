import api from './api';

export interface TempRemoval {
  id?: number;
  site: number | {
    id: number;
    site_reference: string;
    site_name: string;
  };
  removal_date: string;
  refit_date?: string | null;
  job_number?: string;
  notes?: string;
  created_by?: {
    id: number;
    username: string;
    email: string;
  };
  created_at?: string;
  updated_at?: string;
  is_refitted?: boolean;
  days_removed?: number;
}

export interface TempRemovalReport {
  summary: {
    total_removals: number;
    currently_removed: number;
    refitted_count: number;
    average_days_removed: number;
    sites_affected: number;
  };
  removals: TempRemoval[];
  date_range: {
    start_date: string;
    end_date: string;
  };
}

export interface TempRemovalFilters {
  site?: number;
  site__site_name__icontains?: string;
  status?: 'removed' | 'refitted';
  removal_date__gte?: string;
  removal_date__lte?: string;
  refit_date__gte?: string;
  refit_date__lte?: string;
  job_number__icontains?: string;
}

class TempRemovalService {
  private baseUrl = '/temp-removals';

  // Get all temp removals with optional filters
  async getTempRemovals(filters?: TempRemovalFilters): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: TempRemoval[];
  }> {
    const response = await api.get(this.baseUrl + '/', { params: filters });
    return response.data;
  }

  // Get temp removals for a specific site
  async getSiteTempRemovals(siteId: number): Promise<TempRemoval[]> {
    const response = await api.get(this.baseUrl + '/', { 
      params: { site: siteId } 
    });
    return response.data.results;
  }

  // Get a single temp removal
  async getTempRemoval(id: number): Promise<TempRemoval> {
    const response = await api.get(`${this.baseUrl}/${id}/`);
    return response.data;
  }

  // Create a new temp removal
  async createTempRemoval(data: Omit<TempRemoval, 'id' | 'created_by' | 'created_at' | 'updated_at' | 'is_refitted' | 'days_removed'>): Promise<TempRemoval> {
    const response = await api.post(this.baseUrl + '/', data);
    return response.data;
  }

  // Update a temp removal
  async updateTempRemoval(id: number, data: Partial<TempRemoval>): Promise<TempRemoval> {
    const response = await api.patch(`${this.baseUrl}/${id}/`, data);
    return response.data;
  }

  // Delete a temp removal
  async deleteTempRemoval(id: number): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}/`);
  }

  // Get currently removed equipment
  async getCurrentlyRemoved(): Promise<TempRemoval[]> {
    const response = await api.get(`${this.baseUrl}/currently_removed/`);
    return response.data;
  }

  // Mark as refitted
  async markRefitted(id: number, refitDate: string): Promise<TempRemoval> {
    const response = await api.post(`${this.baseUrl}/${id}/mark_refitted/`, {
      refit_date: refitDate
    });
    return response.data;
  }

  // Generate report
  async generateReport(startDate: string, endDate: string, filters?: {
    site?: number;
    status?: 'removed' | 'refitted';
  }): Promise<TempRemovalReport> {
    const response = await api.get(`${this.baseUrl}/report/`, {
      params: {
        start_date: startDate,
        end_date: endDate,
        ...filters
      }
    });
    return response.data;
  }

  // Export to CSV
  async exportToCsv(filters?: TempRemovalFilters): Promise<Blob> {
    const response = await api.get(`${this.baseUrl}/export/`, {
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  }

  // Bulk create
  async bulkCreate(removals: Array<Omit<TempRemoval, 'id' | 'created_by' | 'created_at' | 'updated_at' | 'is_refitted' | 'days_removed'>>): Promise<TempRemoval[]> {
    const response = await api.post(`${this.baseUrl}/bulk_create/`, {
      removals
    });
    return response.data.created;
  }
}

export default new TempRemovalService();