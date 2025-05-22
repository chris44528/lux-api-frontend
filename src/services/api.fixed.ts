import axios from 'axios';
import { 
    SystemNote, 
    PaginatedResponse
} from '../types/api';

// Define proper types for the cache
interface SiteDetailCacheItem {
    data: Record<string, unknown>;
    timestamp: number;
}

// Initialize cache with proper typing
const siteDetailCache: Record<string, SiteDetailCacheItem> = {};

// Create main API instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: true
});

// Create meter testing API instance
const meterTestApi = axios.create({
    baseURL: 'http://10.75.0.40',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
        config.headers.Authorization = `Token ${token}`;
    }
    return config;
}, (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
});

// Add response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        console.error('Response error:', error.message);
        if (error.code === 'ERR_NETWORK') {
            console.error('Network error - please check if the backend server is running');
        }
        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
            localStorage.removeItem('access_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Site Detail API methods
export const getSiteDetail = async (
  siteId: string, 
  options: { 
    page?: number; 
    readingType?: 'all' | 'end_of_day'; 
    meterSerial?: string;
    sort_order?: 'asc' | 'desc';
    end_date?: string;
  } = {}
) => {
  const { 
    page = 1, 
    readingType = 'all', 
    meterSerial = '', 
    sort_order = 'desc',
    end_date = ''
  } = options;
  
  const params = new URLSearchParams();
  params.append('page', page.toString());
  
  if (readingType === 'end_of_day') {
    params.append('reading_type', 'end_of_day');
  }
  
  if (meterSerial) {
    params.append('meter_serial', meterSerial);
  }
  
  params.append('sort_order', sort_order);
  
  if (end_date) {
    params.append('end_date', end_date);
  }
  
  try {
    const response = await api.get(`/site-detail/${siteId}/`, {
      params: Object.fromEntries(params),
      withCredentials: true,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching site detail:', error);
    throw error;
  }
};

// Clear cache for a specific site
export const clearSiteDetailCache = (siteId?: string | number): void => {
    if (siteId) {
        // Clear cache for specific site
        Object.keys(siteDetailCache).forEach(key => {
            if (key.startsWith(`${siteId}-`)) {
                delete siteDetailCache[key];
            }
        });
    } else {
        // Clear all cache
        Object.keys(siteDetailCache).forEach(key => {
            delete siteDetailCache[key];
        });
    }
};

// Toggle note favorite status
export const toggleNoteFavorite = async (noteId: number): Promise<Record<string, unknown>> => {
    try {
        const response = await api.post(`/system-notes/${noteId}/toggle-favorite/`);
        return response.data;
    } catch (error) {
        console.error('Error toggling note favorite:', error);
        throw error;
    }
};

// Search sites
export const searchSites = async (
    searchTerm: string, 
    page: number = 1, 
    pageSize: number = 10
): Promise<PaginatedResponse<Record<string, unknown>>> => {
    try {
        const response = await api.get('/sites/', {
            params: {
                search: searchTerm,
                page,
                page_size: pageSize
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error searching sites:', error);
        throw error;
    }
};

// Create a new note
export const createNote = async (
    siteId: string | number, 
    data: { 
        note: string;
        image?: File;
        image_description?: string;
    }
): Promise<SystemNote> => {
    const currentDate = new Date().toISOString();
    const payload = {
        notes: data.note,
        site_id: siteId,
        note_date: currentDate,
        note_author: "system",
        imageDescription: data.image_description || null,
        site_name: "string"
    };
    
    // If we have an image, use FormData
    if (data.image) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
            if (value !== null) {
                formData.append(key, value.toString());
            }
        });
        formData.append('image', data.image);
        
        return api.post('/system-notes/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }).then(response => response.data);
    }
    
    // If no image, use JSON
    return api.post('/system-notes/', payload)
        .then(response => response.data);
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
    const {
        page = 1,
        pageSize = 365,
        startDate,
        endDate,
        meterSerial
    } = options;

    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());

    if (startDate) {
        params.append('start_date', startDate);
    }

    if (endDate) {
        params.append('end_date', endDate);
    }

    if (meterSerial) {
        params.append('meter', meterSerial);
    }

    const apiUrl = `/site-readings/${siteId}/?${params.toString()}`;
    console.log('Fetching readings:', { apiUrl, options });

    try {
        const response = await api.get(apiUrl, {
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        console.log('API Response:', {
            status: response.status,
            data: response.data,
            readings: response.data?.readings?.length || 0
        });

        return response.data;
    } catch (error: unknown) {
        const apiError = error as ApiError;
        console.error('API Error:', {
            status: apiError.response?.status,
            statusText: apiError.response?.statusText,
            data: apiError.response?.data,
            message: apiError.message
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

// Authentication methods
export const login = async (username: string, password: string): Promise<{ token: string; [key: string]: unknown }> => {
    try {
        const response = await api.post('/users/login/', {
            username,
            password
        });
        
        const { token } = response.data;
        localStorage.setItem('access_token', token);
        
        // Store the username in localStorage for display in the welcome message
        localStorage.setItem('username', username);
        
        return response.data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

export const logout = async () => {
    try {
        await api.post('/users/logout/');
        localStorage.removeItem('access_token');
        localStorage.removeItem('username');
        
        // Clear all cache on logout
        clearSiteDetailCache();
    } catch (error) {
        console.error('Logout error:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('username');
    }
};

// Check if user is authenticated
export const isAuthenticated = () => {
    return !!localStorage.getItem('access_token');
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

export const startMeterTest = async (data: MeterTestRequest): Promise<MeterTestResponse> => {
    try {
        const response = await meterTestApi.post('/meter/reading', data);
        return response.data;
    } catch (error) {
        console.error('Error starting meter test:', error);
        throw error;
    }
};

export const getMeterTestStatus = async (taskId: string): Promise<MeterTestStatusResponse> => {
    try {
        const response = await meterTestApi.get(`/meter/reading/status/${taskId}`);
        return response.data;
    } catch (error) {
        console.error('Error checking meter test status:', error);
        throw error;
    }
};

// Helper function to poll meter test status
export const pollMeterTestStatus = async (
    taskId: string, 
    onStatusUpdate: (status: MeterTestStatusResponse) => void,
    maxAttempts: number = 30,
    intervalMs: number = 2000
): Promise<void> => {
    let attempts = 0;
    
    const checkStatus = async () => {
        try {
            const status = await getMeterTestStatus(taskId);
            onStatusUpdate(status);
            
            if (status.status === 'pending' && attempts < maxAttempts) {
                attempts++;
                setTimeout(checkStatus, intervalMs);
            }
        } catch (error) {
            console.error('Error polling meter test status:', error);
            throw error;
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

export const saveMeterTest = async (data: SaveMeterTestRequest): Promise<Record<string, unknown>> => {
    try {
        const response = await api.post('/meter-test/', data);
        return response.data;
    } catch (error) {
        console.error('Error saving meter test:', error);
        throw error;
    }
};

export default api; 