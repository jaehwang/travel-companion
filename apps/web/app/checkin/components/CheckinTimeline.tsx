'use client';

import { Map } from 'lucide-react';
import { CheckinListItem } from '@/components/CheckinListItem';
import type { Checkin } from '@travel-companion/shared';

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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-tc-warm-dark tracking-[-0.01em]">
          기록{' '}
          <span className="text-sm font-normal text-tc-warm-faint">
            {checkins.length}곳
          </span>
        </h2>
        {checkins.length > 0 && (
          <button
            onClick={onSortChange}
            className="text-xs font-semibold text-tc-warm-mid bg-tc-card-empty border-none rounded-full px-3 py-[5px] cursor-pointer tracking-[0.01em]"
          >
            {sortOrder === 'desc' ? '최신순 ↓' : '오래된순 ↑'}
          </button>
        )}
      </div>

      {/* 빈 상태 */}
      {checkins.length === 0 && (
        <div className="text-center py-12">
          <div className="flex justify-center mb-3.5"><Map size={48} color="#C4B49A" /></div>
          <p className="text-base font-extrabold text-tc-warm-dark mb-1.5">
            아직 체크인이 없어요
          </p>
          <p className="text-[13px] text-tc-warm-mid">
            아래 + 버튼을 눌러 첫 순간을 기록해보세요
          </p>
        </div>
      )}

      {/* 타임라인 */}
      {sorted.length > 0 && (() => {
        // 날짜별 그룹핑
        const groups: { dateKey: string; dateStr: string; items: typeof sorted }[] = [];
        for (const checkin of sorted) {
          const dateKey = new Date(checkin.checked_in_at).toDateString();
          const last = groups[groups.length - 1];
          if (last && last.dateKey === dateKey) {
            last.items.push(checkin);
          } else {
            groups.push({ dateKey, dateStr: checkin.checked_in_at, items: [checkin] });
          }
        }

        return (
          <div className="flex flex-col">
            {groups.map((group, gi) => (
              <div key={group.dateKey} className={gi > 0 ? 'mt-7' : ''}>
                {/* 날짜 구분선 */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full shrink-0 bg-[#FF6B47]" />
                  <span className="text-xs font-bold text-tc-warm-mid whitespace-nowrap tracking-[0.02em]">
                    {formatDateHeader(group.dateStr)}
                  </span>
                  <div className="flex-1 h-px bg-tc-dot" />
                </div>

                {/* 체크인 카드 그리드 */}
                <div className="checkin-grid">
                  {group.items.map((checkin) => (
                    <CheckinListItem key={checkin.id} checkin={checkin} onEdit={onEdit} onDelete={onDelete} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
