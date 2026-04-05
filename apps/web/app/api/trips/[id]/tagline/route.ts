import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getAuthenticatedClient } from '@/lib/supabase/server';
import { buildTripTaglinePrompt, normalizeTripTagline } from '@/lib/ai/tripTagline';
import type { Checkin, Trip } from '@travel-companion/shared';

type TripTaglineTrip = Pick<Trip, 'id' | 'title' | 'description' | 'place' | 'start_date' | 'end_date'>;
type TripTaglineCheckin = Pick<Checkin, 'checked_in_at' | 'title' | 'message' | 'place' | 'category'>;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return NextResponse.json({ error: 'Gemini API is not configured' }, { status: 503 });
    }

    const { id } = await params;
    const tripResult = await supabase
      .from('trips')
      .select('id, title, description, place, start_date, end_date')
      .eq('id', id)
      .single();
    const trip = tripResult.data as TripTaglineTrip | null;
    const tripError = tripResult.error;

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const checkinsResult = await supabase
      .from('checkins')
      .select('checked_in_at, title, message, place, category')
      .eq('trip_id', id)
      .order('checked_in_at', { ascending: true });
    const checkins = (checkinsResult.data ?? null) as TripTaglineCheckin[] | null;
    const checkinsError = checkinsResult.error;

    if (checkinsError) {
      console.error('Failed to fetch checkins for tagline:', checkinsError);
      return NextResponse.json({ error: 'Failed to load trip context' }, { status: 500 });
    }

    const firstCheckinDate = checkins?.[0]?.checked_in_at ?? null;
    const lastCheckinDate = checkins && checkins.length > 0
      ? checkins[checkins.length - 1].checked_in_at
      : null;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash-lite',
      contents: buildTripTaglinePrompt({
        title: trip.title,
        description: trip.description,
        place: trip.place,
        startDate: trip.start_date ?? firstCheckinDate,
        endDate: trip.end_date ?? lastCheckinDate ?? firstCheckinDate,
        checkinCount: checkins?.length ?? 0,
        checkins: checkins?.map((checkin) => ({
          checkedInAt: checkin.checked_in_at,
          place: checkin.place,
          title: checkin.title,
          message: checkin.message,
          category: checkin.category,
        })),
      }),
    });

    const tagline = normalizeTripTagline(response.text ?? '');
    if (!tagline) {
      return NextResponse.json({ error: 'Gemini returned an empty tagline' }, { status: 502 });
    }

    return NextResponse.json({ tagline });
  } catch (error) {
    console.error('Unexpected error while generating tagline:', error);
    return NextResponse.json({ error: 'Failed to generate tagline' }, { status: 500 });
  }
}
