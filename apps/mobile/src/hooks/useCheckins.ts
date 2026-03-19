import { useState, useEffect, useCallback } from 'react';
import type { Checkin, CheckinInsert } from '../../../../packages/shared/src/types';
import { fetchCheckins, createCheckin, updateCheckin, deleteCheckin } from '../lib/api';

export function useCheckins(tripId: string) {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tripId) return;
    try {
      setError(null);
      const data = await fetchCheckins(tripId);
      setCheckins(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load checkins');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => { load(); }, [load]);

  const create = useCallback(async (data: CheckinInsert): Promise<Checkin> => {
    const checkin = await createCheckin(data);
    setCheckins(prev => [checkin, ...prev]);
    return checkin;
  }, []);

  const update = useCallback(async (id: string, data: Partial<CheckinInsert>): Promise<Checkin> => {
    const checkin = await updateCheckin(id, data);
    setCheckins(prev => prev.map(c => c.id === id ? checkin : c));
    return checkin;
  }, []);

  const remove = useCallback(async (id: string): Promise<void> => {
    await deleteCheckin(id);
    setCheckins(prev => prev.filter(c => c.id !== id));
  }, []);

  return { checkins, loading, error, reload: load, create, update, remove };
}
