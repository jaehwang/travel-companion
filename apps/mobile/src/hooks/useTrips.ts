import { useEffect, useCallback } from 'react';
import type { Trip, TripFormData } from '../../../../packages/shared/src/types';
import { useTripsStore } from '../store/tripsStore';

export function useTrips() {
  const trips = useTripsStore((s) => s.trips);
  const loading = useTripsStore((s) => s.loading);
  const error = useTripsStore((s) => s.error);
  const loadTrips = useTripsStore((s) => s.loadTrips);
  const addTrip = useTripsStore((s) => s.addTrip);
  const updateTripAction = useTripsStore((s) => s.updateTrip);
  const removeTripAction = useTripsStore((s) => s.removeTrip);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const reload = useCallback(async () => {
    // Force reload by resetting loading state first
    useTripsStore.setState({ loading: false });
    await loadTrips();
  }, [loadTrips]);

  const create = useCallback(
    async (data: TripFormData): Promise<Trip> => {
      return addTrip(data);
    },
    [addTrip],
  );

  const update = useCallback(
    async (id: string, data: Partial<TripFormData>): Promise<Trip> => {
      return updateTripAction(id, data);
    },
    [updateTripAction],
  );

  const remove = useCallback(
    async (id: string, moveCheckins?: boolean): Promise<void> => {
      return removeTripAction(id, moveCheckins);
    },
    [removeTripAction],
  );

  return { trips, loading, error, reload, create, update, remove };
}
