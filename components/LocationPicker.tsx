'use client';

import { useState, useEffect } from 'react';
import { APIProvider, Map as GoogleMap, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

interface LocationPickerProps {
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
  onLocationSelect: (latitude: number, longitude: number) => void;
  onClose?: () => void;
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col overflow-y-auto">
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-200">
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
        <div className="relative w-full" style={{ height: '400px' }}>
          <APIProvider apiKey={apiKey}>
            <GoogleMap
              defaultCenter={selectedLocation || defaultCenter}
              defaultZoom={13}
              mapId="f61fd161984b7ef0b0aaa09b"
              gestureHandling="greedy"
              style={{ width: '100%', height: '100%' }}
              onClick={(e: any) => {
                console.log('CLICK EVENT:', e);

                // latLng 추출 (여러 형식 지원)
                let lat: number | undefined;
                let lng: number | undefined;

                if (e.detail?.latLng) {
                  lat = typeof e.detail.latLng.lat === 'function'
                    ? e.detail.latLng.lat()
                    : e.detail.latLng.lat;
                  lng = typeof e.detail.latLng.lng === 'function'
                    ? e.detail.latLng.lng()
                    : e.detail.latLng.lng;
                }

                if (lat !== undefined && lng !== undefined) {
                  console.log('Setting location:', lat, lng);
                  handleMapClick(lat, lng);
                } else {
                  console.log('Could not extract lat/lng from event');
                }
              }}
            >

              {/* 선택된 위치 마커 */}
              {selectedLocation && (
                <AdvancedMarker
                  position={selectedLocation}
                  draggable={true}
                  onDragEnd={(event) => {
                    const newLat = event.latLng?.lat();
                    const newLng = event.latLng?.lng();
                    if (newLat !== undefined && newLng !== undefined) {
                      setSelectedLocation({
                        lat: newLat,
                        lng: newLng,
                      });
                    }
                  }}
                />
              )}
            </GoogleMap>
          </APIProvider>
        </div>

        {/* 선택된 좌표 표시 */}
        {selectedLocation && (
          <div className="p-3 bg-blue-50 border-t border-blue-200">
            <p className="text-sm text-blue-800">
              선택된 위치: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              💡 마커를 드래그하여 위치를 미세 조정할 수 있습니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
