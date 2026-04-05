import { supabase } from '../supabase';
import { getUser } from './supabase-client';
import type { Checkin, CheckinInsert, Trip } from '../../../../../packages/shared/src/types';

async function getOrCreateDefaultTrip(userId: string): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', userId)
    .eq('is_default', true)
    .single();

  if (!error) return data as Trip;

  if (error.code !== 'PGRST116') {
    throw new Error(`default trip 조회 실패: ${error.message}`);
  }

  const { data: created, error: insertError } = await supabase
    .from('trips')
    .insert({
      user_id: userId,
      title: `${userId}_default`,
      is_default: true,
      is_public: false,
      is_frequent: false,
    } as any)
    .select()
    .single();

  if (insertError) throw new Error(`default trip 생성 실패: ${insertError.message}`);
  return created as Trip;
}

export async function fetchCheckins(tripId: string): Promise<Checkin[]> {
  await getUser();

  const { data, error } = await supabase
    .from('checkins')
    .select('*')
    .eq('trip_id', tripId)
    .order('checked_in_at', { ascending: true });

  if (error) throw error;
  return data as Checkin[];
}

export async function fetchAllCheckins(tripId?: string): Promise<Checkin[]> {
  await getUser();

  let query = supabase
    .from('checkins')
    .select('*');

  if (tripId) {
    query = query.eq('trip_id', tripId);
  }

  const { data, error } = await query.order('checked_in_at', { ascending: true });

  if (error) throw error;
  return data as Checkin[];
}

export async function createCheckin(checkinData: CheckinInsert & { trip_id?: string }): Promise<Checkin> {
  const user = await getUser();

  const resolvedTripId = checkinData.trip_id
    ? checkinData.trip_id
    : (await getOrCreateDefaultTrip(user.id)).id;

  const { data, error } = await supabase
    .from('checkins')
    .insert({ ...checkinData, trip_id: resolvedTripId } as any)
    .select()
    .single();

  if (error) throw error;
  return data as Checkin;
}

export async function updateCheckin(id: string, checkinData: Partial<CheckinInsert>): Promise<Checkin> {
  await getUser();

  const { data, error } = await supabase
    .from('checkins')
    .update(checkinData as any)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Checkin;
}

export async function deleteCheckin(id: string): Promise<void> {
  await getUser();

  const { data: checkin } = await supabase
    .from('checkins')
    .select('photo_url')
    .eq('id', id)
    .single();

  const { error } = await supabase
    .from('checkins')
    .delete()
    .eq('id', id);

  if (error) throw error;

  if (checkin?.photo_url) {
    const marker = '/trip-photos/';
    const idx = checkin.photo_url.indexOf(marker);
    if (idx !== -1) {
      const storagePath = checkin.photo_url.slice(idx + marker.length);
      await supabase.storage.from('trip-photos').remove([storagePath]);
    }
  }
}
