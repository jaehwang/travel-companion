import { apiFetch } from './rest-client';

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

export async function connectCalendar(): Promise<string> {
  const data = await apiFetch<{ url: string; error?: string }>('/api/calendar/mobile/connect');
  if (data.error) throw new Error(data.error);
  return data.url;
}

export async function completeCalendarConnect(code: string): Promise<void> {
  await apiFetch('/api/calendar/mobile/complete', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
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
