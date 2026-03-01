'use client';

import { useState, useEffect, useRef } from 'react';
import CheckinForm from '@/components/checkin-form/CheckinForm';
import { LocationPicker } from '@/components/LocationPicker';
import Map, { MapPhoto } from '@/components/Map';
import { useGeolocation } from '@/hooks/useGeolocation';
import { createClient } from '@/lib/supabase/client';
import type { Trip, Checkin } from '@/types/database';
import type { User } from '@supabase/supabase-js';
import { useTrips } from './hooks/useTrips';
import { useCheckins } from './hooks/useCheckins';
import SideDrawer from './components/SideDrawer';
import TripFormModal from './components/TripFormModal';
import CheckinTimeline from './components/CheckinTimeline';
import BottomBar from './components/BottomBar';

function formatTripDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  const date = isDateOnly
    ? (() => { const [y, m, d] = dateStr.split('-').map(Number); return new Date(y, m - 1, d); })()
    : new Date(dateStr);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  }).format(date);
}

export default function CheckinPage() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedTripId, setSelectedTripId] = useState('');
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
  const locationPickerInitial = useRef<{ latitude: number; longitude: number } | null>(null);
  const locationPickerCallback = useRef<((lat: number, lng: number) => void) | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const { trips, loading, error: tripsError, createTrip, updateTrip, deleteTrip } = useTrips();
  const { checkins, error: checkinsError, addCheckin, updateCheckin, deleteCheckin } = useCheckins(selectedTripId);
  const { getCurrentPosition } = useGeolocation();

  // 사용자 정보
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  // 첫 번째 여행 자동 선택
  useEffect(() => {
    if (trips.length > 0 && !selectedTripId) {
      setSelectedTripId(trips[0].id);
    }
  }, [trips, selectedTripId]);

  // 체크인 변경 시 지도 중심 업데이트
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

  const handleCheckinSuccess = (checkin: Checkin) => {
    if (editingCheckin) {
      updateCheckin(checkin);
    } else {
      addCheckin(checkin);
    }
    setShowForm(false);
    setEditingCheckin(null);
  };

  const handleDeleteCheckin = async (id: string) => {
    try {
      await deleteCheckin(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : '체크인 삭제에 실패했습니다.');
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!window.confirm('이 여행을 삭제하시겠습니까? 여행에 속한 체크인도 모두 삭제됩니다.')) return;
    try {
      const remaining = trips.filter((t) => t.id !== tripId);
      await deleteTrip(tripId);
      setSelectedTripId(remaining.length > 0 ? remaining[0].id : '');
    } catch (err) {
      alert(err instanceof Error ? err.message : '여행 삭제에 실패했습니다.');
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  const displayError = tripsError || checkinsError;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setShowDrawer(true)}
            className="bg-transparent border-0 cursor-pointer p-1 flex items-center text-gray-900 dark:text-gray-100"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="font-bold text-gray-900 dark:text-gray-100 flex-1 ml-3">
            {selectedTrip ? selectedTrip.title : 'Travel Companion'}
          </span>
          {user && (
            <div className="flex items-center gap-4">
              {user.user_metadata?.avatar_url && (
                <img
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata.name || ''}
                  className="user-avatar"
                  referrerPolicy="no-referrer"
                />
              )}
              <span className="text-sm text-gray-700 hidden sm:block">
                {user.user_metadata?.name || user.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-[15px] text-gray-500 hover:text-gray-700 px-4 py-3 rounded-full hover:bg-gray-100"
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </header>

      <div
        className="max-w-7xl mx-auto px-4 pt-8"
        style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}
      >
        {displayError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{displayError}</p>
          </div>
        )}

        {selectedTripId && (
          <>
            {showForm && (
              <CheckinForm
                tripId={selectedTripId}
                tripName={selectedTrip?.title}
                userAvatarUrl={user?.user_metadata?.avatar_url}
                editingCheckin={editingCheckin ?? undefined}
                onSuccess={handleCheckinSuccess}
                onCancel={() => { setShowForm(false); setEditingCheckin(null); }}
                onOpenLocationPicker={(initial, onSelect) => {
                  locationPickerInitial.current = initial;
                  locationPickerCallback.current = onSelect;
                  setShowLocationPicker(true);
                }}
              />
            )}

            {/* 여행 설명 및 날짜 */}
            {(() => {
              const earliest = checkins.length > 0
                ? [...checkins].sort((a, b) => new Date(a.checked_in_at).getTime() - new Date(b.checked_in_at).getTime())[0]
                : null;
              const startSrc = selectedTrip?.start_date || earliest?.checked_in_at || null;
              const endSrc = selectedTrip?.end_date || null;
              if (!selectedTrip?.description && !startSrc) return null;
              return (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-700 space-y-1">
                  {selectedTrip?.description && <p>{selectedTrip.description}</p>}
                  {startSrc && (
                    <p className="text-gray-500">
                      {formatTripDate(startSrc)}
                      {endSrc && endSrc !== selectedTrip?.start_date ? ` ~ ${formatTripDate(endSrc)}` : ''}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* 지도 */}
            <div className="mb-6">
              <Map photos={mapPhotos} height="400px" defaultCenter={mapCenter} />
              {mapPhotos.length === 0 && (
                <p className="mt-2 text-center text-sm text-gray-500">
                  체크인을 추가하면 지도에 위치가 표시됩니다
                </p>
              )}
            </div>

            <CheckinTimeline
              checkins={checkins}
              sortOrder={sortOrder}
              onSortChange={() => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
              onEdit={(checkin) => { setEditingCheckin(checkin); setShowForm(true); }}
              onDelete={handleDeleteCheckin}
            />
          </>
        )}

        {!selectedTripId && trips.length === 0 && (
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <p className="text-gray-500 text-lg mb-2">여행이 없습니다</p>
            <p className="text-gray-400 text-sm mb-4">먼저 여행을 만들어주세요!</p>
            <button
              onClick={() => { setTripFormMode('create'); setEditingTrip(undefined); setShowTripForm(true); }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              + 첫 여행 만들기
            </button>
          </div>
        )}
      </div>

      {mounted && showDrawer && (
        <SideDrawer
          trips={trips}
          selectedTripId={selectedTripId}
          onClose={() => setShowDrawer(false)}
          onSelectTrip={setSelectedTripId}
          onCreateTrip={() => { setTripFormMode('create'); setEditingTrip(undefined); setShowTripForm(true); }}
          onEditTrip={(trip) => { setEditingTrip(trip); setTripFormMode('edit'); setShowTripForm(true); }}
          onDeleteTrip={handleDeleteTrip}
        />
      )}

      {mounted && selectedTripId && !showForm && (
        <BottomBar onCheckin={() => { setEditingCheckin(null); setShowForm(true); }} />
      )}

      {mounted && showTripForm && (
        <TripFormModal
          mode={tripFormMode}
          initialTrip={editingTrip}
          onSuccess={(trip) => {
            if (tripFormMode === 'create') setSelectedTripId(trip.id);
            setShowTripForm(false);
          }}
          onCancel={() => setShowTripForm(false)}
          onCreate={createTrip}
          onUpdate={updateTrip}
        />
      )}

      {showLocationPicker && (
        <LocationPicker
          initialLocation={locationPickerInitial.current || undefined}
          onLocationSelect={(lat, lng) => {
            locationPickerCallback.current?.(lat, lng);
            setShowLocationPicker(false);
          }}
          onClose={() => setShowLocationPicker(false)}
        />
      )}
    </div>
  );
}
