import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/supabase/server';
import type { UserProfileSettings } from '@travel-companion/shared';

export async function GET(request: Request) {
  const { user, supabase } = await getAuthenticatedClient(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error } = await (supabase
    .from('user_profiles')
    .select('settings')
    .eq('id', user.id)
    .single() as any);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }

  const settings: UserProfileSettings = (profile?.settings as UserProfileSettings) ?? {};

  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const { user, supabase } = await getAuthenticatedClient(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Partial<UserProfileSettings>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Fetch current settings first to merge
  const { data: profile } = await (supabase
    .from('user_profiles')
    .select('settings')
    .eq('id', user.id)
    .single() as any);

  const current: UserProfileSettings = (profile?.settings as UserProfileSettings) ?? {};
  const updated: UserProfileSettings = { ...current, ...body };

  const { error } = await (supabase.from('user_profiles') as any)
    .update({ settings: updated })
    .eq('id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }

  return NextResponse.json({ settings: updated });
}
