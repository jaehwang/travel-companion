'use client';

import { useState, useEffect } from 'react';
import { APIProvider, Map as GoogleMap, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import MyLocationButton from '@/components/MyLocationButton';

export interface MapPhoto {
  id: string;
  url: string;
  latitude: number;
  longitude: number;
  title?: string;
  place?: string;
  place_id?: string;
  takenAt?: string;
  message?: string;
}

interface MapProps {
  photos: MapPhoto[];
  height?: string;
  defaultCenter?: { lat: number; lng: number };
  defaultZoom?: number;
}

// 지도 중심/줌 자동 조정을 담당하는 내부 컴포넌트
// useMap() 훅은 APIProvider 내부에서만 동작하므로 별도 컴포넌트로 분리
function MapController({
  photos,
  defaultCenter,
  defaultZoom,
}: {
  photos: MapPhoto[];
  defaultCenter: { lat: number; lng: number };
  defaultZoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (photos.length === 0) {
      map.panTo(defaultCenter);
      map.setZoom(defaultZoom);
    } else if (photos.length === 1) {
      map.panTo({ lat: photos[0].latitude, lng: photos[0].longitude });
      map.setZoom(13);
    } else {
      const bounds = new google.maps.LatLngBounds();
      photos.forEach(photo => {
        bounds.extend({ lat: photo.latitude, lng: photo.longitude });
      });
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }
  }, [photos, map, defaultCenter, defaultZoom]);

  return null;
}

export default function Map({
  photos,
  height = '500px',
  defaultCenter = { lat: 37.5665, lng: 126.9780 }, // 서울 기본 좌표
  defaultZoom = 10,
}: MapProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<MapPhoto | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

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
          defaultCenter={defaultCenter}
          defaultZoom={defaultZoom}
          mapId="f61fd161984b7ef0b0aaa09b"
          gestureHandling="greedy"
          mapTypeControl={false}
          streetViewControl={false}
          style={{ width: '100%', height: '100%' }}
        >
          <MapController
            photos={photos}
            defaultCenter={defaultCenter}
            defaultZoom={defaultZoom}
          />
          <MyLocationButton />
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
                <div style={{ minWidth: '200px', maxWidth: '300px', color: '#111827' }}>
                  {selectedPhoto.url && (
                    <img
                      src={selectedPhoto.url}
                      alt={selectedPhoto.title || 'Photo'}
                      className="w-full h-40 object-cover rounded mb-2"
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
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
                      {new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(selectedPhoto.takenAt))}
                    </p>
                  )}
                  <a
                    href={selectedPhoto.place_id
                      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPhoto.place || '')}&query_place_id=${selectedPhoto.place_id}`
                      : `https://www.google.com/maps?q=${selectedPhoto.latitude},${selectedPhoto.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12, color: '#4285F4', textDecoration: 'none', display: 'block', marginBottom: 8 }}
                  >
                    📍 {selectedPhoto.place || '지도에서 보기'}
                  </a>

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

        </GoogleMap>
      </APIProvider>

    </div>
  );
}
