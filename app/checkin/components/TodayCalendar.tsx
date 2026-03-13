'use client';

import { useEffect, useState } from 'react';

interface CalendarEvent {
  id: string;
  summary?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

function formatTime(event: CalendarEvent): string {
  if (event.start.dateTime) {
    const s = new Date(event.start.dateTime);
    const e = new Date(event.end.dateTime!);
    return `${s.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} – ${e.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return '종일';
}

function getNextEvent(events: CalendarEvent[]): CalendarEvent | null {
  const now = Date.now();
  // 아직 끝나지 않은 일정 중 가장 빨리 시작하는 것
  const upcoming = events
    .filter(e => e.start.dateTime) // 시간이 있는 일정만
    .filter(e => new Date(e.end.dateTime!).getTime() > now)
    .sort((a, b) => new Date(a.start.dateTime!).getTime() - new Date(b.start.dateTime!).getTime());
  return upcoming[0] ?? null;
}

export default function TodayCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    fetch(`/api/calendar?timeMin=${start.toISOString()}&timeMax=${end.toISOString()}&maxResults=10`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setEvents(data.items ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // 다음 일정 AI 조언
  useEffect(() => {
    if (events.length === 0) return;
    const next = getNextEvent(events);
    if (!next) return;

    const minutesUntil = Math.round(
      (new Date(next.start.dateTime!).getTime() - Date.now()) / 60000
    );

    const fetchAdvice = (userLat?: number, userLng?: number) => {
      fetch('/api/calendar/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: next.summary ?? '일정',
          location: next.location,
          minutesUntil,
          userLat,
          userLng,
        }),
      })
        .then(res => res.json())
        .then(data => { if (data.advice) setAdvice(data.advice); })
        .catch(() => {});
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => fetchAdvice(pos.coords.latitude, pos.coords.longitude),
        () => fetchAdvice()
      );
    } else {
      fetchAdvice();
    }
  }, [events]);

  if (loading || events.length === 0) return null;

  return (
    <div style={{
      marginBottom: 16,
      background: 'var(--tc-card-bg)',
      borderRadius: 14,
      boxShadow: '0 2px 8px rgba(45,36,22,0.06)',
      overflow: 'hidden',
    }}>
      {/* 헤더 */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tc-warm-dark)' }}>
            오늘 일정 {events.length}개
          </div>
          {advice && (
            <div style={{
              fontSize: 12,
              color: 'var(--tc-warm-mid)',
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {advice}
            </div>
          )}
          {!advice && (
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
              AI 조언 생성 중...
            </div>
          )}
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="var(--tc-warm-mid)" strokeWidth="2.5" strokeLinecap="round"
          style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* 이벤트 목록 */}
      {open && (
        <div style={{ borderTop: '1px solid var(--color-border-light)', padding: '6px 0 8px' }}>
          {events.map(event => (
            <div key={event.id} style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 10,
              padding: '5px 14px',
            }}>
              <span style={{ fontSize: 12, color: '#4285F4', fontWeight: 600, flexShrink: 0, minWidth: 90 }}>
                {formatTime(event)}
              </span>
              <span style={{ fontSize: 13, color: 'var(--tc-warm-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {event.summary ?? '(제목 없음)'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
