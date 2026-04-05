'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useGeolocation } from '@/hooks/useGeolocation';
import type { Trip, Checkin } from '@travel-companion/shared';
import type { User } from '@supabase/supabase-js';
import type { MapPhoto } from '@/components/Map';
import { useTrips } from './useTrips';
import { useCheckins } from './useCheckins';
import { useTripTagline } from './useTripTagline';

export function formatTripDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  const date = isDateOnly
    ? (() => { const [y, m, d] = dateStr.split('-').map(Number); return new Date(y, m - 1, d); })()
    : new Date(dateStr);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  }).format(date);
}

export function useCheckinPage() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [selectedTripId, setSelectedTripId] = useState(searchParams.get('trip_id') ?? '');
  const [showForm, setShowForm] = useState(false);
  const [editingCheckin, setEditingCheckin] = useState<Checkin | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showTripForm, setShowTripForm] = useState(false);
  const [tripFormMode, setTripFormMode] = useState<'create' | 'edit'>('create');
  const [editingTrip, setEditingTrip] = useState<Trip | undefined>();
  const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.978 });
  const [mounted, setMounted] = useState(false);
  const [applyingPlace, setApplyingPlace] = useState(false);
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);

  /**
   * LocationPicker 연결용 ref 쌍
   * state 대신 ref를 사용하는 이유: CheckinForm이 넘기는 onSelect 클로저를 state로 저장하면
   * LocationPicker 닫힌 뒤 호출 시 stale closure 문제가 생긴다. ref는 항상 최신값 보장.
   */
  const locationPickerInitial = useRef<{ latitude: number; longitude: number } | null>(null);
  const locationPickerCallback = useRef<((lat: number, lng: number, place?: { name: string; place_id: string }) => void) | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const { trips, loading, error: tripsError, createTrip, updateTrip, deleteTrip } = useTrips();
  const { checkins, error: checkinsError, addCheckin, updateCheckin, deleteCheckin, reloadCheckins } = useCheckins(selectedTripId);
  const { getCurrentPosition } = useGeolocation();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  useEffect(() => {
    if (trips.length > 0 && !selectedTripId) {
      setSelectedTripId(trips[0].id);
    }
  }, [trips, selectedTripId]);

  useEffect(() => {
    if (checkins.length > 0) {
      const last = checkins[0];
      setMapCenter({ lat: last.latitude, lng: last.longitude });
    } else {
      getCurrentPosition()
        .then((pos) => setMapCenter({ lat: pos.latitude, lng: pos.longitude }))
        .catch(() => {});
    }
  }, [checkins, getCurrentPosition]);

  const selectedTrip = trips.find((t) => t.id === selectedTripId);
  const { tagline, loading: taglineLoading, error: taglineError, refresh: refreshTagline } = useTripTagline(selectedTrip);

  const mapPhotos: MapPhoto[] = checkins
    .map((c) => ({
      id: c.id,
      url: c.photo_url || '',
      latitude: c.latitude,
      longitude: c.longitude,
      title: c.title,
      place: c.place,
      place_id: c.place_id,
      takenAt: c.checked_in_at,
      message: c.message,
    }))
    .sort((a, b) => new Date(a.takenAt!).getTime() - new Date(b.takenAt!).getTime());

  const openLocationPicker = (
    initial: { latitude: number; longitude: number } | null,
    onSelect: (lat: number, lng: number, place?: { name: string; place_id: string }) => void,
  ) => {
    locationPickerInitial.current = initial;
    locationPickerCallback.current = onSelect;
    setShowLocationPicker(true);
  };

  const handleCheckinSuccess = (checkin: Checkin) => {
    if (editingCheckin) {
      updateCheckin(checkin);
    } else {
      addCheckin(checkin);
    }
    refreshTagline();
    setShowForm(false);
    setEditingCheckin(null);
  };

  const handleDeleteCheckin = async (id: string) => {
    try {
      await deleteCheckin(id);
      refreshTagline();
    } catch (err) {
      alert(err instanceof Error ? err.message : '체크인 삭제에 실패했습니다.');
    }
  };

  const handleDeleteTrip = (tripId: string) => {
    setDeletingTripId(tripId);
  };

  const executeDeleteTrip = async (tripId: string, moveCheckins: boolean) => {
    setDeletingTripId(null);
    try {
      const remaining = trips.filter((t) => t.id !== tripId);
      await deleteTrip(tripId, moveCheckins);
      setSelectedTripId(remaining.length > 0 ? remaining[0].id : '');
    } catch (err) {
      alert(err instanceof Error ? err.message : '여행 삭제에 실패했습니다.');
    }
  };

  const handleBulkApplyPlace = async () => {
    if (!selectedTrip?.place || checkins.length === 0) return;
    const confirmed = window.confirm(
      `"${selectedTrip.place}"을(를) 이 여행의 모든 체크인(${checkins.length}개)에 적용합니다. 기존 장소가 덮어씌워집니다.`
    );
    if (!confirmed) return;
    setApplyingPlace(true);
    try {
      const res = await fetch(`/api/trips/${selectedTrip.id}/apply-place`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to apply place');
      }
      await reloadCheckins();
      alert('장소가 모든 체크인에 적용되었습니다.');
    } catch (err) {
      alert(err instanceof Error ? err.message : '일괄 적용에 실패했습니다.');
    } finally {
      setApplyingPlace(false);
    }
  };

  const displayError = tripsError || checkinsError;

  return {
    user,
    selectedTripId,
    setSelectedTripId,
    selectedTrip,
    showForm,
    setShowForm,
    editingCheckin,
    setEditingCheckin,
    sortOrder,
    setSortOrder,
    mounted,
    loading,
    displayError,
    trips,
    checkins,
    mapPhotos,
    mapCenter,
    tagline,
    taglineLoading,
    taglineError,
    refreshTagline,
    showDrawer,
    setShowDrawer,
    showTripForm,
    setShowTripForm,
    tripFormMode,
    setTripFormMode,
    editingTrip,
    setEditingTrip,
    deletingTripId,
    setDeletingTripId,
    applyingPlace,
    showLocationPicker,
    setShowLocationPicker,
    locationPickerInitial,
    locationPickerCallback,
    openLocationPicker,
    handleCheckinSuccess,
    handleDeleteCheckin,
    handleDeleteTrip,
    executeDeleteTrip,
    handleBulkApplyPlace,
    createTrip,
    updateTrip,
  };
}
