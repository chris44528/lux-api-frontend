import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import engineerService from '../../../services/engineerService';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { useGeolocation } from '../../../hooks/useGeolocation';

interface Place {
  place_id: string;
  name: string;
  vicinity: string;
  types: string[];
  rating?: number;
  user_ratings_total?: number;
  distance_meters: number;
  is_open?: boolean;
}

const NearbyPlaces: React.FC = () => {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['gas_station']);
  const [places, setPlaces] = useState<Place[]>([]);
  const { location, error: locationError, getCurrentPosition } = useGeolocation();

  const placeTypes = [
    { value: 'gas_station', label: '⛽ Gas Station', icon: '⛽' },
    { value: 'restaurant', label: '🍽️ Restaurant', icon: '🍽️' },
    { value: 'parking', label: '🅿️ Parking', icon: '🅿️' },
    { value: 'atm', label: '💰 ATM', icon: '💰' },
    { value: 'hospital', label: '🏥 Hospital', icon: '🏥' },
    { value: 'pharmacy', label: '💊 Pharmacy', icon: '💊' },
    { value: 'car_repair', label: '🔧 Car Repair', icon: '🔧' },
    { value: 'convenience_store', label: '🏪 Store', icon: '🏪' }
  ];

  const searchMutation = useMutation(
    async () => {
      if (!location) {
        await getCurrentPosition();
        throw new Error('Location required');
      }
      
      return engineerService.findNearbyPlaces(
        {
          lat: location.coords.latitude,
          lng: location.coords.longitude
        },
        selectedTypes,
        5000 // 5km radius
      );
    },
    {
      onSuccess: (data) => {
        setPlaces(data.places || []);
      }
    }
  );

  const togglePlaceType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${meters}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const openInMaps = (place: Place) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Find Nearby Facilities</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Place Type Selection */}
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Select facility types:</p>
            <div className="flex flex-wrap gap-2">
              {placeTypes.map(type => (
                <Button
                  key={type.value}
                  size="sm"
                  variant={selectedTypes.includes(type.value) ? 'default' : 'outline'}
                  onClick={() => togglePlaceType(type.value)}
                >
                  <span className="mr-1">{type.icon}</span>
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Location Status */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
            {location ? (
              <p className="text-sm">
                📍 Using your current location
              </p>
            ) : locationError ? (
              <p className="text-sm text-red-500">
                ⚠️ {locationError}
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                📍 Getting your location...
              </p>
            )}
          </div>

          {/* Search Button */}
          <Button
            onClick={() => searchMutation.mutate()}
            disabled={selectedTypes.length === 0 || !location || searchMutation.isLoading}
            className="w-full"
          >
            {searchMutation.isLoading ? (
              <>
                <span className="animate-spin mr-2">🔄</span>
                Searching...
              </>
            ) : (
              <>
                <span className="mr-2">🔍</span>
                Search Nearby
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {places.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nearby Places ({places.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {places.map(place => (
                <div
                  key={place.place_id}
                  className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => openInMaps(place)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{place.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {place.vicinity}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-500">
                          {formatDistance(place.distance_meters)}
                        </span>
                        {place.rating && (
                          <span className="text-sm">
                            ⭐ {place.rating} ({place.user_ratings_total})
                          </span>
                        )}
                        {place.is_open !== undefined && (
                          <Badge variant={place.is_open ? 'default' : 'secondary'}>
                            {place.is_open ? 'Open' : 'Closed'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <span className="text-xl">
                      {placeTypes.find(t => place.types.includes(t.value))?.icon || '📍'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {searchMutation.isError && (
        <Card>
          <CardContent className="text-center py-4">
            <p className="text-red-500">Failed to search nearby places. Please try again.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NearbyPlaces;