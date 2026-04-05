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
 *     CheckinPageOverlays에서 렌더링한다. LocationPicker 자체도 createPortal로 document.body에
 *     붙여 stacking context를 완전히 우회한다.
 */

import { Suspense } from 'react';
import { Plane } from 'lucide-react';
import CheckinPageHeader from './components/CheckinPageHeader';
import TripContent from './components/TripContent';
import EmptyTripsView from './components/EmptyTripsView';
import CheckinPageOverlays from './components/CheckinPageOverlays';
import { useTranslations } from 'next-intl';
import { useCheckinPage } from './hooks/useCheckinPage';

function CheckinPageInner() {
  const page = useCheckinPage();
  const tc = useTranslations('common');

  if (page.loading) {
    return (
      <div className="tc-page-bg flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="mb-4 flex justify-center"><Plane size={44} color="#FF6B47" /></div>
          <p className="text-sm text-[var(--tc-warm-mid)]">{tc('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tc-page-bg min-h-screen">
      <CheckinPageHeader
        user={page.user}
        selectedTrip={page.selectedTrip}
        onOpenDrawer={() => page.setShowDrawer(true)}
      />

      <div
        className="max-w-full px-4 pt-5"
        style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}
      >
        {page.displayError && (
          <div className="mb-4 px-4 py-3 bg-[#FFF5F5] border border-[#fca5a5] rounded-xl">
            <p className="text-[#DC2626] text-sm">{page.displayError}</p>
          </div>
        )}

        {page.selectedTripId && (
          <TripContent
            tripId={page.selectedTripId}
            selectedTrip={page.selectedTrip}
            checkins={page.checkins}
            mapPhotos={page.mapPhotos}
            mapCenter={page.mapCenter}
            tagline={page.tagline}
            taglineLoading={page.taglineLoading}
            taglineError={page.taglineError}
            refreshTagline={page.refreshTagline}
            applyingPlace={page.applyingPlace}
            showForm={page.showForm}
            editingCheckin={page.editingCheckin}
            sortOrder={page.sortOrder}
            userAvatarUrl={page.user?.user_metadata?.avatar_url}
            onCheckinSuccess={page.handleCheckinSuccess}
            onCancelForm={() => { page.setShowForm(false); page.setEditingCheckin(null); }}
            onOpenLocationPicker={page.openLocationPicker}
            onBulkApplyPlace={page.handleBulkApplyPlace}
            onSortChange={() => page.setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
            onEditCheckin={(checkin) => { page.setEditingCheckin(checkin); page.setShowForm(true); }}
            onDeleteCheckin={page.handleDeleteCheckin}
          />
        )}

        {!page.selectedTripId && page.trips.length === 0 && (
          <EmptyTripsView
            onCreateTrip={() => {
              page.setTripFormMode('create');
              page.setEditingTrip(undefined);
              page.setShowTripForm(true);
            }}
          />
        )}
      </div>

      <CheckinPageOverlays
        mounted={page.mounted}
        trips={page.trips}
        selectedTripId={page.selectedTripId}
        showForm={page.showForm}
        showDrawer={page.showDrawer}
        showTripForm={page.showTripForm}
        showLocationPicker={page.showLocationPicker}
        tripFormMode={page.tripFormMode}
        editingTrip={page.editingTrip}
        deletingTripId={page.deletingTripId}
        locationPickerInitial={page.locationPickerInitial}
        locationPickerCallback={page.locationPickerCallback}
        onSetShowDrawer={page.setShowDrawer}
        onSelectTrip={page.setSelectedTripId}
        onSetSelectedTripId={page.setSelectedTripId}
        onSetTripFormMode={page.setTripFormMode}
        onSetEditingTrip={page.setEditingTrip}
        onSetShowTripForm={page.setShowTripForm}
        onSetEditingCheckin={page.setEditingCheckin}
        onSetShowForm={page.setShowForm}
        onSetDeletingTripId={page.setDeletingTripId}
        onSetShowLocationPicker={page.setShowLocationPicker}
        onDeleteTrip={page.handleDeleteTrip}
        executeDeleteTrip={page.executeDeleteTrip}
        createTrip={page.createTrip}
        updateTrip={page.updateTrip}
      />
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
