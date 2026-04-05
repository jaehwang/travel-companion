'use client';

import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

interface BottomBarProps {
  onCheckin: () => void;
}

export default function BottomBar({ onCheckin }: BottomBarProps) {
  const router = useRouter();

  return createPortal(
    <div
      className="tc-bottom-bar"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: 64, padding: '0 16px' }}>
        {/* 홈 버튼 */}
        <button
          onClick={() => router.push('/')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            color: 'var(--tc-warm-faint)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px 16px',
          }}
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
            <polyline points="9 21 9 12 15 12 15 21" />
          </svg>
          <span style={{ fontSize: 10, fontWeight: 600 }}>홈</span>
        </button>

        {/* 체크인 FAB — 중앙 */}
        <button
          onClick={onCheckin}
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#FF6B47',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(255, 107, 71, 0.5)',
            transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateX(-50%) scale(1.1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateX(-50%) scale(1)';
          }}
        >
          <svg
            width="26"
            height="26"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  );
}
