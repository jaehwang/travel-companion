'use client';

import type { Checkin } from '@/types/database';

interface CheckinListItemProps {
  checkin: Checkin;
  onEdit?: (checkin: Checkin) => void;
  onDelete?: (checkinId: string) => void;
}

const CATEGORY_META: Record<string, { icon: string; label: string; color: string }> = {
  restaurant:     { icon: '🍽️', label: '음식점',   color: '#FF6B47' },
  cafe:           { icon: '☕',  label: '카페',     color: '#F59E0B' },
  attraction:     { icon: '🏛️', label: '명소',     color: '#3B82F6' },
  accommodation:  { icon: '🏨', label: '숙소',     color: '#8B5CF6' },
  shopping:       { icon: '🛍️', label: '쇼핑',     color: '#EC4899' },
  nature:         { icon: '🌿', label: '자연',     color: '#10B981' },
  activity:       { icon: '🎯', label: '액티비티', color: '#EF4444' },
  transportation: { icon: '🚌', label: '교통',     color: '#6B7280' },
  other:          { icon: '📍', label: '기타',     color: '#C4A882' },
};

export function CheckinListItem({ checkin, onEdit, onDelete }: CheckinListItemProps) {
  const meta = CATEGORY_META[checkin.category ?? 'other'] ?? CATEGORY_META.other;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const mapsUrl = checkin.place_id
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(checkin.place || '')}&query_place_id=${checkin.place_id}`
    : `https://www.google.com/maps?q=${checkin.latitude},${checkin.longitude}`;

  const handleDelete = () => {
    if (window.confirm('이 체크인을 삭제하시겠습니까?')) {
      onDelete?.(checkin.id);
    }
  };

  return (
    <div className="tc-checkin-card">
      <div className="flex">
        {/* 카테고리 액센트 좌측 스트립 */}
        <div className="w-[5px] shrink-0" style={{ background: meta.color }} />

        {/* 본문 */}
        <div className="flex-1 p-[14px] pb-3">
          {/* 상단 메타 — 카테고리 + 시간 */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold tracking-[0.02em]" style={{ color: meta.color }}>
              {meta.icon} {meta.label}
            </span>
            <span className="text-[11px] text-tc-warm-faint">
              {formatTime(checkin.checked_in_at)}
            </span>
          </div>

          {/* 제목 */}
          <h3 className="text-base font-black text-tc-warm-dark mb-2.5 leading-[1.3] tracking-[-0.01em]">
            {checkin.title || '이름 없는 장소'}
          </h3>

          {/* 사진 */}
          {checkin.photo_url && (
            <img
              src={checkin.photo_url}
              alt={checkin.title || 'Checkin photo'}
              className="w-full aspect-[4/3] object-cover rounded-[10px] mb-2.5 block"
            />
          )}

          {/* 메모 */}
          {checkin.message && (
            <p className="text-sm text-tc-warm-mid whitespace-pre-wrap leading-[1.65] mb-3">
              {checkin.message}
            </p>
          )}

          {/* 하단 — 장소 링크 + 액션 */}
          <div className="flex items-center justify-between mt-1">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-tc-warm-faint no-underline flex items-center gap-[3px] hover:text-tc-warm-mid transition-colors"
            >
              📍 {checkin.place || '지도에서 보기'}
            </a>
            {(onEdit || onDelete) && (
              <div className="flex gap-2.5">
                {onEdit && (
                  <button
                    onClick={() => onEdit(checkin)}
                    className="text-xs text-tc-warm-mid bg-transparent border-none cursor-pointer py-0.5 hover:text-tc-warm-dark transition-colors"
                  >
                    수정
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={handleDelete}
                    className="text-xs text-[#EF4444] bg-transparent border-none cursor-pointer py-0.5 hover:text-red-600 transition-colors"
                  >
                    삭제
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
