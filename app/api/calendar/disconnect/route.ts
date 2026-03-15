import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('google_refresh_token')
    .eq('id', session.user.id)
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
  }).eq('id', session.user.id);

  return NextResponse.json({ success: true });
}
