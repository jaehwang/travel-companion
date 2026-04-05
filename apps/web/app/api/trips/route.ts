import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/supabase/server';
import type { TripInsert } from '@travel-companion/shared';
import { buildTripMetaMap } from '@travel-companion/shared';

// GET /api/trips - 여행 목록 조회
export async function GET(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('is_default', false)
      .order('created_at', { ascending: false }) as any;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch trips' },
        { status: 500 }
      );
    }

    // 각 여행의 첫 번째 체크인 날짜 및 사진 조회
    const tripIds = (data as any[]).map((t: any) => t.id);
    let metaMap: Record<string, { first_checkin_date: string | null; cover_photo_url: string | null }> = {};

    if (tripIds.length > 0) {
      const { data: checkins } = await supabase
        .from('checkins')
        .select('trip_id, checked_in_at, photo_url')
        .in('trip_id', tripIds)
        .order('checked_in_at', { ascending: true }) as any;

      if (checkins) {
        metaMap = buildTripMetaMap(checkins as any[]);
      }
    }

    const trips = (data as any[]).map((t: any) => ({
      ...t,
      ...(metaMap[t.id] ?? { first_checkin_date: null, cover_photo_url: null }),
    }));

    return NextResponse.json({ trips });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/trips - 새 여행 생성
export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, start_date, end_date, is_public, place, place_id, latitude, longitude, is_frequent } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const tripData: TripInsert = {
      title: title.trim(),
      description: description?.trim() || undefined,
      start_date,
      end_date,
      is_public: is_public ?? false,
      is_frequent: is_frequent ?? false,
      user_id: user.id,
      place: place?.trim() || null,
      place_id: place_id || null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
    };

    const { data, error } = await supabase
      .from('trips')
      .insert(tripData as any)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create trip' },
        { status: 500 }
      );
    }

    return NextResponse.json({ trip: data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
