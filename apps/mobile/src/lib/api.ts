import { supabase } from './supabase';
import type { Trip, Checkin, TripFormData, CheckinInsert, UserProfileSettings } from '../../../../packages/shared/src/types';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://travel-companion.vercel.app';

// ── Vercel API fetch (Places, Calendar, AI 전용) ─────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
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

// ── Auth helper ───────────────────────────────────────────────────────

async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}

// ── Trips (Supabase 직접 호출) ────────────────────────────────────────

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

  // 체크인 추가 조회: cover_photo_url, first_checkin_date 계산
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

export async function deleteTrip(id: string): Promise<void> {
  await getUser();

  const { error } = await supabase
    .from('trips')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function fetchTripTagline(tripId: string): Promise<string> {
  const data = await apiFetch<{ tagline: string }>(`/api/trips/${tripId}/tagline`, {
    method: 'POST',
  });
  return data.tagline;
}

// ── Checkins (Supabase 직접 호출) ─────────────────────────────────────

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

  const { error } = await supabase
    .from('checkins')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ── Places (Vercel API 경유) ──────────────────────────────────────────

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

// ── Settings (Supabase 직접 호출) ─────────────────────────────────────

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

  // Fetch current settings to merge
  const current = await fetchSettings();
  const updated: UserSettings = { ...current, ...settings };

  const { error } = await supabase
    .from('user_profiles')
    .update({ settings: updated } as any)
    .eq('id', user.id);

  if (error) throw error;
  return updated;
}

// ── Calendar (Vercel API 경유) ────────────────────────────────────────

export interface PlaceInfo {
  open_now: boolean | null;
  open_at_event: boolean | null;
  hours_text: string[];
  website?: string;
  rating?: number;
}

export interface CalendarEvent {
  id: string;
  summary?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  place?: PlaceInfo;
}

export interface WeatherInfo {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  weatherCode: number;
  windspeedMax: number;
  description: string;
  emoji: string;
}

export interface CalendarEventWithWeather extends CalendarEvent {
  weather?: WeatherInfo;
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

export async function fetchScheduleWithWeather(): Promise<{
  items: CalendarEventWithWeather[];
  advice: string | null;
}> {
  const data = await apiFetch<{ items?: CalendarEventWithWeather[]; advice?: string }>(
    '/api/calendar/schedule'
  );
  return { items: data.items ?? [], advice: data.advice ?? null };
}

// ── Nearby Checkins (Supabase 직접 호출) ──────────────────────────────

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

  // Step 1: is_frequent 여행 조회
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

  // Step 2: 해당 여행의 체크인 전체 조회
  const { data: checkins, error: checkinsError } = await supabase
    .from('checkins')
    .select('*')
    .in('trip_id', tripIds)
    .order('checked_in_at', { ascending: false });

  if (checkinsError) throw checkinsError;

  // Step 3: Haversine 필터링
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

// ── AI Tagline (Vercel API 경유) ──────────────────────────────────────

export async function generateTagline(tripId: string): Promise<string> {
  const data = await apiFetch<{ tagline: string }>(`/api/trips/${tripId}/tagline`, {
    method: 'POST',
  });
  return data.tagline;
}

// ── Storage (direct Supabase) ─────────────────────────────────────────

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
      cacheControl: '31536000',
    });

  if (error) throw error;

  const { data: publicData } = supabase.storage
    .from('trip-photos')
    .getPublicUrl(filePath);
  const cdnUrl = process.env.EXPO_PUBLIC_PHOTO_CDN_URL;
  return cdnUrl
    ? publicData.publicUrl.replace(process.env.EXPO_PUBLIC_SUPABASE_URL!, cdnUrl)
    : publicData.publicUrl;
}
