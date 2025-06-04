import { useCallback, useEffect, useState } from "react";
import { Search, Gauge, WifiOff, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, getSystemStatusSummary } from "../services/api";
import { DashboardResponse, SiteData } from "../types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Define the structure of the API response based on the actual data
interface ApiSiteResponse {
  site_id: number;
  site_name: string;
  address: string;
  postcode: string;
  account: string;
  fco: string;
  fit_id: string;
  region?: string;
  install_date?: string;
  panel_size?: string;
  last_reading?: string;
  last_reading_date?: string;
  meter_serial?: string;
}

const SitesView = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [data, setData] = useState<DashboardResponse>({
    filtered_sites: [],
    total_reads: 0,
    no_comms: 0,
    zero_reads: 0,
    current_filter: "all",
    pagination: {
      current_page: 1,
      num_pages: 1,
      has_next: false,
      has_previous: false,
    },
    metrics_last_updated: null,
  });

  // Fetch system metrics separately
  const fetchMetrics = useCallback(async () => {
    try {
      setMetricsLoading(true);
      const systemStatus = await getSystemStatusSummary();
      
      setData(prev => ({
        ...prev,
        total_reads: systemStatus.metrics.totalSites,
        no_comms: systemStatus.metrics.offlineSites,
        zero_reads: systemStatus.metrics.sitesWithIssues,
        metrics_last_updated: systemStatus.lastUpdated,
      }));
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  const fetchSites = useCallback(
    async (term = "", page = 1) => {
      setIsLoading(true);
      try {
        const params = {
          search: term,
          filter: "all",
          page: page.toString(),
          ordering: "-Site_id",
        };
        const response = await api.get("/sites/", { params });

        if (response.data) {
          // Transform the API response data into our expected format
          const transformedSites: SiteData[] = response.data.results.map(
            (site: ApiSiteResponse) => {
              return {
                site: {
                  site_id: site.site_id?.toString() || "",
                  site_name: site.site_name || "",
                  address: site.address || "",
                  postcode: site.postcode || "",
                  fit_id: site.fit_id || "",
                  fco: site.fco || "",
                  region: site.region || "",
                  install_date: site.install_date || null,
                  panel_size: site.panel_size?.toString() || "0",
                },
                latest_read: site.last_reading || null,
                last_updated:
                  site.last_reading_date || new Date().toISOString(),
                is_zero_read: false,
                is_old_reading: false,
                meter_serial: site.meter_serial || "",
              };
            }
          );

          const transformedData: DashboardResponse = {
            filtered_sites: transformedSites,
            total_reads: data.total_reads || response.data.count || 0, // Use metrics total_reads if available
            no_comms: data.no_comms, // Preserve the metrics from fetchMetrics
            zero_reads: data.zero_reads, // Preserve the metrics from fetchMetrics
            current_filter: "all",
            pagination: {
              current_page: page,
              num_pages: Math.ceil((response.data.count || 0) / 20),
              has_next: !!response.data.next,
              has_previous: !!response.data.previous,
            },
            metrics_last_updated: data.metrics_last_updated || new Date().toISOString(),
          };

          setData(transformedData);
          setCurrentPage(page);
        } else {
        }
      } catch (err) {
        if (
          (err as { response?: { status: number } })?.response?.status === 401
        ) {
          navigate("/login");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [navigate]
  );

  // Use an effect for the debounced search instead of debounce function
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        fetchSites(searchTerm, 1);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, fetchSites]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchSites();
    fetchMetrics(); // Fetch metrics when component loads
  }, [fetchSites, fetchMetrics, navigate]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Solar Sites</h1>

        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Enter Site Name/Address/PostCode"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Reads</CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data?.total_reads || 0}</div>
              <p className="text-xs text-muted-foreground dark:text-gray-400">
                Total site readings
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">No Comms</CardTitle>
              <WifiOff className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data?.no_comms || 0}</div>
              <p className="text-xs text-muted-foreground dark:text-gray-400">
                Sites with no communication
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Zero Reads</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data?.zero_reads || 0}</div>
              <p className="text-xs text-muted-foreground dark:text-gray-400">
                Sites with no readings
              </p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
          </div>
        ) : data?.filtered_sites && data.filtered_sites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.filtered_sites.map((siteData, index) => (
              <div
                key={`site-${siteData.site.site_id}-${index}`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 hover:shadow-md dark:hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-700"
              >
                <div className="p-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {siteData.site.site_name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">{siteData.site.address}</p>
                    <p className="text-gray-500 dark:text-gray-400">{siteData.site.postcode}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      System Size: {siteData.site.panel_size} kW
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Latest Read:{" "}
                      {siteData.latest_read
                        ? `${Number(siteData.latest_read).toFixed(2)} kWh`
                        : "No data"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Last Updated:{" "}
                      {new Date(siteData.last_updated).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/site/${siteData.site.site_id}`)}
                    className="w-full py-2 bg-green-700 hover:bg-[#16a34a] dark:bg-green-600 dark:hover:bg-green-700 text-white rounded transition-colors duration-200"
                  >
                    See Site Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {isLoading ? "Loading..." : "No sites found"}
          </div>
        )}

        {data?.pagination?.num_pages > 1 && (
          <div className="flex justify-center mt-8 gap-2">
            {/* Pagination controls */}
            <button
              disabled={!data.pagination.has_previous}
              onClick={() => fetchSites(searchTerm, currentPage - 1)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-900 dark:text-gray-100">
              Page {currentPage} of {data.pagination.num_pages}
            </span>
            <button
              disabled={!data.pagination.has_next}
              onClick={() => fetchSites(searchTerm, currentPage + 1)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default SitesView;
