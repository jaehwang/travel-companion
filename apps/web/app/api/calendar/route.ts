import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { UserProfile } from '@/types/database';

interface Period {
  open: { day: number; time: string };
  close?: { day: number; time: string };
}

interface PlaceDetails {
  periods: Period[] | null;
  open_now_fallback: boolean | null;
  hours_text: string[];
  website?: string;
  rating?: number;
}

function isOpenAt(periods: Period[], date: Date): boolean {
  const day = date.getDay();
  const time = date.getHours() * 100 + date.getMinutes();
  for (const period of periods) {
    if (!period.close) return true; // 24/7
    const openDay = period.open.day;
    const openTime = parseInt(period.open.time);
    const closeDay = period.close.day;
    const closeTime = parseInt(period.close.time);
    if (openDay === closeDay) {
      if (day === openDay && time >= openTime && time < closeTime) return true;
    } else {
      if (day === openDay && time >= openTime) return true;
      if (day === closeDay && time < closeTime) return true;
    }
  }
  return false;
}

async function fetchPlaceDetails(location: string): Promise<PlaceDetails | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn('[Places] API key not found');
    return null;
  }
  try {
    const searchRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(location)}&key=${apiKey}`
    );
    if (!searchRes.ok) {
      console.warn('[Places] Text Search HTTP error', searchRes.status);
      return null;
    }
    const searchData = await searchRes.json();
    if (searchData.status !== 'OK') {
      console.warn('[Places] Text Search status:', searchData.status, 'location:', location);
      return null;
    }
    const placeId = searchData.results?.[0]?.place_id;
    if (!placeId) {
      console.warn('[Places] No place found for:', location);
      return null;
    }

    const detailsRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=opening_hours,website,rating&language=ko&key=${apiKey}`
    );
    if (!detailsRes.ok) {
      console.warn('[Places] Place Details HTTP error', detailsRes.status);
      return null;
    }
    const detailsData = await detailsRes.json();
    if (detailsData.status !== 'OK') {
      console.warn('[Places] Place Details status:', detailsData.status);
      return null;
    }
    const result = detailsData.result;
    const openingHours = result?.opening_hours;
    if (!openingHours) {
      console.log('[Places] No opening_hours for:', location);
      return null;
    }

    console.log('[Places] OK (periods:', !!openingHours.periods, '):', location);
    return {
      periods: openingHours.periods ?? null,
      open_now_fallback: openingHours.open_now ?? null,
      hours_text: openingHours.weekday_text ?? [],
      website: result.website,
      rating: result.rating,
    };
  } catch (e) {
    console.error('[Places] Error:', e);
    return null;
  }
}

async function refreshGoogleToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });
    if (!res.ok) return null;
    const { access_token } = await res.json();
    return access_token ?? null;
  } catch {
    return null;
  }
}

async function fetchCalendarEvents(accessToken: string, params: URLSearchParams) {
  return fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
}

function tokenExpiredResponse() {
  return NextResponse.json(
    { error: 'TOKEN_EXPIRED', message: '구글 캘린더 접근 권한이 만료되었습니다. 재로그인이 필요합니다.' },
    { status: 401 }
  );
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  const isBearerAuth = authHeader?.startsWith('Bearer ');

  let supabase;
  let userId: string | undefined;
  let accessToken: string | null | undefined;
  let refreshToken: string | null = null;

  if (isBearerAuth) {
    const { getAuthenticatedClient } = await import('@/lib/supabase/server');
    const { supabase: authSupabase, user } = await getAuthenticatedClient(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    supabase = authSupabase;
    userId = user.id;
    accessToken = null; // Bearer 토큰 인증 시 provider_token 없음
  } else {
    supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    userId = user.id;
    // provider_token/refresh_token은 getUser()에 없으므로 getSession()에서 가져옴
    const { data: { session } } = await supabase.auth.getSession();
    accessToken = session?.provider_token;
    refreshToken = session?.provider_refresh_token ?? null;
  }

  if (!refreshToken && userId) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('google_refresh_token')
      .eq('id', userId)
      .single();
    refreshToken = (profile as Pick<UserProfile, 'google_refresh_token'> | null)?.google_refresh_token ?? null;
  }

  if (!accessToken && !refreshToken) {
    return tokenExpiredResponse();
  }

  const { searchParams } = new URL(request.url);
  const timeMin = searchParams.get('timeMin') ?? new Date().toISOString();
  const timeMax = searchParams.get('timeMax') ?? undefined;
  const maxResults = searchParams.get('maxResults') ?? '20';

  const params = new URLSearchParams({
    timeMin,
    maxResults,
    singleEvents: 'true',
    orderBy: 'startTime',
  });
  if (timeMax) params.set('timeMax', timeMax);

  // 1차 시도
  let response = accessToken ? await fetchCalendarEvents(accessToken, params) : null;

  // 401(만료) 또는 403(scope 없음)이거나 accessToken이 없으면 refresh 시도
  if ((!response || response.status === 401 || response.status === 403) && refreshToken) {
    const newToken = await refreshGoogleToken(refreshToken);
    if (newToken) {
      response = await fetchCalendarEvents(newToken, params);
    }
  }

  if (!response || !response.ok) {
    if (!response || response.status === 401 || response.status === 403) {
      return tokenExpiredResponse();
    }
    const error = await response.json();
    return NextResponse.json(
      { error: error.error?.message ?? 'Calendar API error' },
      { status: response.status }
    );
  }

  const data = await response.json();

  const items: Array<Record<string, unknown>> = data.items ?? [];

  const locationSet = new Set<string>();
  for (const event of items) {
    if (typeof event.location === 'string' && event.location) {
      locationSet.add(event.location);
    }
  }

  const detailsCache = new Map<string, PlaceDetails | null>();
  await Promise.allSettled(
    Array.from(locationSet).map(async (loc) => {
      detailsCache.set(loc, await fetchPlaceDetails(loc));
    })
  );

  const now = new Date();
  const enrichedItems = items.map((event) => {
    const loc = typeof event.location === 'string' ? event.location : null;
    if (!loc) return event;
    const details = detailsCache.get(loc);
    if (!details) return event;

    const startStr = (event.start as Record<string, string> | undefined)?.dateTime;
    const eventStart = startStr ? new Date(startStr) : null;

    const open_now = details.periods
      ? isOpenAt(details.periods, now)
      : (details.open_now_fallback ?? null);
    const open_at_event = details.periods && eventStart
      ? isOpenAt(details.periods, eventStart)
      : null;

    return {
      ...event,
      place: {
        open_now,
        open_at_event,
        hours_text: details.hours_text,
        website: details.website,
        rating: details.rating,
      },
    };
  });

  return NextResponse.json({ ...data, items: enrichedItems });
}
