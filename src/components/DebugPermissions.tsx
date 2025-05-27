import { useEffect, useState } from 'react';
import { uiPermissionService } from '../services/uiPermissionService';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export function DebugPermissions() {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      await uiPermissionService.loadPermissions();
      const allPerms = uiPermissionService.getAllPermissions();
      setPermissions(allPerms);
    } catch (error) {
      console.error('Failed to load permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Only show in development
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDebug(!showDebug)}
        className="fixed bottom-4 right-4 z-50"
      >
        🔧 Debug Permissions
      </Button>

      {showDebug && (
        <Card className="fixed bottom-16 right-4 w-96 max-h-[600px] overflow-auto z-50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>UI Permissions Debug</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDebug(false)}
              >
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading permissions...</p>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-500">
                    Total: {Object.keys(permissions).length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadPermissions}
                  >
                    Refresh
                  </Button>
                </div>
                
                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                  {Object.entries(permissions)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([codename, granted]) => (
                      <div
                        key={codename}
                        className="flex items-center justify-between py-1 px-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                      >
                        <code className="font-mono">{codename}</code>
                        <Badge variant={granted ? "success" : "secondary"}>
                          {granted ? "✓" : "✗"}
                        </Badge>
                      </div>
                    ))}
                </div>
                
                {Object.keys(permissions).length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    No permissions loaded. Try refreshing or check the console for errors.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}