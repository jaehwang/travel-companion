'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Trip } from '@travel-companion/shared';

interface TaglineCacheEntry {
  signature: string;
  tagline: string;
}

function createTripSignature(trip: Trip) {
  return [
    trip.title,
    trip.description ?? '',
    trip.place ?? '',
    trip.start_date ?? '',
    trip.end_date ?? '',
  ].join('::');
}

function toDisplayError(message: string): string {
  switch (message) {
    case 'Gemini API is not configured':
      return '재치 멘트 설정이 아직 준비되지 않았어요.';
    case 'Unauthorized':
      return '로그인이 필요합니다.';
    default:
      return '재치 멘트를 준비하지 못했어요. 다시 시도해 주세요.';
  }
}

export function useTripTagline(selectedTrip: Trip | undefined) {
  const [cache, setCache] = useState<Record<string, TaglineCacheEntry>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const signature = useMemo(() => (selectedTrip ? createTripSignature(selectedTrip) : ''), [selectedTrip]);

  const currentEntry = selectedTrip ? cache[selectedTrip.id] : undefined;
  const tagline = currentEntry?.signature === signature ? currentEntry.tagline : null;

  const refresh = useCallback(() => {
    if (!selectedTrip) return;
    setCache((prev) => {
      const next = { ...prev };
      delete next[selectedTrip.id];
      return next;
    });
    setRefreshNonce((prev) => prev + 1);
  }, [selectedTrip]);

  useEffect(() => {
    if (!selectedTrip) {
      setLoading(false);
      setError(null);
      return;
    }

    if (currentEntry?.signature === signature) {
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/trips/${selectedTrip.id}/tagline`, {
          method: 'POST',
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(typeof data?.error === 'string' ? data.error : 'Failed to generate tagline');
        }
        if (typeof data?.tagline !== 'string' || data.tagline.trim().length === 0) {
          throw new Error('Failed to generate tagline');
        }
        if (cancelled) return;
        setCache((prev) => ({
          ...prev,
          [selectedTrip.id]: {
            signature,
            tagline: data.tagline.trim(),
          },
        }));
      } catch (err) {
        if (cancelled) return;
        setError(toDisplayError(err instanceof Error ? err.message : 'Failed to generate tagline'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [currentEntry?.signature, selectedTrip, signature, refreshNonce]);

  return { tagline, loading, error, refresh };
}
