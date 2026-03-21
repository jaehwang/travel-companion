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
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => 'no body');
    let error: { error?: string } = {};
    try { error = JSON.parse(text); } catch {}
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

// ── Trips ──────────────────────────────────────────────────────────────

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

export async function updateTrip(id: string, tripData: Partial<TripFormData>): Promise<Trip> {
  const data = await apiFetch<{ trip: Trip }>(`/api/trips/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(tripData),
  });
  return data.trip;
}

export async function deleteTrip(id: string): Promise<void> {
  await apiFetch(`/api/trips/${id}`, { method: 'DELETE' });
}

export async function fetchTripTagline(tripId: string): Promise<string> {
  const data = await apiFetch<{ tagline: string }>(`/api/trips/${tripId}/tagline`, {
    method: 'POST',
  });
  return data.tagline;
}

// ── Checkins ───────────────────────────────────────────────────────────

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

export async function updateCheckin(id: string, checkinData: Partial<CheckinInsert>): Promise<Checkin> {
  const data = await apiFetch<{ checkin: Checkin }>(`/api/checkins/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(checkinData),
  });
  return data.checkin;
}

export async function deleteCheckin(id: string): Promise<void> {
  await apiFetch(`/api/checkins/${id}`, { method: 'DELETE' });
}

// ── Places ─────────────────────────────────────────────────────────────

export interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface PlaceDetails {
  name: string;
  place_id: string;
  latitude: number;
  longitude: number;
}

export async function searchPlaces(input: string, lat?: number, lng?: number): Promise<PlacePrediction[]> {
  let path = `/api/places/autocomplete?input=${encodeURIComponent(input)}`;
  if (lat != null && lng != null) {
    path += `&lat=${lat}&lng=${lng}`;
  }
  const data = await apiFetch<{ predictions: PlacePrediction[] }>(path);
  return data.predictions;
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const data = await apiFetch<{ place: PlaceDetails }>(`/api/places/details?place_id=${placeId}`);
  return data.place;
}

// ── Settings ────────────────────────────────────────────────────────────

export interface UserSettings {
  calendar_sync_enabled?: boolean;
}

export async function fetchSettings(): Promise<UserSettings> {
  const data = await apiFetch<{ settings: UserSettings }>('/api/settings');
  return data.settings;
}

export async function updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  const data = await apiFetch<{ settings: UserSettings }>('/api/settings', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
  return data.settings;
}

// ── Calendar ───────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string;
  summary?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

export async function fetchCalendarEvents(timeMin: string, timeMax?: string, maxResults = 10): Promise<CalendarEvent[]> {
  let path = `/api/calendar?timeMin=${encodeURIComponent(timeMin)}&maxResults=${maxResults}`;
  if (timeMax) path += `&timeMax=${encodeURIComponent(timeMax)}`;
  const data = await apiFetch<{ items?: CalendarEvent[]; error?: string }>(path);
  if (data.error) throw new Error(data.error);
  return data.items ?? [];
}

export async function fetchCalendarAdvice(
  events: { summary: string; location?: string; minutesUntil: number; isAllDay?: boolean }[],
): Promise<string | null> {
  const data = await apiFetch<{ advice?: string }>('/api/calendar/advice', {
    method: 'POST',
    body: JSON.stringify({ events }),
  });
  return data.advice ?? null;
}

export async function disconnectCalendar(): Promise<void> {
  await apiFetch('/api/calendar/disconnect', { method: 'POST' });
}

// ── Nearby Checkins ────────────────────────────────────────────────────

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

export async function fetchNearbyCheckins(
  lat: number,
  lng: number,
  radius = 1000,
): Promise<NearbyCheckin[]> {
  const data = await apiFetch<{ checkins: NearbyCheckin[] }>(
    `/api/checkins/nearby?lat=${lat}&lng=${lng}&radius=${radius}`,
  );
  return data.checkins;
}

// ── Storage (direct Supabase) ──────────────────────────────────────────

export async function uploadPhoto(
  fileUri: string,
  fileName: string,
): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response);
    xhr.onerror = () => reject(new Error('파일 읽기 실패'));
    xhr.responseType = 'arraybuffer';
    xhr.open('GET', fileUri);
    xhr.send();
  });

  const filePath = `photos/${Date.now()}_${fileName}`;
  const { error } = await supabase.storage
    .from('trip-photos')
    .upload(filePath, arrayBuffer, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) throw error;

  const { data: signedData, error: signedError } = await supabase.storage
    .from('trip-photos')
    .createSignedUrl(filePath, 31536000); // 1년
  if (signedError) throw signedError;

  return signedData.signedUrl;
}
