import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';

interface StatusIndicatorProps {
  currentStatus: string;
  onStatusChange: (status: string, location?: GeolocationPosition) => void;
  isOffline: boolean;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  currentStatus, 
  onStatusChange, 
  isOffline 
}) => {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    // Request location permission and get current location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(position);
          setLocationError(null);
        },
        (error) => {
          setLocationError(error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    }
  }, []);

  const statuses = [
    { value: 'available', label: 'Available', color: 'bg-green-500', icon: '🟢' },
    { value: 'driving', label: 'Driving', color: 'bg-blue-500', icon: '🚗' },
    { value: 'on_site', label: 'On Site', color: 'bg-purple-500', icon: '🏢' },
    { value: 'break', label: 'Break', color: 'bg-yellow-500', icon: '☕' },
    { value: 'offline', label: 'Offline', color: 'bg-gray-500', icon: '⭕' },
  ];

  const currentStatusObj = statuses.find(s => s.value === currentStatus) || statuses[4];

  const handleStatusChange = (newStatus: string) => {
    // Include location if available
    onStatusChange(newStatus, location || undefined);
  };

  return (
    <div className="flex items-center gap-2">
      {locationError && (
        <span className="text-xs text-yellow-600" title={locationError}>
          📍⚠️
        </span>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${currentStatusObj.color}`} />
            <span>{currentStatusObj.label}</span>
            {isOffline && <span className="text-xs">📴</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {statuses.map((status) => (
            <DropdownMenuItem
              key={status.value}
              onClick={() => handleStatusChange(status.value)}
              className="flex items-center gap-2"
            >
              <span>{status.icon}</span>
              <span>{status.label}</span>
              {currentStatus === status.value && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default StatusIndicator;