import axios from "axios";

// Base API URL
const API_URL = import.meta.env.VITE_API_URL || "/api";
const BIO_API_URL = `${API_URL}/bio`;

// Get auth token from local storage
const getAuthToken = () => {
  // Get token from localStorage
  const storedToken = localStorage.getItem("access_token");
  if (storedToken) {
    return storedToken;
  }

  return null;
};

// Create axios instance with auth headers
const apiClient = axios.create({
  baseURL: BIO_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {

    // Pass the error through to be handled by the component
    return Promise.reject(error);
  }
);

// BioSite API Service
export const bioSiteService = {
  // Get all sites with optional filters
  getAllSites: async (filters = {}) => {
    try {
      const response = await apiClient.get("/sites/", { params: filters });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get site by ID
  getSiteById: async (id: string) => {
    try {
      const response = await apiClient.get(`/sites/${id}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new site
  createSite: async (siteData: any) => {
    try {
      const response = await apiClient.post("/sites/", siteData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update site
  updateSite: async (id: string, siteData: any) => {
    try {
      const response = await apiClient.put(`/sites/${id}/`, siteData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete site
  deleteSite: async (id: string) => {
    try {
      await apiClient.delete(`/sites/${id}/`);
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Get site service records
  getSiteServiceRecords: async (siteId: string) => {
    try {
      const response = await apiClient.get(`/sites/${siteId}/service_records/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get site remedials
  getSiteRemedials: async (siteId: string) => {
    try {
      const response = await apiClient.get(`/sites/${siteId}/remedials/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get site payments
  getSitePayments: async (siteId: string) => {
    try {
      const response = await apiClient.get(`/sites/${siteId}/payments/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get site fuel store services
  getSiteFuelStoreServices: async (siteId: string) => {
    try {
      const response = await apiClient.get(
        `/sites/${siteId}/fuel_store_services/`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Boiler API Service
export const boilerService = {
  // Get all boilers with optional filters
  getAllBoilers: async (filters = {}) => {
    try {
      const response = await apiClient.get("/boilers/", { params: filters });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get boiler by ID
  getBoilerById: async (id: string) => {
    try {
      const response = await apiClient.get(`/boilers/${id}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new boiler
  createBoiler: async (boilerData: any) => {
    try {
      const response = await apiClient.post("/boilers/", boilerData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update boiler
  updateBoiler: async (id: string, boilerData: any) => {
    try {
      const response = await apiClient.put(`/boilers/${id}/`, boilerData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete boiler
  deleteBoiler: async (id: string) => {
    try {
      await apiClient.delete(`/boilers/${id}/`);
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Get boiler service records
  getBoilerServiceRecords: async (boilerId: string) => {
    try {
      const response = await apiClient.get(
        `/boilers/${boilerId}/service_records/`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get boiler remedials
  getBoilerRemedials: async (boilerId: string) => {
    try {
      const response = await apiClient.get(`/boilers/${boilerId}/remedials/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Engineer API Service
export const engineerService = {
  // Get all engineers
  getAllEngineers: async (filters = {}) => {
    try {
      const response = await apiClient.get("/engineers/", { params: filters });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get engineer by ID
  getEngineerById: async (id: string) => {
    try {
      const response = await apiClient.get(`/engineers/${id}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new engineer
  createEngineer: async (engineerData: any) => {
    try {
      const response = await apiClient.post("/engineers/", engineerData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update engineer
  updateEngineer: async (id: string, engineerData: any) => {
    try {
      const response = await apiClient.put(`/engineers/${id}/`, engineerData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete engineer
  deleteEngineer: async (id: string) => {
    try {
      await apiClient.delete(`/engineers/${id}/`);
      return true;
    } catch (error) {
      throw error;
    }
  },
};

// Service Record API Service
export const serviceRecordService = {
  // Get all service records
  getAllServiceRecords: async (filters: Record<string, any> = {}) => {
    try {
      // Handle multiple status values
      const params: Record<string, any> = { ...filters };
      if (
        params.status &&
        typeof params.status === "string" &&
        params.status.includes(",")
      ) {
        // Convert comma-separated status to status__in format
        const statusValues = params.status.split(",");
        delete params.status;
        params.status__in = statusValues.join(",");
      }

      const response = await apiClient.get("/service-records/", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get service record by ID
  getServiceRecordById: async (id: string) => {
    try {
      const response = await apiClient.get(`/service-records/${id}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new service record
  createServiceRecord: async (recordData: any) => {
    try {
      const response = await apiClient.post("/service-records/", recordData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update service record
  updateServiceRecord: async (id: string, recordData: any) => {
    try {
      const response = await apiClient.put(
        `/service-records/${id}/`,
        recordData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete service record
  deleteServiceRecord: async (id: string) => {
    try {
      await apiClient.delete(`/service-records/${id}/`);
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Complete service record
  completeServiceRecord: async (id: string) => {
    try {
      const response = await apiClient.post(`/service-records/${id}/complete/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Remedial API Service
export const remedialService = {
  // Get all remedials
  getAllRemedials: async (filters: Record<string, any> = {}) => {
    try {
      // Handle multiple status values
      const params: Record<string, any> = { ...filters };
      if (
        params.status &&
        typeof params.status === "string" &&
        params.status.includes(",")
      ) {
        // Convert comma-separated status to status__in format
        const statusValues = params.status.split(",");
        delete params.status;
        params.status__in = statusValues.join(",");
      }

      const response = await apiClient.get("/remedials/", { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get remedial by ID
  getRemedialById: async (id: string) => {
    try {
      const response = await apiClient.get(`/remedials/${id}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new remedial
  createRemedial: async (remedialData: any) => {
    try {
      const response = await apiClient.post("/remedials/", remedialData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update remedial
  updateRemedial: async (id: string, remedialData: any) => {
    try {
      const response = await apiClient.put(`/remedials/${id}/`, remedialData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete remedial
  deleteRemedial: async (id: string) => {
    try {
      await apiClient.delete(`/remedials/${id}/`);
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Complete remedial
  completeRemedial: async (id: string) => {
    try {
      const response = await apiClient.post(`/remedials/${id}/complete/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Payment API Service
export const paymentService = {
  // Get all payments
  getAllPayments: async (filters = {}) => {
    try {
      const response = await apiClient.get("/payments/", { params: filters });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get payment by ID
  getPaymentById: async (id: string) => {
    try {
      const response = await apiClient.get(`/payments/${id}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new payment
  createPayment: async (paymentData: any) => {
    try {
      const response = await apiClient.post("/payments/", paymentData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update payment
  updatePayment: async (id: string, paymentData: any) => {
    try {
      const response = await apiClient.put(`/payments/${id}/`, paymentData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete payment
  deletePayment: async (id: string) => {
    try {
      await apiClient.delete(`/payments/${id}/`);
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Mark payment as paid
  markAsPaid: async (id: string) => {
    try {
      const response = await apiClient.post(`/payments/${id}/mark_as_paid/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Standing Order API Service
export const standingOrderService = {
  // Get all standing orders
  getAllStandingOrders: async (filters = {}) => {
    try {
      const response = await apiClient.get("/standing-orders/", {
        params: filters,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get standing order by ID
  getStandingOrderById: async (id: string) => {
    try {
      const response = await apiClient.get(`/standing-orders/${id}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new standing order
  createStandingOrder: async (orderData: any) => {
    try {
      const response = await apiClient.post("/standing-orders/", orderData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update standing order
  updateStandingOrder: async (id: string, orderData: any) => {
    try {
      const response = await apiClient.put(
        `/standing-orders/${id}/`,
        orderData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete standing order
  deleteStandingOrder: async (id: string) => {
    try {
      await apiClient.delete(`/standing-orders/${id}/`);
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Get standing order payments
  getStandingOrderPayments: async (orderId: string) => {
    try {
      const response = await apiClient.get(
        `/standing-orders/${orderId}/payments/`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Fuel Store Service API Service
export const fuelStoreService = {
  // Get all fuel store services
  getAllFuelStoreServices: async (filters = {}) => {
    try {
      const response = await apiClient.get("/fuel-store-services/", {
        params: filters,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get fuel store service by ID
  getFuelStoreServiceById: async (id: string) => {
    try {
      const response = await apiClient.get(`/fuel-store-services/${id}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new fuel store service
  createFuelStoreService: async (serviceData: any) => {
    try {
      const response = await apiClient.post(
        "/fuel-store-services/",
        serviceData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update fuel store service
  updateFuelStoreService: async (id: string, serviceData: any) => {
    try {
      const response = await apiClient.put(
        `/fuel-store-services/${id}/`,
        serviceData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete fuel store service
  deleteFuelStoreService: async (id: string) => {
    try {
      await apiClient.delete(`/fuel-store-services/${id}/`);
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Complete fuel store service
  completeFuelStoreService: async (id: string) => {
    try {
      const response = await apiClient.post(
        `/fuel-store-services/${id}/complete/`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Export all services
export default {
  bioSiteService,
  boilerService,
  engineerService,
  serviceRecordService,
  remedialService,
  paymentService,
  standingOrderService,
  fuelStoreService,
};
