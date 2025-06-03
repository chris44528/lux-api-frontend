import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  location: GeolocationPosition | null;
  error: GeolocationPositionError | null;
  loading: boolean;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
}

export const useGeolocation = (options: GeolocationOptions = {}) => {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: true
  });

  const updatePosition = useCallback((position: GeolocationPosition) => {
    setState({
      location: position,
      error: null,
      loading: false
    });
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    setState({
      location: null,
      error,
      loading: false
    });
  }, []);

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState({
        location: null,
        error: {
          code: 0,
          message: 'Geolocation is not supported',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3
        } as GeolocationPositionError,
        loading: false
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    const geoOptions: PositionOptions = {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeout ?? 10000,
      maximumAge: options.maximumAge ?? 60000
    };

    navigator.geolocation.getCurrentPosition(
      updatePosition,
      handleError,
      geoOptions
    );
  }, [options, updatePosition, handleError]);

  useEffect(() => {
    if (!navigator.geolocation) {
      handleError({
        code: 0,
        message: 'Geolocation is not supported',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      } as GeolocationPositionError);
      return;
    }

    const geoOptions: PositionOptions = {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeout ?? 10000,
      maximumAge: options.maximumAge ?? 60000
    };

    let watchId: number;

    if (options.watch) {
      watchId = navigator.geolocation.watchPosition(
        updatePosition,
        handleError,
        geoOptions
      );
    } else {
      navigator.geolocation.getCurrentPosition(
        updatePosition,
        handleError,
        geoOptions
      );
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [options, updatePosition, handleError]);

  return {
    ...state,
    getCurrentPosition
  };
};