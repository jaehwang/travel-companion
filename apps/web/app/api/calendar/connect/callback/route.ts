import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  const cookieStore = await cookies();
  const savedState = cookieStore.get('calendar_oauth_state')?.value;
  cookieStore.delete('calendar_oauth_state');

  if (!state || state !== savedState) {
    return NextResponse.redirect(`${origin}/settings?error=invalid_state`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/settings?error=no_code`);
  }

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${origin}/api/calendar/connect/callback`,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${origin}/settings?error=token_exchange_failed`);
  }

  const { refresh_token } = await tokenRes.json();

  if (!refresh_token) {
    return NextResponse.redirect(`${origin}/settings?error=no_refresh_token`);
  }

  const { error: dbError } = await (supabase.from('user_profiles') as any)
    .update({
      google_refresh_token: refresh_token,
      settings: { calendar_sync_enabled: true },
    })
    .eq('id', session.user.id);

  if (dbError) {
    console.error('user_profiles update error:', dbError);
    return NextResponse.redirect(`${origin}/settings?error=db_update_failed`);
  }

  return NextResponse.redirect(`${origin}/settings?calendar=connected`);
}
