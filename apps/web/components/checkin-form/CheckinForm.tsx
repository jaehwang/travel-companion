'use client';

/**
 * CheckinForm - 체크인 생성/수정 폼
 *
 * 이 컴포넌트는 createPortal로 document.body에 직접 마운트되는 전체화면 모달이다.
 * 즉 DOM 트리상으로는 부모와 분리되어 있지만, React 트리(이벤트 버블링, context)는
 * 부모와 연결된 상태로 동작한다.
 *
 * LocationPicker 연결 방식 (onOpenLocationPicker 콜백 패턴):
 *   이 컴포넌트는 LocationPicker를 직접 렌더링하지 않는다.
 *   이유: CheckinForm 내부에서 LocationPicker를 렌더링하면 Google Maps APIProvider
 *   context 안에 중첩되고, Google Maps SDK가 주입하는 `transform` CSS 때문에
 *   iOS에서 LocationPicker의 `position: fixed` 지도가 transform 기준으로 배치되어
 *   화면 밖으로 어긋난다.
 *
 *   대신 `onOpenLocationPicker(initial, onSelect)` 콜백을 부모(checkin/page.tsx)에 전달하고,
 *   부모가 Google Maps context 바깥에서 LocationPicker를 직접 렌더링한다.
 *   위치 선택 결과는 onSelect 클로저를 통해 이 컴포넌트의 상태로 돌아온다.
 */

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
import type { Checkin } from '@travel-companion/shared';

// ─── 타입 ─────────────────────────────────────────────────────────────────────

/** 폼 내 활성 패널. 'main' 외의 패널은 슬라이드인 형태로 'main' 위에 표시된다. */
type Panel = 'main' | 'place-search' | 'category' | 'time';

// ─── 상수 ─────────────────────────────────────────────────────────────────────

/** 하단 툴바 높이. 메인 패널의 스크롤 영역이 툴바에 가려지지 않도록 패딩에 사용한다. */
const TOOLBAR_HEIGHT = 96;

// ─── 유틸 ─────────────────────────────────────────────────────────────────────

/** ISO 문자열을 datetime-local input이 요구하는 형식(YYYY-MM-DDTHH:mm)으로 변환한다. */
const toDateTimeLocalValue = (isoString: string): string => {
  const d = new Date(isoString);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface CheckinFormProps {
  /** 체크인이 속할 여행 ID */
  tripId: string;
  /** 헤더에 표시할 여행 이름 */
  tripName?: string;
  /** 헤더 아바타 이미지 URL */
  userAvatarUrl?: string;
  /**
   * 수정할 체크인. undefined이면 신규 생성 모드.
   * 이 값의 유무로 isEditMode가 결정되고, 초기 폼 값 및 API 엔드포인트가 달라진다.
   */
  editingCheckin?: Checkin;
  /**
   * 신규 생성 시 여행의 대표 장소/좌표를 초기값으로 채운다.
   * 수정 모드에서는 editingCheckin의 값을 사용하므로 이 props는 무시한다.
   */
  initialPlace?: string | null;
  initialPlaceId?: string | null;
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  /**
   * 저장 성공 시 호출. 서버에서 반환한 최신 Checkin 객체를 전달한다.
   * 부모(page.tsx)는 이 값으로 로컬 목록을 갱신한다.
   */
  onSuccess?: (checkin: Checkin) => void;
  /** 취소 버튼 클릭 시 호출 */
  onCancel?: () => void;
  /**
   * LocationPicker를 열어달라는 요청을 부모에게 전달하는 콜백.
   *
   * @param initial - 지도 초기 위치 (현재 선택된 위치 또는 null)
   * @param onSelect - 위치 선택 완료 후 부모가 호출할 콜백.
   *                   이 클로저 안에서 이 컴포넌트의 location/place 상태를 업데이트한다.
   *
   * 이 prop이 undefined이면 툴바의 위치 버튼이 숨겨진다.
   */
  onOpenLocationPicker?: (
    initial: { latitude: number; longitude: number } | null,
    onSelect: (lat: number, lng: number, place?: { name: string; place_id: string }) => void
  ) => void;
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

export default function CheckinForm({ tripId, tripName, userAvatarUrl, editingCheckin, initialPlace, initialPlaceId, initialLatitude, initialLongitude, onSuccess, onCancel, onOpenLocationPicker }: CheckinFormProps) {
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
    location: loc.location ? { lat: loc.location.latitude, lng: loc.location.longitude } : undefined,
    onPlaceSelected: (lat, lng, name, pid) => { loc.setManualLocation(lat, lng); setPlace(name); setPlaceId(pid); setError(null); setActivePanel('main'); placeSearch.reset(); },
    onError: setError,
  });

  const isEditMode = !!editingCheckin;
  const canSubmit = !!loc.location && !!title.trim() && !isSubmitting && !photo.isProcessingPhoto && !photo.isUploadingPhoto;

  // ─── 초기화 ───────────────────────────────────────────────────────────────

  // editingCheckin이 바뀔 때마다 폼 전체를 초기화한다.
  useEffect(() => {
    if (editingCheckin) {
      setTitle(editingCheckin.title || ''); setPlace(editingCheckin.place || ''); setPlaceId(editingCheckin.place_id || '');
      setCategory(editingCheckin.category || ''); setMessage(editingCheckin.message || '');
      loc.initLocation(editingCheckin.latitude, editingCheckin.longitude);
      setCheckedInAt(editingCheckin.checked_in_at ? toDateTimeLocalValue(editingCheckin.checked_in_at) : '');
      photo.reset(editingCheckin.photo_url || undefined);
    } else {
      setTitle(''); setPlace(initialPlace || ''); setPlaceId(initialPlaceId || '');
      setCategory(''); setMessage('');
      if (initialLatitude != null && initialLongitude != null) loc.initLocation(initialLatitude, initialLongitude);
      else loc.resetLocation();
      setCheckedInAt(''); photo.reset();
    }
    setActivePanel('main'); placeSearch.reset(); setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingCheckin]);

  const handleSubmit = async () => {
    if (!loc.location) { setError('위치를 선택해주세요.'); return; }
    if (!title.trim()) { setError('제목을 입력해주세요.'); return; }
    setIsSubmitting(true); setError(null);
    try {
      const url = isEditMode ? `/api/checkins/${editingCheckin!.id}` : '/api/checkins';
      const method = isEditMode ? 'PATCH' : 'POST';
      const body: Record<string, unknown> = { title: title.trim(), place: place.trim() || null, place_id: placeId || null, message: message.trim() || undefined, category: category || undefined, latitude: loc.location!.latitude, longitude: loc.location!.longitude, photo_url: photo.photoUrl || undefined, photo_metadata: photo.photoMetadata || undefined };
      if (!isEditMode) body.trip_id = tripId;
      if (checkedInAt) body.checked_in_at = new Date(checkedInAt).toISOString();
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || (isEditMode ? 'Failed to update checkin' : 'Failed to create checkin'));
      onSuccess?.(data.checkin);
    } catch (err) { setError(err instanceof Error ? err.message : '체크인 저장에 실패했습니다.'); }
    finally { setIsSubmitting(false); }
  };

  const handleOpenLocationPicker = onOpenLocationPicker
    ? () => onOpenLocationPicker(loc.location, (lat, lng, place) => {
        loc.setManualLocation(lat, lng);
        setPlace(place?.name ?? '');
        setPlaceId(place?.place_id ?? '');
        setError(null);
      })
    : undefined;

  return createPortal(
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: 'var(--tc-bg)', display: 'flex', flexDirection: 'column' }}>
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
          onBack={() => { setActivePanel('main'); placeSearch.reset(); }}
        />
      )}
      {activePanel === 'category' && (
        <CheckinFormCategoryPanel category={category} onSelectCategory={setCategory} onClose={() => setActivePanel('main')} />
      )}
      {activePanel === 'time' && (
        <CheckinFormTimePanel checkedInAt={checkedInAt} onCheckedInAtChange={setCheckedInAt} onClose={() => setActivePanel('main')} />
      )}

      {activePanel === 'main' && (
        <CheckinFormToolbar
          fileInputRef={photo.fileInputRef}
          photoPreviewUrl={photo.photoPreviewUrl}
          selectedLocation={loc.location}
          hasCategory={!!category}
          checkedInAt={checkedInAt}
          toolbarBottom={toolbarBottom}
          onFileChange={photo.handleFileSelect}
          onOpenLocationPicker={handleOpenLocationPicker}
          onOpenCategory={() => setActivePanel('category')}
          onOpenTime={() => setActivePanel('time')}
        />
      )}
    </div>,
    document.body
  );
}
