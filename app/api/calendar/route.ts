import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = session.provider_token;
  if (!accessToken) {
    return NextResponse.json(
      { error: 'Google access token not found. Please re-login.' },
      { status: 401 }
    );
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

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    return NextResponse.json({ error: error.error?.message ?? 'Calendar API error' }, { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json(data);
}
