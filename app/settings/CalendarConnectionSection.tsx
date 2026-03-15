'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  connected: boolean;
}

export default function CalendarConnectionSection({ connected }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleConnect = () => {
    window.location.href = '/api/calendar/connect';
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await fetch('/api/calendar/disconnect', { method: 'POST' });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'var(--tc-card-bg)',
      borderRadius: 14,
      padding: '16px',
      boxShadow: '0 2px 8px rgba(45,36,22,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--tc-warm-dark)', marginBottom: 2 }}>
            Google Calendar
          </p>
          <p style={{ fontSize: 12, color: 'var(--tc-warm-mid)' }}>
            {connected ? '캘린더가 연동되어 있습니다.' : '여행 일정과 캘린더를 연동하세요.'}
          </p>
        </div>

        {connected ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: '#10B981', fontWeight: 700 }}>연동됨</span>
            <button
              onClick={handleDisconnect}
              disabled={loading}
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--tc-warm-mid)',
                background: 'none',
                border: '1.5px solid var(--tc-dot)',
                borderRadius: 9999,
                padding: '5px 12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading ? '처리 중...' : '연동 해제'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            disabled={loading}
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'white',
              background: 'var(--tc-primary, #FF6B47)',
              border: 'none',
              borderRadius: 9999,
              padding: '8px 16px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Google Calendar 연동하기
          </button>
        )}
      </div>
    </div>
  );
}
