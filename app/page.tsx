'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Trip } from '@/types/database';
import TripFormModal from '@/app/checkin/components/TripFormModal';
import type { TripFormData } from '@/app/checkin/hooks/useTrips';

const CARD_ACCENTS = [
  '#FF6B47', // coral
  '#F59E0B', // amber
  '#10B981', // emerald
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
];

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [showTripForm, setShowTripForm] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchTrips = useCallback(async () => {
    setLoadingTrips(true);
    try {
      const res = await fetch('/api/trips');
      if (res.ok) {
        const data = await res.json();
        setTrips(data.trips ?? []);
      }
    } finally {
      setLoadingTrips(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchTrips();
    else setTrips([]);
  }, [user, fetchTrips]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  };

  const createTrip = async (data: TripFormData): Promise<Trip> => {
    const res = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to create trip');
    return result.trip as Trip;
  };

  const formatTripDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
    const date = isDateOnly
      ? (() => { const [y, m, d] = dateStr.split('-').map(Number); return new Date(y, m - 1, d); })()
      : new Date(dateStr);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric',
    }).format(date);
  };

  const displayName = user?.user_metadata?.full_name || user?.email || '';

  return (
    <main className="tc-page-bg">
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px 80px' }}>

        {/* 상단 바 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          {user ? (
            <>
              <span style={{ fontSize: 13, color: 'var(--tc-warm-mid)' }}>
                {displayName}님 👋
              </span>
              <button
                onClick={handleLogout}
                style={{
                  fontSize: 13,
                  color: 'var(--tc-warm-mid)',
                  padding: '6px 16px',
                  borderRadius: 9999,
                  border: '1.5px solid var(--tc-dot)',
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link
              href="/login"
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#fff',
                padding: '8px 20px',
                borderRadius: 9999,
                background: '#FF6B47',
                boxShadow: '0 4px 14px rgba(255,107,71,0.45)',
                textDecoration: 'none',
                transition: 'transform 0.15s',
              }}
            >
              로그인 ✈️
            </Link>
          )}
        </div>

        {/* 히어로 */}
        <div className="tc-hero" style={{ marginBottom: 48 }}>
          <div className="tc-plane" style={{ fontSize: 48, marginBottom: 12 }}>✈️</div>
          <h1
            className="tc-brand"
            style={{
              fontSize: 'clamp(2.4rem, 10vw, 3.4rem)',
              lineHeight: 1.1,
              marginBottom: 10,
            }}
          >
            Travel<br />Companion
          </h1>
          <p className="tc-hero-sub" style={{ fontSize: 15, color: 'var(--tc-warm-mid)' }}>
            나만의 여행 이야기를 기록하세요
          </p>
        </div>

        {/* 비로그인 CTA */}
        {!user && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🗺️</div>
            <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--tc-warm-dark)', marginBottom: 8 }}>
              여행의 순간을 기록해보세요
            </p>
            <p style={{ fontSize: 14, color: 'var(--tc-warm-mid)', marginBottom: 28 }}>
              로그인하면 나만의 여행 일기를 만들 수 있어요
            </p>
            <Link
              href="/login"
              style={{
                display: 'inline-block',
                fontSize: 15,
                fontWeight: 700,
                color: '#fff',
                padding: '12px 32px',
                borderRadius: 9999,
                background: '#FF6B47',
                boxShadow: '0 6px 20px rgba(255,107,71,0.45)',
                textDecoration: 'none',
              }}
            >
              시작하기 →
            </Link>
          </div>
        )}

        {/* 여행 목록 */}
        {user && (
          <section>
            {/* 섹션 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--tc-warm-dark)', letterSpacing: '-0.01em' }}>
                내 여행
              </h2>
              <button
                onClick={() => setShowTripForm(true)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#FF6B47',
                  color: '#fff',
                  fontSize: 22,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(255,107,71,0.45)',
                  transition: 'transform 0.15s',
                  flexShrink: 0,
                }}
              >
                +
              </button>
            </div>

            {/* 로딩 스켈레톤 */}
            {loadingTrips && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="tc-skeleton-card tc-shimmer" style={{ animationDelay: `${i * 0.12}s` }}>
                    <div style={{ height: 5, background: CARD_ACCENTS[i % CARD_ACCENTS.length], opacity: 0.4 }} />
                    <div className="tc-skeleton-fill" style={{ aspectRatio: '4/3' }} />
                    <div style={{ padding: 12 }}>
                      <div className="tc-skeleton-fill" style={{ height: 8, borderRadius: 4, width: '55%', marginBottom: 8 }} />
                      <div className="tc-skeleton-fill" style={{ height: 12, borderRadius: 4, width: '85%' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 빈 상태 */}
            {!loadingTrips && trips.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🗺️</div>
                <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--tc-warm-dark)', marginBottom: 6 }}>
                  첫 여행을 기록해볼까요?
                </p>
                <p style={{ fontSize: 13, color: 'var(--tc-warm-mid)' }}>
                  위의 + 버튼을 눌러 새로운 여행을 만드세요
                </p>
              </div>
            )}

            {/* 여행 카드 그리드 */}
            {!loadingTrips && trips.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {trips.map((trip, i) => {
                  const accent = CARD_ACCENTS[i % CARD_ACCENTS.length];
                  return (
                    <button
                      key={trip.id}
                      onClick={() => router.push(`/checkin?trip_id=${trip.id}`)}
                      className="tc-trip-card"
                      style={{
                        borderRadius: 20,
                        overflow: 'hidden',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        animationDelay: `${i * 0.07}s`,
                      }}
                    >
                      {/* 액센트 상단 스트립 */}
                      <div style={{ height: 5, background: accent, flexShrink: 0 }} />

                      {/* 커버 사진 */}
                      <div
                        className="tc-card-photo-empty"
                        style={{ aspectRatio: '4/3', overflow: 'hidden', flexShrink: 0 }}
                      >
                        {trip.cover_photo_url ? (
                          <img
                            src={trip.cover_photo_url}
                            alt={trip.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 32,
                          }}>
                            🗺️
                          </div>
                        )}
                      </div>

                      {/* 텍스트 영역 */}
                      <div style={{ padding: '10px 12px 12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {/* 날짜 — 액센트 컬러로 */}
                        <p style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: accent,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          marginBottom: 4,
                        }}>
                          {formatTripDate(trip.start_date ?? trip.first_checkin_date) ?? '날짜 미정'}
                        </p>

                        {/* 제목 */}
                        <h3 style={{
                          fontSize: 14,
                          fontWeight: 900,
                          color: 'var(--tc-warm-dark)',
                          marginBottom: trip.description ? 4 : 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          letterSpacing: '-0.01em',
                        }}>
                          {trip.title}
                        </h3>

                        {/* 설명 */}
                        {trip.description && (
                          <p style={{
                            fontSize: 11,
                            color: 'var(--tc-warm-mid)',
                            lineHeight: 1.45,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            flex: 1,
                          }}>
                            {trip.description}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>

      {mounted && showTripForm && (
        <TripFormModal
          mode="create"
          onSuccess={(trip) => {
            setTrips((prev) => [trip, ...prev]);
            setShowTripForm(false);
            router.push(`/checkin?trip_id=${trip.id}`);
          }}
          onCancel={() => setShowTripForm(false)}
          onCreate={createTrip}
          onUpdate={async () => { throw new Error('not used'); }}
        />
      )}
    </main>
  );
}
