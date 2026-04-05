import { supabase } from '../supabase';
import { getUser } from './supabase-client';

export interface NearbyCheckin {
  id: string;
  trip_id: string;
  trip_title: string;
  title?: string;
  place?: string;
  latitude: number;
  longitude: number;
  category?: string;
  photo_url?: string;
  checked_in_at: string;
  distance: number;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function fetchNearbyCheckins(
  lat: number,
  lng: number,
  radius = 1000,
): Promise<NearbyCheckin[]> {
  await getUser();

  const { data: trips, error: tripsError } = await supabase
    .from('trips')
    .select('id, title')
    .eq('is_frequent', true);

  if (tripsError) throw tripsError;
  if (!trips || trips.length === 0) return [];

  const tripIds = (trips as any[]).map((t) => t.id);
  const tripTitleMap: Record<string, string> = Object.fromEntries(
    (trips as any[]).map((t) => [t.id, t.title])
  );

  const { data: checkins, error: checkinsError } = await supabase
    .from('checkins')
    .select('*')
    .in('trip_id', tripIds)
    .order('checked_in_at', { ascending: false });

  if (checkinsError) throw checkinsError;

  const nearby = ((checkins ?? []) as any[])
    .map((c) => ({
      ...c,
      trip_title: tripTitleMap[c.trip_id],
      distance: haversineDistance(lat, lng, c.latitude, c.longitude),
    }))
    .filter((c) => c.distance <= radius)
    .sort((a, b) =>
      new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime()
    );

  return nearby;
}
