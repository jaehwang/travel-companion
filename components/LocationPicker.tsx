'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { APIProvider, Map as GoogleMap, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import MyLocationButton from '@/components/MyLocationButton';

interface LocationPickerProps {
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
  onLocationSelect: (latitude: number, longitude: number) => void;
  onClose?: () => void;
}

// initialLocation 없을 때 현재 위치로 지도 중심 이동 + 마커 표시
function CenterOnCurrentLocation({ onCenter }: { onCenter: (lat: number, lng: number) => void }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        map.panTo({ lat, lng });
        onCenter(lat, lng);
      },
      () => {}, // 실패 시 기본 중심(서울) 유지
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [map]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

// 지도 클릭 이벤트를 처리하는 컴포넌트
function MapClickHandler({
  onLocationClick
}: {
  onLocationClick: (lat: number, lng: number) => void
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const listener = map.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        console.log('Map clicked at:', lat, lng);
        onLocationClick(lat, lng);
      }
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map, onLocationClick]);

  return null;
}

export function LocationPicker({
  initialLocation,
  onLocationSelect,
  onClose,
}: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(
    initialLocation
      ? { lat: initialLocation.latitude, lng: initialLocation.longitude }
      : null
  );

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const defaultCenter = initialLocation
    ? { lat: initialLocation.latitude, lng: initialLocation.longitude }
    : { lat: 37.5665, lng: 126.9780 }; // 서울 기본 좌표

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation.lat, selectedLocation.lng);
    }
  };

  if (!apiKey || apiKey === 'your-google-maps-api-key') {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <p className="text-red-600 font-semibold mb-2">
          ⚠️ Google Maps API 키가 설정되지 않았습니다
        </p>
      </div>
    );
  }

  return createPortal(
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: 'white' }}
      className="md:bg-black/60 flex flex-col md:items-center md:justify-center md:p-4"
    >
      <div className="bg-white flex flex-col w-full h-full md:h-auto md:w-auto md:rounded-lg md:max-w-4xl md:min-w-[600px] md:shadow-xl">
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">위치 선택</h2>
              <p className="text-sm text-gray-600">지도를 클릭하여 위치를 선택하세요</p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            )}
          </div>

          {/* 버튼 - 상단으로 이동 */}
          <div className="flex gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                취소
              </button>
            )}
            <button
              onClick={handleConfirm}
              disabled={!selectedLocation}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              위치 확정
            </button>
          </div>
        </div>

        {/* 지도 */}
        <div className="relative w-full flex-1 md:flex-none md:h-[500px] min-h-[300px]">
          <APIProvider apiKey={apiKey}>
            <GoogleMap
              defaultCenter={selectedLocation || defaultCenter}
              defaultZoom={13}
              mapId="f61fd161984b7ef0b0aaa09b"
              gestureHandling="greedy"
              style={{ width: '100%', height: '100%' }}
              onClick={(e: any) => {
                let lat: number | undefined;
                let lng: number | undefined;
                if (e.detail?.latLng) {
                  lat = typeof e.detail.latLng.lat === 'function' ? e.detail.latLng.lat() : e.detail.latLng.lat;
                  lng = typeof e.detail.latLng.lng === 'function' ? e.detail.latLng.lng() : e.detail.latLng.lng;
                }
                if (lat !== undefined && lng !== undefined) handleMapClick(lat, lng);
              }}
            >
              {!initialLocation && (
                <CenterOnCurrentLocation
                  onCenter={(lat, lng) => setSelectedLocation({ lat, lng })}
                />
              )}
              <MyLocationButton
                onLocationFound={(lat, lng) => setSelectedLocation({ lat, lng })}
              />
              {selectedLocation && (
                <AdvancedMarker
                  position={selectedLocation}
                  draggable={true}
                  onDragEnd={(event) => {
                    const newLat = event.latLng?.lat();
                    const newLng = event.latLng?.lng();
                    if (newLat !== undefined && newLng !== undefined) {
                      setSelectedLocation({ lat: newLat, lng: newLng });
                    }
                  }}
                />
              )}
            </GoogleMap>
          </APIProvider>

          {/* 선택된 좌표 - 지도 위 오버레이 (지도 크기 유지) */}
          {selectedLocation && (
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/90 border-t border-blue-200 pointer-events-none">
              <p className="text-sm text-blue-800">
                📍 {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </p>
              <p className="text-xs text-blue-600 mt-0.5">
                💡 마커를 드래그하여 미세 조정 가능
              </p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
