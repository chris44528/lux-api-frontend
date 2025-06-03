import React from 'react';
import { usePWA } from '../../hooks/usePWA';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

const EngineerSettingsPage: React.FC = () => {
  const { isInstallable, isInstalled, installApp } = usePWA();

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-4">
        {/* PWA Install */}
        {isInstallable && !isInstalled && (
          <Card>
            <CardHeader>
              <CardTitle>Install App</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Install the LUX Engineer app for offline access and better performance
              </p>
              <Button onClick={installApp}>
                📱 Install App
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="font-medium">Engineer ID</p>
                <p className="text-gray-600">{localStorage.getItem('currentEngineerId') || 'N/A'}</p>
              </div>
              <Button variant="outline" className="w-full">
                Change Password
              </Button>
              <Button variant="outline" className="w-full">
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sync Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Sync Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Automatic sync interval: 30 seconds
            </p>
            <Button variant="outline" className="w-full">
              Clear Local Data
            </Button>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              LUX Engineer Management System v1.0.0
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EngineerSettingsPage;