import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenAI } from '@google/genai';
import type { UserProfile } from '@/types/database';

function weatherDescription(code: number): string {
  if (code === 0) return '맑음';
  if (code === 1) return '대체로 맑음';
  if (code === 2) return '구름 조금';
  if (code === 3) return '흐림';
  if (code <= 48) return '안개';
  if (code <= 55) return '이슬비';
  if (code <= 67) return '비';
  if (code <= 77) return '눈';
  if (code <= 82) return '소나기';
  if (code <= 99) return '뇌우';
  return '알 수 없음';
}

function weatherEmoji(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 2) return '🌤️';
  if (code === 3) return '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 55) return '🌦️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '🌨️';
  if (code <= 82) return '🌦️';
  return '⛈️';
}

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );
    const data = await res.json();
    const loc = data.results?.[0]?.geometry?.location;
    if (!loc) return null;
    return { lat: loc.lat, lng: loc.lng };
  } catch {
    return null;
  }
}

async function fetchWeather(lat: number, lng: number, dateStr: string) {
  const today = new Date().toISOString().slice(0, 10);
  const isFuture = dateStr >= today;
  const baseUrl = isFuture
    ? 'https://api.open-meteo.com/v1/forecast'
    : 'https://archive-api.open-meteo.com/v1/archive';

  try {
    const res = await fetch(
      `${baseUrl}?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode,windspeed_10m_max&timezone=Asia%2FSeoul&start_date=${dateStr}&end_date=${dateStr}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const d = data.daily;
    if (!d?.time?.[0]) return null;
    const code = d.weathercode[0] ?? 0;
    return {
      date: dateStr,
      tempMax: Math.round(d.temperature_2m_max[0]),
      tempMin: Math.round(d.temperature_2m_min[0]),
      precipitation: Math.round((d.precipitation_sum[0] ?? 0) * 10) / 10,
      weatherCode: code,
      windspeedMax: Math.round(d.windspeed_10m_max[0]),
      description: weatherDescription(code),
      emoji: weatherEmoji(code),
    };
  } catch {
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
    accessToken = null;
  } else {
    supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    userId = user.id;
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
    return NextResponse.json(
      { error: 'TOKEN_EXPIRED', message: '구글 캘린더 접근 권한이 만료되었습니다.' },
      { status: 401 }
    );
  }

  const now = new Date();
  const timeMin = now.toISOString();
  const timeMax = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    maxResults: '50',
    singleEvents: 'true',
    orderBy: 'startTime',
  });

  const fetchEvents = (token: string) =>
    fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

  let calResponse = accessToken ? await fetchEvents(accessToken) : null;

  if ((!calResponse || calResponse.status === 401 || calResponse.status === 403) && refreshToken) {
    const newToken = await refreshGoogleToken(refreshToken);
    if (newToken) calResponse = await fetchEvents(newToken);
  }

  if (!calResponse?.ok) {
    const status = calResponse?.status ?? 500;
    if (status === 401 || status === 403) {
      return NextResponse.json(
        { error: 'TOKEN_EXPIRED', message: '구글 캘린더 접근 권한이 만료되었습니다.' },
        { status: 401 }
      );
    }
    return NextResponse.json({ error: 'Calendar API error' }, { status: 500 });
  }

  const calData = await calResponse.json();
  const items: Array<Record<string, unknown>> = calData.items ?? [];

  // 위치별 좌표 캐시
  const coordCache = new Map<string, { lat: number; lng: number } | null>();
  const locationSet = new Set<string>();
  for (const event of items) {
    if (typeof event.location === 'string' && event.location) {
      locationSet.add(event.location);
    }
  }
  await Promise.allSettled(
    Array.from(locationSet).map(async (loc) => {
      coordCache.set(loc, await geocode(loc));
    })
  );

  // 각 이벤트에 날씨 첨부
  const enrichedItems = await Promise.all(
    items.map(async (event) => {
      const loc = typeof event.location === 'string' ? event.location : null;
      if (!loc) return event;
      const coords = coordCache.get(loc);
      if (!coords) return event;
      const start = event.start as { dateTime?: string; date?: string };
      const dateStr = start.date ?? start.dateTime?.slice(0, 10);
      if (!dateStr) return event;
      const weather = await fetchWeather(coords.lat, coords.lng, dateStr);
      return weather ? { ...event, weather } : event;
    })
  );

  // Gemini AI 조언
  let advice: string | null = null;
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && enrichedItems.length > 0) {
    try {
      const lines = enrichedItems.slice(0, 10).map((e: any) => {
        const start = e.start as { dateTime?: string; date?: string };
        const dateStr = start.date ?? start.dateTime?.slice(0, 10) ?? '';
        const d = new Date(start.dateTime ?? dateStr);
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const dateLabel = start.dateTime
          ? `${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]}) ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
          : `${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]}) 종일`;
        const weatherPart = e.weather
          ? `${e.weather.emoji}${e.weather.description} ${e.weather.tempMin}~${e.weather.tempMax}°C${e.weather.precipitation > 0 ? ` 강수${e.weather.precipitation}mm` : ''}`
          : '날씨미상';
        const locationPart = e.location ? ` @ ${e.location}` : '';
        return `- ${dateLabel}${locationPart}: ${e.summary ?? '일정'} (${weatherPart})`;
      });

      const prompt = [
        '너는 여행 동반자 앱의 친근한 AI 어시스턴트다.',
        '아래 2주 일정과 날씨 정보를 보고 사용자에게 실용적인 조언을 2~3문장으로 줘라.',
        '날씨가 나쁜 날의 준비물, 주목할 일정을 자연스럽게 녹여라. 말하듯 친근하게 써라.',
        '',
        '일정 목록:',
        ...lines,
      ].join('\n');

      const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash-lite';
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const aiResponse = await ai.models.generateContent({ model, contents: prompt });
      advice = (aiResponse.text ?? '').trim();
    } catch {
      // advice 실패해도 이벤트 반환
    }
  }

  return NextResponse.json({ items: enrichedItems, advice });
}
