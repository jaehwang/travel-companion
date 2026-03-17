'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Trip, TripFormData } from '@/types/database';
import { usePlaceSearch } from '@/components/checkin-form/hooks/usePlaceSearch';
import CheckinFormPlacePanel from '@/components/checkin-form/CheckinFormPlacePanel';

interface TripFormModalProps {
  mode: 'create' | 'edit';
  initialTrip?: Trip;
  onSuccess: (trip: Trip) => void;
  onCancel: () => void;
  onCreate: (data: TripFormData) => Promise<Trip>;
  onUpdate: (id: string, data: Partial<TripFormData>) => Promise<Trip>;
}

export default function TripFormModal({
  mode,
  initialTrip,
  onSuccess,
  onCancel,
  onCreate,
  onUpdate,
}: TripFormModalProps) {
  const [title, setTitle] = useState(initialTrip?.title ?? '');
  const [description, setDescription] = useState(initialTrip?.description ?? '');
  const [startDate, setStartDate] = useState(initialTrip?.start_date ?? '');
  const [endDate, setEndDate] = useState(initialTrip?.end_date ?? '');
  const [isPublic, setIsPublic] = useState(initialTrip?.is_public ?? false);
  const [place, setPlace] = useState(initialTrip?.place ?? '');
  const [placeId, setPlaceId] = useState(initialTrip?.place_id ?? '');
  const [placeLat, setPlaceLat] = useState<number | undefined>(initialTrip?.latitude ?? undefined);
  const [placeLng, setPlaceLng] = useState<number | undefined>(initialTrip?.longitude ?? undefined);
  const [showPlaceSearch, setShowPlaceSearch] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placeSearch = usePlaceSearch({
    isActive: showPlaceSearch,
    onPlaceSelected: (lat, lng, name, pid) => {
      setPlace(name);
      setPlaceId(pid);
      setPlaceLat(lat);
      setPlaceLng(lng);
      setShowPlaceSearch(false);
      placeSearch.reset();
    },
    onError: setError,
  });

  const canSubmit = !!title.trim() && !submitting;

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const data: TripFormData = {
        title: title.trim(),
        description: description.trim() || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        is_public: isPublic,
        place: place.trim() || null,
        place_id: placeId || null,
        latitude: placeLat ?? null,
        longitude: placeLng ?? null,
      };
      const trip =
        mode === 'create'
          ? await onCreate(data)
          : await onUpdate(initialTrip!.id, data);
      onSuccess(trip);
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearPlace = () => {
    setPlace('');
    setPlaceId('');
    setPlaceLat(undefined);
    setPlaceLng(undefined);
  };

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10001,
      backgroundColor: 'var(--tc-bg)',
      display: 'flex', flexDirection: 'column',
    }}>
      {showPlaceSearch ? (
        <CheckinFormPlacePanel
          searchQuery={placeSearch.searchQuery}
          onSearchQueryChange={placeSearch.setSearchQuery}
          predictions={placeSearch.predictions}
          searchingPlaces={placeSearch.searchingPlaces}
          onSelectPlace={placeSearch.handleSelectPlace}
          onBack={() => { setShowPlaceSearch(false); placeSearch.reset(); }}
        />
      ) : (
        <>
          {/* 헤더 */}
          <div style={{
            display: 'flex', alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1.5px solid var(--tc-dot)',
            gap: 10, flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'rgba(255,107,71,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, flexShrink: 0,
              }}>
                {mode === 'create' ? '✈️' : '✏️'}
              </div>
              <span style={{
                fontSize: 15, fontWeight: 800,
                color: 'var(--tc-warm-dark)',
                letterSpacing: '-0.01em',
              }}>
                {mode === 'create' ? '새 여행 만들기' : '여행 수정'}
              </span>
            </div>

            <button
              onClick={onCancel}
              style={{
                padding: '8px 16px', borderRadius: 9999,
                background: 'var(--tc-card-empty)',
                color: 'var(--tc-warm-mid)',
                fontWeight: 700, fontSize: 14,
                border: 'none', cursor: 'pointer',
                whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              취소
            </button>

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                padding: '8px 18px', borderRadius: 9999,
                background: canSubmit ? '#FF6B47' : 'var(--tc-card-empty)',
                color: canSubmit ? 'white' : 'var(--tc-warm-faint)',
                fontWeight: 700, fontSize: 14,
                border: 'none', cursor: canSubmit ? 'pointer' : 'not-allowed',
                whiteSpace: 'nowrap', flexShrink: 0,
                boxShadow: canSubmit ? '0 3px 10px rgba(255,107,71,0.4)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {submitting ? '저장 중...' : mode === 'create' ? '만들기' : '저장'}
            </button>
          </div>

          {/* 본문 */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="여행 이름을 지어주세요"
              autoFocus
              style={{
                width: '100%',
                fontSize: 26, fontWeight: 800,
                border: 'none', outline: 'none',
                color: 'var(--tc-warm-dark)',
                background: 'transparent',
                marginBottom: 14,
                letterSpacing: '-0.02em', lineHeight: 1.3,
              }}
            />

            <div style={{ height: 1.5, background: 'var(--tc-dot)', marginBottom: 14 }} />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="어떤 여행인지 적어보세요..."
              rows={3}
              style={{
                width: '100%',
                fontSize: 17,
                border: 'none', outline: 'none', resize: 'none',
                color: 'var(--tc-warm-mid)',
                background: 'transparent',
                lineHeight: 1.7,
                marginBottom: 24,
              }}
            />

            {/* 날짜 섹션 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              <div style={{
                background: 'var(--tc-card-bg)',
                borderRadius: 14,
                padding: '14px 16px',
                boxShadow: '0 2px 8px rgba(45,36,22,0.06)',
              }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#FF6B47', letterSpacing: '0.06em', marginBottom: 6 }}>
                  📅 시작일
                </p>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    fontSize: 16, fontWeight: 600,
                    border: 'none', outline: 'none',
                    color: startDate ? 'var(--tc-warm-dark)' : 'var(--tc-warm-faint)',
                    background: 'transparent',
                    width: '100%',
                  }}
                />
              </div>

              <div style={{
                background: 'var(--tc-card-bg)',
                borderRadius: 14,
                padding: '14px 16px',
                boxShadow: '0 2px 8px rgba(45,36,22,0.06)',
              }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', letterSpacing: '0.06em', marginBottom: 6 }}>
                  🏁 종료일
                </p>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    fontSize: 16, fontWeight: 600,
                    border: 'none', outline: 'none',
                    color: endDate ? 'var(--tc-warm-dark)' : 'var(--tc-warm-faint)',
                    background: 'transparent',
                    width: '100%',
                  }}
                />
              </div>
            </div>

            {/* 장소 섹션 */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--tc-warm-mid)', letterSpacing: '0.06em', marginBottom: 8 }}>
                대표 장소
              </p>
              {place ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'var(--tc-card-bg)',
                  borderRadius: 14,
                  padding: '14px 16px',
                  boxShadow: '0 2px 8px rgba(45,36,22,0.06)',
                }}>
                  <span style={{ fontSize: 16 }}>📍</span>
                  <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: 'var(--tc-warm-dark)' }}>
                    {place}
                  </span>
                  <button
                    onClick={handleClearPlace}
                    style={{
                      width: 24, height: 24, flexShrink: 0,
                      borderRadius: '50%',
                      background: 'var(--tc-card-empty)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: 'none', cursor: 'pointer',
                      color: 'var(--tc-warm-mid)', fontSize: 12,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setShowPlaceSearch(true); placeSearch.reset(); }}
                  style={{
                    width: '100%', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'var(--tc-card-bg)',
                    borderRadius: 14,
                    padding: '14px 16px',
                    boxShadow: '0 2px 8px rgba(45,36,22,0.06)',
                    border: '1.5px dashed var(--tc-dot)',
                    cursor: 'pointer',
                    color: 'var(--tc-warm-faint)',
                    fontSize: 14,
                  }}
                >
                  <span style={{ fontSize: 16 }}>📍</span>
                  장소 추가
                </button>
              )}
            </div>

            {/* 공개 토글 */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--tc-card-bg)',
              borderRadius: 14,
              padding: '14px 16px',
              boxShadow: '0 2px 8px rgba(45,36,22,0.06)',
              marginBottom: 20,
            }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--tc-warm-dark)', marginBottom: 2 }}>공개 여행</p>
                <p style={{ fontSize: 12, color: 'var(--tc-warm-faint)' }}>링크로 공유할 수 있어요</p>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: 51, height: 31, cursor: 'pointer', flexShrink: 0 }}>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute', inset: 0,
                  borderRadius: 15.5,
                  backgroundColor: isPublic ? '#FF6B47' : 'var(--tc-dot)',
                  transition: 'background-color 0.2s',
                  boxShadow: isPublic ? '0 2px 8px rgba(255,107,71,0.4)' : 'none',
                }} />
                <span style={{
                  position: 'absolute',
                  width: 27, height: 27,
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  top: 2,
                  left: isPublic ? 22 : 2,
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                }} />
              </label>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px',
                background: '#FFF5F5',
                border: '1px solid #fca5a5',
                borderRadius: 12,
              }}>
                <p style={{ fontSize: 13, color: '#DC2626' }}>{error}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>,
    document.body
  );
}
