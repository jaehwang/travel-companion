'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import CheckinForm from '@/components/CheckinForm';
import { CheckinListItem } from '@/components/CheckinListItem';
import { LocationPicker } from '@/components/LocationPicker';
import Map, { MapPhoto } from '@/components/Map';
import { useGeolocation } from '@/hooks/useGeolocation';
import { createClient } from '@/lib/supabase/client';
import type { Trip, Checkin } from '@/types/database';
import type { User } from '@supabase/supabase-js';

export default function CheckinPage() {
  const [user, setUser] = useState<User | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCheckin, setEditingCheckin] = useState<Checkin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const locationPickerInitial = useRef<{ latitude: number; longitude: number } | null>(null);
  const locationPickerCallback = useRef<((lat: number, lng: number) => void) | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 37.5665, lng: 126.9780 });
  const { getCurrentPosition } = useGeolocation();

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [showDrawer, setShowDrawer] = useState(false);

  // 여행 편집 상태
  const [editingTrip, setEditingTrip] = useState(false);
  const [tripEditTitle, setTripEditTitle] = useState('');
  const [tripEditDescription, setTripEditDescription] = useState('');
  const [tripEditStartDate, setTripEditStartDate] = useState('');
  const [tripEditEndDate, setTripEditEndDate] = useState('');
  const [tripEditIsPublic, setTripEditIsPublic] = useState(false);
  const [tripEditSubmitting, setTripEditSubmitting] = useState(false);

  // 사용자 정보 로드
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  // 여행 목록 로드
  useEffect(() => {
    fetchTrips();
  }, []);

  // 선택된 여행의 체크인 로드
  useEffect(() => {
    if (selectedTripId) {
      fetchCheckins(selectedTripId);
    } else {
      setCheckins([]);
    }
  }, [selectedTripId]);

  // 체크인 변경 시 지도 중심 업데이트
  useEffect(() => {
    if (checkins.length > 0) {
      // 마지막 (가장 최근) 체크인 위치 사용
      const lastCheckin = checkins[0]; // checkins는 최신순이므로 첫 번째가 마지막
      setMapCenter({ lat: lastCheckin.latitude, lng: lastCheckin.longitude });
    } else {
      // 체크인이 없으면 현재 위치 사용
      getCurrentPosition()
        .then((pos) => {
          setMapCenter({ lat: pos.latitude, lng: pos.longitude });
        })
        .catch((err) => {
          console.log('Failed to get current position:', err);
          // 에러 시 서울 유지 (기본값)
        });
    }
  }, [checkins, getCurrentPosition]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/trips');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch trips');
      }

      setTrips(data.trips || []);

      // 첫 번째 여행 자동 선택
      if (data.trips && data.trips.length > 0) {
        setSelectedTripId(data.trips[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch trips:', err);
      setError(err instanceof Error ? err.message : '여행 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCheckins = async (tripId: string) => {
    try {
      const response = await fetch(`/api/checkins?trip_id=${tripId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch checkins');
      }

      setCheckins(data.checkins || []);
    } catch (err) {
      console.error('Failed to fetch checkins:', err);
      setError(err instanceof Error ? err.message : '체크인 목록을 불러오는데 실패했습니다.');
    }
  };

  const handleCheckinSuccess = (checkin: Checkin) => {
    if (editingCheckin) {
      // 수정 모드: 목록에서 해당 항목 교체
      setCheckins((prev) => prev.map((c) => (c.id === checkin.id ? checkin : c)));
    } else {
      // 생성 모드: 목록 맨 앞에 추가
      setCheckins((prev) => [checkin, ...prev]);
    }
    setShowForm(false);
    setEditingCheckin(null);
  };

  const handleEditCheckin = (checkin: Checkin) => {
    setEditingCheckin(checkin);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteCheckin = async (checkinId: string) => {
    try {
      const response = await fetch(`/api/checkins/${checkinId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete checkin');
      }

      setCheckins((prev) => prev.filter((c) => c.id !== checkinId));
    } catch (err) {
      console.error('Failed to delete checkin:', err);
      alert(err instanceof Error ? err.message : '체크인 삭제에 실패했습니다.');
    }
  };

  const handleCreateTrip = async () => {
    const title = prompt('여행 이름을 입력하세요:');
    if (!title || !title.trim()) return;

    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          is_public: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create trip');
      }

      setTrips((prev) => [data.trip, ...prev]);
      setSelectedTripId(data.trip.id);
    } catch (err) {
      console.error('Failed to create trip:', err);
      alert(err instanceof Error ? err.message : '여행 생성에 실패했습니다.');
    }
  };

  const selectedTrip = trips.find((t) => t.id === selectedTripId);

  const handleOpenTripEdit = () => {
    if (!selectedTrip) return;
    setTripEditTitle(selectedTrip.title);
    setTripEditDescription(selectedTrip.description || '');
    setTripEditStartDate(selectedTrip.start_date || '');
    setTripEditEndDate(selectedTrip.end_date || '');
    setTripEditIsPublic(selectedTrip.is_public);
    setEditingTrip(true);
  };

  const handleUpdateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTripId) return;

    setTripEditSubmitting(true);
    try {
      const response = await fetch(`/api/trips/${selectedTripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: tripEditTitle,
          description: tripEditDescription || undefined,
          start_date: tripEditStartDate || undefined,
          end_date: tripEditEndDate || undefined,
          is_public: tripEditIsPublic,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update trip');
      }

      setTrips((prev) => prev.map((t) => (t.id === data.trip.id ? data.trip : t)));
      setEditingTrip(false);
    } catch (err) {
      console.error('Failed to update trip:', err);
      alert(err instanceof Error ? err.message : '여행 수정에 실패했습니다.');
    } finally {
      setTripEditSubmitting(false);
    }
  };

  const handleDeleteTrip = async () => {
    if (!selectedTripId) return;
    if (!window.confirm('이 여행을 삭제하시겠습니까? 여행에 속한 체크인도 모두 삭제됩니다.')) return;

    try {
      const response = await fetch(`/api/trips/${selectedTripId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete trip');
      }

      const remaining = trips.filter((t) => t.id !== selectedTripId);
      setTrips(remaining);
      setSelectedTripId(remaining.length > 0 ? remaining[0].id : '');
      setCheckins([]);
    } catch (err) {
      console.error('Failed to delete trip:', err);
      alert(err instanceof Error ? err.message : '여행 삭제에 실패했습니다.');
    }
  };

  // Checkin을 MapPhoto 형식으로 변환 (시간순 정렬)
  const mapPhotos: MapPhoto[] = checkins
    .map((checkin) => ({
      id: checkin.id,
      url: checkin.photo_url || '',
      latitude: checkin.latitude,
      longitude: checkin.longitude,
      title: checkin.title,
      takenAt: checkin.checked_in_at,
      message: checkin.message,
    }))
    .sort((a, b) => new Date(a.takenAt!).getTime() - new Date(b.takenAt!).getTime());

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setShowDrawer(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
            className="text-gray-900 dark:text-gray-100"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="font-bold text-gray-900 dark:text-gray-100 flex-1 ml-3">
            {selectedTrip ? selectedTrip.title : 'Travel Companion'}
          </span>
          {user && (
            <div className="flex items-center gap-3">
              {user.user_metadata?.avatar_url && (
                <img
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata.name || ''}
                  className="user-avatar"
                  referrerPolicy="no-referrer"
                />
              )}
              <span className="text-sm text-gray-700 hidden sm:block">
                {user.user_metadata?.name || user.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 pb-24">
        <div className="mb-6">

          {/* 여행 편집 폼 */}
          {editingTrip && selectedTrip && (
            <form onSubmit={handleUpdateTrip} className="mt-4 p-4 bg-white border border-gray-200 rounded-lg space-y-3">
              <h3 className="font-semibold text-gray-900">여행 수정</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
                <input
                  type="text"
                  value={tripEditTitle}
                  onChange={(e) => setTripEditTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  value={tripEditDescription}
                  onChange={(e) => setTripEditDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                  <input
                    type="date"
                    value={tripEditStartDate}
                    onChange={(e) => setTripEditStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                  <input
                    type="date"
                    value={tripEditEndDate}
                    onChange={(e) => setTripEditEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="trip-is-public"
                  type="checkbox"
                  checked={tripEditIsPublic}
                  onChange={(e) => setTripEditIsPublic(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="trip-is-public" className="text-sm text-gray-700">공개 여행</label>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={tripEditSubmitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 font-medium"
                >
                  {tripEditSubmitting ? '저장 중...' : '저장'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTrip(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  취소
                </button>
              </div>
            </form>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {selectedTripId && (
          <>

            {/* 체크인 폼 (전체화면 모달) */}
            {showForm && (
              <CheckinForm
                tripId={selectedTripId}
                tripName={selectedTrip?.title}
                userAvatarUrl={user?.user_metadata?.avatar_url}
                editingCheckin={editingCheckin ?? undefined}
                onSuccess={handleCheckinSuccess}
                onCancel={() => {
                  setShowForm(false);
                  setEditingCheckin(null);
                }}
                onOpenLocationPicker={(initial, onSelect) => {
                  locationPickerInitial.current = initial;
                  locationPickerCallback.current = onSelect;
                  setShowLocationPicker(true);
                }}
              />
            )}

            {/* 여행 설명 및 날짜 */}
            {(selectedTrip?.description || selectedTrip?.start_date) && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-700 space-y-1">
                {selectedTrip.description && (
                  <p>{selectedTrip.description}</p>
                )}
                {(selectedTrip.start_date || selectedTrip.end_date) && (
                  <p className="text-gray-500">
                    {selectedTrip.start_date}
                    {selectedTrip.end_date && selectedTrip.end_date !== selectedTrip.start_date
                      ? ` ~ ${selectedTrip.end_date}`
                      : ''}
                  </p>
                )}
              </div>
            )}

            {/* 지도 */}
            <div className="mb-6">
              <Map photos={mapPhotos} height="400px" defaultCenter={mapCenter} />
              {mapPhotos.length === 0 && (
                <p className="mt-2 text-center text-sm text-gray-500">
                  체크인을 추가하면 지도에 위치가 표시됩니다
                </p>
              )}
            </div>

            {/* 체크인 타임라인 */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                기록 <span className="text-base font-normal text-gray-400">{checkins.length}곳</span>
              </h2>

              {checkins.length > 0 ? (
                <div>
                  <div>
                    {checkins.map((checkin, index) => {
                      const currentDate = new Date(checkin.checked_in_at).toDateString();
                      const prevDate = index > 0
                        ? new Date(checkins[index - 1].checked_in_at).toDateString()
                        : null;
                      const showDateHeader = currentDate !== prevDate;

                      const formatDateHeader = (dateStr: string) => {
                        const d = new Date(dateStr);
                        const today = new Date();
                        const yesterday = new Date(today);
                        yesterday.setDate(today.getDate() - 1);
                        if (d.toDateString() === today.toDateString()) return '오늘';
                        if (d.toDateString() === yesterday.toDateString()) return '어제';
                        return new Intl.DateTimeFormat('ko-KR', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        }).format(d);
                      };

                      const isLast = index === checkins.length - 1;

                      return (
                        <div key={checkin.id}>
                          {showDateHeader && (
                            <div className={`flex items-center gap-2 mb-4 ${index > 0 ? 'mt-2' : ''}`}>
                              <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
                                {formatDateHeader(checkin.checked_in_at)}
                              </span>
                              <div className="flex-1 h-px bg-gray-200" />
                            </div>
                          )}
                          <CheckinListItem
                            checkin={checkin}
                            onEdit={handleEditCheckin}
                            onDelete={handleDeleteCheckin}
                          />
                          {!isLast && (
                            <hr className="my-6 border-gray-200" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-4xl mb-3">🗺️</p>
                  <p className="text-gray-500 font-medium mb-1">아직 체크인이 없습니다</p>
                  <p className="text-gray-400 text-sm">
                    아래 + 버튼을 눌러 첫 체크인을 기록해보세요!
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {!selectedTripId && trips.length === 0 && (
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <p className="text-gray-500 text-lg mb-2">여행이 없습니다</p>
            <p className="text-gray-400 text-sm mb-4">
              먼저 여행을 만들어주세요!
            </p>
            <button
              onClick={handleCreateTrip}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              + 첫 여행 만들기
            </button>
          </div>
        )}
      </div>
      {/* 왼쪽 드로어 */}
      {mounted && showDrawer && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }}>
          {/* 배경 오버레이 */}
          <div
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowDrawer(false)}
          />
          {/* 드로어 패널 */}
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '80%', maxWidth: '320px', backgroundColor: 'white', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {/* 새 여행 버튼 */}
            <button
              onClick={() => { handleCreateTrip(); setShowDrawer(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 20px', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '1px solid #e5e7eb', background: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: '600', color: '#111827', width: '100%', textAlign: 'left' }}
            >
              <span style={{ fontSize: '18px' }}>+</span> 새 여행 만들기
            </button>

            {/* 여행 목록 */}
            <div style={{ padding: '12px 0' }}>
              {trips.length === 0 ? (
                <p style={{ padding: '12px 20px', color: '#9ca3af', fontSize: '14px' }}>여행이 없습니다</p>
              ) : (
                trips.map((trip) => (
                  <div
                    key={trip.id}
                    style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', backgroundColor: trip.id === selectedTripId ? '#f0fdf4' : 'transparent' }}
                  >
                    <button
                      onClick={() => { setSelectedTripId(trip.id); setEditingTrip(false); setShowDrawer(false); }}
                      style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '15px', fontWeight: trip.id === selectedTripId ? '600' : '400', color: trip.id === selectedTripId ? '#16a34a' : '#111827' }}
                    >
                      {trip.title}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedTripId(trip.id); handleOpenTripEdit(); setShowDrawer(false); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', color: '#9ca3af', fontSize: '13px' }}
                    >
                      수정
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedTripId(trip.id); handleDeleteTrip(); setShowDrawer(false); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', color: '#ef4444', fontSize: '13px' }}
                    >
                      삭제
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 하단 고정 바 */}
      {mounted && selectedTripId && !showForm && createPortal(
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '64px', zIndex: 9999 }}>
          <button
            onClick={() => {
              setEditingCheckin(null);
              setShowForm(true);
            }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6b7280', padding: '8px 24px', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="currentColor" strokeWidth={1.8} />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8M8 12h8" />
            </svg>
            <span style={{ fontSize: '12px', marginTop: '2px' }}>체크인</span>
          </button>
        </div>,
        document.body
      )}

      {showLocationPicker && (
        <LocationPicker
          initialLocation={locationPickerInitial.current || undefined}
          onLocationSelect={(lat, lng) => {
            locationPickerCallback.current?.(lat, lng);
            setShowLocationPicker(false);
          }}
          onClose={() => setShowLocationPicker(false)}
        />
      )}
    </div>
  );
}
