import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import TripCreateButton from '@/components/TripCreateButton';
import { fetchTrips } from '@/app/lib/fetchTrips';
import { APP_NAME } from '@/lib/config';


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

  const trips = await fetchTrips(supabase);
  const displayName = user.user_metadata?.full_name || user.email || '';

  return (
    <main className="tc-page-bg">
      <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto px-4 py-6 md:py-10 pb-20">

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-8">
          <h1 className="tc-brand text-2xl md:text-3xl leading-none flex-1">
            {APP_NAME}
          </h1>
          <Link href="/settings" className="shrink-0">
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt={displayName}
                referrerPolicy="no-referrer"
                className="user-avatar"
              />
            ) : (
              <div className="user-avatar flex items-center justify-center text-base">
                👤
              </div>
            )}
          </Link>
        </div>

        {/* 여행 목록 */}
        <section>
          {/* 섹션 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-black text-tc-warm-dark tracking-[-0.01em]">
              내 여행
            </h2>
            <TripCreateButton />
          </div>

          {/* 빈 상태 */}
          {trips.length === 0 && (
            <div className="text-center py-10">
              <div className="text-5xl mb-3">🗺️</div>
              <p className="text-base font-extrabold text-tc-warm-dark mb-1.5">
                첫 여행을 기록해볼까요?
              </p>
              <p className="text-[13px] text-tc-warm-mid">
                위의 + 버튼을 눌러 새로운 여행을 만드세요
              </p>
            </div>
          )}

          {/* 여행 카드 그리드 */}
          {trips.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {trips.map((trip, i) => {
                const accent = CARD_ACCENTS[i % CARD_ACCENTS.length];
                return (
                  <Link
                    key={trip.id}
                    href={`/checkin?trip_id=${trip.id}`}
                    className="tc-trip-card rounded-[20px] overflow-hidden no-underline flex flex-col"
                    style={{ animationDelay: `${i * 0.07}s` }}
                  >
                    {/* 액센트 상단 스트립 */}
                    <div className="h-[5px] shrink-0" style={{ background: accent }} />

                    {/* 커버 사진 */}
                    <div className="tc-card-photo-empty aspect-[4/3] overflow-hidden shrink-0">
                      {trip.cover_photo_url ? (
                        <img
                          src={trip.cover_photo_url}
                          alt={trip.title}
                          className="w-full h-full object-cover block"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[32px]">
                          🗺️
                        </div>
                      )}
                    </div>

                    {/* 텍스트 영역 */}
                    <div className="px-3 py-2.5 pb-3 flex-1 flex flex-col">
                      <p 
                        className="text-[10px] font-bold tracking-[0.06em] uppercase mb-1"
                        style={{ color: accent }}
                      >
                        {formatTripDate(trip.start_date ?? trip.first_checkin_date) ?? '날짜 미정'}
                      </p>

                      <h3 className={`text-sm md:text-[15px] font-black text-tc-warm-dark overflow-hidden text-ellipsis whitespace-nowrap tracking-[-0.01em] ${trip.description ? 'mb-1' : ''}`}>
                        {trip.title}
                      </h3>

                      {trip.description && (
                        <p className="text-[11px] md:text-xs text-tc-warm-mid leading-[1.45] line-clamp-2 overflow-hidden flex-1">
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
