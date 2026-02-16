import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { CheckinInsert } from '@/types/database';

// GET /api/checkins?trip_id={id} - 체크인 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get('trip_id');

    let query = supabase
      .from('checkins')
      .select('*')
      .order('checked_in_at', { ascending: false });

    if (tripId) {
      query = query.eq('trip_id', tripId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch checkins:', error);
      return NextResponse.json(
        { error: 'Failed to fetch checkins' },
        { status: 500 }
      );
    }

    return NextResponse.json({ checkins: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/checkins - 체크인 생성
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      trip_id,
      latitude,
      longitude,
      location_name,
      message,
      category,
      photo_url,
      photo_metadata,
      checked_in_at,
    } = body;

    // 필수 필드 유효성 검증
    if (!trip_id || typeof trip_id !== 'string') {
      return NextResponse.json(
        { error: 'trip_id is required' },
        { status: 400 }
      );
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'latitude and longitude are required and must be numbers' },
        { status: 400 }
      );
    }

    // GPS 좌표 유효성 검증
    if (latitude < -90 || latitude > 90) {
      return NextResponse.json(
        { error: 'latitude must be between -90 and 90' },
        { status: 400 }
      );
    }

    if (longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: 'longitude must be between -180 and 180' },
        { status: 400 }
      );
    }

    const checkinData: CheckinInsert = {
      trip_id,
      latitude,
      longitude,
      location_name: location_name?.trim(),
      message: message?.trim(),
      category,
      photo_url,
      photo_metadata,
      checked_in_at: checked_in_at || new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('checkins')
      .insert(checkinData as any)
      .select()
      .single();

    if (error) {
      console.error('Failed to create checkin:', error);
      return NextResponse.json(
        { error: 'Failed to create checkin' },
        { status: 500 }
      );
    }

    return NextResponse.json({ checkin: data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
