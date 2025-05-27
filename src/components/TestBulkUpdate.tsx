import { useState } from 'react';
import { api } from '../services/api';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function TestBulkUpdate() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testFormats = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Try different formats to see what the backend accepts
      const testPayloads = [
        // Format 1: As documented
        {
          group_id: 1,
          permissions: [
            { codename: 'sites.list.view', is_granted: true },
            { codename: 'sites.detail.view', is_granted: true }
          ]
        },
        // Format 2: Direct array
        {
          group_id: 1,
          permissions: {
            'sites.list.view': true,
            'sites.detail.view': true
          }
        },
        // Format 3: Nested structure
        {
          group_id: 1,
          updates: [
            { codename: 'sites.list.view', is_granted: true }
          ]
        }
      ];

      // Test the first format
      const response = await api.post('/users/group-ui-permissions/bulk-update/', testPayloads[0]);
      setResult({ 
        success: true, 
        payload: testPayloads[0],
        response: response.data 
      });
    } catch (err: any) {
      setError(err.response?.data ? JSON.stringify(err.response.data, null, 2) : err.message);
      console.error('Bulk update test error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Test Bulk Update Format</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={testFormats} disabled={loading}>
            {loading ? 'Testing...' : 'Test Bulk Update'}
          </Button>
          
          {error && (
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
              <strong>Error:</strong>
              <pre className="text-xs mt-2">{error}</pre>
            </div>
          )}
          
          {result && (
            <div className="space-y-4">
              <div className="bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded">
                <strong>Success!</strong>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
                <strong>Payload sent:</strong>
                <pre className="text-xs overflow-auto mt-2">
                  {JSON.stringify(result.payload, null, 2)}
                </pre>
              </div>
              {result.response && (
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
                  <strong>Response:</strong>
                  <pre className="text-xs overflow-auto mt-2">
                    {JSON.stringify(result.response, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}