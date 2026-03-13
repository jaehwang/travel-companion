'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CheckinForm from '@/components/checkin-form/CheckinForm';
import { LocationPicker } from '@/components/LocationPicker';
import Map, { MapPhoto } from '@/components/Map';
import { useGeolocation } from '@/hooks/useGeolocation';
import { createClient } from '@/lib/supabase/client';
import type { Trip, Checkin } from '@/types/database';
import type { User } from '@supabase/supabase-js';
import { useTrips } from './hooks/useTrips';
import { useCheckins } from './hooks/useCheckins';
import { useTripTagline } from './hooks/useTripTagline';
import SideDrawer from './components/SideDrawer';
import TripFormModal from '@/components/TripFormModal';
import CheckinTimeline from './components/CheckinTimeline';
import BottomBar from './components/BottomBar';
import TodayCalendar from './components/TodayCalendar';

function formatTripDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  const date = isDateOnly
    ? (() => { const [y, m, d] = dateStr.split('-').map(Number); return new Date(y, m - 1, d); })()
    : new Date(dateStr);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  }).format(date);
}

function CheckinPageInner() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [selectedTripId, setSelectedTripId] = useState(searchParams.get('trip_id') ?? '');
  const [showForm, setShowForm] = useState(false);
  const [editingCheckin, setEditingCheckin] = useState<Checkin | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showTripForm, setShowTripForm] = useState(false);
  const [tripFormMode, setTripFormMode] = useState<'create' | 'edit'>('create');
  const [editingTrip, setEditingTrip] = useState<Trip | undefined>();
  const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.978 });
  const [mounted, setMounted] = useState(false);
  const [applyingPlace, setApplyingPlace] = useState(false);
  const locationPickerInitial = useRef<{ latitude: number; longitude: number } | null>(null);
  const locationPickerCallback = useRef<((lat: number, lng: number, place?: { name: string; place_id: string }) => void) | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const { trips, loading, error: tripsError, createTrip, updateTrip, deleteTrip } = useTrips();
  const { checkins, error: checkinsError, addCheckin, updateCheckin, deleteCheckin, reloadCheckins } = useCheckins(selectedTripId);
  const { getCurrentPosition } = useGeolocation();

  // 사용자 정보
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  // 첫 번째 여행 자동 선택 (URL에 trip_id 없을 때만)
  useEffect(() => {
    if (trips.length > 0 && !selectedTripId) {
      setSelectedTripId(trips[0].id);
    }
  }, [trips, selectedTripId]);

  // 체크인 변경 시 지도 중심 업데이트
  useEffect(() => {
    if (checkins.length > 0) {
      const last = checkins[0];
      setMapCenter({ lat: last.latitude, lng: last.longitude });
    } else {
      getCurrentPosition()
        .then((pos) => setMapCenter({ lat: pos.latitude, lng: pos.longitude }))
        .catch(() => {});
    }
  }, [checkins, getCurrentPosition]);

  const selectedTrip = trips.find((t) => t.id === selectedTripId);
  const { tagline, loading: taglineLoading, error: taglineError, refresh: refreshTagline } = useTripTagline(selectedTrip);

  const mapPhotos: MapPhoto[] = checkins
    .map((c) => ({
      id: c.id,
      url: c.photo_url || '',
      latitude: c.latitude,
      longitude: c.longitude,
      title: c.title,
      place: c.place,
      place_id: c.place_id,
      takenAt: c.checked_in_at,
      message: c.message,
    }))
    .sort((a, b) => new Date(a.takenAt!).getTime() - new Date(b.takenAt!).getTime());

  const handleCheckinSuccess = (checkin: Checkin) => {
    if (editingCheckin) {
      updateCheckin(checkin);
    } else {
      addCheckin(checkin);
    }
    refreshTagline();
    setShowForm(false);
    setEditingCheckin(null);
  };

  const handleDeleteCheckin = async (id: string) => {
    try {
      await deleteCheckin(id);
      refreshTagline();
    } catch (err) {
      alert(err instanceof Error ? err.message : '체크인 삭제에 실패했습니다.');
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!window.confirm('이 여행을 삭제하시겠습니까? 여행에 속한 체크인도 모두 삭제됩니다.')) return;
    try {
      const remaining = trips.filter((t) => t.id !== tripId);
      await deleteTrip(tripId);
      setSelectedTripId(remaining.length > 0 ? remaining[0].id : '');
    } catch (err) {
      alert(err instanceof Error ? err.message : '여행 삭제에 실패했습니다.');
    }
  };

  const handleBulkApplyPlace = async () => {
    if (!selectedTrip?.place || checkins.length === 0) return;
    const confirmed = window.confirm(
      `"${selectedTrip.place}"을(를) 이 여행의 모든 체크인(${checkins.length}개)에 적용합니다. 기존 장소가 덮어씌워집니다.`
    );
    if (!confirmed) return;
    setApplyingPlace(true);
    try {
      const res = await fetch(`/api/trips/${selectedTrip.id}/apply-place`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to apply place');
      }
      await reloadCheckins();
      alert('장소가 모든 체크인에 적용되었습니다.');
    } catch (err) {
      alert(err instanceof Error ? err.message : '일괄 적용에 실패했습니다.');
    } finally {
      setApplyingPlace(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    location.href = '/login';
  };

  if (loading) {
    return (
      <div className="tc-page-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="tc-plane" style={{ fontSize: 44, marginBottom: 16 }}>✈️</div>
          <p style={{ fontSize: 14, color: 'var(--tc-warm-mid)' }}>불러오는 중...</p>
        </div>
      </div>
    );
  }

  const displayError = tripsError || checkinsError;

  return (
    <div className="tc-page-bg" style={{ minHeight: '100vh' }}>
      {/* 헤더 */}
      <header className="tc-header">
        <div style={{ maxWidth: '100%', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* 햄버거 */}
          <button
            onClick={() => setShowDrawer(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 6,
              color: 'var(--tc-warm-dark)',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* 여행 제목 */}
          <span style={{
            flex: 1,
            fontSize: 16,
            fontWeight: 800,
            color: 'var(--tc-warm-dark)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            letterSpacing: '-0.01em',
          }}>
            {selectedTrip ? selectedTrip.title : 'Travel Companion'}
          </span>

          {/* 유저 영역 */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              {user.user_metadata?.avatar_url && (
                <img
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata.name || ''}
                  className="user-avatar"
                  referrerPolicy="no-referrer"
                />
              )}
              <button
                onClick={handleLogout}
                style={{
                  fontSize: 13,
                  color: 'var(--tc-warm-mid)',
                  background: 'none',
                  border: '1.5px solid var(--tc-dot)',
                  borderRadius: 9999,
                  padding: '5px 14px',
                  cursor: 'pointer',
                }}
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 본문 */}
      <div
        style={{
          maxWidth: '100%',
          padding: '20px 16px',
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* 에러 */}
        {displayError && (
          <div style={{
            marginBottom: 16,
            padding: '12px 16px',
            background: '#FFF5F5',
            border: '1px solid #fca5a5',
            borderRadius: 12,
          }}>
            <p style={{ color: '#DC2626', fontSize: 14 }}>{displayError}</p>
          </div>
        )}

        {selectedTripId && (
          <>
            {showForm && (
              <CheckinForm
                tripId={selectedTripId}
                tripName={selectedTrip?.title}
                userAvatarUrl={user?.user_metadata?.avatar_url}
                editingCheckin={editingCheckin ?? undefined}
                initialPlace={editingCheckin ? undefined : selectedTrip?.place}
                initialPlaceId={editingCheckin ? undefined : selectedTrip?.place_id}
                initialLatitude={editingCheckin ? undefined : selectedTrip?.latitude}
                initialLongitude={editingCheckin ? undefined : selectedTrip?.longitude}
                onSuccess={handleCheckinSuccess}
                onCancel={() => { setShowForm(false); setEditingCheckin(null); }}
                onOpenLocationPicker={(initial, onSelect) => {
                  locationPickerInitial.current = initial;
                  locationPickerCallback.current = onSelect;
                  setShowLocationPicker(true);
                }}
              />
            )}

            {/* 여행 설명 및 날짜 */}
            {(() => {
              const earliest = checkins.length > 0
                ? [...checkins].sort((a, b) => new Date(a.checked_in_at).getTime() - new Date(b.checked_in_at).getTime())[0]
                : null;
              const startSrc = selectedTrip?.start_date || earliest?.checked_in_at || null;
              const endSrc = selectedTrip?.end_date || null;
              const hasPlace = !!selectedTrip?.place;
              if (!selectedTrip?.description && !startSrc && !hasPlace) return null;
              return (
                <div style={{
                  marginBottom: 16,
                  padding: '12px 16px',
                  background: 'var(--tc-card-bg)',
                  borderRadius: 14,
                  boxShadow: '0 2px 8px rgba(45,36,22,0.06)',
                  borderLeft: '4px solid #FF6B47',
                }}>
                  {selectedTrip?.description && (
                    <p style={{ fontSize: 14, color: 'var(--tc-warm-dark)', marginBottom: startSrc ? 4 : 0 }}>
                      {selectedTrip.description}
                    </p>
                  )}
                  {startSrc && (
                    <p style={{ fontSize: 12, color: 'var(--tc-warm-mid)', marginBottom: hasPlace ? 4 : 0 }}>
                      📅 {formatTripDate(startSrc)}
                      {endSrc && endSrc !== selectedTrip?.start_date ? ` ~ ${formatTripDate(endSrc)}` : ''}
                    </p>
                  )}
                  {hasPlace && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p style={{ fontSize: 12, color: 'var(--tc-warm-mid)', flex: 1 }}>
                        📍 {selectedTrip.place}
                      </p>
                      {checkins.length > 0 && (
                        <button
                          onClick={handleBulkApplyPlace}
                          disabled={applyingPlace}
                          title="체크인 장소 일괄 적용"
                          style={{
                            width: 28, height: 28, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--tc-warm-mid)',
                            background: 'var(--tc-card-empty)',
                            border: '1px solid var(--tc-dot)',
                            borderRadius: 8,
                            cursor: applyingPlace ? 'not-allowed' : 'pointer',
                            opacity: applyingPlace ? 0.4 : 1,
                            transition: 'opacity 0.2s',
                          }}
                        >
                          {applyingPlace ? (
                            <div style={{
                              width: 12, height: 12,
                              border: '2px solid var(--tc-warm-mid)',
                              borderTopColor: 'transparent',
                              borderRadius: '50%',
                              animation: 'spin 0.8s linear infinite',
                            }} />
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                              <circle cx="12" cy="9" r="2.5"/>
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {selectedTrip && (
              <div style={{
                marginBottom: 16,
                padding: '12px 16px',
                background: 'var(--tc-card-bg)',
                borderRadius: 14,
                boxShadow: '0 2px 8px rgba(45,36,22,0.06)',
                borderLeft: '4px solid rgba(255,107,71,0.45)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: 0,
                      fontSize: 14,
                      lineHeight: 1.6,
                      fontWeight: 500,
                      fontStyle: 'italic',
                      color: 'var(--tc-warm-dark)',
                    }}>
                      {!taglineLoading && (tagline || taglineError) && <span style={{ marginRight: 4, fontStyle: 'normal' }}>✨</span>}
                      {taglineLoading ? '두근, 두근...' : (tagline || taglineError)}
                    </p>
                  </div>
                  <button
                    onClick={refreshTagline}
                    disabled={taglineLoading}
                    title="문구 다시 만들기"
                    style={{
                      width: 28,
                      height: 28,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--tc-warm-mid)',
                      background: 'var(--tc-card-empty)',
                      border: '1px solid var(--tc-dot)',
                      borderRadius: 8,
                      cursor: taglineLoading ? 'not-allowed' : 'pointer',
                      opacity: taglineLoading ? 0.4 : 1,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {taglineLoading ? (
                      <div style={{
                        width: 12,
                        height: 12,
                        border: '2px solid var(--tc-warm-mid)',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }} />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 2v6h-6" />
                        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                        <path d="M3 22v-6h6" />
                        <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* 지도 */}
            <div style={{ marginBottom: 24, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(45,36,22,0.1)' }}>
              <Map photos={mapPhotos} height="360px" defaultCenter={mapCenter} />
              {mapPhotos.length === 0 && (
                <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--tc-warm-faint)', padding: '8px 0 4px' }}>
                  체크인을 추가하면 지도에 위치가 표시됩니다
                </p>
              )}
            </div>

            <TodayCalendar />

            <CheckinTimeline
              checkins={checkins}
              sortOrder={sortOrder}
              onSortChange={() => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
              onEdit={(checkin) => { setEditingCheckin(checkin); setShowForm(true); }}
              onDelete={handleDeleteCheckin}
            />
          </>
        )}

        {!selectedTripId && trips.length === 0 && (
          <div style={{
            marginTop: 40,
            textAlign: 'center',
            padding: '48px 24px',
            background: 'var(--tc-card-bg)',
            borderRadius: 20,
            boxShadow: '0 4px 20px rgba(45,36,22,0.08)',
          }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🗺️</div>
            <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--tc-warm-dark)', marginBottom: 8 }}>
              여행이 없습니다
            </p>
            <p style={{ fontSize: 14, color: 'var(--tc-warm-mid)', marginBottom: 24 }}>
              첫 여행을 만들어보세요!
            </p>
            <button
              onClick={() => { setTripFormMode('create'); setEditingTrip(undefined); setShowTripForm(true); }}
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: 'white',
                background: '#FF6B47',
                border: 'none',
                borderRadius: 9999,
                padding: '12px 28px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(255,107,71,0.45)',
              }}
            >
              + 첫 여행 만들기
            </button>
          </div>
        )}
      </div>

      {mounted && showDrawer && (
        <SideDrawer
          trips={trips}
          selectedTripId={selectedTripId}
          onClose={() => setShowDrawer(false)}
          onSelectTrip={setSelectedTripId}
          onCreateTrip={() => { setTripFormMode('create'); setEditingTrip(undefined); setShowTripForm(true); }}
          onEditTrip={(trip) => { setEditingTrip(trip); setTripFormMode('edit'); setShowTripForm(true); }}
          onDeleteTrip={handleDeleteTrip}
        />
      )}

      {mounted && selectedTripId && !showForm && (
        <BottomBar onCheckin={() => { setEditingCheckin(null); setShowForm(true); }} />
      )}

      {mounted && showTripForm && (
        <TripFormModal
          mode={tripFormMode}
          initialTrip={editingTrip}
          onSuccess={(trip) => {
            if (tripFormMode === 'create') setSelectedTripId(trip.id);
            setShowTripForm(false);
          }}
          onCancel={() => setShowTripForm(false)}
          onCreate={createTrip}
          onUpdate={updateTrip}
        />
      )}

      {showLocationPicker && (
        <LocationPicker
          initialLocation={locationPickerInitial.current || undefined}
          onLocationSelect={(lat, lng, place) => {
            locationPickerCallback.current?.(lat, lng, place);
            setShowLocationPicker(false);
          }}
          onClose={() => setShowLocationPicker(false)}
        />
      )}
    </div>
  );
}

export default function CheckinPage() {
  return (
    <Suspense>
      <CheckinPageInner />
    </Suspense>
  );
}
