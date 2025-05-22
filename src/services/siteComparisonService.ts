import api from "./api";

/**
 * Interface for nearby site data
 */
export interface NearbySite {
  site_id: number;
  site_name: string;
  postcode: string;
  address: string;
  fco: string;
  panel_size: string;
  panel_type: string;
}

/**
 * Interface for generation period data
 */
export interface GenerationPeriod {
  start_date: string;
  end_date: string;
  total_generation: number;
  readings_count: number;
}

/**
 * Interface for site generation summary
 */
export interface SiteGenerationSummary {
  site_id: number;
  site_name: string;
  meter_type: string;
  meter_serial: string;
  sim_provider: string;
  sim_num: string;
  system_size?: number | string;
  generation_data: {
    current_period: GenerationPeriod;
    last_year: GenerationPeriod;
    two_years_ago: GenerationPeriod;
  };
}

/**
 * Interface for site comparison data
 */
export interface SiteComparisonData {
  current_site: SiteGenerationSummary;
  nearby_sites: SiteGenerationSummary[];
}

/**
 * Service for site comparison operations
 */
const siteComparisonService = {
  /**
   * Get nearby sites based on postcode similarity
   * @param siteId The ID of the site to find nearby sites for
   * @returns Promise with nearby sites data
   */
  getNearbySites: async (
    siteId: number | string
  ): Promise<{ current_site: NearbySite; nearby_sites: NearbySite[] }> => {
    const response = await api.get(`/sites/${siteId}/nearby/`);
    return response.data;
  },

  /**
   * Get generation summary for a site
   * @param siteId The ID of the site to get generation summary for
   * @returns Promise with site generation summary
   */
  getSiteGenerationSummary: async (
    siteId: number | string
  ): Promise<SiteGenerationSummary> => {
    const response = await api.get(`/sites/${siteId}/generation-summary/`);
    return response.data;
  },

  /**
   * Get comparison data for a site and its nearby sites
   * @param siteId The ID of the site to compare
   * @returns Promise with site comparison data
   */
  getSiteComparison: async (
    siteId: number | string
  ): Promise<SiteComparisonData> => {
    const response = await api.get(`/sites/${siteId}/comparison/`);
    return response.data;
  },
};

export default siteComparisonService;
