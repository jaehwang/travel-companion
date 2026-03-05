import type { SupabaseClient } from '@supabase/supabase-js';
import type { Trip } from '@/types/database';

export async function fetchTrips(supabase: SupabaseClient): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('created_at', { ascending: false }) as any;

  if (error || !data) return [];

  const tripIds = (data as any[]).map((t: any) => t.id);
  const firstCheckinMap: Record<string, string> = {};
  const photoMap: Record<string, string[]> = {};

  if (tripIds.length > 0) {
    const { data: checkins } = await supabase
      .from('checkins')
      .select('trip_id, checked_in_at, photo_url')
      .in('trip_id', tripIds)
      .order('checked_in_at', { ascending: true }) as any;

    if (checkins) {
      for (const c of checkins as any[]) {
        if (!firstCheckinMap[c.trip_id]) {
          firstCheckinMap[c.trip_id] = c.checked_in_at;
        }
        if (c.photo_url) {
          if (!photoMap[c.trip_id]) photoMap[c.trip_id] = [];
          photoMap[c.trip_id].push(c.photo_url);
        }
      }
    }
  }

  return (data as any[]).map((t: any) => {
    const photos = photoMap[t.id] ?? [];
    const cover_photo_url = photos.length > 0
      ? photos[Math.floor(Math.random() * photos.length)]
      : null;
    return {
      ...t,
      first_checkin_date: firstCheckinMap[t.id] ?? null,
      cover_photo_url,
    } as Trip;
  });
}
