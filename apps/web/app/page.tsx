import { redirect } from 'next/navigation';
import Link from 'next/link';
import { User, Map } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import TripCreateButton from '@/components/TripCreateButton';
import TripCard from '@/components/TripCard';
import QuickCheckinButton from '@/components/QuickCheckinButton';
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
              <div className="user-avatar flex items-center justify-center">
                <User size={18} color="#9CA3AF" />
              </div>
            )}
          </Link>
        </div>

        {/* 빠른 체크인 */}
        <QuickCheckinButton />

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
              <div className="flex justify-center mb-3"><Map size={48} color="#C4B49A" /></div>
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
              {trips.map((trip, i) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  accent={CARD_ACCENTS[i % CARD_ACCENTS.length]}
                  style={{ animationDelay: `${i * 0.07}s` }}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
