import { useEffect, useCallback, useRef } from 'react';
import { useShallow } from 'zustand/shallow';
import type { Checkin, CheckinInsert } from '@travel-companion/shared';
import { useCheckinsStore } from '../store/checkinsStore';

const EMPTY_CHECKINS: Checkin[] = [];

export function useCheckins(tripId: string) {
  const { storeCheckins, storeTripId, storeLoading, storeError } = useCheckinsStore(
    useShallow((s) => ({
      storeCheckins: s.checkins,
      storeTripId: s.tripId,
      storeLoading: s.loading,
      storeError: s.error,
    })),
  );

  const checkins = storeTripId === tripId ? storeCheckins : EMPTY_CHECKINS;
  const loading = storeTripId === tripId ? storeLoading : true;
  const error = storeTripId === tripId ? storeError : null;

  const loadCheckins = useCheckinsStore((s) => s.loadCheckins);
  const addCheckin = useCheckinsStore((s) => s.addCheckin);
  const updateCheckinAction = useCheckinsStore((s) => s.updateCheckin);
  const removeCheckinAction = useCheckinsStore((s) => s.removeCheckin);

  useEffect(() => {
    if (tripId) {
      loadCheckins(tripId);
    }
  }, [tripId, loadCheckins]);

  const reload = useCallback(async () => {
    if (tripId) {
      await loadCheckins(tripId);
    }
  }, [tripId, loadCheckins]);

  const create = useCallback(
    async (data: CheckinInsert): Promise<Checkin> => {
      return addCheckin(data);
    },
    [addCheckin],
  );

  const update = useCallback(
    async (id: string, data: Partial<CheckinInsert>): Promise<Checkin> => {
      return updateCheckinAction(id, data);
    },
    [updateCheckinAction],
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      return removeCheckinAction(id);
    },
    [removeCheckinAction],
  );

  return { checkins, loading, error, reload, create, update, remove };
}
