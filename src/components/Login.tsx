import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import MfaVerification from './MfaVerification';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // MFA state handled by component visibility
  const [showMfa, setShowMfa] = useState(false);
  
  // Get login function, MFA session ID, and setter from context
  const { login, mfaSessionId, setMfaSessionId } = useAuth();

  // Check if MFA is required based on mfaSessionId from context
  useEffect(() => {
    if (mfaSessionId) {
      console.log('MFA session detected, showing MFA verification screen');
      setShowMfa(true);
    }
  }, [mfaSessionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Use the login function from the auth context
      const response = await login(username, password);
      
      // Check if MFA is required (useAuth hook handles setting mfaSessionId)
      if (response.requiresMfa && response.mfaSessionId) {
        // Show MFA verification screen
        setShowMfa(true);
        // No need to manually set mfaSessionId here, useAuth did it
        setIsLoading(false);
      } else {
        // MFA not required, login successful
        console.log('Login successful (no MFA), letting auth state handle navigation...');
        // Auth state change will trigger routing in App.tsx
        // setIsLoading(false); // useAuth sets loading to false
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid username or password');
      setIsLoading(false);
      // Ensure MFA session is cleared on login error
      setMfaSessionId(null); 
    }
  };
  
  // Handle successful MFA verification (triggered by MfaVerification component)
  const handleMfaSuccess = () => {
     // This function might be called by MfaVerification upon its success
     // MfaVerification itself should call a function in useAuth to finalize login
     // and set the user state. App.tsx routing will then take over.
     console.log('MFA successful callback in Login, letting auth state handle navigation...');
     setShowMfa(false); // Hide MFA screen
  };
  
  // Handle cancelling MFA verification
  const handleMfaCancel = () => {
    setShowMfa(false);
    // Use the setter from the context to clear the MFA session ID state in useAuth
    setMfaSessionId(null); 
  };

  // Add some debugging
  console.log('Login component render state:', { 
    showMfa, 
    mfaSessionId,
    username 
  });

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link to="/">
                <img 
                  src="/logo.png" 
                  alt="A Shade Greener Maintenance" 
                  className="h-12 w-auto"
                />
              </Link>
            </div>
            <div>
              <Link to="/" className="text-gray-700 hover:text-gray-900">
                Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Login Form or MFA Verification */}
      <div className="flex-grow flex flex-col items-center justify-center px-4">
        {showMfa ? (
          <MfaVerification 
            username={username}
            mfaSessionId={mfaSessionId || ''}
            onVerificationSuccess={handleMfaSuccess}
            onCancel={handleMfaCancel}
          />
        ) : (
          <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
              Please Complete Login Form
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Username"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Password"
                  required
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">Trouble Logging in? </span>
              <Link to="/forgot-password" className="text-blue-600 hover:text-blue-800 mr-2">
                Forgot Password
              </Link>
              <span className="text-gray-600">or </span>
              <a href="/contact" className="text-blue-600 hover:text-blue-800">
                Contact Us
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-gray-600 text-sm">
            {new Date().getFullYear()} A Shade Greener. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Login;
