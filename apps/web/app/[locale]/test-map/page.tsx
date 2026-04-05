'use client';

import { useState } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';

export default function TestMapPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number } | null>(null);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">지도 클릭 테스트</h1>
      <p className="mb-4">지도를 클릭하면 마커가 생성되어야 합니다</p>

      {clickedLocation && (
        <p className="mb-4 text-green-600">
          클릭 위치: {clickedLocation.lat.toFixed(6)}, {clickedLocation.lng.toFixed(6)}
        </p>
      )}

      <div style={{ width: '100%', height: '500px' }}>
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={{ lat: 37.5665, lng: 126.9780 }}
            defaultZoom={12}
            mapId="f61fd161984b7ef0b0aaa09b"
            gestureHandling="greedy"
            onClick={(e) => {
              console.log('CLICK EVENT:', e);
              alert('지도 클릭됨!');
            }}
          >
            {clickedLocation && (
              <AdvancedMarker position={clickedLocation} />
            )}
          </Map>
        </APIProvider>
      </div>
    </div>
  );
}
