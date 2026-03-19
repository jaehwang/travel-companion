import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const { user, supabase } = await getAuthenticatedClient(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('google_refresh_token')
    .eq('id', user.id)
    .single();

  if ((profile as any)?.google_refresh_token) {
    await fetch(
      `https://oauth2.googleapis.com/revoke?token=${(profile as any).google_refresh_token}`,
      { method: 'POST' }
    ).catch(() => {});
  }

  await (supabase.from('user_profiles') as any).update({
    google_refresh_token: null,
    settings: { calendar_sync_enabled: false },
  }).eq('id', user.id);

  return NextResponse.json({ success: true });
}
