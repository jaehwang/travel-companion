'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { Plane, Pencil, Calendar, Flag, MapPin, X, Star } from 'lucide-react';
import type { Trip, TripFormData } from '@travel-companion/shared';
import { usePlaceSearch } from '@/components/checkin-form/hooks/usePlaceSearch';
import CheckinFormPlacePanel from '@/components/checkin-form/CheckinFormPlacePanel';

function useTripFormModal(
  mode: string, initialTrip: Trip | undefined,
  onSuccess: (t: Trip) => void, onCancel: () => void,
  onCreate: (d: TripFormData) => Promise<Trip>, onUpdate: (id: string, d: Partial<TripFormData>) => Promise<Trip>
) {
  const tc = useTranslations('common');
  const [title, setTitle] = useState(initialTrip?.title ?? '');
  const [description, setDescription] = useState(initialTrip?.description ?? '');
  const [startDate, setStartDate] = useState(initialTrip?.start_date ?? '');
  const [endDate, setEndDate] = useState(initialTrip?.end_date ?? '');
  const [isPublic, setIsPublic] = useState(initialTrip?.is_public ?? false);
  const [isFrequent, setIsFrequent] = useState(initialTrip?.is_frequent ?? false);
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
      setPlace(name); setPlaceId(pid); setPlaceLat(lat); setPlaceLng(lng);
      setShowPlaceSearch(false); placeSearch.reset();
    },
    onError: setError,
  });

  const canSubmit = !!title.trim() && !submitting;

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true); setError(null);
    try {
      const data: TripFormData = { title: title.trim(), description: description.trim() || undefined, start_date: startDate || undefined, end_date: endDate || undefined, is_public: isPublic, is_frequent: isFrequent, place: place.trim() || null, place_id: placeId || null, latitude: placeLat ?? null, longitude: placeLng ?? null };
      const trip = mode === 'create' ? await onCreate(data) : await onUpdate(initialTrip!.id, data);
      onSuccess(trip);
    } catch (err) { setError(err instanceof Error ? err.message : `${tc('save')} 실패`); }
    finally { setSubmitting(false); }
  };

  const handleClearPlace = () => { setPlace(''); setPlaceId(''); setPlaceLat(undefined); setPlaceLng(undefined); };

  return { tc, title, setTitle, description, setDescription, startDate, setStartDate, endDate, setEndDate, isPublic, setIsPublic, isFrequent, setIsFrequent, place, placeId, placeLat, placeLng, showPlaceSearch, setShowPlaceSearch, submitting, error, canSubmit, handleSubmit, handleClearPlace, placeSearch };
}

interface TripFormModalProps {
  mode: 'create' | 'edit';
  initialTrip?: Trip;
  onSuccess: (trip: Trip) => void;
  onCancel: () => void;
  onCreate: (data: TripFormData) => Promise<Trip>;
  onUpdate: (id: string, data: Partial<TripFormData>) => Promise<Trip>;
}

function TripFormModalHeader({ mode, t, tc, canSubmit, submitting, onCancel, onSubmit }: { mode: string; t: ReturnType<typeof useTranslations>; tc: ReturnType<typeof useTranslations>; canSubmit: boolean; submitting: boolean; onCancel: () => void; onSubmit: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1.5px solid var(--tc-dot)', gap: 10, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,107,71,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {mode === 'create' ? <Plane size={15} color="#FF6B47" /> : <Pencil size={15} color="#FF6B47" />}
        </div>
        <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--tc-warm-dark)', letterSpacing: '-0.01em' }}>
          {mode === 'create' ? t('createTitle') : t('editTitle')}
        </span>
      </div>
      <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: 9999, background: 'var(--tc-card-empty)', color: 'var(--tc-warm-mid)', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>{tc('cancel')}</button>
      <button onClick={onSubmit} disabled={!canSubmit} style={{ padding: '8px 18px', borderRadius: 9999, background: canSubmit ? '#FF6B47' : 'var(--tc-card-empty)', color: canSubmit ? 'white' : 'var(--tc-warm-faint)', fontWeight: 700, fontSize: 14, border: 'none', cursor: canSubmit ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', flexShrink: 0, boxShadow: canSubmit ? '0 3px 10px rgba(255,107,71,0.4)' : 'none', transition: 'all 0.2s ease' }}>
        {submitting ? `${tc('save')}...` : mode === 'create' ? t('createTitle') : tc('save')}
      </button>
    </div>
  );
}

function TripFormDatesSection({ t, startDate, setStartDate, endDate, setEndDate }: { t: ReturnType<typeof useTranslations>; startDate: string; setStartDate: (v: string) => void; endDate: string; setEndDate: (v: string) => void }) {
  const cardStyle = { background: 'var(--tc-card-bg)', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 8px rgba(45,36,22,0.06)' };
  const inputStyle = { fontSize: 16, fontWeight: 600 as const, border: 'none', outline: 'none', background: 'transparent', width: '100%' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
      <div style={cardStyle}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#FF6B47', letterSpacing: '0.06em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={11} />{t('startDate')}</p>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ ...inputStyle, color: startDate ? 'var(--tc-warm-dark)' : 'var(--tc-warm-faint)' }} />
      </div>
      <div style={cardStyle}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', letterSpacing: '0.06em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}><Flag size={11} />{t('endDate')}</p>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ ...inputStyle, color: endDate ? 'var(--tc-warm-dark)' : 'var(--tc-warm-faint)' }} />
      </div>
    </div>
  );
}

function TripFormPlaceSection({ place, onAdd, onClear }: { place: string; onAdd: () => void; onClear: () => void }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--tc-warm-mid)', letterSpacing: '0.06em', marginBottom: 8 }}>대표 장소</p>
      {place ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--tc-card-bg)', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 8px rgba(45,36,22,0.06)' }}>
          <MapPin size={16} color="#FF6B47" />
          <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: 'var(--tc-warm-dark)' }}>{place}</span>
          <button onClick={onClear} style={{ width: 24, height: 24, flexShrink: 0, borderRadius: '50%', background: 'var(--tc-card-empty)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', color: 'var(--tc-warm-mid)' }}><X size={12} color="#9CA3AF" /></button>
        </div>
      ) : (
        <button onClick={onAdd} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--tc-card-bg)', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 8px rgba(45,36,22,0.06)', border: '1.5px dashed var(--tc-dot)', cursor: 'pointer', color: 'var(--tc-warm-faint)', fontSize: 14 }}>
          <MapPin size={16} color="#C4B49A" />장소 추가
        </button>
      )}
    </div>
  );
}

function TripFormToggle({ checked, onChange, color, label, desc, icon }: { checked: boolean; onChange: (v: boolean) => void; color: string; label: string; desc: string; icon?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--tc-card-bg)', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 8px rgba(45,36,22,0.06)', marginBottom: 10 }}>
      <div>
        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--tc-warm-dark)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>{icon}{label}</p>
        <p style={{ fontSize: 12, color: 'var(--tc-warm-faint)' }}>{desc}</p>
      </div>
      <label style={{ position: 'relative', display: 'inline-block', width: 51, height: 31, cursor: 'pointer', flexShrink: 0 }}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
        <span style={{ position: 'absolute', inset: 0, borderRadius: 15.5, backgroundColor: checked ? color : 'var(--tc-dot)', transition: 'background-color 0.2s', boxShadow: checked ? `0 2px 8px ${color}66` : 'none' }} />
        <span style={{ position: 'absolute', width: 27, height: 27, borderRadius: '50%', backgroundColor: 'white', top: 2, left: checked ? 22 : 2, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
      </label>
    </div>
  );
}

export default function TripFormModal({ mode, initialTrip, onSuccess, onCancel, onCreate, onUpdate }: TripFormModalProps) {
  const t = useTranslations('trip');
  const { tc, title, setTitle, description, setDescription, startDate, setStartDate, endDate, setEndDate, isPublic, setIsPublic, isFrequent, setIsFrequent, place, placeLat, placeLng, showPlaceSearch, setShowPlaceSearch, submitting, error, canSubmit, handleSubmit, handleClearPlace, placeSearch } = useTripFormModal(mode, initialTrip, onSuccess, onCancel, onCreate, onUpdate);

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
          <TripFormModalHeader mode={mode} t={t} tc={tc} canSubmit={canSubmit} submitting={submitting} onCancel={onCancel} onSubmit={handleSubmit} />

          {/* 본문 */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('titlePlaceholder')}
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
              placeholder={t('descPlaceholder')}
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

            <TripFormDatesSection t={t} startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} />
            <TripFormPlaceSection place={place} onAdd={() => { setShowPlaceSearch(true); placeSearch.reset(); }} onClear={handleClearPlace} />
            <TripFormToggle checked={isPublic} onChange={setIsPublic} color="#FF6B47" label={t('isPublic')} desc="링크로 공유할 수 있어요" />
            <TripFormToggle checked={isFrequent} onChange={setIsFrequent} color="#F59E0B" label="자주 가는 곳" desc="빠른 체크인 목록에 표시됩니다" icon={<Star size={14} color="#F59E0B" />} />

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
