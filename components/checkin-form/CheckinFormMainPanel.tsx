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

const CATEGORY_COLORS: Record<string, string> = {
  restaurant: '#FF6B47',
  cafe: '#F59E0B',
  attraction: '#3B82F6',
  accommodation: '#8B5CF6',
  shopping: '#EC4899',
  nature: '#10B981',
  activity: '#EF4444',
  transportation: '#6B7280',
  other: '#C4A882',
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
  const catColor = CATEGORY_COLORS[category] ?? '#C4A882';

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ padding: '20px 20px 0', paddingBottom: toolbarHeight + 16 }}
    >
      {/* 제목 입력 */}
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="어디에 다녀왔나요?"
        style={{
          width: '100%',
          fontSize: 24,
          fontWeight: 800,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          color: 'var(--tc-warm-dark)',
          marginBottom: 14,
          letterSpacing: '-0.02em',
          lineHeight: 1.3,
        }}
      />

      {/* 구분선 */}
      <div style={{ height: 1.5, background: 'var(--tc-dot)', marginBottom: 14 }} />

      {/* 메모 입력 */}
      <textarea
        value={message}
        onChange={(e) => onMessageChange(e.target.value)}
        placeholder="이 순간을 기록해보세요..."
        rows={4}
        style={{
          width: '100%',
          fontSize: 17,
          border: 'none',
          outline: 'none',
          resize: 'none',
          background: 'transparent',
          color: 'var(--tc-warm-mid)',
          lineHeight: 1.7,
        }}
      />

      {/* 사진 처리 중 */}
      {(isProcessingPhoto || isUploadingPhoto) && (
        <div style={{
          marginTop: 14,
          padding: '10px 14px',
          background: 'var(--tc-card-empty)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{
            width: 16, height: 16,
            border: '2px solid #FF6B47',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <span style={{ fontSize: 13, color: 'var(--tc-warm-mid)' }}>
            {isProcessingPhoto ? '사진 처리 중...' : '업로드 중...'}
          </span>
        </div>
      )}

      {/* 사진 미리보기 */}
      {photoPreviewUrl && !isProcessingPhoto && !isUploadingPhoto && (
        <div style={{ marginTop: 14 }}>
          <button
            onClick={onClearPhoto}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
              borderRadius: 9999,
              background: 'rgba(255,107,71,0.1)',
              color: '#FF6B47',
              fontSize: 12,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              marginBottom: 8,
            }}
          >
            📷 사진 삭제 ✕
          </button>
          <img
            src={photoPreviewUrl}
            alt="사진"
            style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 14, display: 'block' }}
          />
        </div>
      )}

      {/* 선택된 정보 chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
        {selectedLocation && (
          <button
            onClick={onClearLocation}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 9999,
              background: 'rgba(255,107,71,0.1)',
              color: '#FF6B47',
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            📍 {place || (photoMetadata?.gps ? 'GPS 추출됨' : `${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`)}
            <span style={{ fontSize: 11, opacity: 0.7 }}>✕</span>
          </button>
        )}
        {category && (
          <button
            onClick={onClearCategory}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 9999,
              background: `${catColor}18`,
              color: catColor,
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {CATEGORY_EMOJI[category] || '🏷️'} {CHECKIN_CATEGORY_LABELS[category as CheckinCategory] || category}
            <span style={{ fontSize: 11, opacity: 0.7 }}>✕</span>
          </button>
        )}
        {checkedInAt && (
          <button
            onClick={onClearCheckedInAt}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 9999,
              background: 'rgba(139,92,246,0.1)',
              color: '#8B5CF6',
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            ⏰{' '}
            {new Intl.DateTimeFormat('ko-KR', {
              month: 'long', day: 'numeric',
              weekday: 'short', hour: '2-digit', minute: '2-digit',
            }).format(new Date(checkedInAt))}
            <span style={{ fontSize: 11, opacity: 0.7 }}>✕</span>
          </button>
        )}
      </div>

      {/* 에러 */}
      {error && (
        <div style={{
          marginTop: 14,
          padding: '10px 14px',
          background: '#FFF5F5',
          border: '1px solid #fca5a5',
          borderRadius: 12,
        }}>
          <p style={{ fontSize: 13, color: '#DC2626' }}>{error}</p>
        </div>
      )}
    </div>
  );
}
