import { supabase } from '../supabase';
import { getUser } from './supabase-client';
import { apiFetch } from './rest-client';
import type { Trip, TripFormData } from '../../../../../packages/shared/src/types';

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

  const firstCheckinMap: Record<string, string> = {};
  const photoMap: Record<string, string[]> = {};

  if (tripIds.length > 0) {
    const { data: checkins } = await supabase
      .from('checkins')
      .select('trip_id, checked_in_at, photo_url')
      .in('trip_id', tripIds)
      .order('checked_in_at', { ascending: true });

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

  return trips.map((t) => {
    const photos = photoMap[t.id] ?? [];
    const cover_photo_url = photos.length > 0
      ? photos[Math.floor(Math.random() * photos.length)]
      : null;
    return {
      ...t,
      first_checkin_date: firstCheckinMap[t.id] ?? null,
      cover_photo_url,
    };
  });
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
