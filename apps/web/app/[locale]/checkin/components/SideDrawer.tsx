'use client';

import { createPortal } from 'react-dom';
import { Star, MapPin } from 'lucide-react';
import type { Trip } from '@travel-companion/shared';
import { formatTripDate } from '@travel-companion/shared';
import { DropdownMenu } from '@/components/DropdownMenu';
import { APP_NAME } from '@/lib/config';

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
      {/* 배경 딤 */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(45, 36, 22, 0.45)' }}
        onClick={onClose}
      />

      {/* 드로어 패널 */}
      <div
        className="tc-drawer-panel"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '80%',
          maxWidth: 320,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 헤더 */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1.5px solid var(--tc-dot)',
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--tc-warm-faint)', letterSpacing: '0.08em', marginBottom: 2 }}>
            MY TRIPS
          </p>
          <p className="tc-brand" style={{ fontSize: 20 }}>{APP_NAME}</p>
        </div>

        {/* 새 여행 만들기 */}
        <button
          onClick={() => { onClose(); onCreateTrip(); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '16px 20px',
            background: 'none',
            border: 'none',
            borderBottom: '1.5px solid var(--tc-dot)',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 700,
            color: '#FF6B47',
            width: '100%',
            textAlign: 'left',
          }}
        >
          <span style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: '#FF6B47',
            color: 'white',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 700,
            flexShrink: 0,
          }}>+</span>
          새 여행 만들기
        </button>

        {/* 여행 목록 */}
        <div style={{ flex: 1 }}>
          {trips.length === 0 ? (
            <p style={{ padding: '20px', color: 'var(--tc-warm-faint)', fontSize: 13 }}>
              여행이 없습니다
            </p>
          ) : (
            trips.map((trip) => {
              const isSelected = trip.id === selectedTripId;
              const label = formatTripDate(trip.start_date) ?? formatTripDate(trip.first_checkin_date);
              return (
                <div
                  key={trip.id}
                  style={{
                    borderBottom: '1px solid var(--tc-dot)',
                    background: isSelected ? 'rgba(255,107,71,0.07)' : 'transparent',
                  }}
                >
                  {/* 여행 선택 버튼 + 더보기 */}
                  <div style={{ display: 'flex', alignItems: 'center', padding: '12px 12px 4px 20px' }}>
                    {isSelected && (
                      <div style={{
                        width: 4,
                        height: 20,
                        background: '#FF6B47',
                        borderRadius: 2,
                        marginRight: 10,
                        flexShrink: 0,
                      }} />
                    )}
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
                        fontWeight: isSelected ? 800 : 500,
                        color: isSelected ? '#FF6B47' : 'var(--tc-warm-dark)',
                        letterSpacing: '-0.01em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {trip.is_frequent && (
                        <Star size={13} color="#F59E0B" fill="#F59E0B" style={{ flexShrink: 0 }} />
                      )}
                      {trip.title}
                    </button>
                    <DropdownMenu
                      align="right"
                      items={[
                        { label: '수정', onClick: () => { onClose(); onEditTrip(trip); } },
                        { label: '삭제', onClick: () => { onDeleteTrip(trip.id); onClose(); }, variant: 'danger' },
                      ]}
                    />
                  </div>

                  {/* 날짜 + 장소 */}
                  <div style={{ display: 'flex', alignItems: 'center', padding: '2px 20px 12px', paddingLeft: isSelected ? 34 : 20 }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {label && (
                        <span style={{ fontSize: 11, color: 'var(--tc-warm-faint)' }}>
                          {label}
                        </span>
                      )}
                      {trip.place && (
                        <span style={{ fontSize: 11, color: 'var(--tc-warm-faint)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <MapPin size={12} />{trip.place}
                        </span>
                      )}
                    </div>
                  </div>
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
