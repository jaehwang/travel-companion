'use client';

/**
 * 체크인 메인 페이지
 *
 * 역할:
 *   - 여행 목록 조회 및 선택, 체크인 CRUD, 지도/타임라인 렌더링을 조율하는 최상위 컨테이너
 *
 * LocationPicker 아키텍처:
 *   - LocationPicker는 반드시 이 페이지 최상위(CheckinForm 바깥)에서 렌더링해야 한다.
 *   - CheckinForm 내부에 두면 Google Maps APIProvider context 안에 중첩되고,
 *     Google Maps SDK가 페이지에 주입하는 `transform` CSS 때문에
 *     LocationPicker 내부의 `position: fixed` 지도가 iOS에서 뷰포트 기준이 아닌
 *     transform 컨텍스트 기준으로 배치되어 화면 밖으로 어긋난다.
 *   - 해결: CheckinForm은 `onOpenLocationPicker` 콜백만 받고, 실제 LocationPicker는
 *     이 파일에서 직접 렌더링한다. LocationPicker 자체도 createPortal로 document.body에
 *     붙여 stacking context를 완전히 우회한다.
 */

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
  // editingCheckin이 null이면 신규 체크인, 값이 있으면 수정 모드
  const [editingCheckin, setEditingCheckin] = useState<Checkin | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showTripForm, setShowTripForm] = useState(false);
  const [tripFormMode, setTripFormMode] = useState<'create' | 'edit'>('create');
  const [editingTrip, setEditingTrip] = useState<Trip | undefined>();
  const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.978 });
  // SideDrawer, BottomBar, TripFormModal은 SSR 환경(document 없음)에서 렌더링 불가 → 마운트 후에만 표시
  const [mounted, setMounted] = useState(false);
  const [applyingPlace, setApplyingPlace] = useState(false);

  /**
   * LocationPicker 연결용 ref 쌍
   *
   * state 대신 ref를 사용하는 이유:
   *   CheckinForm이 onOpenLocationPicker 콜백을 호출할 때 onSelect 함수를 넘긴다.
   *   이 onSelect는 CheckinForm 내부 클로저이므로, state로 저장하면 LocationPicker가
   *   닫힌 뒤 호출될 때 stale closure 문제가 생긴다.
   *   ref는 항상 최신 값을 가리키므로 안전하다.
   *   또한 ref 변경은 리렌더링을 유발하지 않아 불필요한 렌더를 막는다.
   */
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

  /**
   * 체크인 저장 성공 핸들러
   *
   * editingCheckin 유무로 수정/신규를 구분하여 로컬 목록을 갱신한다.
   * API 호출 자체는 CheckinForm이 담당하고, 성공 후 결과 checkin 객체를 받아 여기서 처리한다.
   */
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

  /**
   * 여행의 대표 장소(selectedTrip.place)를 해당 여행의 모든 체크인에 일괄 적용한다.
   *
   * 개별 체크인마다 장소를 직접 설정하기 번거로울 때 사용하는 편의 기능.
   * 기존 체크인의 place 값을 덮어쓰므로 사용자 확인을 먼저 받는다.
   * 서버 API(/api/trips/:id/apply-place)가 DB를 일괄 업데이트하고,
   * 완료 후 reloadCheckins()로 최신 상태를 다시 불러온다.
   */
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
            <Link href="/settings" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              {user.user_metadata?.avatar_url && (
                <img
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata.name || ''}
                  className="user-avatar"
                  referrerPolicy="no-referrer"
                />
              )}
            </Link>
          )}
        </div>
      </header>

      {/* 본문 */}
      <div
        style={{
          maxWidth: '100%',
          padding: '20px 16px',
          // BottomBar 높이(약 80px) + iOS safe area를 확보해 콘텐츠가 가려지지 않도록 함
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
                // 수정 모드에서는 여행 기본 장소를 덮어쓰지 않는다
                initialPlace={editingCheckin ? undefined : selectedTrip?.place}
                initialPlaceId={editingCheckin ? undefined : selectedTrip?.place_id}
                initialLatitude={editingCheckin ? undefined : selectedTrip?.latitude}
                initialLongitude={editingCheckin ? undefined : selectedTrip?.longitude}
                onSuccess={handleCheckinSuccess}
                onCancel={() => { setShowForm(false); setEditingCheckin(null); }}
                // LocationPicker를 직접 열지 않고 콜백으로 부모에게 위임한다.
                // 이유: LocationPicker를 CheckinForm 내부(Google Maps context 안)에서
                // 렌더링하면 iOS에서 fixed 위치가 transform 기준으로 어긋나는 문제가 생긴다.
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

            <TodayCalendar tripEndDate={selectedTrip?.end_date} />

            <CheckinTimeline
              checkins={checkins}
              sortOrder={sortOrder}
              onSortChange={() => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
              // 수정 버튼 클릭 → editingCheckin 설정 후 폼 열기 (수정 모드)
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

      {/* mounted 체크: SideDrawer/BottomBar/TripFormModal은 document에 접근하므로 SSR에서 제외 */}
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

      {/*
        LocationPicker를 이 파일 최상위에서 렌더링하는 이유:
        CheckinForm 안에 두면 Google Maps APIProvider의 transform context에 갇혀
        iOS에서 fixed 모달 위치가 어긋난다. 여기서 렌더링하면 CheckinForm의
        Google Maps context 바깥에 위치하므로 안전하다.
        LocationPicker 내부에서도 createPortal로 document.body에 직접 붙인다.

        locationPickerCallback.current에 CheckinForm이 넘긴 onSelect 클로저가 담겨 있어,
        위치 확정 시 CheckinForm의 location 상태를 직접 업데이트한다.
      */}
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
