import React, { useEffect, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline, HeatmapLayer, InfoWindow, Circle } from '@react-google-maps/api';
import { format } from 'date-fns';
import { MapPin, Navigation, Clock, Activity } from 'lucide-react';
import { Badge } from '../../ui/badge';

interface LocationData {
  id: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  recorded_at: string;
  speed?: number;
  heading?: number;
  activity_type?: string;
  engineer?: {
    id: number;
    name: string;
    color?: string;
  };
}

interface EngineerLocation {
  engineer_id: number;
  name: string;
  latitude?: number;
  longitude?: number;
  last_update: string;
  time_since_update: number;
  status: string;
}

interface LocationCluster {
  id: number;
  center_latitude: number;
  center_longitude: number;
  radius_meters: number;
  visit_count: number;
  location_name: string;
  location_type: string;
  average_duration_minutes: number;
}

interface LocationTrackingMapProps {
  locations: LocationData[];
  currentLocations?: EngineerLocation[];
  clusters?: LocationCluster[];
  view: 'tracking' | 'heatmap' | 'clusters';
  selectedEngineers: Array<{ id: number; name: string; color?: string }>;
}

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ['places', 'geometry', 'visualization'];

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 51.5074,
  lng: -0.1278, // London
};

const LocationTrackingMap: React.FC<LocationTrackingMapProps> = ({
  locations,
  currentLocations,
  clusters,
  view,
  selectedEngineers,
}) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<LocationCluster | null>(null);
  const [bounds, setBounds] = useState<google.maps.LatLngBounds | null>(null);

  // Calculate bounds to fit all markers
  useEffect(() => {
    if (!isLoaded || locations.length === 0) return;

    const newBounds = new google.maps.LatLngBounds();
    
    // Add location points
    locations.forEach(location => {
      newBounds.extend({
        lat: parseFloat(location.latitude.toString()),
        lng: parseFloat(location.longitude.toString()),
      });
    });

    // Add current locations
    currentLocations?.forEach(location => {
      if (location.latitude && location.longitude) {
        newBounds.extend({
          lat: location.latitude,
          lng: location.longitude,
        });
      }
    });

    // Add clusters
    clusters?.forEach(cluster => {
      newBounds.extend({
        lat: cluster.center_latitude,
        lng: cluster.center_longitude,
      });
    });

    setBounds(newBounds);
  }, [locations, currentLocations, clusters, isLoaded]);

  // Fit map to bounds
  useEffect(() => {
    if (map && bounds) {
      map.fitBounds(bounds);
    }
  }, [map, bounds]);

  // Group locations by engineer for path drawing
  const getEngineerPaths = () => {
    const pathsByEngineer = new Map<number, google.maps.LatLngLiteral[]>();
    
    const sortedLocations = [...locations].sort((a, b) => 
      new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );

    sortedLocations.forEach(location => {
      const engineerId = location.engineer?.id || 0;
      if (!pathsByEngineer.has(engineerId)) {
        pathsByEngineer.set(engineerId, []);
      }
      
      pathsByEngineer.get(engineerId)!.push({
        lat: parseFloat(location.latitude.toString()),
        lng: parseFloat(location.longitude.toString()),
      });
    });

    return pathsByEngineer;
  };

  // Get heatmap data
  const getHeatmapData = () => {
    if (!isLoaded || !window.google) return [];
    
    return locations.map(location => ({
      location: new google.maps.LatLng(
        parseFloat(location.latitude.toString()),
        parseFloat(location.longitude.toString())
      ),
      weight: location.speed && location.speed < 5 ? 2 : 1, // Higher weight for stationary points
    }));
  };

  // Get marker icon based on activity type
  const getMarkerIcon = (activityType?: string, color?: string) => {
    const baseIcon = {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: color || '#3B82F6',
      fillOpacity: 0.8,
      strokeColor: '#ffffff',
      strokeWeight: 2,
    };

    if (activityType === 'stationary' || activityType === 'still') {
      return { ...baseIcon, scale: 10, fillOpacity: 1 };
    }

    return baseIcon;
  };

  // Format time difference
  const formatTimeSince = (minutes: number) => {
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${Math.floor(minutes)}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return `${Math.floor(minutes / 1440)}d ago`;
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      zoom={10}
      center={defaultCenter}
      onLoad={setMap}
      options={{
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      }}
    >
      {/* Tracking View - Show paths and current locations */}
      {view === 'tracking' && (
        <>
          {/* Draw paths for each engineer */}
          {Array.from(getEngineerPaths()).map(([engineerId, path]) => {
            const engineer = selectedEngineers.find(e => e.id === engineerId);
            if (!engineer || path.length < 2) return null;

            return (
              <Polyline
                key={`path-${engineerId}`}
                path={path}
                options={{
                  strokeColor: engineer.color || '#3B82F6',
                  strokeOpacity: 0.8,
                  strokeWeight: 3,
                  geodesic: true,
                }}
              />
            );
          })}

          {/* Show current locations */}
          {currentLocations?.map(location => {
            if (!location.latitude || !location.longitude) return null;
            const engineer = selectedEngineers.find(e => e.id === location.engineer_id);
            
            return (
              <Marker
                key={`current-${location.engineer_id}`}
                position={{
                  lat: location.latitude,
                  lng: location.longitude,
                }}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 12,
                  fillColor: engineer?.color || '#3B82F6',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 3,
                }}
                onClick={() => {
                  // Create a temporary LocationData object for InfoWindow
                  setSelectedLocation({
                    id: location.engineer_id,
                    latitude: location.latitude!,
                    longitude: location.longitude!,
                    accuracy: 0,
                    recorded_at: location.last_update,
                    engineer: {
                      id: location.engineer_id,
                      name: location.name,
                      color: engineer?.color,
                    },
                  });
                }}
              />
            );
          })}

          {/* Show historical locations as smaller markers */}
          {locations.slice(-50).map(location => (
            <Marker
              key={`location-${location.id}`}
              position={{
                lat: parseFloat(location.latitude.toString()),
                lng: parseFloat(location.longitude.toString()),
              }}
              icon={getMarkerIcon(location.activity_type, location.engineer?.color)}
              onClick={() => setSelectedLocation(location)}
            />
          ))}
        </>
      )}

      {/* Heatmap View */}
      {view === 'heatmap' && locations.length > 0 && (
        <HeatmapLayer
          data={getHeatmapData()}
          options={{
            radius: 20,
            opacity: 0.7,
            gradient: [
              'rgba(0, 255, 255, 0)',
              'rgba(0, 255, 255, 1)',
              'rgba(0, 191, 255, 1)',
              'rgba(0, 127, 255, 1)',
              'rgba(0, 63, 255, 1)',
              'rgba(0, 0, 255, 1)',
              'rgba(0, 0, 223, 1)',
              'rgba(0, 0, 191, 1)',
              'rgba(0, 0, 159, 1)',
              'rgba(0, 0, 127, 1)',
              'rgba(63, 0, 91, 1)',
              'rgba(127, 0, 63, 1)',
              'rgba(191, 0, 31, 1)',
              'rgba(255, 0, 0, 1)',
            ],
          }}
        />
      )}

      {/* Clusters View */}
      {view === 'clusters' && clusters && (
        <>
          {clusters.map(cluster => (
            <React.Fragment key={`cluster-${cluster.id}`}>
              <Circle
                center={{
                  lat: cluster.center_latitude,
                  lng: cluster.center_longitude,
                }}
                radius={cluster.radius_meters}
                options={{
                  fillColor: '#3B82F6',
                  fillOpacity: 0.2,
                  strokeColor: '#3B82F6',
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                }}
              />
              <Marker
                position={{
                  lat: cluster.center_latitude,
                  lng: cluster.center_longitude,
                }}
                icon={{
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="20" cy="20" r="18" fill="#3B82F6" stroke="white" stroke-width="2"/>
                      <text x="20" y="26" text-anchor="middle" fill="white" font-size="16" font-weight="bold">${cluster.visit_count}</text>
                    </svg>
                  `),
                  scaledSize: new google.maps.Size(40, 40),
                  anchor: new google.maps.Point(20, 20),
                }}
                onClick={() => setSelectedCluster(cluster)}
              />
            </React.Fragment>
          ))}
        </>
      )}

      {/* Info Window for selected location */}
      {selectedLocation && (
        <InfoWindow
          position={{
            lat: parseFloat(selectedLocation.latitude.toString()),
            lng: parseFloat(selectedLocation.longitude.toString()),
          }}
          onCloseClick={() => setSelectedLocation(null)}
        >
          <div className="p-2 min-w-[200px]">
            <h3 className="font-semibold mb-2">{selectedLocation.engineer?.name}</h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>{format(new Date(selectedLocation.recorded_at), 'HH:mm:ss')}</span>
              </div>
              {selectedLocation.speed !== undefined && (
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-gray-500" />
                  <span>{(selectedLocation.speed * 3.6).toFixed(1)} km/h</span>
                </div>
              )}
              {selectedLocation.activity_type && (
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gray-500" />
                  <Badge variant="outline" className="text-xs">
                    {selectedLocation.activity_type}
                  </Badge>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-xs">
                  ±{Math.round(selectedLocation.accuracy)}m
                </span>
              </div>
            </div>
          </div>
        </InfoWindow>
      )}

      {/* Info Window for selected cluster */}
      {selectedCluster && (
        <InfoWindow
          position={{
            lat: selectedCluster.center_latitude,
            lng: selectedCluster.center_longitude,
          }}
          onCloseClick={() => setSelectedCluster(null)}
        >
          <div className="p-2 min-w-[250px]">
            <h3 className="font-semibold mb-2">{selectedCluster.location_name}</h3>
            <div className="space-y-1 text-sm">
              <div>
                <Badge>{selectedCluster.location_type}</Badge>
              </div>
              <div className="mt-2 space-y-1">
                <p><strong>Visits:</strong> {selectedCluster.visit_count}</p>
                <p><strong>Avg Duration:</strong> {Math.round(selectedCluster.average_duration_minutes)} min</p>
                <p><strong>Coverage:</strong> {selectedCluster.radius_meters}m radius</p>
              </div>
            </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};

export default LocationTrackingMap;