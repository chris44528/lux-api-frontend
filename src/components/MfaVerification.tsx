import React, { useState, useEffect } from 'react';
import { requestMfaCode } from '../services/api';
import { useAuth } from '../hooks/useAuth';

interface MfaVerificationProps {
  username: string;
  mfaSessionId: string;
  onVerificationSuccess: (token: string) => void;
  onCancel: () => void;
}

const MfaVerification: React.FC<MfaVerificationProps> = ({
  username,
  mfaSessionId,
  onVerificationSuccess,
  onCancel
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  
  // Get the verifyMfa function from auth context
  const { verifyMfa } = useAuth();

  // Handle countdown for resending code
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle verification submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Use the verifyMfa function from the auth context instead of directly calling the API
      const response = await verifyMfa(mfaSessionId, verificationCode);
      console.log('MFA verification successful, calling success callback');
      onVerificationSuccess(response.token);
    } catch (error) {
      console.error('MFA verification error:', error);
      setError('Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resending verification code
  const handleResendCode = async () => {
    setIsResending(true);
    setError(null);
    
    try {
      await requestMfaCode(username);
      setCountdown(60);
    } catch (err) {
      setError('Failed to resend verification code. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  // Format verification code as user types (keep only digits)
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '');
    setVerificationCode(input.substring(0, 6));
  };

  return (
    <div className="bg-white rounded-lg p-8 shadow-sm max-w-md w-full">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
        Two-Factor Authentication
      </h2>
      <p className="text-gray-600 text-center mb-6">
        A verification code has been sent to your email. Please enter the 6-digit code below.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 mb-1">
            Verification Code
          </label>
          <input
            id="verification-code"
            type="text"
            inputMode="numeric"
            value={verificationCode}
            onChange={handleCodeChange}
            className="block w-full rounded-md border border-gray-300 text-center text-2xl tracking-widest px-3 py-3 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            placeholder="123456"
            maxLength={6}
            required
            disabled={isLoading}
            autoFocus
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        <div className="flex flex-col space-y-3">
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-70"
            disabled={isLoading || verificationCode.length !== 6}
          >
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </button>
          
          <div className="flex justify-between items-center">
            <button 
              type="button" 
              className="text-sm text-gray-500 hover:text-gray-800"
              onClick={onCancel}
            >
              Back to Login
            </button>
            
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:text-gray-400"
              onClick={handleResendCode}
              disabled={countdown > 0 || isResending}
            >
              {isResending 
                ? 'Sending...' 
                : countdown > 0 
                  ? `Resend code (${countdown}s)` 
                  : 'Resend code'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MfaVerification; 