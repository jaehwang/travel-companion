import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/trips/[id]/apply-place - 여행 장소를 모든 체크인에 일괄 적용
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', id)
      .single() as any;

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    if (!trip.place || trip.latitude == null || trip.longitude == null) {
      return NextResponse.json({ error: 'Trip has no complete place data' }, { status: 400 });
    }

    const { error } = await (supabase.from('checkins') as any)
      .update({
        place: trip.place,
        place_id: trip.place_id || null,
        latitude: trip.latitude,
        longitude: trip.longitude,
      })
      .eq('trip_id', id);

    if (error) {
      return NextResponse.json({ error: 'Failed to update checkins' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
