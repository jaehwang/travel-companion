'use client';

import { Camera, MapPin, X, Clock } from 'lucide-react';

interface PhotoSectionProps {
  isProcessingPhoto: boolean;
  isUploadingPhoto: boolean;
  photoPreviewUrl: string;
  onClearPhoto: () => void;
}

function PhotoSection({ isProcessingPhoto, isUploadingPhoto, photoPreviewUrl, onClearPhoto }: PhotoSectionProps) {
  if (isProcessingPhoto || isUploadingPhoto) {
    return (
      <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--tc-card-empty)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 16, height: 16, border: '2px solid #FF6B47', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: 13, color: 'var(--tc-warm-mid)' }}>
          {isProcessingPhoto ? '사진 처리 중...' : '업로드 중...'}
        </span>
      </div>
    );
  }
  if (!photoPreviewUrl) return null;
  return (
    <div style={{ marginTop: 14 }}>
      <button onClick={onClearPhoto} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 9999, background: 'rgba(255,107,71,0.1)', color: '#FF6B47', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', marginBottom: 8 }}>
        <Camera size={13} />사진 삭제<X size={11} />
      </button>
      {/* blob URL일 수 있으므로 next/image 사용 불가 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photoPreviewUrl} alt="사진" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 14, display: 'block' }} />
    </div>
  );
}
import { CHECKIN_CATEGORY_LABELS } from '@travel-companion/shared';
import type { CheckinCategory } from '@travel-companion/shared';
import type { PhotoMetadata } from '@/lib/exif';
import { CATEGORY_META } from '@/lib/categoryIcons';

interface CheckinFormMainPanelProps {
  title: string;
  onTitleChange: (v: string) => void;
  message: string;
  onMessageChange: (v: string) => void;
  isProcessingPhoto: boolean;
  isUploadingPhoto: boolean;
  photoPreviewUrl: string;
  // photoMetadata: 사진 처리 플로우에서 추출한 EXIF 메타데이터.
  // 위치 chip 표시 시 GPS 추출 여부를 구분하는 데 사용한다.
  // (place명이 없어도 "GPS 추출됨" 라벨을 보여주기 위해 필요)
  photoMetadata: PhotoMetadata | null;
  onClearPhoto: () => void;
  selectedLocation: { latitude: number; longitude: number } | null;
  // place: 장소 검색("장소 입력")으로 선택한 경우에만 저장되는 공식 장소명.
  // 사용자가 직접 입력하는 체크인 제목(title)과는 다른 필드다.
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
  const catMeta = CATEGORY_META[category] ?? CATEGORY_META.other;
  const catColor = catMeta.color;
  const CatIcon = catMeta.icon;

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

      <PhotoSection
        isProcessingPhoto={isProcessingPhoto}
        isUploadingPhoto={isUploadingPhoto}
        photoPreviewUrl={photoPreviewUrl}
        onClearPhoto={onClearPhoto}
      />

      {/* 선택된 정보 chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
        {selectedLocation && (
          <button onClick={onClearLocation} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 9999, background: 'rgba(255,107,71,0.1)', color: '#FF6B47', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            <MapPin size={13} />
            {place || (photoMetadata?.gps ? 'GPS 추출됨' : `${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`)}
            <X size={11} style={{ opacity: 0.7 }} />
          </button>
        )}
        {category && (
          <button onClick={onClearCategory} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 9999, background: `${catColor}18`, color: catColor, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            <CatIcon size={12} color={catColor} />
            {CHECKIN_CATEGORY_LABELS[category as CheckinCategory] || category}
            <X size={11} style={{ opacity: 0.7 }} />
          </button>
        )}
        {checkedInAt && (
          <button onClick={onClearCheckedInAt} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 9999, background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            <Clock size={13} />
            {new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(checkedInAt))}
            <X size={11} style={{ opacity: 0.7 }} />
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
