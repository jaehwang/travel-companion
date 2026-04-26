'use client';

import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
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

interface MapInfoWindowProps {
  photo: MapPhoto;
  photos: MapPhoto[];
  onClose: () => void;
  onSelect: (photo: MapPhoto) => void;
}

function MapInfoWindow({ photo, photos, onClose, onSelect }: MapInfoWindowProps) {
  const idx = photos.findIndex(p => p.id === photo.id);
  const hasPrev = idx > 0;
  const hasNext = idx < photos.length - 1;
  return (
    <InfoWindow position={{ lat: photo.latitude, lng: photo.longitude }} onCloseClick={onClose}>
      <div style={{ minWidth: '200px', maxWidth: '300px', color: '#111827' }}>
        {photo.url && (
          /* Google Maps InfoWindow 내부이므로 next/image 사용 불가 */
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={photo.url} alt={photo.title || 'Photo'} className="w-full h-40 object-cover rounded mb-2" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        )}
        {photo.title && <p className="font-semibold mb-1">{photo.title}</p>}
        {photo.message && <p className="text-sm text-gray-700 mb-2">{photo.message}</p>}
        {photo.takenAt && (
          <p className="text-xs text-gray-600 mb-1">
            {new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(photo.takenAt))}
          </p>
        )}
        <a href={photo.place_id ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(photo.place || '')}&query_place_id=${photo.place_id}` : `https://www.google.com/maps?q=${photo.latitude},${photo.longitude}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#4285F4', textDecoration: 'none', display: 'block', marginBottom: 8 }}>
          <MapPin size={12} style={{ display: 'inline', marginRight: 2 }} />{photo.place || '지도에서 보기'}
        </a>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 12, paddingTop: 8, borderTop: '1px solid #e5e7eb' }}>
          <button onClick={() => hasPrev && onSelect(photos[idx - 1])} disabled={!hasPrev} style={{ flex: 1, padding: '6px 12px', fontSize: 12, fontWeight: 500, backgroundColor: hasPrev ? '#4285F4' : '#e5e7eb', color: hasPrev ? 'white' : '#9ca3af', border: 'none', borderRadius: 4, cursor: hasPrev ? 'pointer' : 'not-allowed' }}>← 이전</button>
          <span style={{ fontSize: 12, color: '#6b7280', alignSelf: 'center', whiteSpace: 'nowrap' }}>{idx + 1} / {photos.length}</span>
          <button onClick={() => hasNext && onSelect(photos[idx + 1])} disabled={!hasNext} style={{ flex: 1, padding: '6px 12px', fontSize: 12, fontWeight: 500, backgroundColor: hasNext ? '#4285F4' : '#e5e7eb', color: hasNext ? 'white' : '#9ca3af', border: 'none', borderRadius: 4, cursor: hasNext ? 'pointer' : 'not-allowed' }}>다음 →</button>
        </div>
        {photo.url && <a href={photo.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-2 block text-center">원본 보기 →</a>}
      </div>
    </InfoWindow>
  );
}

// 지도 중심/줌 자동 조정을 담당하는 내부 컴포넌트.
// useMap() 훅은 <APIProvider> 트리 안에서만 유효한 context를 참조하기 때문에,
// Map 컴포넌트 본체(APIProvider 바깥)에서 직접 호출하면 null을 반환한다.
// 해결책으로 이 컴포넌트를 <GoogleMap> 자식으로 배치하여, APIProvider 안에서만 실행되도록 분리.
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
      // 여러 마커가 모두 화면에 들어오도록 경계 계산 후 자동 줌 조정
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
          // controlled center/zoom 대신 default* 사용.
          // controlled 방식(center/zoom prop)을 쓰면 React state와 지도를 항상 동기화해야 하는데,
          // 사용자가 드래그/핀치로 지도를 움직일 때마다 state가 갱신되어야 하고,
          // 그렇지 않으면 리렌더링 시 지도가 원래 위치로 튀어 돌아온다.
          // default* 는 초기값만 지정하는 uncontrolled 방식이므로 이 문제가 없다.
          defaultCenter={defaultCenter}
          defaultZoom={defaultZoom}
          mapId="f61fd161984b7ef0b0aaa09b"
          // 모바일에서 스크롤(페이지 이동)과 지도 패닝이 충돌하지 않도록 "greedy" 설정.
          // 기본값("cooperative")은 단일 손가락 스와이프를 페이지 스크롤로 처리하기 때문에
          // 지도를 움직이려면 두 손가락이 필요해 UX가 불편하다.
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
          {selectedPhoto && (
            <MapInfoWindow
              photo={selectedPhoto}
              photos={photos}
              onClose={() => setSelectedPhoto(null)}
              onSelect={setSelectedPhoto}
            />
          )}

        </GoogleMap>
      </APIProvider>

    </div>
  );
}
