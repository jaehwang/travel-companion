import { create } from 'zustand';
import type { Trip, TripFormData } from '../../../../packages/shared/src/types';
import {
  fetchTrips as apiFetchTrips,
  createTrip as apiCreateTrip,
  updateTrip as apiUpdateTrip,
  deleteTrip as apiDeleteTrip,
} from '../lib/api';

interface TripsState {
  trips: Trip[];
  loading: boolean;
  error: string | null;

  loadTrips: () => Promise<void>;
  addTrip: (data: TripFormData) => Promise<Trip>;
  updateTrip: (id: string, data: Partial<TripFormData>) => Promise<Trip>;
  removeTrip: (id: string) => Promise<void>;
}

export const useTripsStore = create<TripsState>((set, get) => ({
  trips: [],
  loading: true,
  error: null,

  loadTrips: async () => {
    if (get().loading && get().trips.length > 0) return; // 중복 호출 방지
    try {
      set({ error: null, loading: true });
      const data = await apiFetchTrips();
      set({ trips: data, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load trips',
        loading: false,
      });
    }
  },

  addTrip: async (data: TripFormData) => {
    const trip = await apiCreateTrip(data);
    set((state) => ({ trips: [trip, ...state.trips] }));
    return trip;
  },

  updateTrip: async (id: string, data: Partial<TripFormData>) => {
    const trip = await apiUpdateTrip(id, data);
    set((state) => ({
      trips: state.trips.map((t) => (t.id === id ? trip : t)),
    }));
    return trip;
  },

  removeTrip: async (id: string) => {
    await apiDeleteTrip(id);
    set((state) => ({
      trips: state.trips.filter((t) => t.id !== id),
    }));
  },
}));
