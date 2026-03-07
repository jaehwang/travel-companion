'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useKeyboardHeight } from './hooks/useKeyboardHeight';
import { usePhotoUpload } from './hooks/usePhotoUpload';
import { usePlaceSearch } from './hooks/usePlaceSearch';
import { useLocationSource } from './hooks/useLocationSource';
import CheckinFormHeader from './CheckinFormHeader';
import CheckinFormMainPanel from './CheckinFormMainPanel';
import CheckinFormPlacePanel from './CheckinFormPlacePanel';
import CheckinFormCategoryPanel from './CheckinFormCategoryPanel';
import CheckinFormToolbar from './CheckinFormToolbar';
import CheckinFormTimePanel from './CheckinFormTimePanel';
import type { Checkin } from '@/types/database';

type Panel = 'main' | 'place-search' | 'category' | 'time';

const TOOLBAR_HEIGHT = 96;

const toDateTimeLocalValue = (isoString: string): string => {
  const d = new Date(isoString);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

interface CheckinFormProps {
  tripId: string;
  tripName?: string;
  userAvatarUrl?: string;
  editingCheckin?: Checkin;
  initialPlace?: string | null;
  initialPlaceId?: string | null;
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  onSuccess?: (checkin: Checkin) => void;
  onCancel?: () => void;
  onOpenLocationPicker?: (
    initial: { latitude: number; longitude: number } | null,
    onSelect: (lat: number, lng: number) => void
  ) => void;
}

export default function CheckinForm({
  tripId,
  tripName,
  userAvatarUrl,
  editingCheckin,
  initialPlace,
  initialPlaceId,
  initialLatitude,
  initialLongitude,
  onSuccess,
  onCancel,
  onOpenLocationPicker,
}: CheckinFormProps) {
  const [activePanel, setActivePanel] = useState<Panel>('main');
  const [title, setTitle] = useState('');
  const [place, setPlace] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [checkedInAt, setCheckedInAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loc = useLocationSource();

  const toolbarBottom = useKeyboardHeight();

  const photo = usePhotoUpload({
    onGpsExtracted: (lat, lng) => loc.applyPhotoGps(lat, lng),
    onError: setError,
  });

  const placeSearch = usePlaceSearch({
    isActive: activePanel === 'place-search',
    location: loc.location
      ? { lat: loc.location.latitude, lng: loc.location.longitude }
      : undefined,
    onPlaceSelected: (lat, lng, name, pid) => {
      loc.setManualLocation(lat, lng);
      setPlace(name);
      setPlaceId(pid);
      setError(null);
      setActivePanel('main');
      placeSearch.reset();
    },
    onError: setError,
  });

  const isEditMode = !!editingCheckin;
  const canSubmit =
    !!loc.location &&
    !!title.trim() &&
    !isSubmitting &&
    !photo.isProcessingPhoto &&
    !photo.isUploadingPhoto;

  // 수정 모드 초기화
  useEffect(() => {
    if (editingCheckin) {
      setTitle(editingCheckin.title || '');
      setPlace(editingCheckin.place || '');
      setPlaceId(editingCheckin.place_id || '');
      setCategory(editingCheckin.category || '');
      setMessage(editingCheckin.message || '');
      loc.initLocation(editingCheckin.latitude, editingCheckin.longitude);
      setCheckedInAt(
        editingCheckin.checked_in_at ? toDateTimeLocalValue(editingCheckin.checked_in_at) : ''
      );
      photo.reset(editingCheckin.photo_url || undefined);
    } else {
      setTitle('');
      setPlace(initialPlace || '');
      setPlaceId(initialPlaceId || '');
      setCategory('');
      setMessage('');
      if (initialLatitude != null && initialLongitude != null) {
        loc.initLocation(initialLatitude, initialLongitude);
      } else {
        loc.resetLocation();
      }
      setCheckedInAt('');
      photo.reset();
    }
    setActivePanel('main');
    placeSearch.reset();
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingCheckin]);

  const handleSubmit = async () => {
    if (!loc.location) {
      setError('위치를 선택해주세요.');
      return;
    }
    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const url = isEditMode ? `/api/checkins/${editingCheckin!.id}` : '/api/checkins';
      const method = isEditMode ? 'PATCH' : 'POST';
      const body: Record<string, unknown> = {
        title: title.trim(),
        place: place.trim() || undefined,
        place_id: placeId || undefined,
        message: message.trim() || undefined,
        category: category || undefined,
        latitude: loc.location!.latitude,
        longitude: loc.location!.longitude,
        photo_url: photo.photoUrl || undefined,
        photo_metadata: photo.photoMetadata || undefined,
      };
      if (!isEditMode) body.trip_id = tripId;
      if (checkedInAt) body.checked_in_at = new Date(checkedInAt).toISOString();

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || (isEditMode ? 'Failed to update checkin' : 'Failed to create checkin')
        );

      onSuccess?.(data.checkin);
    } catch (err) {
      setError(err instanceof Error ? err.message : '체크인 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: 'var(--tc-bg)', display: 'flex', flexDirection: 'column' }}
    >
      <CheckinFormHeader
        userAvatarUrl={userAvatarUrl}
        tripName={tripName}
        isEditMode={isEditMode}
        isSubmitting={isSubmitting}
        canSubmit={canSubmit}
        onCancel={onCancel ?? (() => {})}
        onSubmit={handleSubmit}
      />

      {activePanel === 'main' && (
        <CheckinFormMainPanel
          title={title}
          onTitleChange={setTitle}
          message={message}
          onMessageChange={setMessage}
          isProcessingPhoto={photo.isProcessingPhoto}
          isUploadingPhoto={photo.isUploadingPhoto}
          photoPreviewUrl={photo.photoPreviewUrl}
          photoMetadata={photo.photoMetadata}
          onClearPhoto={() => {
            photo.clearPhoto();
            loc.onPhotoClear();
          }}
          selectedLocation={loc.location}
          place={place}
          onClearLocation={() => {
            loc.clearLocation();
            setPlace('');
            setPlaceId('');
          }}
          category={category}
          onClearCategory={() => setCategory('')}
          checkedInAt={checkedInAt}
          onClearCheckedInAt={() => setCheckedInAt('')}
          error={error}
          toolbarHeight={TOOLBAR_HEIGHT}
        />
      )}

      {activePanel === 'place-search' && (
        <CheckinFormPlacePanel
          searchQuery={placeSearch.searchQuery}
          onSearchQueryChange={placeSearch.setSearchQuery}
          predictions={placeSearch.predictions}
          searchingPlaces={placeSearch.searchingPlaces}
          onSelectPlace={placeSearch.handleSelectPlace}
          onBack={() => {
            setActivePanel('main');
            placeSearch.reset();
          }}
        />
      )}

      {activePanel === 'category' && (
        <CheckinFormCategoryPanel
          category={category}
          onSelectCategory={setCategory}
          onClose={() => setActivePanel('main')}
        />
      )}

      {activePanel === 'time' && (
        <CheckinFormTimePanel
          checkedInAt={checkedInAt}
          onCheckedInAtChange={setCheckedInAt}
          onClose={() => setActivePanel('main')}
        />
      )}

      {activePanel === 'main' && (
        <CheckinFormToolbar
          fileInputRef={photo.fileInputRef}
          photoPreviewUrl={photo.photoPreviewUrl}
          hasPlaceFromSearch={!!place}
          selectedLocation={loc.location}
          hasCategory={!!category}
          checkedInAt={checkedInAt}
          toolbarBottom={toolbarBottom}
          onFileChange={photo.handleFileSelect}
          onOpenPlaceSearch={() => {
            setActivePanel('place-search');
            placeSearch.reset();
          }}
          onOpenLocationPicker={
            onOpenLocationPicker
              ? () =>
                  onOpenLocationPicker(loc.location, (lat, lng) => {
                    loc.setManualLocation(lat, lng);
                    setPlace('');
                    setPlaceId('');
                    setError(null);
                  })
              : undefined
          }
          onOpenCategory={() => setActivePanel('category')}
          onOpenTime={() => setActivePanel('time')}
        />
      )}
    </div>
  );

  return createPortal(content, document.body);
}
