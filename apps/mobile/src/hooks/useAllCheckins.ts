import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { Checkin } from '../../../../packages/shared/src/types';
import { fetchAllCheckins } from '../lib/api';

export function useAllCheckins(tripId?: string) {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchAllCheckins(tripId);
      setCheckins(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load checkins');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  return { checkins, loading, error, reload: load };
}
