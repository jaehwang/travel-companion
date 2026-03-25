import { create } from 'zustand';
import type { Checkin, CheckinInsert } from '../../../../packages/shared/src/types';
import {
  fetchCheckins as apiFetchCheckins,
  fetchAllCheckins as apiFetchAllCheckins,
  createCheckin as apiCreateCheckin,
  updateCheckin as apiUpdateCheckin,
  deleteCheckin as apiDeleteCheckin,
} from '../lib/api';

interface CheckinsState {
  // Per-trip checkins
  checkins: Checkin[];
  tripId: string | null;
  loading: boolean;
  error: string | null;

  // All checkins (across trips)
  allCheckins: Checkin[];
  allCheckinsLoading: boolean;
  allCheckinsError: string | null;

  loadCheckins: (tripId: string) => Promise<void>;
  loadAllCheckins: (tripId?: string) => Promise<void>;
  addCheckin: (data: CheckinInsert) => Promise<Checkin>;
  updateCheckin: (id: string, data: Partial<CheckinInsert>) => Promise<Checkin>;
  removeCheckin: (id: string) => Promise<void>;
}

export const useCheckinsStore = create<CheckinsState>((set, get) => ({
  checkins: [],
  tripId: null,
  loading: true,
  error: null,

  allCheckins: [],
  allCheckinsLoading: true,
  allCheckinsError: null,

  loadCheckins: async (tripId: string) => {
    if (!tripId) return;
    try {
      set({ error: null, loading: true, tripId });
      const data = await apiFetchCheckins(tripId);
      // Only update if tripId hasn't changed during fetch
      if (get().tripId === tripId) {
        set({ checkins: data, loading: false });
      }
    } catch (err) {
      if (get().tripId === tripId) {
        set({
          error: err instanceof Error ? err.message : 'Failed to load checkins',
          loading: false,
        });
      }
    }
  },

  loadAllCheckins: async (tripId?: string) => {
    try {
      set({ allCheckinsError: null, allCheckinsLoading: true });
      const data = await apiFetchAllCheckins(tripId);
      set({ allCheckins: data, allCheckinsLoading: false });
    } catch (err) {
      set({
        allCheckinsError: err instanceof Error ? err.message : 'Failed to load checkins',
        allCheckinsLoading: false,
      });
    }
  },

  addCheckin: async (data: CheckinInsert) => {
    const checkin = await apiCreateCheckin(data);
    set((state) => ({
      checkins: state.tripId === checkin.trip_id
        ? [checkin, ...state.checkins]
        : state.checkins,
      allCheckins: [checkin, ...state.allCheckins],
    }));
    return checkin;
  },

  updateCheckin: async (id: string, data: Partial<CheckinInsert>) => {
    const checkin = await apiUpdateCheckin(id, data);
    set((state) => ({
      checkins: state.checkins.map((c) => (c.id === id ? checkin : c)),
      allCheckins: state.allCheckins.map((c) => (c.id === id ? checkin : c)),
    }));
    return checkin;
  },

  removeCheckin: async (id: string) => {
    await apiDeleteCheckin(id);
    set((state) => ({
      checkins: state.checkins.filter((c) => c.id !== id),
      allCheckins: state.allCheckins.filter((c) => c.id !== id),
    }));
  },
}));
