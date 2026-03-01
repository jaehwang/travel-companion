'use client';

import { CHECKIN_CATEGORY_LABELS } from '@/types/database';
import type { CheckinCategory } from '@/types/database';
import type { PhotoMetadata } from '@/lib/exif';

const CATEGORY_EMOJI: Record<string, string> = {
  restaurant: '🍽️',
  attraction: '🏛️',
  accommodation: '🏨',
  cafe: '☕',
  shopping: '🛍️',
  nature: '🌿',
  activity: '🎯',
  transportation: '🚌',
  other: '📌',
};

interface CheckinFormMainPanelProps {
  title: string;
  onTitleChange: (v: string) => void;
  message: string;
  onMessageChange: (v: string) => void;
  isProcessingPhoto: boolean;
  isUploadingPhoto: boolean;
  photoPreviewUrl: string;
  photoMetadata: PhotoMetadata | null;
  onClearPhoto: () => void;
  selectedLocation: { latitude: number; longitude: number } | null;
  place: string;
  onClearLocation: () => void;
  category: string;
  onClearCategory: () => void;
  checkedInAt: string;
  onClearCheckedInAt: () => void;
  error: string | null;
  toolbarHeight: number;
}

export default function CheckinFormMainPanel({
  title,
  onTitleChange,
  message,
  onMessageChange,
  isProcessingPhoto,
  isUploadingPhoto,
  photoPreviewUrl,
  photoMetadata,
  onClearPhoto,
  selectedLocation,
  place,
  onClearLocation,
  category,
  onClearCategory,
  checkedInAt,
  onClearCheckedInAt,
  error,
  toolbarHeight,
}: CheckinFormMainPanelProps) {
  return (
    <div
      className="flex-1 overflow-y-auto px-4 pt-5"
      style={{ paddingBottom: toolbarHeight + 16 }}
    >
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="제목을 입력하세요..."
        className="w-full text-[22px] font-medium border-0 outline-none text-gray-900 mb-3 bg-transparent"
      />

      <textarea
        value={message}
        onChange={(e) => onMessageChange(e.target.value)}
        placeholder="메모를 남겨보세요..."
        rows={4}
        className="w-full text-[18px] border-0 outline-none resize-none text-gray-700 bg-transparent leading-relaxed"
      />

      {/* 사진 처리 중 */}
      {(isProcessingPhoto || isUploadingPhoto) && (
        <div className="mt-3 p-3 bg-gray-100 rounded-xl flex items-center gap-2">
          <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full" />
          <span className="text-sm text-gray-500">
            {isProcessingPhoto ? '사진 처리 중...' : '업로드 중...'}
          </span>
        </div>
      )}

      {/* 사진 미리보기 */}
      {photoPreviewUrl && !isProcessingPhoto && !isUploadingPhoto && (
        <div className="mt-3 relative">
          <img
            src={photoPreviewUrl}
            alt="사진"
            className="w-full max-h-60 object-cover rounded-xl"
          />
          <button
            onClick={onClearPhoto}
            className="absolute top-2 right-2 w-7 h-7 rounded-full border-0 bg-black/55 text-white cursor-pointer text-sm flex items-center justify-center"
          >
            ✕
          </button>
          {photoMetadata?.gps && (
            <div className="absolute bottom-2 left-2 bg-black/55 text-white text-xs px-2 py-0.5 rounded-[10px]">
              📍 GPS 추출됨
            </div>
          )}
        </div>
      )}

      {/* 선택된 정보 chips */}
      <div className="flex flex-wrap gap-2 mt-4">
        {selectedLocation && (
          <button
            onClick={onClearLocation}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-green-200 bg-green-50 text-green-700 text-[13px] cursor-pointer"
          >
            📍{' '}
            {place ||
              `${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`}
            <span className="text-green-300 ml-0.5 text-[11px]">✕</span>
          </button>
        )}
        {category && (
          <button
            onClick={onClearCategory}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-[13px] cursor-pointer"
          >
            {CATEGORY_EMOJI[category] || '🏷️'}{' '}
            {CHECKIN_CATEGORY_LABELS[category as CheckinCategory] || category}
            <span className="text-blue-300 ml-0.5 text-[11px]">✕</span>
          </button>
        )}
        {checkedInAt && (
          <button
            onClick={onClearCheckedInAt}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-purple-200 bg-purple-50 text-purple-700 text-[13px] cursor-pointer"
          >
            ⏰{' '}
            {new Intl.DateTimeFormat('ko-KR', {
              month: 'long',
              day: 'numeric',
              weekday: 'short',
              hour: '2-digit',
              minute: '2-digit',
            }).format(new Date(checkedInAt))}
            <span className="text-purple-300 ml-0.5 text-[11px]">✕</span>
          </button>
        )}
      </div>

      {/* 에러 */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
