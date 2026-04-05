import { supabase } from '../supabase';
import { getUser } from './supabase-client';
import { apiFetch } from './rest-client';
import type { Trip, TripFormData } from '@travel-companion/shared';
import { buildTripMetaMap } from '@travel-companion/shared';

export async function fetchTrips(): Promise<Trip[]> {
  await getUser();

  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('is_default', false)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const trips = data as any[];
  const tripIds = trips.map((t) => t.id);
  let metaMap: Record<string, { first_checkin_date: string | null; cover_photo_url: string | null }> = {};

  if (tripIds.length > 0) {
    const { data: checkins } = await supabase
      .from('checkins')
      .select('trip_id, checked_in_at, photo_url')
      .in('trip_id', tripIds)
      .order('checked_in_at', { ascending: true });

    if (checkins) {
      metaMap = buildTripMetaMap(checkins as any[]);
    }
  }

  return trips.map((t) => ({
    ...t,
    ...(metaMap[t.id] ?? { first_checkin_date: null, cover_photo_url: null }),
  }));
}

export async function createTrip(tripData: TripFormData): Promise<Trip> {
  const user = await getUser();

  const { data, error } = await supabase
    .from('trips')
    .insert({ ...tripData, user_id: user.id } as any)
    .select()
    .single();

  if (error) throw error;
  return data as Trip;
}

export async function updateTrip(id: string, tripData: Partial<TripFormData>): Promise<Trip> {
  await getUser();

  const { data, error } = await supabase
    .from('trips')
    .update(tripData as any)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Trip;
}

export async function deleteTrip(id: string, moveCheckins?: boolean): Promise<void> {
  const path = moveCheckins ? `/api/trips/${id}?moveCheckins=true` : `/api/trips/${id}`;
  await apiFetch<{ success: boolean }>(path, { method: 'DELETE' });
}

export async function fetchTripTagline(tripId: string): Promise<string> {
  const data = await apiFetch<{ tagline: string }>(`/api/trips/${tripId}/tagline`, {
    method: 'POST',
  });
  return data.tagline;
}

export const generateTagline = fetchTripTagline;
