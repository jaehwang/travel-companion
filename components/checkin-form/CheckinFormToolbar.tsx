'use client';

import { ChangeEvent } from 'react';

interface CheckinFormToolbarProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  photoPreviewUrl: string;
  selectedLocation: { latitude: number; longitude: number } | null;
  hasCategory: boolean;
  checkedInAt: string;
  toolbarBottom: number;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onOpenLocationPicker?: () => void;
  onOpenCategory: () => void;
  onOpenTime: () => void;
}

const ACTIVE_COLOR = '#FF6B47';
const INACTIVE_COLOR = 'var(--tc-warm-faint)';

function ToolbarBtn({
  emoji,
  label,
  active,
  disabled,
  onClick,
  htmlFor,
}: {
  emoji: string;
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick?: () => void;
  htmlFor?: string;
}) {
  const color = disabled ? '#d1d5db' : active ? ACTIVE_COLOR : INACTIVE_COLOR;
  const bg = active ? 'rgba(255,107,71,0.1)' : 'transparent';

  const inner = (
    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <span style={{ fontSize: 26, lineHeight: 1 }}>{emoji}</span>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.02em', color }}>{label}</span>
    </span>
  );

  if (htmlFor) {
    return (
      <label
        htmlFor={htmlFor}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 60, height: 60, borderRadius: 14,
          background: bg,
          cursor: 'pointer',
          transition: 'background 0.15s',
          flexShrink: 0,
        }}
      >
        {inner}
      </label>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 60, height: 60, borderRadius: 14,
        background: bg,
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'background 0.15s',
        flexShrink: 0,
      }}
    >
      {inner}
    </button>
  );
}

export default function CheckinFormToolbar({
  fileInputRef,
  photoPreviewUrl,
  selectedLocation,
  hasCategory,
  checkedInAt,
  toolbarBottom,
  onFileChange,
  onOpenLocationPicker,
  onOpenCategory,
  onOpenTime,
}: CheckinFormToolbarProps) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: toolbarBottom,
        left: 0, right: 0,
        zIndex: 10000,
        background: 'var(--tc-card-bg)',
        borderTop: '1.5px solid var(--tc-dot)',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        minHeight: 80,
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        style={{ display: 'none' }}
        id="checkin-photo-input"
      />

      <ToolbarBtn
        emoji="📷"
        label="사진"
        active={!!photoPreviewUrl}
        htmlFor="checkin-photo-input"
      />
      <ToolbarBtn
        emoji="📍"
        label="장소"
        active={!!selectedLocation}
        disabled={!onOpenLocationPicker}
        onClick={onOpenLocationPicker}
      />
      <ToolbarBtn
        emoji="🏷️"
        label="분류"
        active={hasCategory}
        onClick={onOpenCategory}
      />
      <ToolbarBtn
        emoji="⏰"
        label="시각"
        active={!!checkedInAt}
        onClick={onOpenTime}
      />
    </div>
  );
}
