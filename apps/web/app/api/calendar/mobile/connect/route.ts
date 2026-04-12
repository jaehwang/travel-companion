import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { user } = await getAuthenticatedClient(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { origin } = new URL(request.url);

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${origin}/api/calendar/mobile/callback`,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    access_type: 'offline',
    prompt: 'consent',
    state: crypto.randomUUID(),
  });

  return NextResponse.json({
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
  });
}
