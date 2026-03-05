import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Trip } from '@/types/database';

const CARD_ACCENTS = [
  '#FF6B47', // coral
  '#F59E0B', // amber
  '#10B981', // emerald
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
];

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

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const trips: Trip[] = []; // fetchTrips will be added in US-003
  const displayName = user.user_metadata?.full_name || user.email || '';

  return (
    <main className="tc-page-bg">
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px 80px' }}>

        {/* 상단 바 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <span style={{ fontSize: 13, color: 'var(--tc-warm-mid)' }}>
            {displayName}님 👋
          </span>
          {/* LogoutButton will be added in US-004 */}
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

        {/* 여행 목록 */}
        <section>
          {/* 섹션 헤더 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--tc-warm-dark)', letterSpacing: '-0.01em' }}>
              내 여행
            </h2>
            {/* TripCreateButton will be added in US-005 */}
          </div>

          {/* 빈 상태 */}
          {trips.length === 0 && (
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
          {trips.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {trips.map((trip, i) => {
                const accent = CARD_ACCENTS[i % CARD_ACCENTS.length];
                return (
                  <Link
                    key={trip.id}
                    href={`/checkin?trip_id=${trip.id}`}
                    className="tc-trip-card"
                    style={{
                      borderRadius: 20,
                      overflow: 'hidden',
                      textDecoration: 'none',
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
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
