'use client';

/**
 * 체크인 메인 페이지
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

import { Suspense } from 'react';
import Link from 'next/link';
import { Plane, Map as MapIcon } from 'lucide-react';
import CheckinForm from '@/components/checkin-form/CheckinForm';
import { LocationPicker } from '@/components/LocationPicker';
import Map from '@/components/Map';
import { APP_NAME } from '@/lib/config';
import TripDeleteDialog from '@/components/TripDeleteDialog';
import SideDrawer from './components/SideDrawer';
import TripFormModal from '@/components/TripFormModal';
import CheckinTimeline from './components/CheckinTimeline';
import BottomBar from './components/BottomBar';
import TodayCalendar from './components/TodayCalendar';
import TripInfoCard from './components/TripInfoCard';
import TaglineBanner from './components/TaglineBanner';
import { useCheckinPage } from './hooks/useCheckinPage';

function CheckinPageInner() {
  const {
    user,
    selectedTripId,
    setSelectedTripId,
    selectedTrip,
    showForm,
    setShowForm,
    editingCheckin,
    setEditingCheckin,
    sortOrder,
    setSortOrder,
    mounted,
    loading,
    displayError,
    trips,
    checkins,
    mapPhotos,
    mapCenter,
    tagline,
    taglineLoading,
    taglineError,
    refreshTagline,
    showDrawer,
    setShowDrawer,
    showTripForm,
    setShowTripForm,
    tripFormMode,
    setTripFormMode,
    editingTrip,
    setEditingTrip,
    deletingTripId,
    setDeletingTripId,
    applyingPlace,
    showLocationPicker,
    setShowLocationPicker,
    locationPickerInitial,
    locationPickerCallback,
    openLocationPicker,
    handleCheckinSuccess,
    handleDeleteCheckin,
    handleDeleteTrip,
    executeDeleteTrip,
    handleBulkApplyPlace,
    createTrip,
    updateTrip,
  } = useCheckinPage();

  if (loading) {
    return (
      <div className="tc-page-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="tc-plane" style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}><Plane size={44} color="#FF6B47" /></div>
          <p style={{ fontSize: 14, color: 'var(--tc-warm-mid)' }}>불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tc-page-bg" style={{ minHeight: '100vh' }}>
      {deletingTripId && (() => {
        const t = trips.find((tr) => tr.id === deletingTripId);
        return t ? (
          <TripDeleteDialog
            tripTitle={t.title}
            onDeleteCheckins={() => executeDeleteTrip(deletingTripId, false)}
            onKeepCheckins={() => executeDeleteTrip(deletingTripId, true)}
            onCancel={() => setDeletingTripId(null)}
          />
        ) : null;
      })()}

      {/* 헤더 */}
      <header className="tc-header">
        <div style={{ maxWidth: '100%', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setShowDrawer(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 6,
              color: 'var(--tc-warm-dark)', display: 'flex', alignItems: 'center', flexShrink: 0,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span style={{
            flex: 1, fontSize: 16, fontWeight: 800, color: 'var(--tc-warm-dark)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em',
          }}>
            {selectedTrip ? selectedTrip.title : APP_NAME}
          </span>
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
      <div style={{
        maxWidth: '100%',
        padding: '20px 16px',
        paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
      }}>
        {displayError && (
          <div style={{ marginBottom: 16, padding: '12px 16px', background: '#FFF5F5', border: '1px solid #fca5a5', borderRadius: 12 }}>
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
                onOpenLocationPicker={openLocationPicker}
              />
            )}

            {selectedTrip && (
              <TripInfoCard
                selectedTrip={selectedTrip}
                checkins={checkins}
                applyingPlace={applyingPlace}
                onBulkApplyPlace={handleBulkApplyPlace}
              />
            )}

            {selectedTrip && (
              <TaglineBanner
                tagline={tagline}
                loading={taglineLoading}
                error={taglineError}
                onRefresh={refreshTagline}
              />
            )}

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
              onEdit={(checkin) => { setEditingCheckin(checkin); setShowForm(true); }}
              onDelete={handleDeleteCheckin}
            />
          </>
        )}

        {!selectedTripId && trips.length === 0 && (
          <div style={{
            marginTop: 40, textAlign: 'center', padding: '48px 24px',
            background: 'var(--tc-card-bg)', borderRadius: 20,
            boxShadow: '0 4px 20px rgba(45,36,22,0.08)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><MapIcon size={52} color="#C4B49A" /></div>
            <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--tc-warm-dark)', marginBottom: 8 }}>여행이 없습니다</p>
            <p style={{ fontSize: 14, color: 'var(--tc-warm-mid)', marginBottom: 24 }}>첫 여행을 만들어보세요!</p>
            <button
              onClick={() => { setTripFormMode('create'); setEditingTrip(undefined); setShowTripForm(true); }}
              style={{
                fontSize: 15, fontWeight: 700, color: 'white', background: '#FF6B47',
                border: 'none', borderRadius: 9999, padding: '12px 28px',
                cursor: 'pointer', boxShadow: '0 4px 14px rgba(255,107,71,0.45)',
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
