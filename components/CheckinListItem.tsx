'use client';

import { CHECKIN_CATEGORY_LABELS } from '@/types/database';
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
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getCategoryLabel = (category?: string) => {
    if (!category) return null;
    return CHECKIN_CATEGORY_LABELS[category as keyof typeof CHECKIN_CATEGORY_LABELS];
  };

  const getCategoryColor = (category?: string) => {
    if (!category) return 'bg-gray-100 text-gray-700';

    const colors: Record<string, string> = {
      restaurant: 'bg-orange-100 text-orange-700',
      attraction: 'bg-purple-100 text-purple-700',
      accommodation: 'bg-blue-100 text-blue-700',
      cafe: 'bg-yellow-100 text-yellow-700',
      shopping: 'bg-pink-100 text-pink-700',
      nature: 'bg-green-100 text-green-700',
      activity: 'bg-red-100 text-red-700',
      transportation: 'bg-indigo-100 text-indigo-700',
      other: 'bg-gray-100 text-gray-700',
    };

    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const handleDelete = () => {
    if (window.confirm('이 체크인을 삭제하시겠습니까?')) {
      onDelete?.(checkin.id);
    }
  };

  const categoryLabel = getCategoryLabel(checkin.category);
  const categoryColor = getCategoryColor(checkin.category);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {checkin.location_name || '이름 없는 장소'}
          </h3>
          {categoryLabel && (
            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${categoryColor}`}>
              {categoryLabel}
            </span>
          )}
        </div>
        {(onEdit || onDelete) && (
          <div className="flex gap-2 ml-2 shrink-0">
            {onEdit && (
              <button
                onClick={() => onEdit(checkin)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                수정
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
              >
                삭제
              </button>
            )}
          </div>
        )}
      </div>

      {checkin.message && (
        <p className="text-gray-700 mb-2 whitespace-pre-wrap">{checkin.message}</p>
      )}

      <div className="text-sm text-gray-500 space-y-1">
        <p>
          📍 {checkin.latitude.toFixed(6)}, {checkin.longitude.toFixed(6)}
        </p>
        <p>🕐 {formatDate(checkin.checked_in_at)}</p>
      </div>

      {checkin.photo_url && (
        <div className="mt-3">
          <img
            src={checkin.photo_url}
            alt={checkin.location_name || 'Checkin photo'}
            className="w-full h-48 object-cover rounded-md"
          />
        </div>
      )}
    </div>
  );
}
