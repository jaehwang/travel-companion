import { supabase } from '../supabase';
import { getUser } from './supabase-client';
import type { Trip, Checkin } from '@travel-companion/shared';

export async function searchTrips(query: string): Promise<Trip[]> {
  await getUser();

  const q = query.trim();
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
    .order('updated_at', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data as Trip[];
}

export async function searchCheckins(query: string): Promise<Checkin[]> {
  await getUser();

  const q = query.trim();
  const { data, error } = await supabase
    .from('checkins')
    .select('*')
    .or(`title.ilike.%${q}%,place.ilike.%${q}%,message.ilike.%${q}%`)
    .order('checked_in_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data as Checkin[];
}
