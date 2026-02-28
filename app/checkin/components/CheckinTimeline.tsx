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
      <div className="flex items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900 flex-1">
          기록 <span className="text-base font-normal text-gray-400">{checkins.length}곳</span>
        </h2>
        {checkins.length > 0 && (
          <button
            onClick={onSortChange}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            {sortOrder === 'desc' ? '최신순 ↓' : '오래된순 ↑'}
          </button>
        )}
      </div>

      {checkins.length > 0 ? (
        <div>
          {sorted.map((checkin, index) => {
            const currentDate = new Date(checkin.checked_in_at).toDateString();
            const prevDate = index > 0 ? new Date(sorted[index - 1].checked_in_at).toDateString() : null;
            const showDateHeader = currentDate !== prevDate;
            const isLast = index === sorted.length - 1;

            return (
              <div key={checkin.id}>
                {showDateHeader && (
                  <div className={`flex items-center gap-2 mb-4 ${index > 0 ? 'mt-2' : ''}`}>
                    <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
                      {formatDateHeader(checkin.checked_in_at)}
                    </span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                )}
                <CheckinListItem checkin={checkin} onEdit={onEdit} onDelete={onDelete} />
                {!isLast && <hr className="my-6 border-gray-200" />}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🗺️</p>
          <p className="text-gray-500 font-medium mb-1">아직 체크인이 없습니다</p>
          <p className="text-gray-400 text-sm">아래 + 버튼을 눌러 첫 체크인을 기록해보세요!</p>
        </div>
      )}
    </div>
  );
}
