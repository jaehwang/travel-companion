'use client';

import { useState, useEffect } from 'react';
import type { Checkin } from '@/types/database';

export function useCheckins(tripId: string) {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) {
      setCheckins([]);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/checkins?trip_id=${tripId}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Failed to fetch checkins');
        setCheckins(data.checkins || []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : '체크인 목록을 불러오는데 실패했습니다.');
      })
      .finally(() => setLoading(false));
  }, [tripId]);

  const addCheckin = (checkin: Checkin) => {
    setCheckins((prev) => [checkin, ...prev]);
  };

  const updateCheckin = (checkin: Checkin) => {
    setCheckins((prev) => prev.map((c) => (c.id === checkin.id ? checkin : c)));
  };

  const deleteCheckin = async (id: string): Promise<void> => {
    const response = await fetch(`/api/checkins/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to delete checkin');
    }
    setCheckins((prev) => prev.filter((c) => c.id !== id));
  };

  const reloadCheckins = async () => {
    if (!tripId) return;
    try {
      const r = await fetch(`/api/checkins?trip_id=${tripId}`);
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed to fetch checkins');
      setCheckins(data.checkins || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '체크인 목록을 불러오는데 실패했습니다.');
    }
  };

  return { checkins, loading, error, addCheckin, updateCheckin, deleteCheckin, reloadCheckins };
}
