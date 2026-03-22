'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Zap, MapPin } from 'lucide-react';

interface NearbyCheckin {
  id: string;
  trip_id: string;
  trip_title: string;
  title?: string;
  place?: string;
  category?: string;
  checked_in_at: string;
  distance: number;
}

interface QuickCheckinModalProps {
  onClose: () => void;
  onCheckedIn?: (checkin: NearbyCheckin) => void;
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

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export default function QuickCheckinModal({ onClose, onCheckedIn }: QuickCheckinModalProps) {
  const [checkins, setCheckins] = useState<NearbyCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
      );
      const { latitude: lat, longitude: lng } = pos.coords;
      const res = await fetch(`/api/checkins/nearby?lat=${lat}&lng=${lng}&radius=1000`);
      if (!res.ok) throw new Error('조회 실패');
      const data = await res.json();
      setCheckins(data.checkins ?? []);
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        setError('위치 권한이 필요합니다.');
      } else {
        setError('근처 장소를 불러오지 못했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCheckin = async (item: NearbyCheckin) => {
    setCheckingIn(item.id);
    try {
      const res = await fetch(`/api/checkins/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checked_in_at: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error();
      onCheckedIn?.({ ...item, checked_in_at: new Date().toISOString() });
      onClose();
    } catch {
      setError('체크인에 실패했습니다.');
    } finally {
      setCheckingIn(null);
    }
  };

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10002,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      {/* 배경 */}
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }}
      />

      {/* 시트 */}
      <div style={{
        position: 'relative',
        background: '#FFFFFF',
        borderRadius: '20px 20px 0 0',
        maxHeight: '70vh',
        display: 'flex', flexDirection: 'column',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        {/* 핸들 */}
        <div style={{
          width: 40, height: 4, borderRadius: 2,
          background: '#E5E7EB',
          margin: '12px auto 4px',
          flexShrink: 0,
        }} />

        {/* 헤더 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px 14px',
          borderBottom: '1px solid #F3F0EB',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: '#1F2937', display: 'flex', alignItems: 'center', gap: 6 }}><Zap size={16} color="#FF6B47" />빠른 체크인</span>
          <button
            onClick={onClose}
            style={{
              padding: '6px 14px', borderRadius: 9999,
              background: '#F3F0EB', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, color: '#6B7280',
            }}
          >
            닫기
          </button>
        </div>

        {/* 본문 */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📡</div>
              <p style={{ fontSize: 14 }}>근처 장소 찾는 중...</p>
            </div>
          ) : error ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: '#DC2626', marginBottom: 12 }}>{error}</p>
              <button
                onClick={load}
                style={{
                  padding: '8px 20px', borderRadius: 9999,
                  background: '#F97316', color: '#fff',
                  border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: 700,
                }}
              >
                다시 시도
              </button>
            </div>
          ) : checkins.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><MapPin size={40} color="#C4B49A" /></div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#4B5563', marginBottom: 6 }}>
                근처에 등록된 장소가 없습니다
              </p>
              <p style={{ fontSize: 13, color: '#9CA3AF' }}>
                여행을 &quot;자주 가는 곳&quot;으로 설정하고 체크인을 추가해보세요
              </p>
            </div>
          ) : (() => {
            // 여행별 그룹핑 (API 정렬: checked_in_at DESC → 그룹 내 첫 번째 = 마지막 체크인)
            const groups = checkins.reduce<{ tripId: string; tripTitle: string; items: NearbyCheckin[] }[]>(
              (acc, c) => {
                const g = acc.find(g => g.tripId === c.trip_id);
                if (g) { g.items.push(c); } else { acc.push({ tripId: c.trip_id, tripTitle: c.trip_title, items: [c] }); }
                return acc;
              }, []
            );
            return (
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {groups.map(group => {
                  const current = group.items[0]; // 가장 최근 체크인
                  return (
                    <div key={group.tripId}>
                      {/* 여행 헤더 + 현재 상태 */}
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginBottom: 8, paddingBottom: 8,
                        borderBottom: '1px solid #F3F0EB',
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#6B7280' }}>
                          {group.tripTitle}
                        </span>
                        <span style={{ fontSize: 12, color: '#F97316', fontWeight: 600 }}>
                          현재: {current.title || current.place || '(이름 없음)'} · {formatRelativeTime(current.checked_in_at)}
                        </span>
                      </div>
                      {/* 체크인 목록 */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {group.items.map(item => {
                          const isCurrent = item.id === current.id;
                          const isLoading = checkingIn === item.id;
                          return (
                            <div
                              key={item.id}
                              style={{
                                display: 'flex', alignItems: 'center',
                                background: isCurrent ? '#FFF7ED' : '#F9FAFB',
                                borderRadius: 12,
                                padding: '12px 14px',
                                border: isCurrent ? '1.5px solid #FED7AA' : '1px solid transparent',
                              }}
                            >
                              <div style={{ flex: 1, marginRight: 12 }}>
                                <p style={{ fontSize: 14, fontWeight: 700, color: '#1F2937', marginBottom: 2 }}>
                                  {item.title || item.place || '(이름 없음)'}
                                </p>
                                <p style={{ fontSize: 12, color: '#9CA3AF' }}>
                                  {formatDistance(item.distance)}
                                </p>
                              </div>
                              <button
                                onClick={() => handleCheckin(item)}
                                disabled={!!checkingIn}
                                style={{
                                  padding: '7px 14px', borderRadius: 10,
                                  background: isCurrent ? '#F97316' : '#E5E7EB',
                                  color: isCurrent ? '#fff' : '#374151',
                                  border: 'none', cursor: checkingIn ? 'not-allowed' : 'pointer',
                                  fontSize: 13, fontWeight: 700,
                                  opacity: checkingIn && !isLoading ? 0.5 : 1,
                                  minWidth: 60,
                                }}
                              >
                                {isLoading ? '...' : isCurrent ? '여기!' : '체크인'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>
    </div>,
    document.body
  );
}
