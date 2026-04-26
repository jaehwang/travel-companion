'use client';

import Image from 'next/image';
import { Plane } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CheckinFormHeaderProps {
  userAvatarUrl?: string;
  tripName?: string;
  isEditMode: boolean;
  isSubmitting: boolean;
  canSubmit: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

export default function CheckinFormHeader({
  userAvatarUrl,
  tripName,
  isEditMode,
  isSubmitting,
  canSubmit,
  onCancel,
  onSubmit,
}: CheckinFormHeaderProps) {
  const t = useTranslations('checkin');
  const tc = useTranslations('common');

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '12px 16px',
      borderBottom: '1.5px solid var(--tc-dot)',
      gap: 10,
      flexShrink: 0,
      background: 'var(--tc-bg)',
    }}>
      {/* 아바타 + 여행명 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        {userAvatarUrl ? (
          <Image
            src={userAvatarUrl}
            alt=""
            width={30}
            height={30}
            style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--tc-dot)' }}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'var(--tc-card-empty)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Plane size={16} color="#FF6B47" />
          </div>
        )}
        <span style={{
          fontSize: 15,
          fontWeight: 700,
          color: 'var(--tc-warm-dark)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          letterSpacing: '-0.01em',
        }}>
          {tripName || t('title')}
        </span>
      </div>

      {/* 취소 */}
      <button
        onClick={onCancel}
        style={{
          padding: '8px 16px',
          borderRadius: 9999,
          background: 'var(--tc-card-empty)',
          color: 'var(--tc-warm-mid)',
          fontWeight: 700,
          fontSize: 14,
          border: 'none',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {tc('cancel')}
      </button>

      {/* 저장 */}
      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        style={{
          padding: '8px 18px',
          borderRadius: 9999,
          background: canSubmit ? '#FF6B47' : 'var(--tc-card-empty)',
          color: canSubmit ? 'white' : 'var(--tc-warm-faint)',
          fontWeight: 700,
          fontSize: 14,
          border: 'none',
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          boxShadow: canSubmit ? '0 3px 10px rgba(255,107,71,0.4)' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        {isSubmitting ? `${tc('save')}...` : isEditMode ? t('update') : t('submit')}
      </button>
    </div>
  );
}
