import { useState, useEffect, useCallback } from 'react';
import type { Trip, TripFormData } from '../../../../packages/shared/src/types';
import { fetchTrips, createTrip, updateTrip, deleteTrip } from '../lib/api';

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchTrips();
      setTrips(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = useCallback(async (data: TripFormData): Promise<Trip> => {
    const trip = await createTrip(data);
    setTrips(prev => [trip, ...prev]);
    return trip;
  }, []);

  const update = useCallback(async (id: string, data: Partial<TripFormData>): Promise<Trip> => {
    const trip = await updateTrip(id, data);
    setTrips(prev => prev.map(t => t.id === id ? trip : t));
    return trip;
  }, []);

  const remove = useCallback(async (id: string): Promise<void> => {
    await deleteTrip(id);
    setTrips(prev => prev.filter(t => t.id !== id));
  }, []);

  return { trips, loading, error, reload: load, create, update, remove };
}
