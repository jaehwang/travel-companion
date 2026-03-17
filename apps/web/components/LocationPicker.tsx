'use client';

/**
 * LocationPicker - 지도 위치 선택 모달
 *
 * createPortal(content, document.body) 패턴을 사용하는 이유:
 *   Google Maps JavaScript SDK는 초기화 시 페이지 루트 요소에 `transform` CSS를 주입한다.
 *   CSS `transform`이 적용된 조상 요소는 새로운 stacking context를 만들기 때문에,
 *   그 하위의 `position: fixed` 요소는 뷰포트가 아닌 해당 transform 요소를 기준으로 배치된다.
 *   CheckinForm 내부(Google Maps context 안)에서 fixed 모달을 렌더링하면
 *   iOS Safari에서 지도가 화면 밖으로 밀려나거나 잘린다.
 *   createPortal로 document.body에 직접 붙이면 transform context를 완전히 우회한다.
 *
 * body { overflow: hidden } 금지:
 *   배경 스크롤을 막기 위해 body에 overflow hidden을 주면,
 *   iOS Safari에서 `position: fixed`가 body를 기준으로 동작하여
 *   지도가 스크롤된 body 위치 기준으로 렌더링된다. 즉 지도가 뷰포트 밖으로 나간다.
 *   따라서 스크롤 차단이 필요해도 body 스타일을 건드리면 안 된다.
 */

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { APIProvider, Map as GoogleMap, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import MyLocationButton from '@/components/MyLocationButton';
import { usePlaceSearch } from '@/components/checkin-form/hooks/usePlaceSearch';

export interface SelectedPlace {
  name: string;
  place_id: string;
}

interface LocationPickerProps {
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
  onLocationSelect: (latitude: number, longitude: number, place?: SelectedPlace) => void;
  onClose?: () => void;
}

// ─── 내부 헬퍼 컴포넌트 ───────────────────────────────────────────────────────

/**
 * 지도가 마운트된 직후 현재 위치로 pan하는 컴포넌트.
 * initialLocation이 없을 때만 사용한다.
 * useMap() 훅을 사용해야 해서 GoogleMap 자식으로 위치시켰다.
 */
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
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [map]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

/**
 * 장소 검색 결과 선택 시 지도를 해당 위치로 이동시키는 컴포넌트.
 * center prop이 변경될 때마다 panTo를 호출한다.
 */
function MapPanner({ center }: { center: { lat: number; lng: number } | null }) {
  const map = useMap();

  useEffect(() => {
    if (map && center) map.panTo(center);
  }, [map, center]);

  return null;
}

// ─── LocationPicker 본체 ──────────────────────────────────────────────────────

export function LocationPicker({
  initialLocation,
  onLocationSelect,
  onClose,
}: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation
      ? { lat: initialLocation.latitude, lng: initialLocation.longitude }
      : null
  );
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);
  const [loadingPlace, setLoadingPlace] = useState(false);
  const [panTo, setPanTo] = useState<{ lat: number; lng: number } | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const defaultCenter = initialLocation
    ? { lat: initialLocation.latitude, lng: initialLocation.longitude }
    : { lat: 37.5665, lng: 126.9780 };

  const placeSearch = usePlaceSearch({
    isActive: true,
    onPlaceSelected: (lat, lng, name, place_id) => {
      setSelectedLocation({ lat, lng });
      setSelectedPlace({ name, place_id });
      setPanTo({ lat, lng });
      placeSearch.reset();
    },
  });

  /**
   * 지도 클릭 핸들러
   *
   * Google Maps는 클릭 이벤트에서 두 가지 경우를 반환한다:
   *   1. placeId가 있는 경우: 지도 위에 표시된 POI(관심 지점)를 클릭한 것.
   *      /api/places/details를 호출해 장소 이름과 정확한 좌표를 가져온다.
   *   2. placeId가 없는 경우: 빈 땅을 클릭한 것.
   *      latLng에서 좌표를 직접 읽어 위치만 설정하고, 장소 정보는 null로 초기화한다.
   *
   * latLng.lat/lng은 함수일 수도 있고 숫자일 수도 있어 양쪽을 모두 처리한다.
   * (vis.gl/react-google-maps 버전에 따라 다름)
   */
  const handleMapClick = useCallback(async (e: any) => {
    const placeId = e.detail?.placeId;
    if (placeId) {
      setLoadingPlace(true);
      try {
        const res = await fetch(`/api/places/details?place_id=${placeId}`);
        const data = await res.json();
        if (res.ok) {
          setSelectedLocation({ lat: data.place.latitude, lng: data.place.longitude });
          setSelectedPlace({ name: data.place.name || '', place_id: placeId });
        }
      } finally {
        setLoadingPlace(false);
      }
    } else if (e.detail?.latLng) {
      const lat = typeof e.detail.latLng.lat === 'function' ? e.detail.latLng.lat() : e.detail.latLng.lat;
      const lng = typeof e.detail.latLng.lng === 'function' ? e.detail.latLng.lng() : e.detail.latLng.lng;
      setSelectedLocation({ lat, lng });
      setSelectedPlace(null);
    }
  }, []);

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation.lat, selectedLocation.lng, selectedPlace ?? undefined);
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

  /**
   * createPortal로 document.body에 직접 붙인다.
   * 이유: 파일 상단 주석 참조.
   * - Google Maps transform context 우회
   * - iOS Safari fixed 위치 문제 방지
   * - mounted 체크 불필요: 버튼 클릭 후 렌더링되므로 항상 클라이언트 환경
   */
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
              <p className="text-sm text-gray-600">장소를 검색하거나 지도를 탭하세요</p>
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

          {/* 장소 검색창 */}
          <div className="relative mb-3">
            <input
              type="text"
              value={placeSearch.searchQuery}
              onChange={(e) => placeSearch.setSearchQuery(e.target.value)}
              placeholder="장소 검색..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            />
            {placeSearch.searchingPlaces && (
              <span className="absolute right-3 top-2.5 text-xs text-gray-400">검색 중...</span>
            )}
            {placeSearch.predictions.length > 0 && (
              <ul className="absolute top-full left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
                {placeSearch.predictions.map((pred) => (
                  <li
                    key={pred.place_id}
                    onClick={() => placeSearch.handleSelectPlace(pred)}
                    className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {pred.structured_formatting.main_text}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {pred.structured_formatting.secondary_text}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 버튼 */}
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
              disabled={!selectedLocation || loadingPlace}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {loadingPlace ? '장소 불러오는 중...' : '위치 확정'}
            </button>
          </div>
        </div>

        {/* 지도 영역 */}
        <div className="relative w-full flex-1 md:flex-none md:h-[500px] min-h-[300px]">
          <APIProvider apiKey={apiKey}>
            <GoogleMap
              defaultCenter={selectedLocation || defaultCenter}
              defaultZoom={13}
              mapId="f61fd161984b7ef0b0aaa09b"
              gestureHandling="greedy"
              style={{ width: '100%', height: '100%' }}
              onClick={handleMapClick}
            >
              {/* initialLocation이 없을 때만 현재 위치로 자동 이동 */}
              {!initialLocation && (
                <CenterOnCurrentLocation
                  onCenter={(lat, lng) => setSelectedLocation({ lat, lng })}
                />
              )}
              <MapPanner center={panTo} />
              <MyLocationButton
                onLocationFound={(lat, lng) => {
                  setSelectedLocation({ lat, lng });
                  setSelectedPlace(null);
                }}
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
                      // 드래그로 미세 조정 시 장소 이름은 더 이상 유효하지 않으므로 초기화
                      setSelectedPlace(null);
                    }
                  }}
                >
                  <span style={{ fontSize: 32, lineHeight: 1, display: 'block', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>📍</span>
                </AdvancedMarker>
              )}
            </GoogleMap>
          </APIProvider>

          {/* 선택된 위치 오버레이 (지도 위에 표시, 지도 조작은 방해하지 않음) */}
          {selectedLocation && (
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/90 border-t border-blue-200 pointer-events-none">
              {selectedPlace ? (
                <>
                  <p className="text-sm font-medium text-blue-800">📍 {selectedPlace.name}</p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-blue-800">
                    📍 {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    💡 마커를 드래그하여 미세 조정 가능
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
