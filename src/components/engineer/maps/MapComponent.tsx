import React, { useState, useCallback, useMemo } from 'react';
import {
  GoogleMap,
  LoadScript,
  DirectionsService,
  DirectionsRenderer,
  Marker,
  InfoWindow,
  TrafficLayer
} from '@react-google-maps/api';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Switch } from '../../ui/switch';
import { Label } from '../../ui/label';

const libraries: ("places" | "drawing" | "visualization")[] = ['places', 'drawing', 'visualization'];

interface Location {
  lat: number;
  lng: number;
}

interface Job {
  id: number;
  title: string;
  site: {
    site_name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  priority: string;
  estimated_duration: number;
}

interface RouteJob {
  job: Job;
  sequence_order: number;
  estimated_arrival: string;
  distance_from_previous: number;
}

interface MapComponentProps {
  apiKey: string;
  engineerLocation?: Location;
  jobs?: Job[];
  routeJobs?: RouteJob[];
  optimizedRoute?: any;
  onDirectionsCalculated?: (result: google.maps.DirectionsResult) => void;
  height?: string;
}

const MapComponent: React.FC<MapComponentProps> = ({
  apiKey,
  engineerLocation,
  jobs = [],
  routeJobs = [],
  optimizedRoute,
  onDirectionsCalculated,
  height = '500px'
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [showTraffic, setShowTraffic] = useState(true);
  const [travelMode, setTravelMode] = useState<google.maps.TravelMode>(
    google.maps.TravelMode.DRIVING
  );

  const mapContainerStyle = {
    width: '100%',
    height: height
  };

  const center = useMemo(() => {
    if (engineerLocation) {
      return engineerLocation;
    }
    if (jobs.length > 0 && jobs[0].site.latitude) {
      return {
        lat: jobs[0].site.latitude,
        lng: jobs[0].site.longitude
      };
    }
    return { lat: 51.5074, lng: -0.1278 }; // Default to London
  }, [engineerLocation, jobs]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const directionsCallback = useCallback((
    result: google.maps.DirectionsResult | null,
    status: google.maps.DirectionsStatus
  ) => {
    if (status === 'OK' && result) {
      setDirections(result);
      onDirectionsCalculated?.(result);
    }
  }, [onDirectionsCalculated]);

  const directionsServiceOptions = useMemo(() => {
    if (!optimizedRoute || routeJobs.length === 0) return null;

    const waypoints = routeJobs.slice(1, -1).map(rj => ({
      location: {
        lat: rj.job.site.latitude,
        lng: rj.job.site.longitude
      },
      stopover: true
    }));

    const origin = engineerLocation || {
      lat: routeJobs[0].job.site.latitude,
      lng: routeJobs[0].job.site.longitude
    };

    const destination = {
      lat: routeJobs[routeJobs.length - 1].job.site.latitude,
      lng: routeJobs[routeJobs.length - 1].job.site.longitude
    };

    return {
      origin,
      destination,
      waypoints,
      travelMode,
      optimizeWaypoints: false, // Already optimized by backend
      drivingOptions: {
        departureTime: new Date(),
        trafficModel: google.maps.TrafficModel.BEST_GUESS
      }
    };
  }, [optimizedRoute, routeJobs, engineerLocation, travelMode]);

  const getMarkerIcon = (job: Job, index?: number) => {
    const color = job.priority === 'urgent' || job.priority === 'high' ? 'red' : 'green';
    const label = index !== undefined ? (index + 1).toString() : '';
    
    return {
      url: `https://maps.google.com/mapfiles/ms/icons/${color}-dot.png`,
      scaledSize: new google.maps.Size(40, 40),
      labelOrigin: new google.maps.Point(20, 15)
    };
  };

  const mapOptions = {
    zoomControl: true,
    mapTypeControl: true,
    scaleControl: true,
    streetViewControl: true,
    rotateControl: true,
    fullscreenControl: true,
    styles: [
      {
        featureType: 'poi.business',
        stylers: [{ visibility: 'off' }]
      }
    ]
  };

  return (
    <div className="space-y-4">
      {/* Map Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Switch
              checked={showTraffic}
              onCheckedChange={setShowTraffic}
              id="traffic-toggle"
            />
            <Label htmlFor="traffic-toggle">Show Traffic</Label>
          </div>
          
          <div className="flex items-center gap-2">
            <Label>Travel Mode:</Label>
            <select
              className="px-3 py-1 border rounded-md"
              value={travelMode}
              onChange={(e) => setTravelMode(e.target.value as google.maps.TravelMode)}
            >
              <option value={google.maps.TravelMode.DRIVING}>Driving</option>
              <option value={google.maps.TravelMode.WALKING}>Walking</option>
              <option value={google.maps.TravelMode.BICYCLING}>Bicycling</option>
              <option value={google.maps.TravelMode.TRANSIT}>Transit</option>
            </select>
          </div>

          {directions && (
            <div className="ml-auto text-sm text-gray-600">
              Total Distance: {directions.routes[0]?.legs.reduce((sum, leg) => 
                sum + (leg.distance?.value || 0), 0) / 1000} km | 
              Duration: {Math.round(directions.routes[0]?.legs.reduce((sum, leg) => 
                sum + (leg.duration?.value || 0), 0) / 60)} min
            </div>
          )}
        </div>
      </Card>

      {/* Map */}
      <LoadScript googleMapsApiKey={apiKey} libraries={libraries}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={12}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={mapOptions}
        >
          {/* Traffic Layer */}
          {showTraffic && <TrafficLayer />}

          {/* Engineer Location Marker */}
          {engineerLocation && (
            <Marker
              position={engineerLocation}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                scaledSize: new google.maps.Size(45, 45)
              }}
              title="Your Location"
            />
          )}

          {/* Job Markers */}
          {jobs.map((job, index) => {
            if (!job.site.latitude || !job.site.longitude) return null;
            
            return (
              <Marker
                key={job.id}
                position={{
                  lat: job.site.latitude,
                  lng: job.site.longitude
                }}
                icon={getMarkerIcon(job, routeJobs.length > 0 ? undefined : index)}
                label={routeJobs.length === 0 ? {
                  text: (index + 1).toString(),
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold'
                } : undefined}
                onClick={() => setSelectedJob(job)}
              />
            );
          })}

          {/* Route Jobs Markers (when optimized) */}
          {routeJobs.map((routeJob, index) => {
            const job = routeJob.job;
            if (!job.site.latitude || !job.site.longitude) return null;
            
            return (
              <Marker
                key={`route-${job.id}`}
                position={{
                  lat: job.site.latitude,
                  lng: job.site.longitude
                }}
                icon={getMarkerIcon(job)}
                label={{
                  text: (index + 1).toString(),
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
                onClick={() => setSelectedJob(job)}
              />
            );
          })}

          {/* Info Window */}
          {selectedJob && (
            <InfoWindow
              position={{
                lat: selectedJob.site.latitude,
                lng: selectedJob.site.longitude
              }}
              onCloseClick={() => setSelectedJob(null)}
            >
              <div className="p-2 min-w-[200px]">
                <h3 className="font-bold mb-1">{selectedJob.site.site_name}</h3>
                <p className="text-sm mb-2">{selectedJob.site.address}</p>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={
                    selectedJob.priority === 'urgent' || selectedJob.priority === 'high' 
                      ? 'destructive' 
                      : 'default'
                  }>
                    {selectedJob.priority}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {selectedJob.estimated_duration} min
                  </span>
                </div>
                <p className="text-sm font-medium">{selectedJob.title}</p>
              </div>
            </InfoWindow>
          )}

          {/* Directions Renderer */}
          {directionsServiceOptions && !directions && (
            <DirectionsService
              options={directionsServiceOptions}
              callback={directionsCallback}
            />
          )}

          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: '#1976d2',
                  strokeOpacity: 0.8,
                  strokeWeight: 4
                }
              }}
            />
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default MapComponent;