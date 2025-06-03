import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { User, UserGroup } from '../types/user';
import { login as apiLogin, logout as apiLogout, verifyMfaCode as apiVerifyMfaCode, AuthResponse } from '../services/api';
import userService from '../services/userService';
import { uiPermissionService } from '../services/uiPermissionService';

interface AuthContextType {
  user: (User & { role: 'staff' | 'engineer' | 'unknown' }) | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<AuthResponse>; // Return full response for MFA handling
  logout: () => Promise<void>;
  mfaSessionId: string | null;
  setMfaSessionId: (id: string | null) => void;
  verifyMfa: (mfaSessionId: string, code: string) => Promise<AuthResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Helper function to determine role from groups - will be replaced by API call
const determineRole = async (groups: UserGroup[]): Promise<'staff' | 'engineer' | 'unknown'> => {
  if (!groups || !Array.isArray(groups) || groups.length === 0) {
    return 'staff'; // Changed from 'unknown' to 'staff' as default
  }
  
  try {
    // Call the API to get the user's view type
    const viewType = await userService.getUserViewType();
    
    // Ensure we return a valid role type
    if (viewType === 'staff' || viewType === 'engineer') {
      return viewType;
    }
    
    // Fallback to 'staff' if the API returns an unexpected value
    return 'staff';
  } catch (error) {
    
    // Fallback logic if the API fails
    if (groups.some(group => group.name?.toLowerCase() === 'admin')) {
      return 'staff';
    }
    
    if (groups.some(group => group.name?.toLowerCase() === 'engineers')) {
      return 'engineer';
    }
    
    return 'staff';
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<(User & { role: 'staff' | 'engineer' | 'unknown' }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaSessionId, setMfaSessionId] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('access_token');
        const storedUserString = localStorage.getItem('user');
        
        if (token && storedUserString) {
          const storedUser: User = JSON.parse(storedUserString);
          // Get role from API rather than simple function
          const role = await determineRole(storedUser.groups);
          setUser({ ...storedUser, role });
          
          // Preload UI permissions when checking auth status
          try {
            await uiPermissionService.loadPermissions();
          } catch (error) {
            console.warn('Failed to preload UI permissions:', error);
          }
        } else {
          setUser(null); 
        }
      } catch (error) {
        setUser(null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<AuthResponse> => {
    setLoading(true);
    setMfaSessionId(null); // Clear previous MFA session
    try {
      const response = await apiLogin(username, password);
      if (response.requiresMfa && response.mfaSessionId) {
        // MFA is required, store session ID, don't set user yet
        setMfaSessionId(response.mfaSessionId);
        setUser(null); // Ensure user is null during MFA step
        localStorage.removeItem('access_token'); // Clear any old token
        localStorage.removeItem('user');
        setLoading(false); // Set loading to false so MFA screen can show
        return response;
      } else if (response.token && response.user) {
        // Login successful, MFA not required or already handled
        const role = await determineRole(response.user.groups);
        const fullUser = { ...response.user, role };
        setUser(fullUser);
        localStorage.setItem('access_token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user)); // Store base user object
        
        // Preload UI permissions after successful login
        try {
          await uiPermissionService.loadPermissions();
        } catch (error) {
          console.warn('Failed to preload UI permissions:', error);
        }
        
        // Clear any intended route - React Router will handle navigation
        localStorage.removeItem('intendedRoute');
        
      } else {
        // Handle unexpected response
         throw new Error('Login failed: Invalid response from server');
      }
      // Only set loading to false if MFA is not required
      if (!response.requiresMfa) {
        setLoading(false);
      }
      return response; // Return full response for component handling (e.g., MFA flow)
    } catch (error) {
      setUser(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      setLoading(false);
      setMfaSessionId(null);
      throw error; // Re-throw error for component handling
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await apiLogout(); // Call API logout if necessary (e.g., to invalidate token server-side)
      
      // Clear UI permissions cache
      uiPermissionService.clearCache();
    } catch (error) {
    } finally {
        setUser(null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setMfaSessionId(null);
        setLoading(false);
    }
  }, []);

  // Add verifyMfa function
  const verifyMfa = useCallback(async (mfaSessionId: string, code: string): Promise<AuthResponse> => {
    setLoading(true);
    try {
      const response = await apiVerifyMfaCode(mfaSessionId, code);
      
      if (response.token && response.user) {
        // Update user state with role from API
        const role = await determineRole(response.user.groups);
        const fullUser = { ...response.user, role };
        setUser(fullUser);
        
        // Store authentication data in localStorage
        localStorage.setItem('access_token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Preload UI permissions after successful MFA verification
        try {
          await uiPermissionService.loadPermissions();
        } catch (error) {
          console.warn('Failed to preload UI permissions:', error);
        }
        
        // Clear any intended route - React Router will handle navigation
        localStorage.removeItem('intendedRoute');
        
      } else {
        throw new Error('MFA verification failed: Invalid response from server');
      }
      
      setMfaSessionId(null); // Clear MFA session after successful verification
      setLoading(false);
      return response;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, []);

  // Note: If MFA verification also returns user data, a separate function 
  // `handleMfaVerificationSuccess(response: AuthResponse)` could be added here 
  // to set the user state similar to the login function.

  // Update provider value to include verifyMfa
  const providerValue = {
      user,
      loading,
      login,
      logout,
      mfaSessionId,
      setMfaSessionId,
      verifyMfa
  };

  // Explicitly return the Provider JSX
  return (
    <AuthContext.Provider value={providerValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 