import { Calendar, MapPin } from 'lucide-react';
import type { Trip, Checkin } from '@travel-companion/shared';
import { formatTripDate } from '../hooks/useCheckinPage';

interface TripInfoCardProps {
  selectedTrip: Trip;
  checkins: Checkin[];
  applyingPlace: boolean;
  onBulkApplyPlace: () => void;
}

export default function TripInfoCard({ selectedTrip, checkins, applyingPlace, onBulkApplyPlace }: TripInfoCardProps) {
  const earliest = checkins.length > 0
    ? [...checkins].sort((a, b) => new Date(a.checked_in_at).getTime() - new Date(b.checked_in_at).getTime())[0]
    : null;
  const startSrc = selectedTrip.start_date || earliest?.checked_in_at || null;
  const endSrc = selectedTrip.end_date || null;
  const hasPlace = !!selectedTrip.place;

  if (!selectedTrip.description && !startSrc && !hasPlace) return null;

  return (
    <div style={{
      marginBottom: 16,
      padding: '12px 16px',
      background: 'var(--tc-card-bg)',
      borderRadius: 14,
      boxShadow: '0 2px 8px rgba(45,36,22,0.06)',
      borderLeft: '4px solid #FF6B47',
    }}>
      {selectedTrip.description && (
        <p style={{ fontSize: 14, color: 'var(--tc-warm-dark)', marginBottom: startSrc ? 4 : 0 }}>
          {selectedTrip.description}
        </p>
      )}
      {startSrc && (
        <p style={{ fontSize: 12, color: 'var(--tc-warm-mid)', marginBottom: hasPlace ? 4 : 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Calendar size={12} />{formatTripDate(startSrc)}
          {endSrc && endSrc !== selectedTrip.start_date ? ` ~ ${formatTripDate(endSrc)}` : ''}
        </p>
      )}
      {hasPlace && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ fontSize: 12, color: 'var(--tc-warm-mid)', flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={12} />{selectedTrip.place}
          </p>
          {checkins.length > 0 && (
            <button
              onClick={onBulkApplyPlace}
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
}
