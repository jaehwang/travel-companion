'use client';

import { useState, useEffect } from 'react';
import type { Trip, TripFormData } from '@/types/database';

export type { TripFormData };

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await fetch('/api/trips');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch trips');
        setTrips(data.trips || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : '여행 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  const createTrip = async (data: TripFormData): Promise<Trip> => {
    const response = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to create trip');
    const newTrip = result.trip as Trip;
    setTrips((prev) => [newTrip, ...prev]);
    return newTrip;
  };

  const updateTrip = async (id: string, data: Partial<TripFormData>): Promise<Trip> => {
    const response = await fetch(`/api/trips/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to update trip');
    const updatedTrip = result.trip as Trip;
    setTrips((prev) => prev.map((t) => (t.id === updatedTrip.id ? updatedTrip : t)));
    return updatedTrip;
  };

  const deleteTrip = async (id: string): Promise<void> => {
    const response = await fetch(`/api/trips/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to delete trip');
    }
    setTrips((prev) => prev.filter((t) => t.id !== id));
  };

  return { trips, loading, error, createTrip, updateTrip, deleteTrip };
}
