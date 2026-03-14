import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let accessToken = session.provider_token;
  const refreshToken = session.provider_refresh_token;

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

  // 401이거나 accessToken이 없으면 refresh 시도
  if ((!response || response.status === 401) && refreshToken) {
    const newToken = await refreshGoogleToken(refreshToken);
    if (newToken) {
      response = await fetchCalendarEvents(newToken, params);
    }
  }

  if (!response || !response.ok) {
    if (!response || response.status === 401) {
      return tokenExpiredResponse();
    }
    const error = await response.json();
    return NextResponse.json(
      { error: error.error?.message ?? 'Calendar API error' },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}
