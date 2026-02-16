'use client';

import { useState, useEffect } from 'react';
import { APIProvider, Map as GoogleMap, AdvancedMarker, InfoWindow, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

export interface MapPhoto {
  id: string;
  url: string;
  latitude: number;
  longitude: number;
  title?: string;
  takenAt?: string;
}

interface MapProps {
  photos: MapPhoto[];
  height?: string;
  defaultCenter?: { lat: number; lng: number };
  defaultZoom?: number;
  showPath?: boolean;
}

// Polyline 컴포넌트 (경로 연결)
function TravelPath({ photos }: { photos: MapPhoto[] }) {
  const map = useMap();
  const maps = useMapsLibrary('maps');
  const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || !maps || photos.length < 2) {
      if (polyline) {
        polyline.setMap(null);
        setPolyline(null);
      }
      return;
    }

    // 시간순으로 정렬 (takenAt이 있는 경우)
    const sortedPhotos = [...photos].sort((a, b) => {
      if (!a.takenAt || !b.takenAt) return 0;
      return new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime();
    });

    // 경로 좌표 생성
    const path = sortedPhotos.map(photo => ({
      lat: photo.latitude,
      lng: photo.longitude,
    }));

    // 새 Polyline 생성
    const newPolyline = new maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#4285F4',
      strokeOpacity: 0.8,
      strokeWeight: 3,
      map,
    });

    setPolyline(newPolyline);

    // 클린업
    return () => {
      newPolyline.setMap(null);
    };
  }, [map, maps, photos]);

  return null;
}

export default function Map({
  photos,
  height = '500px',
  defaultCenter = { lat: 37.5665, lng: 126.9780 }, // 서울 기본 좌표
  defaultZoom = 10,
  showPath = true,
}: MapProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<MapPhoto | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(defaultZoom);
  const [error, setError] = useState<string>('');
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // 사진 위치에 맞게 지도 중심과 줌 자동 조정
  useEffect(() => {
    if (photos.length === 0) return;

    if (photos.length === 1) {
      // 사진이 1개면 그 위치로 이동
      setMapCenter({ lat: photos[0].latitude, lng: photos[0].longitude });
      setMapZoom(13);
    } else {
      // 여러 사진이면 모든 위치를 포함하는 중심점 계산
      const bounds = {
        north: Math.max(...photos.map(p => p.latitude)),
        south: Math.min(...photos.map(p => p.latitude)),
        east: Math.max(...photos.map(p => p.longitude)),
        west: Math.min(...photos.map(p => p.longitude)),
      };

      const center = {
        lat: (bounds.north + bounds.south) / 2,
        lng: (bounds.east + bounds.west) / 2,
      };

      setMapCenter(center);

      // 범위에 따라 적절한 줌 레벨 계산 (간단한 방식)
      const latDiff = bounds.north - bounds.south;
      const lngDiff = bounds.east - bounds.west;
      const maxDiff = Math.max(latDiff, lngDiff);

      let zoom = 13;
      if (maxDiff > 10) zoom = 5;
      else if (maxDiff > 5) zoom = 6;
      else if (maxDiff > 2) zoom = 7;
      else if (maxDiff > 1) zoom = 8;
      else if (maxDiff > 0.5) zoom = 9;
      else if (maxDiff > 0.2) zoom = 10;
      else if (maxDiff > 0.1) zoom = 11;
      else if (maxDiff > 0.05) zoom = 12;

      setMapZoom(zoom);
    }
  }, [photos]);

  if (!apiKey || apiKey === 'your-google-maps-api-key') {
    return (
      <div
        style={{ height }}
        className="bg-gray-100 rounded-lg flex items-center justify-center p-8"
      >
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">⚠️ Google Maps API 키가 설정되지 않았습니다</p>
          <p className="text-sm text-gray-600 mb-2">
            .env.local 파일에 NEXT_PUBLIC_GOOGLE_MAPS_API_KEY를 추가하세요
          </p>
          <a
            href="https://console.cloud.google.com/google/maps-apis"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm"
          >
            Google Cloud Console에서 API 키 발급 →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ height, pointerEvents: 'auto', touchAction: 'pan-x pan-y' }}>
      <APIProvider apiKey={apiKey}>
        <GoogleMap
          defaultCenter={mapCenter}
          defaultZoom={mapZoom}
          mapId="f61fd161984b7ef0b0aaa09b"
          gestureHandling="greedy"
          style={{ width: '100%', height: '100%' }}
        >
          {/* 마커 표시 */}
          {photos.map((photo) => (
            <AdvancedMarker
              key={photo.id}
              position={{ lat: photo.latitude, lng: photo.longitude }}
              onClick={() => setSelectedPhoto(photo)}
              title={photo.title || 'Photo'}
            />
          ))}

          {/* InfoWindow (팝업) */}
          {selectedPhoto && (
            <InfoWindow
              position={{ lat: selectedPhoto.latitude, lng: selectedPhoto.longitude }}
              onCloseClick={() => setSelectedPhoto(null)}
            >
              <div style={{ minWidth: '200px', maxWidth: '300px' }}>
                {selectedPhoto.url && (
                  <img
                    src={selectedPhoto.url}
                    alt={selectedPhoto.title || 'Photo'}
                    className="w-full h-40 object-cover rounded mb-2"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      console.error('Image load error:', selectedPhoto.url);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                {selectedPhoto.title && (
                  <p className="font-semibold mb-1">{selectedPhoto.title}</p>
                )}
                {selectedPhoto.takenAt && (
                  <p className="text-xs text-gray-600 mb-1">{selectedPhoto.takenAt}</p>
                )}
                <p className="text-xs text-gray-500">
                  📍 {selectedPhoto.latitude.toFixed(6)}, {selectedPhoto.longitude.toFixed(6)}
                </p>
                {selectedPhoto.url && (
                  <a
                    href={selectedPhoto.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline mt-2 block"
                  >
                    원본 보기 →
                  </a>
                )}
              </div>
            </InfoWindow>
          )}

          {/* 경로 연결 */}
          {showPath && <TravelPath photos={photos} />}
        </GoogleMap>
      </APIProvider>

      {/* 사진이 없을 때 오버레이 */}
      {photos.length === 0 && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg pointer-events-none">
          <p className="text-white text-lg font-medium">
            GPS 정보가 있는 사진을 업로드하세요
          </p>
        </div>
      )}
    </div>
  );
}
