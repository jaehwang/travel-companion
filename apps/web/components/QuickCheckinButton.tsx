'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QuickCheckinModal from './QuickCheckinModal';

interface NearbyCheckin {
  id: string;
  trip_title: string;
  title?: string;
  place?: string;
  checked_in_at: string;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

export default function QuickCheckinButton() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [current, setCurrent] = useState<NearbyCheckin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) { setLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lng } = pos.coords;
          const res = await fetch(`/api/checkins/nearby?lat=${lat}&lng=${lng}&radius=1000`);
          if (res.ok) {
            const data = await res.json();
            setCurrent(data.checkins?.[0] ?? null);
          }
        } catch { /* silent */ } finally {
          setLoading(false);
        }
      },
      () => setLoading(false),
      { timeout: 8000 }
    );
  }, []);

  const subtitle = loading
    ? '현재 위치 확인 중...'
    : current
      ? `${current.trip_title}: ${current.title || current.place || '(이름 없음)'} · ${formatRelativeTime(current.checked_in_at)}`
      : '자주 가는 곳을 빠르게 기록';

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          gap: 12,
          padding: '14px 16px',
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1.5px solid #FED7AA',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(249,115,22,0.10)',
          marginBottom: 24,
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 24 }}>⚡</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#1F2937', marginBottom: 2 }}>빠른 체크인</p>
          <p style={{ fontSize: 12, color: current ? '#F97316' : '#9CA3AF' }}>{subtitle}</p>
        </div>
        <span style={{ fontSize: 20, color: '#D1D5DB', fontWeight: 300 }}>›</span>
      </button>

      {showModal && (
        <QuickCheckinModal
          onClose={() => setShowModal(false)}
          onCheckedIn={(checkin) => {
            setCurrent({
              id: checkin.id,
              trip_title: checkin.trip_title,
              title: checkin.title,
              place: checkin.place,
              checked_in_at: checkin.checked_in_at,
            });
            router.refresh();
          }}
        />
      )}
    </>
  );
}
