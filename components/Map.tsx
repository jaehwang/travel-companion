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
  message?: string;
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

  // defaultCenter 변경 시 지도 이동 (photos가 없을 때만)
  useEffect(() => {
    if (photos.length === 0 && map) {
      map.panTo(defaultCenter);
      map.setZoom(defaultZoom);
    }
  }, [defaultCenter, defaultZoom, photos.length, map]);

  // 사진 위치에 맞게 지도 중심과 줌 자동 조정
  useEffect(() => {
    if (!map || photos.length === 0) return;

    if (photos.length === 1) {
      // 사진이 1개면 그 위치로 이동
      map.panTo({ lat: photos[0].latitude, lng: photos[0].longitude });
      map.setZoom(13);
    } else {
      // 여러 사진이면 모든 위치를 포함하는 영역으로 fitBounds
      const bounds = new google.maps.LatLngBounds();
      photos.forEach(photo => {
        bounds.extend({ lat: photo.latitude, lng: photo.longitude });
      });
      map.fitBounds(bounds);

      // 패딩 추가하여 마커가 가장자리에 붙지 않도록
      const padding = { top: 50, right: 50, bottom: 50, left: 50 };
      map.fitBounds(bounds, padding);
    }
  }, [photos, map]);

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
          onCameraChanged={(ev) => {
            // 지도 인스턴스 저장
            if (ev.map && !map) {
              setMap(ev.map);
            }
          }}
        >
          {/* 마커 표시 */}
          {photos.map((photo, index) => (
            <AdvancedMarker
              key={photo.id}
              position={{ lat: photo.latitude, lng: photo.longitude }}
              onClick={() => setSelectedPhoto(photo)}
              title={photo.title || 'Photo'}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#4285F4',
                  border: '2px solid white',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                {index + 1}
              </div>
            </AdvancedMarker>
          ))}

          {/* InfoWindow (팝업) */}
          {selectedPhoto && (() => {
            const selectedIndex = photos.findIndex(p => p.id === selectedPhoto.id);
            const hasPrev = selectedIndex > 0;
            const hasNext = selectedIndex < photos.length - 1;

            const handlePrev = () => {
              if (hasPrev) {
                setSelectedPhoto(photos[selectedIndex - 1]);
              }
            };

            const handleNext = () => {
              if (hasNext) {
                setSelectedPhoto(photos[selectedIndex + 1]);
              }
            };

            return (
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
                  {selectedPhoto.message && (
                    <p className="text-sm text-gray-700 mb-2">{selectedPhoto.message}</p>
                  )}
                  {selectedPhoto.takenAt && (
                    <p className="text-xs text-gray-600 mb-1">
                      {new Date(selectedPhoto.takenAt).toLocaleString('ko-KR')}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mb-2">
                    📍 {selectedPhoto.latitude.toFixed(6)}, {selectedPhoto.longitude.toFixed(6)}
                  </p>

                  {/* 이전/다음 버튼 */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '8px',
                    marginTop: '12px',
                    paddingTop: '8px',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <button
                      onClick={handlePrev}
                      disabled={!hasPrev}
                      style={{
                        flex: 1,
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: hasPrev ? '#4285F4' : '#e5e7eb',
                        color: hasPrev ? 'white' : '#9ca3af',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: hasPrev ? 'pointer' : 'not-allowed',
                      }}
                    >
                      ← 이전
                    </button>
                    <span style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      alignSelf: 'center',
                      whiteSpace: 'nowrap'
                    }}>
                      {selectedIndex + 1} / {photos.length}
                    </span>
                    <button
                      onClick={handleNext}
                      disabled={!hasNext}
                      style={{
                        flex: 1,
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: hasNext ? '#4285F4' : '#e5e7eb',
                        color: hasNext ? 'white' : '#9ca3af',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: hasNext ? 'pointer' : 'not-allowed',
                      }}
                    >
                      다음 →
                    </button>
                  </div>

                  {selectedPhoto.url && (
                    <a
                      href={selectedPhoto.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline mt-2 block text-center"
                    >
                      원본 보기 →
                    </a>
                  )}
                </div>
              </InfoWindow>
            );
          })()}

          {/* 경로 연결 */}
          {showPath && <TravelPath photos={photos} />}
        </GoogleMap>
      </APIProvider>

    </div>
  );
}
