import { supabase } from '../supabase';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://travel-companion.vercel.app';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
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
