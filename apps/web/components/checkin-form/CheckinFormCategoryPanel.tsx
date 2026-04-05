'use client';

import { CHECKIN_CATEGORY_LABELS } from '@travel-companion/shared';
import { CATEGORY_META } from '@/lib/categoryIcons';

interface CheckinFormCategoryPanelProps {
  category: string;
  onSelectCategory: (category: string) => void;
  onClose: () => void;
}

export default function CheckinFormCategoryPanel({
  category,
  onSelectCategory,
  onClose,
}: CheckinFormCategoryPanelProps) {
  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--tc-bg)' }}>
      {/* 패널 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1.5px solid var(--tc-dot)',
      }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--tc-warm-dark)', letterSpacing: '-0.01em' }}>
          어떤 곳인가요?
        </span>
        <button
          onClick={onClose}
          style={{
            fontSize: 13, fontWeight: 600,
            color: 'var(--tc-warm-mid)',
            background: 'var(--tc-card-empty)',
            border: 'none', borderRadius: 9999,
            padding: '5px 14px', cursor: 'pointer',
          }}
        >
          닫기
        </button>
      </div>

      {/* 카테고리 그리드 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {Object.entries(CHECKIN_CATEGORY_LABELS).map(([value, label]) => {
            const isSelected = category === value;
            const meta = CATEGORY_META[value] ?? CATEGORY_META.other;
            const color = meta.color;
            const IconComponent = meta.icon;
            return (
              <button
                key={value}
                onClick={() => { onSelectCategory(value); onClose(); }}
                style={{
                  padding: '16px 8px',
                  borderRadius: 16,
                  border: `2px solid ${isSelected ? color : 'var(--tc-dot)'}`,
                  background: isSelected ? `${color}14` : 'var(--tc-card-bg)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.15s ease',
                }}
              >
                <IconComponent size={28} color={isSelected ? color : 'var(--tc-warm-mid)'} />
                <span style={{
                  fontSize: 12,
                  fontWeight: isSelected ? 800 : 500,
                  color: isSelected ? color : 'var(--tc-warm-mid)',
                  letterSpacing: '-0.01em',
                }}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
