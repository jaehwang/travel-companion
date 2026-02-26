'use client';

import { useEffect } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

interface MyLocationButtonProps {
  /** 위치를 찾은 후 추가 동작이 필요한 경우 (예: LocationPicker에서 마커 이동) */
  onLocationFound?: (lat: number, lng: number) => void;
}

export default function MyLocationButton({ onLocationFound }: MyLocationButtonProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const button = document.createElement('div');
    button.style.cssText = [
      'margin:10px',
      'background:white',
      'border-radius:2px',
      'box-shadow:0 2px 6px rgba(0,0,0,.3)',
      'width:40px',
      'height:40px',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'cursor:pointer',
    ].join(';');
    button.title = '현재 위치로 이동';
    // Material Design "my_location" 아이콘
    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#666">
      <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
    </svg>`;

    button.addEventListener('click', () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          map.panTo({ lat, lng });
          map.setZoom(15);
          onLocationFound?.(lat, lng);
        },
        () => {}, // 권한 거부 등 실패 시 무시
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });

    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(button);

    return () => {
      const controls = map.controls[google.maps.ControlPosition.RIGHT_BOTTOM];
      const idx = controls.getArray().indexOf(button);
      if (idx > -1) controls.removeAt(idx);
    };
  }, [map]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
