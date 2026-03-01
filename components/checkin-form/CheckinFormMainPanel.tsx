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
        className="w-full text-[22px] font-medium border-0 outline-none text-text-main mb-3 bg-transparent"
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
          <span className="text-sm text-text-sub">
            {isProcessingPhoto ? '사진 처리 중...' : '업로드 중...'}
          </span>
        </div>
      )}

      {/* 사진 미리보기 */}
      {photoPreviewUrl && !isProcessingPhoto && !isUploadingPhoto && (
        <div className="mt-3">
          <div
            onClick={onClearPhoto}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] cursor-pointer select-none mb-2"
            style={{ backgroundColor: '#e5e7eb', color: '#4b5563' }}
          >
            <span>사진 삭제</span>
            <span style={{ color: '#9ca3af', fontSize: '11px' }}>✕</span>
          </div>
          <img
            src={photoPreviewUrl}
            alt="사진"
            className="w-full max-h-60 object-cover rounded-xl"
          />
        </div>
      )}

      {/* 선택된 정보 chips */}
      <div className="flex flex-wrap gap-2 mt-4">
        {selectedLocation && (
          <div
            onClick={onClearLocation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] cursor-pointer select-none"
            style={{ backgroundColor: '#e5e7eb', color: '#4b5563' }}
          >
            <span>📍 {place || (photoMetadata?.gps ? 'GPS 추출됨' : `${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`)}</span>
            <span style={{ color: '#9ca3af', fontSize: '11px' }}>✕</span>
          </div>
        )}
        {category && (
          <div
            onClick={onClearCategory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] cursor-pointer select-none"
            style={{ backgroundColor: '#e5e7eb', color: '#4b5563' }}
          >
            <span>{CATEGORY_EMOJI[category] || '🏷️'} {CHECKIN_CATEGORY_LABELS[category as CheckinCategory] || category}</span>
            <span style={{ color: '#9ca3af', fontSize: '11px' }}>✕</span>
          </div>
        )}
        {checkedInAt && (
          <div
            onClick={onClearCheckedInAt}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] cursor-pointer select-none"
            style={{ backgroundColor: '#e5e7eb', color: '#4b5563' }}
          >
            <span>
              ⏰{' '}
              {new Intl.DateTimeFormat('ko-KR', {
                month: 'long',
                day: 'numeric',
                weekday: 'short',
                hour: '2-digit',
                minute: '2-digit',
              }).format(new Date(checkedInAt))}
            </span>
            <span style={{ color: '#9ca3af', fontSize: '11px' }}>✕</span>
          </div>
        )}
      </div>

      {/* 에러 */}
      {error && (
        <div className="mt-3 p-3 bg-danger-bg border border-red-200 rounded-lg">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}
    </div>
  );
}
