import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/supabase/server';
import type { CheckinInsert } from '@travel-companion/shared';

// PATCH /api/checkins/[id] - 체크인 수정
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      trip_id,
      latitude,
      longitude,
      title,
      place,
      place_id,
      message,
      category,
      photo_url,
      photo_metadata,
      checked_in_at,
    } = body;

    if (trip_id !== undefined) {
      const { data: targetTrip } = await supabase
        .from('trips')
        .select('user_id')
        .eq('id', trip_id)
        .single() as any;
      if (!targetTrip || targetTrip.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (latitude !== undefined) {
      if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
        return NextResponse.json(
          { error: 'latitude must be a number between -90 and 90' },
          { status: 400 }
        );
      }
    }
    if (longitude !== undefined) {
      if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
        return NextResponse.json(
          { error: 'longitude must be a number between -180 and 180' },
          { status: 400 }
        );
      }
    }

    const updateData: Partial<CheckinInsert> & { trip_id?: string } = {};
    if (trip_id !== undefined) updateData.trip_id = trip_id;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (title !== undefined) updateData.title = title?.trim() || undefined;
    if (place !== undefined) updateData.place = place ? place.trim() || null : null;
    if (place_id !== undefined) updateData.place_id = place_id || null;
    if (message !== undefined) updateData.message = message?.trim() || undefined;
    if (category !== undefined) updateData.category = category || undefined;
    if (photo_url !== undefined) updateData.photo_url = photo_url || undefined;
    if (photo_metadata !== undefined) updateData.photo_metadata = photo_metadata || undefined;
    if (checked_in_at !== undefined) updateData.checked_in_at = checked_in_at;

    const { data, error } = await (supabase.from('checkins') as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update checkin' },
        { status: 500 }
      );
    }

    return NextResponse.json({ checkin: data });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/checkins/[id] - 체크인 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // photo_url 먼저 조회
    const { data: checkin } = await (supabase.from('checkins') as any)
      .select('photo_url')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('checkins')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete checkin' },
        { status: 500 }
      );
    }

    // Storage 사진 삭제 (실패해도 응답에는 영향 없음)
    if (checkin?.photo_url) {
      const marker = '/trip-photos/';
      const idx = checkin.photo_url.indexOf(marker);
      if (idx !== -1) {
        const storagePath = checkin.photo_url.slice(idx + marker.length);
        await supabase.storage.from('trip-photos').remove([storagePath]);
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
