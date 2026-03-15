'use client';

import { useEffect, useState } from 'react';

interface CalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
}

function formatDate(event: CalendarEvent): string {
  const start = event.start.dateTime ?? event.start.date ?? '';
  const end = event.end.dateTime ?? event.end.date ?? '';

  if (event.start.dateTime) {
    const s = new Date(start);
    const e = new Date(end);
    const dateStr = s.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
    const startTime = s.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    const endTime = e.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} ${startTime} – ${endTime}`;
  } else {
    const s = new Date(start);
    return s.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }) + ' (종일)';
  }
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenExpired, setTokenExpired] = useState(false);

  useEffect(() => {
    fetch('/api/calendar?maxResults=20')
      .then(res => res.json())
      .then(data => {
        if (data.error === 'TOKEN_EXPIRED') {
          setTokenExpired(true);
        } else if (data.error) {
          setError(data.message ?? data.error);
        } else {
          setEvents(data.items ?? []);
        }
      })
      .catch(() => setError('캘린더를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main style={{ minHeight: '100vh', background: 'var(--tc-bg)', padding: '24px 16px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        <h1 style={{ fontSize: 'var(--font-title)', fontWeight: 700, color: 'var(--tc-warm-dark)', marginBottom: 20 }}>
          내 Google 캘린더
        </h1>

        {loading && (
          <div style={{ textAlign: 'center', color: 'var(--tc-warm-mid)', padding: '40px 0' }}>
            불러오는 중...
          </div>
        )}

        {tokenExpired && (
          <div style={{
            background: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            color: 'var(--color-danger)',
            fontSize: 'var(--font-base)',
          }}>
            <div style={{ marginBottom: 10 }}>
              Google Calendar가 연동되지 않았습니다. 설정에서 연동해 주세요.
            </div>
            <a
              href="/settings"
              style={{
                display: 'inline-block',
                padding: '8px 16px',
                background: '#4285F4',
                color: 'white',
                borderRadius: 8,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 'var(--font-sm)',
              }}
            >
              설정으로 이동
            </a>
          </div>
        )}

        {error && (
          <div style={{
            background: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            color: 'var(--color-danger)',
            fontSize: 'var(--font-base)',
          }}>
            {error}
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--tc-warm-mid)', padding: '40px 0' }}>
            예정된 일정이 없습니다.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {events.map(event => (
            <div key={event.id} style={{
              background: 'var(--tc-card-bg)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              boxShadow: '0 2px 8px rgba(45,36,22,0.06)',
            }}>
              <div style={{ fontWeight: 600, fontSize: 'var(--font-md)', color: 'var(--tc-warm-dark)', marginBottom: 4 }}>
                {event.summary ?? '(제목 없음)'}
              </div>
              <div style={{ fontSize: 'var(--font-sm)', color: 'var(--tc-warm-mid)' }}>
                {formatDate(event)}
              </div>
              {event.location && (
                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--tc-warm-faint)', marginTop: 4 }}>
                  📍 {event.location}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}
