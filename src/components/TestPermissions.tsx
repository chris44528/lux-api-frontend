import { useState } from 'react';
import { api } from '../services/api';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function TestPermissions() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testEndpoint = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Test the my-permissions endpoint
      const response = await api.get('/users/ui-permissions/my-permissions/');
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Unknown error');
      console.error('Permission test error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Test UI Permissions Endpoint</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={testEndpoint} disabled={loading}>
            {loading ? 'Testing...' : 'Test /users/ui-permissions/my-permissions/'}
          </Button>
          
          {error && (
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {result && (
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}