import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/story/[id] - 공개 여행 스토리 데이터 (인증 불필요)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // 여행 조회
    const { data: trip, error: tripError } = await (supabase
      .from('trips')
      .select('*')
      .eq('id', id)
      .single() as any);

    if (tripError || !trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    // 비공개 여행이면 체크인 없이 is_public: false만 반환
    if (!trip.is_public) {
      return NextResponse.json({ trip: { id: trip.id, is_public: false }, checkins: [] });
    }

    // 체크인 조회
    const { data: checkins, error: checkinsError } = await supabase
      .from('checkins')
      .select('*')
      .eq('trip_id', id)
      .order('checked_in_at', { ascending: true });

    if (checkinsError) {
      return NextResponse.json(
        { error: 'Failed to fetch checkins' },
        { status: 500 }
      );
    }

    return NextResponse.json({ trip, checkins: checkins || [] });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
