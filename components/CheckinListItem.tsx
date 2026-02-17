'use client';

import type { Checkin } from '@/types/database';

interface CheckinListItemProps {
  checkin: Checkin;
  onEdit?: (checkin: Checkin) => void;
  onDelete?: (checkinId: string) => void;
}


export function CheckinListItem({ checkin, onEdit, onDelete }: CheckinListItemProps) {

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const mapsUrl = `https://www.google.com/maps?q=${checkin.latitude},${checkin.longitude}`;

  const handleDelete = () => {
    if (window.confirm('이 체크인을 삭제하시겠습니까?')) {
      onDelete?.(checkin.id);
    }
  };

  return (
    <div>
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <div className="p-4">
            {/* 날짜 */}
            <div className="flex justify-end mb-2">
              <span className="text-xs text-gray-400">{formatDate(checkin.checked_in_at)}</span>
            </div>

            {/* 장소명 */}
            <h3 className="text-base font-bold text-gray-900 mb-3 leading-snug">
              {checkin.location_name || '이름 없는 장소'}
            </h3>

            {/* 사진 */}
            {checkin.photo_url && (
              <img
                src={checkin.photo_url}
                alt={checkin.location_name || 'Checkin photo'}
                className="w-full h-52 object-cover rounded-xl mb-3"
              />
            )}

            {/* 메모 */}
            {checkin.message && (
              <p className="text-sm text-gray-600 whitespace-pre-wrap mb-3 leading-relaxed">
                {checkin.message}
              </p>
            )}

            {/* 하단 (좌표 링크 + 액션) */}
            <div className="flex items-center justify-between mt-2">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors no-underline"
                style={{ textDecoration: 'none' }}
              >
                📍 지도에서 보기
              </a>
              {(onEdit || onDelete) && (
                <div className="flex gap-3">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(checkin)}
                      className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      수정
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={handleDelete}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
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
