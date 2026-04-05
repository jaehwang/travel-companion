'use client';

import { ChangeEvent } from 'react';
import { Camera, MapPin, Tag, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
  htmlFor,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick?: () => void;
  htmlFor?: string;
}) {
  const color = disabled ? '#d1d5db' : active ? ACTIVE_COLOR : INACTIVE_COLOR;
  const bg = active ? 'rgba(255,107,71,0.1)' : 'transparent';

  const inner = (
    <span className="flex flex-col items-center gap-[3px]">
      <Icon size={26} color={color} />
      <span className="text-[10px] font-semibold tracking-[0.02em]" style={{ color }}>{label}</span>
    </span>
  );

  const baseClass = 'flex items-center justify-center w-[60px] h-[60px] rounded-[14px] shrink-0 transition-[background] duration-150';

  if (htmlFor) {
    return (
      <label
        htmlFor={htmlFor}
        className={`${baseClass} cursor-pointer`}
        style={{ background: bg }}
      >
        {inner}
      </label>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClass} border-none ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
      style={{ background: bg }}
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
      className="fixed left-0 right-0 z-[10000] bg-[var(--tc-card-bg)] border-t-[1.5px] border-[var(--tc-dot)] px-3 py-2 flex items-center gap-1 min-h-[80px]"
      style={{ bottom: toolbarBottom }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
        id="checkin-photo-input"
      />

      <ToolbarBtn
        icon={Camera}
        label="사진"
        active={!!photoPreviewUrl}
        htmlFor="checkin-photo-input"
      />
      <ToolbarBtn
        icon={MapPin}
        label="장소"
        active={!!selectedLocation}
        disabled={!onOpenLocationPicker}
        onClick={onOpenLocationPicker}
      />
      <ToolbarBtn
        icon={Tag}
        label="분류"
        active={hasCategory}
        onClick={onOpenCategory}
      />
      <ToolbarBtn
        icon={Clock}
        label="시각"
        active={!!checkedInAt}
        onClick={onOpenTime}
      />
    </div>
  );
}
