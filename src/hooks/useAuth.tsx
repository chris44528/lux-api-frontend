import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { User, UserGroup } from '../types/user';
import { login as apiLogin, logout as apiLogout, verifyMfaCode as apiVerifyMfaCode, AuthResponse } from '../services/api';
import userService from '../services/userService';

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
  if (!groups || !Array.isArray(groups) || groups.length === 0) return 'unknown';
  
  try {
    // Call the API to get the user's view type
    const viewType = await userService.getUserViewType();
    console.log('Auth Hook: Got view type from API:', viewType);
    
    // Ensure we return a valid role type
    if (viewType === 'staff' || viewType === 'engineer') {
      return viewType;
    }
    
    // Fallback to 'staff' if the API returns an unexpected value
    return 'staff';
  } catch (error) {
    console.error('Auth Hook: Error getting user view type, falling back to basic logic', error);
    
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
          console.log('Auth Hook: Session loaded from localStorage', { username: storedUser.username, role });
        } else {
          console.log('Auth Hook: No active session found in localStorage');
          setUser(null); 
        }
      } catch (error) {
        console.error('Auth Hook: Error loading auth status from localStorage', error);
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
        console.log('Auth Hook: MFA required');
      } else if (response.token && response.user) {
        // Login successful, MFA not required or already handled
        const role = await determineRole(response.user.groups);
        const fullUser = { ...response.user, role };
        setUser(fullUser);
        localStorage.setItem('access_token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user)); // Store base user object
        
        // Handle intended route redirect
        const intendedRoute = localStorage.getItem('intendedRoute');
        if (intendedRoute && intendedRoute !== '/login') {
          localStorage.removeItem('intendedRoute');
          window.location.href = intendedRoute;
        }
        
        console.log('Auth Hook: Login successful', { username: response.user.username, role });
      } else {
        // Handle unexpected response
         throw new Error('Login failed: Invalid response from server');
      }
      setLoading(false);
      return response; // Return full response for component handling (e.g., MFA flow)
    } catch (error) {
      console.error('Auth Hook: Login failed', error);
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
    } catch (error) {
        console.error('Auth Hook: API logout failed, proceeding with client-side logout', error);
    } finally {
        setUser(null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setMfaSessionId(null);
        setLoading(false);
        console.log('Auth Hook: User logged out');
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
        
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Handle intended route redirect
        const intendedRoute = localStorage.getItem('intendedRoute');
        if (intendedRoute && intendedRoute !== '/login') {
          localStorage.removeItem('intendedRoute');
          window.location.href = intendedRoute;
        }
        
        console.log('Auth Hook: MFA verification successful', { 
          username: response.user.username, 
          role, 
          token: response.token ? 'present' : 'absent' 
        });
      } else {
        throw new Error('MFA verification failed: Invalid response from server');
      }
      
      setMfaSessionId(null); // Clear MFA session after successful verification
      setLoading(false);
      return response;
    } catch (error) {
      console.error('Auth Hook: MFA verification failed', error);
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