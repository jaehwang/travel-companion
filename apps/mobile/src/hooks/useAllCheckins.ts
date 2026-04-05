import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useCheckinsStore } from '../store/checkinsStore';

export function useAllCheckins(tripId?: string) {
  const checkins = useCheckinsStore((s) => s.allCheckins);
  const loading = useCheckinsStore((s) => s.allCheckinsLoading);
  const error = useCheckinsStore((s) => s.allCheckinsError);
  const loadAllCheckins = useCheckinsStore((s) => s.loadAllCheckins);

  const load = useCallback(async () => {
    await loadAllCheckins(tripId);
  }, [tripId, loadAllCheckins]);

  useFocusEffect(
    useCallback(() => {
      useCheckinsStore.setState({ allCheckinsLoading: true });
      load();
    }, [load]),
  );

  return { checkins, loading, error, reload: load };
}
