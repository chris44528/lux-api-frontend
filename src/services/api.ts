import axios from "axios";
import { SystemNote } from "../types/api";
import { User, UserGroup, UserFormData } from "../types/user";

// Define proper types for the cache
interface SiteDetailCacheItem {
  data: Record<string, unknown>;
  timestamp: number;
}

// Define Meter interface
export interface Meter {
  id?: number;
  meter_serial: string;
  meter_model?: string;
  meter_type?: string;
  meter_install_date?: string;
  meter_adoption_date?: string;
  meter_opening_read?: string;
  meter_password?: string;
  meter_band?: string;
  export_meter?: boolean;
  site_id?: number;
}

// Initialize cache with proper typing
const siteDetailCache: Record<string, SiteDetailCacheItem> = {};

// Create main API instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false, // Set to false since we're using token auth
});

// Create meter testing API instance
const meterTestApi = axios.create({
  baseURL: "http://10.75.0.40",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    console.log("Request interceptor - Token present:", !!token);
    console.log("Request URL:", config.url);

    if (token && config.headers) {
      console.log("Authorization header set: Token", token);
      config.headers.Authorization = `Token ${token}`;
    } else {
      console.error("No auth token found in localStorage");
      // Don't redirect here, let the response interceptor handle it
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log("Response received:", {
      status: response.status,
      url: response.config.url,
      headers: response.headers,
      data: response.config.url?.includes("/groups")
        ? response.data
        : undefined, // Only log group data
    });
    return response;
  },
  async (error) => {
    console.error("Response error:", {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      token: localStorage.getItem("access_token"),
      headers: error.config?.headers,
    });

    if (error.code === "ERR_NETWORK") {
      console.error(
        "Network error - please check if the backend server is running"
      );
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.error(
        "Authentication required. Current token:",
        localStorage.getItem("access_token")
      );
      // Only clear token and redirect if we're not already on the login page
      if (window.location.pathname !== "/login") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("username");
        window.location.replace("/login");
      }
    }
    return Promise.reject(error);
  }
);

// Site Detail API methods
export const getSiteDetail = async (
  siteId: string,
  options: {
    page?: number;
    readingType?: "all" | "end_of_day";
    meterSerial?: string;
    sort_order?: "asc" | "desc";
    end_date?: string;
  } = {}
) => {
  const {
    page = 1,
    readingType = "all",
    meterSerial = "",
    sort_order = "desc",
    end_date = "",
  } = options;

  const params = new URLSearchParams();
  params.append("page", page.toString());

  if (readingType === "end_of_day") {
    params.append("reading_type", "end_of_day");
  }

  if (meterSerial) {
    params.append("meter_serial", meterSerial);
  }

  params.append("sort_order", sort_order);

  if (end_date) {
    params.append("end_date", end_date);
  }

  try {
    const response = await api.get(`/site-detail/${siteId}/`, {
      params: Object.fromEntries(params),
      withCredentials: true,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching site detail:", error);
    throw error;
  }
};

// Clear cache for a specific site
export const clearSiteDetailCache = (siteId?: string | number): void => {
  if (siteId) {
    // Clear cache for specific site
    Object.keys(siteDetailCache).forEach((key) => {
      if (key.startsWith(`${siteId}-`)) {
        delete siteDetailCache[key];
      }
    });
  } else {
    // Clear all cache
    Object.keys(siteDetailCache).forEach((key) => {
      delete siteDetailCache[key];
    });
  }
};

// Toggle note favorite status
export const toggleNoteFavorite = async (
  noteId: number
): Promise<Record<string, unknown>> => {
  try {
    const response = await api.post(`/system-notes/${noteId}/toggle-favorite/`);
    return response.data;
  } catch (error) {
    console.error("Error toggling note favorite:", error);
    throw error;
  }
};

// Search sites
export const searchSites = async (
  searchTerm = "",
  page = 1,
  pageSize = 10,
  isEcotricityUser = false,
  filter = "all",
  ordering = "-Site_id"
) => {
  try {
    console.log("Searching sites with params:", {
      searchTerm,
      page,
      pageSize,
      isEcotricityUser,
      filter,
      ordering,
    });

    // Build API parameters
    const params: Record<string, string | number> = {
      page,
      ordering: ordering,
    };

    // Add search term if provided
    if (searchTerm) {
      params.search = searchTerm;
    }

    // Add filter if provided
    if (filter && filter !== "all") {
      params.filter = filter;
    }

    // Add account filter for Ecotricity users
    if (isEcotricityUser) {
      params.account = "ecotricity";
    }

    console.log("Making API call to /sites/ with params:", params);
    const response = await api.get("/sites/", {
      params,
    });

    console.log("Site search API response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error searching sites:", error);
    throw error;
  }
};

// Create a new note
export interface CreateNoteData {
  note: string;
  image?: File;
  image_description?: string;
  department_id?: number;
}

export const createNote = async (
  siteId: string | number,
  data: CreateNoteData
): Promise<SystemNote> => {
  const currentDate = new Date().toISOString();
  const payload: Record<string, unknown> = {
    notes: data.note,
    site_id: siteId,
    note_date: currentDate,
    imageDescription: data.image_description || null,
  };
  if (typeof data.department_id === "number") {
    payload.department_id = data.department_id;
  }
  // If we have an image, use FormData
  if (data.image) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });
    formData.append("image", data.image);
    return api
      .post("/system-notes/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => response.data);
  }
  // If no image, use JSON
  return api.post("/system-notes/", payload).then((response) => response.data);
};

// Get site readings with pagination
export const getSiteReadings = async (
  siteId: string,
  options: {
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
    meterSerial?: string;
  } = {}
) => {
  const { page = 1, pageSize = 365, startDate, endDate, meterSerial } = options;

  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("page_size", pageSize.toString());

  if (startDate) {
    params.append("start_date", startDate);
  }

  if (endDate) {
    params.append("end_date", endDate);
  }

  if (meterSerial) {
    params.append("meter", meterSerial);
  }

  const apiUrl = `/site-readings/${siteId}/?${params.toString()}`;
  console.log("Fetching readings:", { apiUrl, options });

  try {
    const response = await api.get(apiUrl, {
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    console.log("API Response:", {
      status: response.status,
      data: response.data,
      readings: response.data?.readings?.length || 0,
    });

    return response.data;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error("API Error:", {
      status: apiError.response?.status,
      statusText: apiError.response?.statusText,
      data: apiError.response?.data,
      message: apiError.message,
    });
    throw error;
  }
};

// Define proper error interface
interface ApiError {
  response?: {
    status?: number;
    statusText?: string;
    data?: unknown;
  };
  message: string;
}

// Define MeterHistory interface
export interface MeterHistory {
  id: number;
  site_id: number;
  old_meter_serial: string;
  new_meter_serial: string;
  closing_reading: string;
  change_date: string;
  new_meter_opening_reading: string;
}

// Meter History API methods
export const getMeterHistory = async (
  siteId: string
): Promise<MeterHistory[]> => {
  try {
    const response = await api.get(`/meter-history/${siteId}/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching meter history:", error);
    throw error;
  }
};

export const createMeterHistory = async (data: {
  site_id: number;
  old_meter_serial: string;
  new_meter_serial: string;
  closing_reading: string;
  change_date: string;
  new_meter_opening_reading: string;
}): Promise<MeterHistory> => {
  try {
    const response = await api.post("/meter-history/", data);
    return response.data;
  } catch (error) {
    console.error("Error creating meter history:", error);
    throw error;
  }
};

export const updateMeterHistory = async (
  meterHistoryId: number,
  data: Partial<MeterHistory>
): Promise<MeterHistory> => {
  try {
    const response = await api.put(
      `/meter-history/update/${meterHistoryId}/`,
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error updating meter history:", error);
    throw error;
  }
};

export const deleteMeterHistory = async (
  meterHistoryId: number
): Promise<void> => {
  try {
    await api.delete(`/meter-history/delete/${meterHistoryId}/`);
  } catch (error) {
    console.error("Error deleting meter history:", error);
    throw error;
  }
};

// Meter Change API methods
export const searchMeters = async (searchTerm: string): Promise<Meter[]> => {
  try {
    if (searchTerm.length < 3) {
      return [];
    }

    const response = await api.get("/search-meters/", {
      params: { term: searchTerm },
    });
    return response.data;
  } catch (error) {
    console.error("Error searching meters:", error);
    throw error;
  }
};

export const getMeterDetails = async (
  meterId: number
): Promise<
  Meter & {
    lastReading?: string;
    lastReadingDate?: string;
    closingMeterReading?: string;
  }
> => {
  try {
    const response = await api.get(`/get-meter-details/${meterId}/`);
    return response.data;
  } catch (error) {
    console.error("Error getting meter details:", error);
    throw error;
  }
};

export const changeMeter = async (
  siteId: number | string,
  data: {
    meter_model: string;
    meter_serial: string;
    meter_install_date: string;
    meter_opening_read: string;
    old_meter_serial: string;
    closing_meter_reading: string;
  }
): Promise<{ message: string; new_meter: Meter }> => {
  try {
    const response = await api.post(`/change-meter/${siteId}/`, data);
    return response.data;
  } catch (error) {
    console.error("Error changing meter:", error);
    throw error;
  }
};

// SIM Change API methods
export interface Sim {
  id: number;
  sim_num: string;
  ctn: string;
  sim_ip?: string;
  assigned_date?: string;
  site_id?: number;
  meter_id?: number;
}

export const searchSims = async (searchTerm: string): Promise<Sim[]> => {
  try {
    if (searchTerm.length < 3) {
      return [];
    }

    const response = await api.get("/search-sims/", {
      params: { term: searchTerm },
    });
    return response.data;
  } catch (error) {
    console.error("Error searching SIMs:", error);
    throw error;
  }
};

export const getSimDetails = async (simId: number): Promise<Sim> => {
  try {
    const response = await api.get(`/get-sim-details/${simId}/`);
    return response.data;
  } catch (error) {
    console.error("Error getting SIM details:", error);
    throw error;
  }
};

export const changeSim = async (
  siteId: number | string,
  data: {
    sim_num: string;
    assigned_date: string;
  }
): Promise<{ message: string; new_sim: Sim }> => {
  try {
    const response = await api.post(`/change-sim/${siteId}/`, data);
    return response.data;
  } catch (error) {
    console.error("Error changing SIM:", error);
    throw error;
  }
};

// Auth Types
export interface AuthResponse {
  token: string;
  user: User;
  requiresMfa: boolean;
  mfaSessionId?: string;
  [key: string]: unknown;
}

// Basic login - will return if MFA is required
export const login = async (
  username: string,
  password: string
): Promise<AuthResponse> => {
  try {
    console.log("Attempting login for user:", username);
    const response = await api.post("/users/login/", { username, password });
    console.log("Login response:", response.data);

    // If MFA is required, return the MFA session data
    if (response.data.requiresMfa) {
      console.log("MFA required for user:", username);
      return {
        requiresMfa: true,
        mfaSessionId: response.data.mfaSessionId,
        user: response.data.user,
        token: "", // No token yet since MFA is required
      };
    }

    // If MFA is not required or already verified
    const { token, user } = response.data;
    if (!token) {
      console.error("No token received in login response");
      throw new Error("No token received in login response");
    }

    console.log("Storing token for user:", username);
    localStorage.setItem("access_token", token);
    localStorage.setItem("username", user.username);

    // Verify token was stored
    const storedToken = localStorage.getItem("access_token");
    console.log("Token stored successfully:", !!storedToken);

    // Redirect to intended route if exists
    const intendedRoute = localStorage.getItem("intendedRoute");
    if (intendedRoute) {
      localStorage.removeItem("intendedRoute");
      window.location.replace(intendedRoute);
    }

    return { token, user, requiresMfa: false };
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

// Request a new MFA code to be sent via email
export const requestMfaCode = async (
  username: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.post("/users/request-mfa-code/", { username });
    return response.data;
  } catch (error) {
    console.error("Error requesting MFA code:", error);
    throw error;
  }
};

// Verify the MFA code and complete login
export const verifyMfaCode = async (
  mfaSessionId: string,
  code: string
): Promise<AuthResponse> => {
  try {
    const response = await api.post("/users/verify-mfa/", {
      mfaSessionId,
      code,
    });
    console.log("MFA verification response:", response.data);

    const { token, user } = response.data;
    console.log("Storing token after MFA:", token);
    localStorage.setItem("access_token", token);
    localStorage.setItem("username", user.username);
    return { token, user, requiresMfa: false };
  } catch (error) {
    console.error("MFA verification error:", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await api.post("/users/logout/");
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    localStorage.removeItem("access_token");
    localStorage.removeItem("username");
    window.location.href = "/login";
  }
};

// Helper function to check if user has a specific group
export const hasGroup = (groupName: string): boolean => {
  const groupsJson = localStorage.getItem("user_groups");
  if (!groupsJson) return false;

  try {
    const groups = JSON.parse(groupsJson) as UserGroup[];
    return groups.some((group: UserGroup) => group.name === groupName);
  } catch (error) {
    console.error("Error parsing user groups:", error);
    return false;
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    console.log("No token found in localStorage");
    return false;
  }
  console.log("Token found in localStorage");
  return true;
};

// Meter Testing API methods
interface MeterTestRequest {
  ip: string;
  model: string;
  password: string;
  site_id: number;
}

interface MeterTestResponse {
  task_id: string;
  status: string;
  message: string;
}

// Define proper types for meter test results
interface MeterTestResult {
  value: number;
  unit: string;
  scaler: number;
  status: string;
  timestamp: string;
}

interface MeterTestStatusResponse {
  status: string;
  result?: Record<string, MeterTestResult>;
  error?: string;
}

export const startMeterTest = async (
  data: MeterTestRequest
): Promise<MeterTestResponse> => {
  try {
    const response = await meterTestApi.post("/meter/reading", data);
    return response.data;
  } catch (error) {
    console.error("Error starting meter test:", error);
    throw error;
  }
};

export const getMeterTestStatus = async (
  taskId: string
): Promise<MeterTestStatusResponse> => {
  try {
    const response = await meterTestApi.get(`/meter/reading/status/${taskId}`);
    return response.data;
  } catch (error) {
    console.error("Error checking meter test status:", error);
    throw error;
  }
};

// Helper function to poll meter test status
export const pollMeterTestStatus = async (
  taskId: string,
  onStatusUpdate: (status: MeterTestStatusResponse) => void,
  maxAttempts: number = 45, // Increased for 90 seconds total (45 * 2 seconds)
  intervalMs: number = 2000
): Promise<void> => {
  let attempts = 0;

  const checkStatus = async () => {
    try {
      const status = await getMeterTestStatus(taskId);
      onStatusUpdate(status);

      // Continue polling if status is still processing/pending and haven't exceeded max attempts
      const shouldContinuePolling = 
        (status.status === "pending" || status.status === "processing") && 
        attempts < maxAttempts;

      if (shouldContinuePolling) {
        attempts++;
        console.log(`Meter test polling attempt ${attempts}/${maxAttempts}, status: ${status.status}`);
        setTimeout(checkStatus, intervalMs);
      } else if (status.status !== "completed" && status.status !== "error") {
        // If we've exhausted attempts and it's not completed or error, mark as timeout
        console.error(`Meter test polling timeout after ${maxAttempts} attempts, final status: ${status.status}`);
        onStatusUpdate({
          status: "error",
          error: `Meter test timeout after ${maxAttempts * intervalMs / 1000} seconds. Final status: ${status.status}`
        });
      }
    } catch (error) {
      console.error("Error polling meter test status:", error);
      onStatusUpdate({
        status: "error",
        error: `Failed to check meter test status: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  await checkStatus();
};

interface SaveMeterTestRequest {
  site_id: number;
  meter_model: string;
  test_reading: string;
  test_date: string;
  signal_level: string;
}

export const saveMeterTest = async (
  data: SaveMeterTestRequest
): Promise<Record<string, unknown>> => {
  try {
    const response = await api.post("/meter-test/", data);
    return response.data;
  } catch (error) {
    console.error("Error saving meter test:", error);
    throw error;
  }
};

// Report Builder API Functions
export const fetchTableSchema = async () => {
  try {
    // Use absolute URL to ensure we're hitting the backend server
    const baseUrl =
      import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1";
    const response = await axios.get(`${baseUrl}/report-builder/schema`, {
      headers: {
        Authorization: `Token ${localStorage.getItem("access_token") || ""}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching database schema:", error);
    throw error;
  }
};

export const executeReportQuery = async (params: {
  tables: string[];
  columns: string[];
  filters: Array<{
    column: string;
    operator: string;
    value: string;
  }>;
  dateRange?: {
    startDate: string | null;
    endDate: string | null;
  };
  page?: number;
  pageSize?: number;
}) => {
  try {
    // Log the request parameters for debugging
    console.log(
      "Executing report query with params:",
      JSON.stringify(params, null, 2)
    );

    // Use absolute URL to ensure we're hitting the backend server
    const baseUrl =
      import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1";
    const fullUrl = `${baseUrl}/report-builder/query`;
    console.log("Making request to:", fullUrl);

    const response = await axios.post(fullUrl, params, {
      headers: {
        Authorization: `Token ${localStorage.getItem("access_token") || ""}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    console.log("Response received:", response.status);
    return response.data;
  } catch (error) {
    console.error("Error executing report query:", error);
    if (axios.isAxiosError(error)) {
      console.error("Request URL:", error.config?.url);
      console.error("Request data:", error.config?.data);
      console.error("Response status:", error.response?.status);
      console.error("Response data:", error.response?.data);
    }
    throw error;
  }
};

export const exportToExcel = async (params: {
  tables: string[];
  columns: string[];
  filters: Array<{
    column: string;
    operator: string;
    value: string;
  }>;
  dateRange?: {
    startDate: string | null;
    endDate: string | null;
  };
  filename?: string;
}) => {
  try {
    // Use absolute URL to ensure we're hitting the backend server
    const baseUrl =
      import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1";
    const response = await axios.post(
      `${baseUrl}/report-builder/export`,
      params,
      {
        headers: {
          Authorization: `Token ${localStorage.getItem("access_token") || ""}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        responseType: "blob",
      }
    );

    // Create a download link and trigger it
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;

    // Use provided filename or generate one with current date
    const filename =
      params.filename ||
      `report-${new Date().toISOString().split("T")[0]}.xlsx`;
    link.setAttribute("download", filename);

    document.body.appendChild(link);
    link.click();
    link.remove();

    return true;
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    throw error;
  }
};

// Define MeterReadingSession interface
export interface MeterReadingSession {
  id: number;
  start_time: string;
  end_time: string;
  total_meters: number;
  successful_reads: number;
  failed_reads: number;
  execution_time_minutes: number;
  meter_band: string;
  success_rate: number;
}

export interface DailySummary {
  date: string;
  total_meters: number;
  successful_reads: number;
  failed_reads: number;
  session_count: number;
  success_rate: number;
}

export interface ReadingReportData {
  daily_sessions: MeterReadingSession[];
  summary: DailySummary[];
  overall_stats: {
    total_sessions: number;
    total_meters: number;
    total_successful_reads: number;
    total_failed_reads: number;
    average_success_rate: number;
    period: string;
    start_date: string;
    end_date: string;
  };
}

export const getMeterReadingSessions = async (
  period: "day" | "week" | "month" = "week",
  date?: string
): Promise<ReadingReportData> => {
  try {
    const params: Record<string, string> = { period };
    if (date) {
      params.date = date;
    }

    const response = await api.get("/meter-reading-sessions/", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching meter reading sessions:", error);
    throw error;
  }
};

export interface SiteAlert {
  id: number;
  site: number;
  message: string;
  alert_type: "info" | "warning" | "danger" | "success";
  created_by: number;
  created_by_username: string;
  created_at: string;
  expires_at: string | null;
  never_expire: boolean;
  is_active: boolean;
  is_expired: boolean;
}

export interface AlertType {
  [key: string]: string;
}

export const getAlertTypes = async (): Promise<{ alert_types: AlertType }> => {
  try {
    const response = await api.get("/alert-types/");
    return response.data;
  } catch (error) {
    console.error("Error fetching alert types:", error);
    throw error;
  }
};

export const getSiteAlerts = async (
  siteId: string | number,
  activeOnly: boolean = false
): Promise<SiteAlert[]> => {
  try {
    const response = await api.get(`/sites/${siteId}/alerts/`, {
      params: { active_only: activeOnly },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching site alerts:", error);
    throw error;
  }
};

export const createSiteAlert = async (
  siteId: string | number,
  data: {
    message: string;
    alert_type: string;
    expires_at?: string | null;
    never_expire?: boolean;
  }
): Promise<SiteAlert> => {
  try {
    const response = await api.post(`/sites/${siteId}/alerts/`, data);
    return response.data;
  } catch (error) {
    console.error("Error creating site alert:", error);
    throw error;
  }
};

export const updateSiteAlert = async (
  alertId: number,
  data: Partial<SiteAlert>
): Promise<SiteAlert> => {
  try {
    const response = await api.put(`/alerts/${alertId}/`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating site alert:", error);
    throw error;
  }
};

export const deleteSiteAlert = async (alertId: number): Promise<void> => {
  try {
    await api.delete(`/alerts/${alertId}/`);
  } catch (error) {
    console.error("Error deleting site alert:", error);
    throw error;
  }
};

export const deactivateSiteAlert = async (
  alertId: number
): Promise<SiteAlert> => {
  try {
    const response = await api.post(`/alerts/${alertId}/deactivate/`);
    return response.data;
  } catch (error) {
    console.error("Error deactivating site alert:", error);
    throw error;
  }
};

export const requestSiteReadingReport = async (
  siteId: string | number,
  data: {
    start_date: string;
    end_date: string;
    meter_serial?: string;
  }
): Promise<{ message: string }> => {
  try {
    const response = await api.post(`/sites/${siteId}/reading-report/`, data);
    return response.data;
  } catch (error) {
    console.error("Error requesting site reading report:", error);
    throw error;
  }
};

// Update RegisterUserData to extend UserFormData
export interface RegisterUserData extends UserFormData {
  password: string;
}

// Add user registration function
export const register = async (
  userData: RegisterUserData
): Promise<{ success: boolean; user?: User }> => {
  try {
    console.log("Attempting to register user:", userData.username);
    const response = await api.post("/users/register/", userData);
    console.log("Registration response:", response.data);

    return {
      success: true,
      user: response.data,
    };
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

export interface CustomerCall {
  id: number;
  site: number;
  call_date: string;
  call_duration: number | null;
  status:
    | "answered"
    | "no_answer"
    | "voicemail"
    | "busy"
    | "scheduled"
    | "callback";
  notes: string | null;
  caller: number | null;
  caller_name: string; // From serializer
  follow_up_required: boolean;
  follow_up_date: string | null;
  call_purpose: string | null;
  created_at: string;
  updated_at: string;
}

// Customer calls
export const getCustomerCalls = async (
  siteId: number
): Promise<CustomerCall[]> => {
  try {
    const response = await api.get<
      { results: CustomerCall[] } | CustomerCall[]
    >(`/customer-calls/?site_id=${siteId}`);

    // Handle both paginated and non-paginated responses
    if (response.data && "results" in response.data) {
      // Paginated response
      return response.data.results;
    } else if (Array.isArray(response.data)) {
      // Non-paginated array response
      return response.data;
    } else {
      // Unexpected response format
      console.error(
        "Unexpected response format for customer calls:",
        response.data
      );
      return [];
    }
  } catch (error) {
    console.error("Error fetching customer calls:", error);
    throw error;
  }
};

export const createCustomerCall = async (
  callData: Omit<
    CustomerCall,
    "id" | "created_at" | "updated_at" | "caller_name"
  >
): Promise<CustomerCall> => {
  try {
    const response = await api.post<CustomerCall>("/customer-calls/", callData);
    return response.data;
  } catch (error) {
    console.error("Error creating customer call:", error);
    throw error;
  }
};

// RDG Report endpoints
export const getFcoList = async (): Promise<{ fcos: string[] }> => {
  try {
    const response = await api.get("/get-fco-list/");
    return response.data;
  } catch (error) {
    console.error("Error fetching FCO list:", error);
    throw error;
  }
};

interface GenerateRDGReportParams {
  start_date: string;
  end_date: string;
  fco: string[];
  low_riso: boolean;
  shading: boolean;
  trina_project: boolean;
  loan_num: string;
}

export const generateRDGReport = async (
  data: GenerateRDGReportParams
): Promise<{ message: string }> => {
  try {
    const response = await api.post("/api/v1/generate-rdg-report/", data);
    return response.data;
  } catch (error) {
    console.error("Error generating RDG report:", error);
    throw error;
  }
};

export const generateFCOAvailabilityReport = async (data: {
  fco: string;
  month: string;
  download?: boolean;
  include_no_comms?: boolean;
  current_year_only?: boolean;
}) => {
  try {
    const response = await api.post("/fco-availability-report/", data, {
      responseType: data.download ? "blob" : "json",
    });
    return response.data;
  } catch (error) {
    console.error("Error generating FCO Availability Report:", error);
    throw error;
  }
};

// Notification type
export interface Notification {
  id: number;
  user: number;
  message: string;
  report_url?: string;
  is_read: boolean;
  created_at: string;
}

// Fetch notifications for the current user
export const getNotifications = async (): Promise<Notification[]> => {
  try {
    const response = await api.get("/users/notifications/");
    return response.data;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};

// Dashboard related interfaces and types
import { DashboardConfig, WidgetConfigUnion } from "../types/dashboard";

// Dashboard configuration API endpoints
export const getUserDashboardConfig = async (): Promise<DashboardConfig[]> => {
  try {
    const response = await api.get("/dashboard-config/");
    return response.data;
  } catch (error) {
    console.error("Error fetching user dashboard config:", error);
    throw error;
  }
};

export const saveUserDashboardConfig = async (
  dashboards: DashboardConfig[]
): Promise<DashboardConfig[]> => {
  try {
    const response = await api.post("/dashboard-config/", dashboards);
    return response.data;
  } catch (error) {
    console.error("Error saving user dashboard config:", error);
    throw error;
  }
};

export const getDefaultDashboardConfig = async (): Promise<DashboardConfig> => {
  try {
    const response = await api.get("/dashboard-config/default/");
    return response.data;
  } catch (error) {
    console.error("Error fetching default dashboard config:", error);
    throw error;
  }
};

// Widget data API endpoints
export const getAvailableWidgets = async (): Promise<{
  widgets: Array<{
    type: string;
    name: string;
    description: string;
    defaultSize: string;
    availableSettings: string[];
  }>;
}> => {
  try {
    const response = await api.get("/dashboard-widgets/");
    return response.data;
  } catch (error) {
    console.error("Error fetching available widgets:", error);
    throw error;
  }
};

export const getWidgetData = async (
  widgetType: string,
  params: Record<string, unknown> = {}
): Promise<unknown> => {
  try {
    const response = await api.get(`/widget-data/${widgetType}/`, { params });
    return response.data;
  } catch (error) {
    console.error(`Error fetching data for widget type ${widgetType}:`, error);
    throw error;
  }
};

// Specific widget data endpoints
export const getSystemStatusSummary = async (): Promise<{
  status: string;
  message: string;
  lastUpdated: string;
  metrics: {
    totalSites: number;
    activeSites: number;
    sitesWithIssues: number;
    offlineSites: number;
  };
}> => {
  try {
    const response = await api.get("/widget-data/system-status/");
    return response.data;
  } catch (error) {
    console.error("Error fetching system status summary:", error);
    throw error;
  }
};

export const getRecentActivities = async (
  limit: number = 5
): Promise<
  Array<{
    id: number;
    type: string;
    description: string;
    timestamp: string;
    user?: string;
  }>
> => {
  try {
    const response = await api.get("/widget-data/recent-activities/", {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    throw error;
  }
};

export const getSitePerformanceMetrics = async (params: {
  period?: "day" | "week" | "month" | "year";
  siteId?: number;
}): Promise<{
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
  }>;
}> => {
  try {
    const response = await api.get("/widget-data/energy-production/", {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching site performance metrics:", error);
    throw error;
  }
};

export const getSiteDistribution = async (
  groupBy: "region" | "status" | "type" = "region"
): Promise<{
  labels: string[];
  data: number[];
  backgroundColor: string[];
}> => {
  try {
    const response = await api.get("/widget-data/site-distribution/", {
      params: { group_by: groupBy },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching site distribution:", error);
    throw error;
  }
};

export const getAlertsSummary = async (): Promise<{
  total: number;
  critical: number;
  warning: number;
  info: number;
  recentAlerts: Array<{
    id: number;
    type: string;
    message: string;
    timestamp: string;
  }>;
}> => {
  try {
    const response = await api.get("/widget-data/alerts-summary/");
    return response.data;
  } catch (error) {
    console.error("Error fetching alerts summary:", error);
    throw error;
  }
};

// Dashboard customization endpoints
export const addWidgetToDashboard = async (
  dashboardId: string,
  widget: WidgetConfigUnion
): Promise<DashboardConfig> => {
  try {
    const response = await api.post(
      `/dashboard-config/${dashboardId}/widgets/`,
      widget
    );
    return response.data;
  } catch (error) {
    console.error("Error adding widget to dashboard:", error);
    throw error;
  }
};

export const removeWidgetFromDashboard = async (
  dashboardId: string,
  widgetId: string
): Promise<DashboardConfig> => {
  try {
    const response = await api.delete(
      `/dashboard-config/${dashboardId}/widgets/${widgetId}/`
    );
    return response.data;
  } catch (error) {
    console.error("Error removing widget from dashboard:", error);
    throw error;
  }
};

export const updateWidgetPosition = async (
  dashboardId: string,
  widgetId: string,
  position: { x: number; y: number }
): Promise<DashboardConfig> => {
  try {
    const response = await api.patch(
      `/dashboard-config/${dashboardId}/widgets/${widgetId}/position/`,
      position
    );
    return response.data;
  } catch (error) {
    console.error("Error updating widget position:", error);
    throw error;
  }
};

export const updateWidgetSettings = async (
  dashboardId: string,
  widgetId: string,
  settings: Record<string, unknown>
): Promise<DashboardConfig> => {
  try {
    const response = await api.patch(
      `/dashboard-config/${dashboardId}/widgets/${widgetId}/settings/`,
      settings
    );
    return response.data;
  } catch (error) {
    console.error("Error updating widget settings:", error);
    throw error;
  }
};

export default api;
