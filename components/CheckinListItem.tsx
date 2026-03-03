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
      <div style={{ display: 'flex' }}>
        {/* 카테고리 액센트 좌측 스트립 */}
        <div style={{ width: 5, background: meta.color, flexShrink: 0 }} />

        {/* 본문 */}
        <div style={{ flex: 1, padding: '14px 14px 12px' }}>
          {/* 상단 메타 — 카테고리 + 시간 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: meta.color, letterSpacing: '0.02em' }}>
              {meta.icon} {meta.label}
            </span>
            <span style={{ fontSize: 11, color: 'var(--tc-warm-faint)' }}>
              {formatTime(checkin.checked_in_at)}
            </span>
          </div>

          {/* 제목 */}
          <h3 style={{
            fontSize: 16,
            fontWeight: 900,
            color: 'var(--tc-warm-dark)',
            marginBottom: 10,
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
          }}>
            {checkin.title || '이름 없는 장소'}
          </h3>

          {/* 사진 */}
          {checkin.photo_url && (
            <img
              src={checkin.photo_url}
              alt={checkin.title || 'Checkin photo'}
              style={{
                width: '100%',
                aspectRatio: '4/3',
                objectFit: 'cover',
                borderRadius: 10,
                marginBottom: 10,
                display: 'block',
              }}
            />
          )}

          {/* 메모 */}
          {checkin.message && (
            <p style={{
              fontSize: 14,
              color: 'var(--tc-warm-mid)',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.65,
              marginBottom: 12,
            }}>
              {checkin.message}
            </p>
          )}

          {/* 하단 — 장소 링크 + 액션 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 12,
                color: 'var(--tc-warm-faint)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              📍 {checkin.place || '지도에서 보기'}
            </a>
            {(onEdit || onDelete) && (
              <div style={{ display: 'flex', gap: 10 }}>
                {onEdit && (
                  <button
                    onClick={() => onEdit(checkin)}
                    style={{
                      fontSize: 12,
                      color: 'var(--tc-warm-mid)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px 0',
                    }}
                  >
                    수정
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={handleDelete}
                    style={{
                      fontSize: 12,
                      color: '#EF4444',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px 0',
                    }}
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
