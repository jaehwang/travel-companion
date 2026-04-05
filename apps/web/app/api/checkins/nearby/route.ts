import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/supabase/server';
import { haversineDistance } from '@travel-companion/shared';

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') ?? '');
    const lng = parseFloat(searchParams.get('lng') ?? '');
    const radius = parseFloat(searchParams.get('radius') ?? '1000');

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
    }

    const { data: trips, error: tripsError } = await (supabase.from('trips') as any)
      .select('id, title')
      .eq('is_frequent', true);

    if (tripsError) return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 });
    if (!trips || trips.length === 0) return NextResponse.json({ checkins: [] });

    const tripIds = (trips as any[]).map((t: any) => t.id);
    const tripTitleMap: Record<string, string> = Object.fromEntries(
      (trips as any[]).map((t: any) => [t.id, t.title])
    );

    const { data: checkins, error: checkinsError } = await (supabase.from('checkins') as any)
      .select('*')
      .in('trip_id', tripIds)
      .order('checked_in_at', { ascending: false });

    if (checkinsError) return NextResponse.json({ error: 'Failed to fetch checkins' }, { status: 500 });

    const nearby = ((checkins ?? []) as any[])
      .map((c: any) => ({
        ...c,
        trip_title: tripTitleMap[c.trip_id],
        distance: haversineDistance(lat, lng, c.latitude, c.longitude),
      }))
      .filter((c: any) => c.distance <= radius)
      .sort((a: any, b: any) =>
        new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime()
      );

    return NextResponse.json({ checkins: nearby });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
