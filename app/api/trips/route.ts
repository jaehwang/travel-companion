import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { TripInsert } from '@/types/database';

// GET /api/trips - 여행 목록 조회
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch trips:', error);
      return NextResponse.json(
        { error: 'Failed to fetch trips' },
        { status: 500 }
      );
    }

    return NextResponse.json({ trips: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/trips - 새 여행 생성
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, start_date, end_date, is_public } = body;

    // 유효성 검증
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const tripData: TripInsert = {
      title: title.trim(),
      description: description?.trim(),
      start_date,
      end_date,
      is_public: is_public ?? false,
    };

    const { data, error } = await supabase
      .from('trips')
      .insert(tripData as any)
      .select()
      .single();

    if (error) {
      console.error('Failed to create trip:', error);
      return NextResponse.json(
        { error: 'Failed to create trip' },
        { status: 500 }
      );
    }

    return NextResponse.json({ trip: data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
