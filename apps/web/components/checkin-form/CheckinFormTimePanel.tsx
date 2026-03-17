'use client';

interface CheckinFormTimePanelProps {
  checkedInAt: string;
  onCheckedInAtChange: (v: string) => void;
  onClose: () => void;
}

export default function CheckinFormTimePanel({
  checkedInAt,
  onCheckedInAtChange,
  onClose,
}: CheckinFormTimePanelProps) {
  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--tc-bg)' }}>
      {/* 패널 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1.5px solid var(--tc-dot)',
      }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--tc-warm-dark)', letterSpacing: '-0.01em' }}>
          언제 방문했나요?
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

      {/* 시간 선택 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, gap: 20 }}>
        <div style={{ fontSize: 48 }}>⏰</div>
        <input
          type="datetime-local"
          value={checkedInAt}
          onChange={(e) => onCheckedInAtChange(e.target.value)}
          autoFocus
          style={{
            fontSize: 17,
            padding: '13px 18px',
            borderRadius: 14,
            border: '2px solid var(--tc-dot)',
            width: '100%', maxWidth: 340,
            color: 'var(--tc-warm-dark)',
            background: 'var(--tc-card-bg)',
            outline: 'none',
            fontWeight: 600,
          }}
        />
        {checkedInAt && (
          <button
            onClick={() => { onCheckedInAtChange(''); onClose(); }}
            style={{
              fontSize: 13, fontWeight: 600,
              color: 'var(--tc-warm-faint)',
              background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            시각 지정 삭제
          </button>
        )}
      </div>
    </div>
  );
}
