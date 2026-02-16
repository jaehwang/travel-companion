'use client';

import { useState, useCallback } from 'react';

interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface GeolocationError {
  code: number;
  message: string;
}

interface UseGeolocationReturn {
  position: GeolocationPosition | null;
  error: GeolocationError | null;
  loading: boolean;
  getCurrentPosition: () => Promise<GeolocationPosition>;
}

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

export function useGeolocation(): UseGeolocationReturn {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [loading, setLoading] = useState(false);

  const getCurrentPosition = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = {
          code: 0,
          message: '브라우저가 위치 정보를 지원하지 않습니다.',
        };
        setError(err);
        reject(err);
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const location: GeolocationPosition = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setPosition(location);
          setLoading(false);
          resolve(location);
        },
        (err) => {
          let message = '위치를 가져올 수 없습니다.';

          switch (err.code) {
            case err.PERMISSION_DENIED:
              message = '위치 접근 권한이 거부되었습니다.';
              break;
            case err.POSITION_UNAVAILABLE:
              message = '위치 정보를 사용할 수 없습니다.';
              break;
            case err.TIMEOUT:
              message = '위치 요청 시간이 초과되었습니다.';
              break;
          }

          const geolocationError = {
            code: err.code,
            message,
          };
          setError(geolocationError);
          setLoading(false);
          reject(geolocationError);
        },
        GEOLOCATION_OPTIONS
      );
    });
  }, []);

  return {
    position,
    error,
    loading,
    getCurrentPosition,
  };
}
