import { useToast } from '../hooks/use-toast';

export interface ErrorResponse {
  status: number;
  message: string;
  code?: string;
}

export const handleApiError = (error: any): ErrorResponse => {
  // Default error response
  let errorResponse: ErrorResponse = {
    status: 500,
    message: 'An unexpected error occurred'
  };

  if (error.response) {
    // Server responded with error status
    errorResponse.status = error.response.status;
    errorResponse.message = error.response.data?.message || 
                            error.response.data?.detail || 
                            getDefaultErrorMessage(error.response.status);
    errorResponse.code = error.response.data?.code;
  } else if (error.request) {
    // Network error
    errorResponse.status = 0;
    errorResponse.message = 'Unable to connect to the server. Please check your internet connection.';
  } else {
    // Other error
    errorResponse.message = error.message || 'An unexpected error occurred';
  }

  // Log error for debugging
  // console.error('API Error:', {
  //   ...errorResponse,
  //   originalError: error,
  //   timestamp: new Date().toISOString()
  // });

  return errorResponse;
};

export const getDefaultErrorMessage = (status: number): string => {
  switch (status) {
    case 400: return 'Bad request. Please check your input.';
    case 401: return 'Authentication required. Please log in.';
    case 403: return 'You don\'t have permission to perform this action.';
    case 404: return 'The requested resource was not found.';
    case 429: return 'Too many requests. Please try again later.';
    case 500: return 'Internal server error. Please try again later.';
    case 502: return 'Server is temporarily unavailable.';
    case 503: return 'Service is temporarily unavailable.';
    default: return 'An unexpected error occurred.';
  }
};

export const showErrorToast = (error: ErrorResponse | string) => {
  const message = typeof error === 'string' ? error : error.message;
  const { toast } = useToast();
  toast({
    type: 'error',
    title: 'Error',
    description: message,
  });
};

export const isAuthError = (status: number): boolean => {
  return status === 401 || status === 403;
};

export const shouldRedirectToLogin = (status: number): boolean => {
  return status === 401;
};

export const handleAuthError = () => {
  // Clear local storage
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  
  // Store current path for redirect after login
  localStorage.setItem('intendedRoute', window.location.pathname);
  
  // Redirect to login
  window.location.href = '/login';
};