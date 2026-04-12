import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const { user, supabase } = await getAuthenticatedClient(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { code } = body as { code?: string };
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  const { origin } = new URL(request.url);

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${origin}/api/calendar/mobile/callback`,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.json({ error: 'token_exchange_failed' }, { status: 400 });
  }

  const tokenData = await tokenRes.json();
  const { refresh_token } = tokenData;

  if (!refresh_token) {
    return NextResponse.json({ error: 'no_refresh_token' }, { status: 400 });
  }

  const { error: dbError } = await (supabase.from('user_profiles') as any)
    .update({
      google_refresh_token: refresh_token,
      settings: { calendar_sync_enabled: true },
    })
    .eq('id', user.id);

  if (dbError) {
    return NextResponse.json({ error: 'db_update_failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
