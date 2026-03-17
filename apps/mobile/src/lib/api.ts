import { supabase } from './supabase';
import type { Trip, Checkin, TripFormData, CheckinInsert } from '../../../../packages/shared/src/types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://travel-companion.vercel.app';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = await getAuthHeaders();
  const url = `${API_URL}${path}`;
  console.log(`API request: ${options?.method ?? 'GET'} ${url}`);
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => 'no body');
    console.error(`API ${response.status} ${path}:`, text.slice(0, 300));
    let error: { error?: string } = {};
    try { error = JSON.parse(text); } catch {}
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

export async function fetchTrips(): Promise<Trip[]> {
  const data = await apiFetch<{ trips: Trip[] }>('/api/trips');
  return data.trips;
}

export async function createTrip(tripData: TripFormData): Promise<Trip> {
  const data = await apiFetch<{ trip: Trip }>('/api/trips', {
    method: 'POST',
    body: JSON.stringify(tripData),
  });
  return data.trip;
}

export async function fetchCheckins(tripId: string): Promise<Checkin[]> {
  const data = await apiFetch<{ checkins: Checkin[] }>(`/api/checkins?trip_id=${tripId}`);
  return data.checkins;
}

export async function createCheckin(checkinData: CheckinInsert): Promise<Checkin> {
  const data = await apiFetch<{ checkin: Checkin }>('/api/checkins', {
    method: 'POST',
    body: JSON.stringify(checkinData),
  });
  return data.checkin;
}
