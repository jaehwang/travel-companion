'use client';

import { CheckinListItem } from '@/components/CheckinListItem';
import type { Checkin } from '@/types/database';

interface CheckinTimelineProps {
  checkins: Checkin[];
  sortOrder: 'desc' | 'asc';
  onSortChange: () => void;
  onEdit: (checkin: Checkin) => void;
  onDelete: (id: string) => void;
}

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const weekday = new Intl.DateTimeFormat('ko-KR', { weekday: 'short' }).format(d);
  if (d.toDateString() === today.toDateString()) return `오늘 (${weekday})`;
  if (d.toDateString() === yesterday.toDateString()) return `어제 (${weekday})`;
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(d);
}

export default function CheckinTimeline({
  checkins,
  sortOrder,
  onSortChange,
  onEdit,
  onDelete,
}: CheckinTimelineProps) {
  const sorted = [...checkins].sort((a, b) => {
    const diff = new Date(a.checked_in_at).getTime() - new Date(b.checked_in_at).getTime();
    return sortOrder === 'desc' ? -diff : diff;
  });

  return (
    <div>
      {/* 섹션 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--tc-warm-dark)', letterSpacing: '-0.01em' }}>
          기록{' '}
          <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--tc-warm-faint)' }}>
            {checkins.length}곳
          </span>
        </h2>
        {checkins.length > 0 && (
          <button
            onClick={onSortChange}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--tc-warm-mid)',
              background: 'var(--tc-card-empty)',
              border: 'none',
              borderRadius: 20,
              padding: '5px 12px',
              cursor: 'pointer',
              letterSpacing: '0.01em',
            }}
          >
            {sortOrder === 'desc' ? '최신순 ↓' : '오래된순 ↑'}
          </button>
        )}
      </div>

      {/* 빈 상태 */}
      {checkins.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>🗺️</div>
          <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--tc-warm-dark)', marginBottom: 6 }}>
            아직 체크인이 없어요
          </p>
          <p style={{ fontSize: 13, color: 'var(--tc-warm-mid)' }}>
            아래 + 버튼을 눌러 첫 순간을 기록해보세요
          </p>
        </div>
      )}

      {/* 타임라인 */}
      {sorted.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {sorted.map((checkin, index) => {
            const currentDate = new Date(checkin.checked_in_at).toDateString();
            const prevDate = index > 0 ? new Date(sorted[index - 1].checked_in_at).toDateString() : null;
            const showDateHeader = currentDate !== prevDate;

            return (
              <div key={checkin.id}>
                {/* 날짜 구분선 */}
                {showDateHeader && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: index > 0 ? 28 : 0,
                    marginBottom: 12,
                  }}>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#FF6B47',
                      flexShrink: 0,
                    }} />
                    <span style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--tc-warm-mid)',
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.02em',
                    }}>
                      {formatDateHeader(checkin.checked_in_at)}
                    </span>
                    <div style={{ flex: 1, height: 1, background: 'var(--tc-dot)' }} />
                  </div>
                )}

                {/* 체크인 카드 */}
                <div style={{ marginBottom: 10 }}>
                  <CheckinListItem checkin={checkin} onEdit={onEdit} onDelete={onDelete} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
