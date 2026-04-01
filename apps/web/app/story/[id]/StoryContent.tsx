'use client';

import { useState } from 'react';
import { MapPin, Map as MapIcon } from 'lucide-react';
import Map, { MapPhoto } from '@/components/Map';
import type { Trip, Checkin } from '@/types/database';
import { APP_NAME } from '@/lib/config';
import { CATEGORY_META } from '@/lib/categoryIcons';

function formatTripDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  const date = isDateOnly
    ? (() => { const [y, m, d] = dateStr.split('-').map(Number); return new Date(y, m - 1, d); })()
    : new Date(dateStr);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  }).format(date);
}

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(d);
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

interface StoryContentProps {
  trip: Trip;
  checkins: Checkin[];
}

export default function StoryContent({ trip, checkins }: StoryContentProps) {
  const [copied, setCopied] = useState(false);

  const mapPhotos: MapPhoto[] = checkins.map((c) => ({
    id: c.id,
    url: c.photo_url || '',
    latitude: c.latitude,
    longitude: c.longitude,
    title: c.title,
    place: c.place,
    place_id: c.place_id,
    takenAt: c.checked_in_at,
    message: c.message,
  }));

  // 날짜 문자열 계산
  const dateDisplay = (() => {
    const start = trip.start_date || (checkins.length > 0 ? checkins[0].checked_in_at : null);
    const end = trip.end_date || null;
    if (!start) return null;
    const startStr = formatTripDate(start);
    if (end && end !== trip.start_date) {
      return `${startStr} ~ ${formatTripDate(end)}`;
    }
    return startStr;
  })();

  // 날짜별 그룹핑
  const groups: { dateKey: string; dateStr: string; items: Checkin[] }[] = [];
  for (const checkin of checkins) {
    const dateKey = new Date(checkin.checked_in_at).toDateString();
    const last = groups[groups.length - 1];
    if (last && last.dateKey === dateKey) {
      last.items.push(checkin);
    } else {
      groups.push({ dateKey, dateStr: checkin.checked_in_at, items: [checkin] });
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 폴백: 텍스트 선택 방식
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="tc-page-bg">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20">

        {/* 헤더 */}
        <header className="mb-6">
          <p className="text-xs font-bold text-tc-warm-faint tracking-[0.06em] uppercase mb-1">
            {APP_NAME}
          </p>
          <h1 className="text-2xl font-black text-tc-warm-dark tracking-[-0.02em] mb-2">
            {trip.title}
          </h1>
          {trip.description && (
            <p className="text-sm text-tc-warm-mid leading-relaxed mb-2">
              {trip.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-tc-warm-faint">
            {dateDisplay && <span suppressHydrationWarning>{dateDisplay}</span>}
            <span>{checkins.length}곳 체크인</span>
          </div>
        </header>

        {/* 지도 */}
        {mapPhotos.length > 0 && (
          <div className="mb-6 rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(45,36,22,0.1)' }}>
            <Map photos={mapPhotos} height="320px" />
          </div>
        )}

        {/* 타임라인 */}
        {groups.length > 0 && (
          <section>
            <h2 className="text-lg font-black text-tc-warm-dark tracking-[-0.01em] mb-4">
              여행 기록{' '}
              <span className="text-sm font-normal text-tc-warm-faint">
                {checkins.length}곳
              </span>
            </h2>

            <div className="flex flex-col">
              {groups.map((group, gi) => (
                <div key={group.dateKey} className={gi > 0 ? 'mt-7' : ''}>
                  {/* 날짜 구분선 */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full shrink-0 bg-[#FF6B47]" />
                    <span className="text-xs font-bold text-tc-warm-mid whitespace-nowrap tracking-[0.02em]" suppressHydrationWarning>
                      {formatDateHeader(group.dateStr)}
                    </span>
                    <div className="flex-1 h-px bg-tc-dot" />
                  </div>

                  {/* 체크인 카드 그리드 */}
                  <div className="flex flex-col gap-[10px]">
                    {group.items.map((checkin) => {
                      const meta = CATEGORY_META[checkin.category ?? 'other'] ?? CATEGORY_META.other;
                      const mapsUrl = checkin.place_id
                        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(checkin.place || '')}&query_place_id=${checkin.place_id}`
                        : `https://www.google.com/maps?q=${checkin.latitude},${checkin.longitude}`;

                      return (
                        <div key={checkin.id} className="tc-checkin-card">
                          <div className="flex">
                            {/* 카테고리 액센트 좌측 스트립 */}
                            <div className="w-[5px] shrink-0" style={{ background: meta.color }} />

                            {/* 본문 */}
                            <div className="flex-1 p-[14px] pb-3">
                              {/* 상단 메타 */}
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold tracking-[0.02em] flex items-center gap-1" style={{ color: meta.color }}>
                                  <meta.icon size={12} color={meta.color} />
                                  {meta.label}
                                </span>
                                <span className="text-[11px] text-tc-warm-faint" suppressHydrationWarning>
                                  {formatTime(checkin.checked_in_at)}
                                </span>
                              </div>

                              {/* 제목 */}
                              <h3 className="text-base font-black text-tc-warm-dark mb-2.5 leading-[1.3] tracking-[-0.01em]">
                                {checkin.title || '이름 없는 장소'}
                              </h3>

                              {/* 사진 */}
                              {checkin.photo_url && (
                                <img
                                  src={checkin.photo_url}
                                  alt={checkin.title || 'Checkin photo'}
                                  className="w-full aspect-[4/3] object-cover rounded-[10px] mb-2.5 block"
                                />
                              )}

                              {/* 메모 */}
                              {checkin.message && (
                                <p className="text-sm text-tc-warm-mid whitespace-pre-wrap leading-[1.65] mb-3">
                                  {checkin.message}
                                </p>
                              )}

                              {/* 장소 링크 */}
                              <div className="flex items-center mt-1">
                                <a
                                  href={mapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-tc-warm-faint no-underline flex items-center gap-[3px] hover:text-tc-warm-mid transition-colors"
                                >
                                  <MapPin size={11} color="#C4B49A" style={{ flexShrink: 0 }} />
                                  <span>{checkin.place || '지도에서 보기'}</span>
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 빈 상태 */}
        {checkins.length === 0 && (
          <div className="text-center py-12">
            <div className="flex justify-center mb-3.5"><MapIcon size={48} color="#C4B49A" /></div>
            <p className="text-base font-extrabold text-tc-warm-dark mb-1.5">
              아직 체크인이 없어요
            </p>
          </div>
        )}

        {/* 푸터: 공유 */}
        <footer className="mt-10 pt-6 border-t border-tc-dot text-center">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold cursor-pointer transition-all"
            style={{
              background: copied ? '#10B981' : '#FF6B47',
              color: 'white',
              border: 'none',
              boxShadow: copied
                ? '0 3px 10px rgba(16,185,129,0.4)'
                : '0 3px 10px rgba(255,107,71,0.4)',
            }}
          >
            {copied ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                복사됨!
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                링크 복사
              </>
            )}
          </button>
          <p className="text-xs text-tc-warm-faint mt-3">
            {APP_NAME}으로 기록한 여행 스토리
          </p>
        </footer>
      </div>
    </main>
  );
}
