'use client';

import { useEffect, useState } from 'react';

interface CalendarEvent {
  id: string;
  summary?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

function formatEventDate(event: CalendarEvent): string {
  const d = new Date(event.start.dateTime ?? event.start.date!);
  return d.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', weekday: 'short' });
}

function formatEventTime(event: CalendarEvent): string {
  if (!event.start.dateTime) return '종일';
  const s = new Date(event.start.dateTime);
  const e = new Date(event.end.dateTime!);
  return `${s.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}–${e.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
}

function eventStartMs(event: CalendarEvent): number {
  return new Date(event.start.dateTime ?? event.start.date!).getTime();
}

function eventEndMs(event: CalendarEvent): number {
  // all-day: end.date는 다음 날 자정(exclusive)이므로 그대로 사용
  return new Date(event.end.dateTime ?? event.end.date!).getTime();
}

function getNextEvent(events: CalendarEvent[]): CalendarEvent | null {
  const now = Date.now();
  const upcoming = events
    .filter(e => eventEndMs(e) > now)
    .sort((a, b) => eventStartMs(a) - eventStartMs(b));
  return upcoming[0] ?? null;
}

function getNextTimedEvent(events: CalendarEvent[]): CalendarEvent | null {
  const now = Date.now();
  const upcoming = events
    .filter(e => e.start.dateTime)
    .filter(e => eventEndMs(e) > now)
    .sort((a, b) => eventStartMs(a) - eventStartMs(b));
  return upcoming[0] ?? null;
}

export default function TodayCalendar({ tripEndDate }: { tripEndDate?: string }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceTarget, setAdviceTarget] = useState<string | null>(null);
  const [tokenExpired, setTokenExpired] = useState(false);

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // 여행 종료일이 있으면 그 날 끝까지, 없으면 오늘 하루
    const end = tripEndDate
      ? new Date(new Date(tripEndDate).getFullYear(), new Date(tripEndDate).getMonth(), new Date(tripEndDate).getDate() + 1)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    setEvents([]);
    setAdvice(null);
    setAdviceTarget(null);
    setOpen(false);

    fetch(`/api/calendar?timeMin=${start.toISOString()}&timeMax=${end.toISOString()}&maxResults=10`)
      .then(res => res.json())
      .then(data => {
        if (data.error === 'TOKEN_EXPIRED') {
          setTokenExpired(true);
        } else if (!data.error) {
          setEvents(data.items ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tripEndDate]);

  // 다음 일정 AI 조언
  useEffect(() => {
    if (events.length === 0) return;
    const next = getNextTimedEvent(events);
    if (!next) {
      setAdvice(null);
      setAdviceTarget(null);
      return;
    }

    setAdviceLoading(true);
    setAdviceTarget(formatEventDate(next));

    const minutesUntil = Math.round(
      (eventStartMs(next) - Date.now()) / 60000
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
        .catch(() => {})
        .finally(() => setAdviceLoading(false));
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

  if (loading) return null;

  if (tokenExpired) {
    return (
      <div style={{
        marginBottom: 16,
        background: 'var(--tc-card-bg)',
        borderRadius: 14,
        padding: '10px 14px',
        boxShadow: '0 2px 8px rgba(45,36,22,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span style={{ fontSize: 12, color: 'var(--tc-warm-mid)', flex: 1 }}>
          캘린더 접근 권한 만료
        </span>
        <a
          href="/login"
          style={{
            fontSize: 12,
            color: '#4285F4',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          재로그인
        </a>
      </div>
    );
  }

  if (events.length === 0) return null;

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
            {tripEndDate ? '여행 일정' : '오늘 일정'} {events.length}개
          </div>
          {advice && (
            <div style={{ fontSize: 12, color: 'var(--tc-warm-mid)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {adviceTarget && <span style={{ color: 'var(--tc-warm-faint)', marginRight: 4 }}>{adviceTarget}</span>}
              {advice}
            </div>
          )}
          {!advice && adviceLoading && (
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
          <div style={{ display: 'grid', gridTemplateColumns: 'max-content max-content 1fr', gap: '0 8px', alignItems: 'baseline' }}>
            {events.map(event => (
              <>
                <span key={`d-${event.id}`} style={{ fontSize: 12, color: '#4285F4', fontWeight: 600, padding: '4px 0 4px 14px', whiteSpace: 'nowrap' }}>
                  {formatEventDate(event)}
                </span>
                <span key={`t-${event.id}`} style={{ fontSize: 12, color: '#4285F4', whiteSpace: 'nowrap' }}>
                  {formatEventTime(event)}
                </span>
                <span key={`s-${event.id}`} style={{ fontSize: 13, color: 'var(--tc-warm-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 14 }}>
                  {event.summary ?? '(제목 없음)'}
                  {event.location && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 11, color: '#4285F4', marginLeft: 6, textDecoration: 'none' }}
                      onClick={e => e.stopPropagation()}
                    >
                      📍 {event.location}
                    </a>
                  )}
                </span>
              </>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
