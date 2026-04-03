import type { SupabaseClient } from '@supabase/supabase-js';
import type { Trip, TripInsert } from '@travel-companion/shared';

export function buildDefaultTripName(userId: string): string {
  return `${userId}_default`;
}

export async function getOrCreateDefaultTrip(
  supabase: SupabaseClient,
  userId: string
): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', userId)
    .eq('is_default', true)
    .single();

  if (!error) {
    return data as Trip;
  }

  // PGRST116: no rows found — 새로 생성
  if (error.code !== 'PGRST116') {
    throw new Error(`default trip 조회 실패: ${error.message}`);
  }

  const insert: TripInsert = {
    user_id: userId,
    title: buildDefaultTripName(userId),
    is_default: true,
    is_public: false,
    is_frequent: false,
  };

  const { data: created, error: insertError } = await supabase
    .from('trips')
    .insert(insert as never)
    .select()
    .single();

  if (insertError) {
    throw new Error(`default trip 생성 실패: ${insertError.message}`);
  }

  return created as Trip;
}
