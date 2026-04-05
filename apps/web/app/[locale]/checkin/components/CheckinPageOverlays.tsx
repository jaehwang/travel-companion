'use client';

import { LocationPicker } from '@/components/LocationPicker';
import TripDeleteDialog from '@/components/TripDeleteDialog';
import SideDrawer from './SideDrawer';
import TripFormModal from '@/components/TripFormModal';
import BottomBar from './BottomBar';
import type { Trip, Checkin } from '@travel-companion/shared';
import type { MutableRefObject } from 'react';

interface CheckinPageOverlaysProps {
  mounted: boolean;
  trips: Trip[];
  selectedTripId: string;
  showForm: boolean;
  showDrawer: boolean;
  showTripForm: boolean;
  showLocationPicker: boolean;
  tripFormMode: 'create' | 'edit';
  editingTrip: Trip | undefined;
  deletingTripId: string | null;
  locationPickerInitial: MutableRefObject<{ latitude: number; longitude: number } | null>;
  locationPickerCallback: MutableRefObject<((lat: number, lng: number, place?: { name: string; place_id: string }) => void) | null>;
  onSetShowDrawer: (v: boolean) => void;
  onSelectTrip: (id: string) => void;
  onSetSelectedTripId: (id: string) => void;
  onSetTripFormMode: (mode: 'create' | 'edit') => void;
  onSetEditingTrip: (trip: Trip | undefined) => void;
  onSetShowTripForm: (v: boolean) => void;
  onSetEditingCheckin: (c: Checkin | null) => void;
  onSetShowForm: (v: boolean) => void;
  onSetDeletingTripId: (id: string | null) => void;
  onSetShowLocationPicker: (v: boolean) => void;
  onDeleteTrip: (id: string) => void;
  executeDeleteTrip: (id: string, keepCheckins: boolean) => void;
  createTrip: (data: any) => Promise<Trip>;
  updateTrip: (id: string, data: any) => Promise<Trip>;
}

export default function CheckinPageOverlays({
  mounted,
  trips,
  selectedTripId,
  showForm,
  showDrawer,
  showTripForm,
  showLocationPicker,
  tripFormMode,
  editingTrip,
  deletingTripId,
  locationPickerInitial,
  locationPickerCallback,
  onSetShowDrawer,
  onSelectTrip,
  onSetSelectedTripId,
  onSetTripFormMode,
  onSetEditingTrip,
  onSetShowTripForm,
  onSetEditingCheckin,
  onSetShowForm,
  onSetDeletingTripId,
  onSetShowLocationPicker,
  onDeleteTrip,
  executeDeleteTrip,
  createTrip,
  updateTrip,
}: CheckinPageOverlaysProps) {
  return (
    <>
      {deletingTripId && (() => {
        const t = trips.find((tr) => tr.id === deletingTripId);
        return t ? (
          <TripDeleteDialog
            tripTitle={t.title}
            onDeleteCheckins={() => executeDeleteTrip(deletingTripId, false)}
            onKeepCheckins={() => executeDeleteTrip(deletingTripId, true)}
            onCancel={() => onSetDeletingTripId(null)}
          />
        ) : null;
      })()}

      {mounted && showDrawer && (
        <SideDrawer
          trips={trips}
          selectedTripId={selectedTripId}
          onClose={() => onSetShowDrawer(false)}
          onSelectTrip={onSetSelectedTripId}
          onCreateTrip={() => { onSetTripFormMode('create'); onSetEditingTrip(undefined); onSetShowTripForm(true); }}
          onEditTrip={(trip) => { onSetEditingTrip(trip); onSetTripFormMode('edit'); onSetShowTripForm(true); }}
          onDeleteTrip={onDeleteTrip}
        />
      )}

      {mounted && selectedTripId && !showForm && (
        <BottomBar onCheckin={() => { onSetEditingCheckin(null); onSetShowForm(true); }} />
      )}

      {mounted && showTripForm && (
        <TripFormModal
          mode={tripFormMode}
          initialTrip={editingTrip}
          onSuccess={(trip) => {
            if (tripFormMode === 'create') onSetSelectedTripId(trip.id);
            onSetShowTripForm(false);
          }}
          onCancel={() => onSetShowTripForm(false)}
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
            onSetShowLocationPicker(false);
          }}
          onClose={() => onSetShowLocationPicker(false)}
        />
      )}
    </>
  );
}
