'use client';

import { createPortal } from 'react-dom';
import type { Trip } from '@/types/database';

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

interface SideDrawerProps {
  trips: Trip[];
  selectedTripId: string;
  onClose: () => void;
  onSelectTrip: (id: string) => void;
  onCreateTrip: () => void;
  onEditTrip: (trip: Trip) => void;
  onDeleteTrip: (id: string) => void;
}

export default function SideDrawer({
  trips,
  selectedTripId,
  onClose,
  onSelectTrip,
  onCreateTrip,
  onEditTrip,
  onDeleteTrip,
}: SideDrawerProps) {
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000 }}>
      <div
        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />
      <div
        style={{ position: 'absolute', top: 0, left: 0, bottom: 0, backgroundColor: 'white' }}
        className="w-4/5 max-w-[320px] overflow-y-auto flex flex-col"
      >
        {/* 새 여행 만들기 버튼 */}
        <button
          onClick={() => { onClose(); onCreateTrip(); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '18px 20px',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            borderBottom: '1px solid #e5e7eb',
            background: 'none',
            cursor: 'pointer',
            fontSize: 15,
            fontWeight: 600,
            color: '#111827',
            width: '100%',
            textAlign: 'left',
          }}
        >
          <span style={{ fontSize: 18 }}>+</span> 새 여행 만들기
        </button>

        <div>
          {trips.length === 0 ? (
            <p style={{ padding: '12px 20px', color: '#9ca3af', fontSize: 14 }}>
              여행이 없습니다
            </p>
          ) : (
            trips.map((trip, index) => {
              const isSelected = trip.id === selectedTripId;
              const label = formatTripDate(trip.start_date) ?? formatTripDate(trip.first_checkin_date);
              return (
                <div
                  key={trip.id}
                  style={{
                    backgroundColor: isSelected ? '#f0fdf4' : 'white',
                    padding: '5px 20px',
                  }}
                >
                  {/* 여행 제목 + 수정/삭제 버튼 행 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={() => { onSelectTrip(trip.id); onClose(); }}
                      style={{
                        flex: 1,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        padding: 0,
                        fontSize: 15,
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? '#16a34a' : '#111827',
                      }}
                    >
                      {isSelected && <span style={{ marginRight: 6 }}>✓</span>}
                      {trip.title}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onClose(); onEditTrip(trip); }}
                      style={{
                        fontSize: 11,
                        color: '#6b7280',
                        border: '1px solid #d1d5db',
                        borderRadius: 5,
                        padding: '2px 7px',
                        background: 'white',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      수정
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteTrip(trip.id); onClose(); }}
                      style={{
                        fontSize: 11,
                        color: '#ef4444',
                        border: '1px solid #fca5a5',
                        borderRadius: 5,
                        padding: '2px 7px',
                        background: 'white',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      삭제
                    </button>
                  </div>

                  {/* 날짜 */}
                  {label && (
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>
                      {label}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
