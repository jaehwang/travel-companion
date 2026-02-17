import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { CheckinInsert } from '@/types/database';

// PATCH /api/checkins/[id] - 체크인 수정
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      latitude,
      longitude,
      location_name,
      message,
      category,
      photo_url,
      photo_metadata,
      checked_in_at,
    } = body;

    // 좌표 유효성 검증 (전달된 경우에만)
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

    const updateData: Partial<CheckinInsert> = {};
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (location_name !== undefined) updateData.location_name = location_name?.trim() || undefined;
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
      console.error('Failed to update checkin:', error);
      return NextResponse.json(
        { error: 'Failed to update checkin' },
        { status: 500 }
      );
    }

    return NextResponse.json({ checkin: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/checkins/[id] - 체크인 삭제
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from('checkins')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete checkin:', error);
      return NextResponse.json(
        { error: 'Failed to delete checkin' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
