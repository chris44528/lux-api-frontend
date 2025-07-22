import React, { useMemo } from 'react';
import { format, differenceInMinutes } from 'date-fns';
import { MapPin, Navigation, Clock, Activity, Battery, Wifi } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { ScrollArea } from '../../ui/scroll-area';

interface LocationData {
  id: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  recorded_at: string;
  speed?: number;
  heading?: number;
  activity_type?: string;
  battery_level?: number;
  network_type?: string;
  job_info?: {
    id: number;
    title: string;
    site_name: string;
  };
  engineer?: {
    id: number;
    name: string;
    color?: string;
  };
}

interface LocationHistoryProps {
  locations: LocationData[];
  engineers: Array<{ id: number; name: string; color?: string }>;
  loading?: boolean;
}

const LocationHistory: React.FC<LocationHistoryProps> = ({
  locations,
  engineers,
  loading,
}) => {
  // Group locations by engineer and time
  const groupedLocations = useMemo(() => {
    const groups = new Map<number, Map<string, LocationData[]>>();
    
    // Sort locations by time
    const sortedLocations = [...locations].sort((a, b) => 
      new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
    );

    sortedLocations.forEach(location => {
      const engineerId = location.engineer?.id || 0;
      const hourKey = format(new Date(location.recorded_at), 'HH:00');
      
      if (!groups.has(engineerId)) {
        groups.set(engineerId, new Map());
      }
      
      const engineerGroups = groups.get(engineerId)!;
      if (!engineerGroups.has(hourKey)) {
        engineerGroups.set(hourKey, []);
      }
      
      engineerGroups.get(hourKey)!.push(location);
    });

    return groups;
  }, [locations]);

  // Calculate movement between locations
  const calculateMovement = (prev: LocationData, current: LocationData) => {
    const timeDiff = differenceInMinutes(
      new Date(current.recorded_at),
      new Date(prev.recorded_at)
    );
    
    // Simple distance calculation (Haversine would be more accurate)
    const latDiff = parseFloat(current.latitude.toString()) - parseFloat(prev.latitude.toString());
    const lngDiff = parseFloat(current.longitude.toString()) - parseFloat(prev.longitude.toString());
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111; // Rough km conversion
    
    return {
      distance: distance.toFixed(2),
      time: timeDiff,
      speed: timeDiff > 0 ? (distance / timeDiff * 60).toFixed(1) : '0',
    };
  };

  // Get activity icon
  const getActivityIcon = (activityType?: string) => {
    switch (activityType?.toLowerCase()) {
      case 'still':
      case 'stationary':
        return <Activity className="w-4 h-4 text-gray-500" />;
      case 'walking':
        return <Activity className="w-4 h-4 text-green-500" />;
      case 'driving':
      case 'in_vehicle':
        return <Navigation className="w-4 h-4 text-blue-500" />;
      default:
        return <MapPin className="w-4 h-4 text-gray-500" />;
    }
  };

  // Get network icon
  const getNetworkIcon = (networkType?: string) => {
    const color = networkType === 'wifi' ? 'text-blue-500' : 'text-gray-500';
    return <Wifi className={`w-4 h-4 ${color}`} />;
  };

  // Get battery color
  const getBatteryColor = (level?: number) => {
    if (!level) return 'text-gray-500';
    if (level > 50) return 'text-green-500';
    if (level > 20) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No location data available for the selected period</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-6">
        {Array.from(groupedLocations).map(([engineerId, hourGroups]) => {
          const engineer = engineers.find(e => e.id === engineerId);
          if (!engineer) return null;

          return (
            <div key={engineerId} className="space-y-4">
              {/* Engineer Header */}
              <div className="flex items-center gap-2 sticky top-0 bg-white dark:bg-gray-900 py-2 z-10">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: engineer.color || '#3B82F6' }}
                />
                <h3 className="font-semibold text-lg">{engineer.name}</h3>
                <Badge variant="outline">{hourGroups.size} hours tracked</Badge>
              </div>

              {/* Hour Groups */}
              {Array.from(hourGroups).map(([hour, hourLocations]) => (
                <div key={`${engineerId}-${hour}`} className="ml-6">
                  <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {hour}
                  </h4>
                  
                  <div className="space-y-2">
                    {hourLocations.map((location, index) => {
                      const prevLocation = index < hourLocations.length - 1 ? hourLocations[index + 1] : null;
                      const movement = prevLocation ? calculateMovement(prevLocation, location) : null;

                      return (
                        <div
                          key={location.id}
                          className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          {/* Time and Activity */}
                          <div className="flex flex-col items-center">
                            <div className="text-sm font-medium">
                              {format(new Date(location.recorded_at), 'HH:mm:ss')}
                            </div>
                            <div className="mt-1">
                              {getActivityIcon(location.activity_type)}
                            </div>
                          </div>

                          {/* Location Details */}
                          <div className="flex-1 space-y-2">
                            {/* Job Info */}
                            {location.job_info && (
                              <div className="mb-2">
                                <Badge variant="secondary" className="text-xs">
                                  {location.job_info.title} - {location.job_info.site_name}
                                </Badge>
                              </div>
                            )}

                            {/* Coordinates and Accuracy */}
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span>
                                  {parseFloat(location.latitude.toString()).toFixed(6)},
                                  {parseFloat(location.longitude.toString()).toFixed(6)}
                                </span>
                              </div>
                              <span className="text-xs">±{Math.round(location.accuracy)}m</span>
                            </div>

                            {/* Movement Info */}
                            {movement && parseFloat(movement.distance) > 0.01 && (
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-blue-600 dark:text-blue-400">
                                  {movement.distance} km in {movement.time} min
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {movement.speed} km/h avg
                                </Badge>
                              </div>
                            )}

                            {/* Speed */}
                            {location.speed !== undefined && location.speed > 0 && (
                              <div className="flex items-center gap-2 text-sm">
                                <Navigation className="w-3 h-3 text-blue-500" />
                                <span>{(location.speed * 3.6).toFixed(1)} km/h</span>
                                {location.heading !== undefined && (
                                  <span className="text-gray-500">
                                    {Math.round(location.heading)}°
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Device Info */}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              {location.battery_level !== undefined && (
                                <div className="flex items-center gap-1">
                                  <Battery className={`w-3 h-3 ${getBatteryColor(location.battery_level)}`} />
                                  <span>{location.battery_level}%</span>
                                </div>
                              )}
                              {location.network_type && (
                                <div className="flex items-center gap-1">
                                  {getNetworkIcon(location.network_type)}
                                  <span>{location.network_type}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default LocationHistory;