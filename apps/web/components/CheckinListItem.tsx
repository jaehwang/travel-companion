'use client';

import Image from 'next/image';
import { MapPin } from 'lucide-react';
import type { Checkin } from '@travel-companion/shared';
import { DropdownMenu } from '@/components/DropdownMenu';
import { CATEGORY_META } from '@/lib/categoryIcons';

interface CheckinListItemProps {
  checkin: Checkin;
  onEdit?: (checkin: Checkin) => void;
  onDelete?: (checkinId: string) => void;
}

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
          {/* 상단 메타 — 카테고리 + 시간 + 더보기 */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold tracking-[0.02em] flex items-center gap-1" style={{ color: meta.color }}>
              <meta.icon size={12} color={meta.color} />
              {meta.label}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-tc-warm-faint">
                {formatTime(checkin.checked_in_at)}
              </span>
              {(onEdit || onDelete) && (
                <DropdownMenu
                  align="right"
                  items={[
                    ...(onEdit ? [{ label: '수정', onClick: () => onEdit(checkin) }] : []),
                    ...(onDelete ? [{ label: '삭제', onClick: handleDelete, variant: 'danger' as const }] : []),
                  ]}
                />
              )}
            </div>
          </div>

          {/* 제목 */}
          <h3 className="text-base font-black text-tc-warm-dark mb-2.5 leading-[1.3] tracking-[-0.01em]">
            {checkin.title || '이름 없는 장소'}
          </h3>

          {/* 사진 */}
          {checkin.photo_url && (
            <div className="relative w-full aspect-[4/3] rounded-[10px] mb-2.5 overflow-hidden">
              <Image
                src={checkin.photo_url}
                alt={checkin.title || 'Checkin photo'}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          )}

          {/* 메모 */}
          {checkin.message && (
            <p className="text-sm text-tc-warm-mid whitespace-pre-wrap leading-[1.65] mb-3">
              {checkin.message}
            </p>
          )}

          {/* 하단 — 장소 링크 */}
          <div className="flex items-center mt-1">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-tc-warm-faint no-underline flex items-center gap-[3px] hover:text-tc-warm-mid transition-colors"
            >
              <MapPin size={11} color="#C4B49A" style={{ flexShrink: 0 }} />
              <span>{checkin.place || '지도에서 보기'}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
