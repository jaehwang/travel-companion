import { createClient } from '@/lib/supabase/server';
import { APP_NAME } from '@/lib/config';
import type { Metadata } from 'next';
import StoryContent from './StoryContent';

interface StoryPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: trip } = await (supabase
    .from('trips')
    .select('title, description')
    .eq('id', id)
    .single() as any);

  if (!trip) {
    return { title: `여행을 찾을 수 없습니다 - ${APP_NAME}` };
  }

  // 대표 사진 조회
  const { data: firstCheckin } = await (supabase
    .from('checkins')
    .select('photo_url')
    .eq('trip_id', id)
    .not('photo_url', 'is', null)
    .order('checked_in_at', { ascending: true })
    .limit(1)
    .single() as any);

  const ogImage = firstCheckin?.photo_url || undefined;

  return {
    title: `${trip.title} - ${APP_NAME}`,
    description: trip.description || `${trip.title} 여행 스토리`,
    openGraph: {
      title: trip.title,
      description: trip.description || `${trip.title} 여행 스토리`,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
  };
}

export default async function StoryPage({ params }: StoryPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 여행 조회
  const { data: trip } = await (supabase.from('trips') as any)
    .select('*')
    .eq('id', id)
    .single();

  if (!trip) {
    return (
      <main className="tc-page-bg">
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-xl font-black text-tc-warm-dark mb-2">여행을 찾을 수 없습니다</h1>
          <p className="text-sm text-tc-warm-mid">
            존재하지 않는 여행이거나, 삭제된 여행입니다.
          </p>
        </div>
      </main>
    );
  }

  // 비공개 여행
  if (!trip.is_public) {
    return (
      <main className="tc-page-bg">
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-xl font-black text-tc-warm-dark mb-2">비공개 여행입니다</h1>
          <p className="text-sm text-tc-warm-mid">
            이 여행은 작성자만 볼 수 있습니다.
          </p>
        </div>
      </main>
    );
  }

  // 체크인 조회
  const { data: checkins } = await supabase
    .from('checkins')
    .select('*')
    .eq('trip_id', id)
    .order('checked_in_at', { ascending: true });

  return <StoryContent trip={trip} checkins={(checkins as any) || []} />;
}
