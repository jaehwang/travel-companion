'use client';

import { useState, useRef } from 'react';

export interface Location {
  latitude: number;
  longitude: number;
}

// 위치 출처: 수동 선택 > 사진 GPS > null
type LocationSource = 'manual' | 'photo' | null;

export interface UseLocationSourceReturn {
  location: Location | null;
  // 장소 검색 또는 지도에서 직접 선택 (항상 적용)
  setManualLocation: (lat: number, lng: number) => void;
  // 사진 GPS 적용 (수동 선택이 있으면 무시)
  applyPhotoGps: (lat: number, lng: number) => void;
  // 사진 제거 시 호출 (사진 GPS 위치라면 함께 초기화)
  onPhotoClear: () => void;
  // 위치 직접 삭제
  clearLocation: () => void;
  // 수정 모드 등 외부에서 위치 초기화 (기존 저장 위치 → 'manual'로 간주)
  initLocation: (lat: number, lng: number) => void;
  // 위치 전체 리셋
  resetLocation: () => void;
}

export function useLocationSource(): UseLocationSourceReturn {
  const [location, setLocation] = useState<Location | null>(null);
  const sourceRef = useRef<LocationSource>(null);

  const setManualLocation = (lat: number, lng: number) => {
    setLocation({ latitude: lat, longitude: lng });
    sourceRef.current = 'manual';
  };

  const applyPhotoGps = (lat: number, lng: number) => {
    if (sourceRef.current !== 'manual') {
      setLocation({ latitude: lat, longitude: lng });
      sourceRef.current = 'photo';
    }
  };

  const onPhotoClear = () => {
    if (sourceRef.current === 'photo') {
      setLocation(null);
      sourceRef.current = null;
    }
  };

  const clearLocation = () => {
    setLocation(null);
    sourceRef.current = null;
  };

  const initLocation = (lat: number, lng: number) => {
    setLocation({ latitude: lat, longitude: lng });
    sourceRef.current = 'manual';
  };

  const resetLocation = () => {
    setLocation(null);
    sourceRef.current = null;
  };

  return {
    location,
    setManualLocation,
    applyPhotoGps,
    onPhotoClear,
    clearLocation,
    initLocation,
    resetLocation,
  };
}
