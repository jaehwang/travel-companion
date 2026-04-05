'use client';

import CheckinForm from '@/components/checkin-form/CheckinForm';
import Map from '@/components/Map';
import CheckinTimeline from './CheckinTimeline';
import TodayCalendar from './TodayCalendar';
import TripInfoCard from './TripInfoCard';
import TaglineBanner from './TaglineBanner';
import { useTranslations } from 'next-intl';
import type { Trip, Checkin } from '@travel-companion/shared';
import type { MapPhoto } from '@/components/Map';

interface TripContentProps {
  tripId: string;
  selectedTrip: Trip | undefined;
  checkins: Checkin[];
  mapPhotos: MapPhoto[];
  mapCenter: { lat: number; lng: number };
  tagline: string | null;
  taglineLoading: boolean;
  taglineError: string | null;
  refreshTagline: () => void;
  applyingPlace: boolean;
  showForm: boolean;
  editingCheckin: Checkin | null;
  sortOrder: 'desc' | 'asc';
  userAvatarUrl?: string;
  onCheckinSuccess: (checkin: Checkin) => void;
  onCancelForm: () => void;
  onOpenLocationPicker: (
    initial: { latitude: number; longitude: number } | null,
    callback: (lat: number, lng: number, place?: { name: string; place_id: string }) => void,
  ) => void;
  onBulkApplyPlace: () => void;
  onSortChange: () => void;
  onEditCheckin: (checkin: Checkin) => void;
  onDeleteCheckin: (id: string) => void;
}

export default function TripContent({
  tripId,
  selectedTrip,
  checkins,
  mapPhotos,
  mapCenter,
  tagline,
  taglineLoading,
  taglineError,
  refreshTagline,
  applyingPlace,
  showForm,
  editingCheckin,
  sortOrder,
  userAvatarUrl,
  onCheckinSuccess,
  onCancelForm,
  onOpenLocationPicker,
  onBulkApplyPlace,
  onSortChange,
  onEditCheckin,
  onDeleteCheckin,
}: TripContentProps) {
  const tCheckin = useTranslations('checkin');

  return (
    <>
      {showForm && (
        <CheckinForm
          tripId={tripId}
          tripName={selectedTrip?.title}
          userAvatarUrl={userAvatarUrl}
          editingCheckin={editingCheckin ?? undefined}
          initialPlace={editingCheckin ? undefined : selectedTrip?.place}
          initialPlaceId={editingCheckin ? undefined : selectedTrip?.place_id}
          initialLatitude={editingCheckin ? undefined : selectedTrip?.latitude}
          initialLongitude={editingCheckin ? undefined : selectedTrip?.longitude}
          onSuccess={onCheckinSuccess}
          onCancel={onCancelForm}
          onOpenLocationPicker={onOpenLocationPicker}
        />
      )}

      {selectedTrip && (
        <TripInfoCard
          selectedTrip={selectedTrip}
          checkins={checkins}
          applyingPlace={applyingPlace}
          onBulkApplyPlace={onBulkApplyPlace}
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

      <div className="mb-6 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(45,36,22,0.1)]">
        <Map photos={mapPhotos} height="360px" defaultCenter={mapCenter} />
        {mapPhotos.length === 0 && (
          <p className="text-center text-xs text-[var(--tc-warm-faint)] pt-2 pb-1">
            {tCheckin('mapEmpty')}
          </p>
        )}
      </div>

      <TodayCalendar tripEndDate={selectedTrip?.end_date} />

      <CheckinTimeline
        checkins={checkins}
        sortOrder={sortOrder}
        onSortChange={onSortChange}
        onEdit={onEditCheckin}
        onDelete={onDeleteCheckin}
      />
    </>
  );
}
