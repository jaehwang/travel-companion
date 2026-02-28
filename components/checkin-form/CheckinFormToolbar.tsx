'use client';

import { ChangeEvent } from 'react';

interface CheckinFormToolbarProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  photoPreviewUrl: string;
  hasPlaceFromSearch: boolean;
  selectedLocation: { latitude: number; longitude: number } | null;
  hasCategory: boolean;
  checkedInAt: string;
  toolbarBottom: number;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onOpenPlaceSearch: () => void;
  onOpenLocationPicker?: () => void;
  onOpenCategory: () => void;
  onCheckedInAtChange: (v: string) => void;
}

export default function CheckinFormToolbar({
  fileInputRef,
  photoPreviewUrl,
  hasPlaceFromSearch,
  selectedLocation,
  hasCategory,
  checkedInAt,
  toolbarBottom,
  onFileChange,
  onOpenPlaceSearch,
  onOpenLocationPicker,
  onOpenCategory,
  onCheckedInAtChange,
}: CheckinFormToolbarProps) {
  return (
    <div
      style={{ position: 'fixed', bottom: toolbarBottom, left: 0, right: 0, zIndex: 10000, backgroundColor: 'white', borderTop: '1px solid #e5e7eb' }}
      className="px-4 py-2 flex items-center gap-1 min-h-[80px]"
    >
      {/* 사진 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
        id="checkin-photo-input"
      />
      <label
        htmlFor="checkin-photo-input"
        style={{ color: photoPreviewUrl ? '#16a34a' : '#6b7280' }}
        className="flex items-center justify-center w-16 h-16 rounded-full cursor-pointer text-4xl shrink-0"
        title="사진 추가"
      >
        📷
      </label>

      {/* 장소 검색 */}
      <button
        onClick={onOpenPlaceSearch}
        style={{ color: selectedLocation && hasPlaceFromSearch ? '#16a34a' : '#6b7280' }}
        className="flex items-center justify-center w-16 h-16 rounded-full border-0 bg-transparent cursor-pointer text-4xl shrink-0"
        title="장소 검색"
      >
        📍
      </button>

      {/* 지도에서 선택 */}
      <button
        onClick={onOpenLocationPicker}
        disabled={!onOpenLocationPicker}
        style={{ color: selectedLocation && !hasPlaceFromSearch ? '#16a34a' : '#6b7280' }}
        className={`flex items-center justify-center w-16 h-16 rounded-full border-0 bg-transparent text-4xl shrink-0 ${
          onOpenLocationPicker ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-40'
        }`}
        title="지도에서 위치 선택"
      >
        🗺️
      </button>

      {/* 카테고리 */}
      <button
        onClick={onOpenCategory}
        style={{ color: hasCategory ? '#1d4ed8' : '#6b7280' }}
        className="flex items-center justify-center w-16 h-16 rounded-full border-0 bg-transparent cursor-pointer text-4xl shrink-0"
        title="카테고리 선택"
      >
        🏷️
      </button>

      {/* 시각 지정 */}
      <div className="relative w-16 h-16 shrink-0">
        <div
          style={{ color: checkedInAt ? '#7c3aed' : '#6b7280' }}
          className="flex items-center justify-center w-full h-full text-4xl pointer-events-none"
        >
          ⏰
        </div>
        <input
          type="datetime-local"
          value={checkedInAt}
          onChange={(e) => onCheckedInAtChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          title="시각 지정"
        />
      </div>
    </div>
  );
}
