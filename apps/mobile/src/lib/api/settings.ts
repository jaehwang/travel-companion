import { supabase } from '../supabase';
import { getUser } from './supabase-client';

export interface UserSettings {
  calendar_sync_enabled?: boolean;
}

export async function fetchSettings(): Promise<UserSettings> {
  const user = await getUser();

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('settings')
    .eq('id', user.id)
    .single();

  if (error) throw error;

  return ((profile as any)?.settings as UserSettings) ?? {};
}

export async function updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  const user = await getUser();

  const current = await fetchSettings();
  const updated: UserSettings = { ...current, ...settings };

  const { error } = await supabase
    .from('user_profiles')
    .update({ settings: updated } as any)
    .eq('id', user.id);

  if (error) throw error;
  return updated;
}
