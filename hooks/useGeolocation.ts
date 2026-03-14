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

// enableHighAccuracy: GPS 칩 우선 사용. Wi-Fi/기지국보다 정확하지만 실내에서는
//   오히려 timeout이 발생할 수 있다.
// maximumAge: 0 — 캐시된 위치 사용 금지. 체크인 시점의 실제 위치가 필요하다.
// timeout: 10000 — 실내 등 GPS 취약 환경을 고려한 여유 값.
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
        // 성공 콜백
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
        // 에러 콜백
        // PERMISSION_DENIED: 브라우저 또는 OS 위치 권한 미허용
        // POSITION_UNAVAILABLE: GPS 신호 없음 또는 네트워크 위치 정보 불가
        // TIMEOUT: enableHighAccuracy 활성화 시 실내에서 자주 발생
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
  // 의존성 배열이 빈 배열인 이유: 외부 변수를 참조하지 않으므로
  // 항상 동일한 함수 참조를 유지하여 불필요한 리렌더를 방지한다.
  }, []);

  return {
    position,
    error,
    loading,
    getCurrentPosition,
  };
}
