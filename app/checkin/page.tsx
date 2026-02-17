'use client';

import { useState, useEffect, useRef } from 'react';
import { CheckinForm } from '@/components/CheckinForm';
import { CheckinListItem } from '@/components/CheckinListItem';
import { LocationPicker } from '@/components/LocationPicker';
import Map, { MapPhoto } from '@/components/Map';
import type { Trip, Checkin } from '@/types/database';

export default function CheckinPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCheckin, setEditingCheckin] = useState<Checkin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const locationPickerInitial = useRef<{ latitude: number; longitude: number } | null>(null);
  const locationPickerCallback = useRef<((lat: number, lng: number) => void) | null>(null);

  // 여행 편집 상태
  const [editingTrip, setEditingTrip] = useState(false);
  const [tripEditTitle, setTripEditTitle] = useState('');
  const [tripEditDescription, setTripEditDescription] = useState('');
  const [tripEditStartDate, setTripEditStartDate] = useState('');
  const [tripEditEndDate, setTripEditEndDate] = useState('');
  const [tripEditIsPublic, setTripEditIsPublic] = useState(false);
  const [tripEditSubmitting, setTripEditSubmitting] = useState(false);

  // 여행 목록 로드
  useEffect(() => {
    fetchTrips();
  }, []);

  // 선택된 여행의 체크인 로드
  useEffect(() => {
    if (selectedTripId) {
      fetchCheckins(selectedTripId);
    } else {
      setCheckins([]);
    }
  }, [selectedTripId]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/trips');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch trips');
      }

      setTrips(data.trips || []);

      // 첫 번째 여행 자동 선택
      if (data.trips && data.trips.length > 0) {
        setSelectedTripId(data.trips[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch trips:', err);
      setError(err instanceof Error ? err.message : '여행 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCheckins = async (tripId: string) => {
    try {
      const response = await fetch(`/api/checkins?trip_id=${tripId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch checkins');
      }

      setCheckins(data.checkins || []);
    } catch (err) {
      console.error('Failed to fetch checkins:', err);
      setError(err instanceof Error ? err.message : '체크인 목록을 불러오는데 실패했습니다.');
    }
  };

  const handleCheckinSuccess = (checkin: Checkin) => {
    if (editingCheckin) {
      // 수정 모드: 목록에서 해당 항목 교체
      setCheckins((prev) => prev.map((c) => (c.id === checkin.id ? checkin : c)));
    } else {
      // 생성 모드: 목록 맨 앞에 추가
      setCheckins((prev) => [checkin, ...prev]);
    }
    setShowForm(false);
    setEditingCheckin(null);
  };

  const handleEditCheckin = (checkin: Checkin) => {
    setEditingCheckin(checkin);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteCheckin = async (checkinId: string) => {
    try {
      const response = await fetch(`/api/checkins/${checkinId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete checkin');
      }

      setCheckins((prev) => prev.filter((c) => c.id !== checkinId));
    } catch (err) {
      console.error('Failed to delete checkin:', err);
      alert(err instanceof Error ? err.message : '체크인 삭제에 실패했습니다.');
    }
  };

  const handleCreateTrip = async () => {
    const title = prompt('여행 이름을 입력하세요:');
    if (!title || !title.trim()) return;

    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          is_public: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create trip');
      }

      setTrips((prev) => [data.trip, ...prev]);
      setSelectedTripId(data.trip.id);
    } catch (err) {
      console.error('Failed to create trip:', err);
      alert(err instanceof Error ? err.message : '여행 생성에 실패했습니다.');
    }
  };

  const selectedTrip = trips.find((t) => t.id === selectedTripId);

  const handleOpenTripEdit = () => {
    if (!selectedTrip) return;
    setTripEditTitle(selectedTrip.title);
    setTripEditDescription(selectedTrip.description || '');
    setTripEditStartDate(selectedTrip.start_date || '');
    setTripEditEndDate(selectedTrip.end_date || '');
    setTripEditIsPublic(selectedTrip.is_public);
    setEditingTrip(true);
  };

  const handleUpdateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTripId) return;

    setTripEditSubmitting(true);
    try {
      const response = await fetch(`/api/trips/${selectedTripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: tripEditTitle,
          description: tripEditDescription || undefined,
          start_date: tripEditStartDate || undefined,
          end_date: tripEditEndDate || undefined,
          is_public: tripEditIsPublic,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update trip');
      }

      setTrips((prev) => prev.map((t) => (t.id === data.trip.id ? data.trip : t)));
      setEditingTrip(false);
    } catch (err) {
      console.error('Failed to update trip:', err);
      alert(err instanceof Error ? err.message : '여행 수정에 실패했습니다.');
    } finally {
      setTripEditSubmitting(false);
    }
  };

  const handleDeleteTrip = async () => {
    if (!selectedTripId) return;
    if (!window.confirm('이 여행을 삭제하시겠습니까? 여행에 속한 체크인도 모두 삭제됩니다.')) return;

    try {
      const response = await fetch(`/api/trips/${selectedTripId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete trip');
      }

      const remaining = trips.filter((t) => t.id !== selectedTripId);
      setTrips(remaining);
      setSelectedTripId(remaining.length > 0 ? remaining[0].id : '');
      setCheckins([]);
    } catch (err) {
      console.error('Failed to delete trip:', err);
      alert(err instanceof Error ? err.message : '여행 삭제에 실패했습니다.');
    }
  };

  // Checkin을 MapPhoto 형식으로 변환
  const mapPhotos: MapPhoto[] = checkins.map((checkin) => ({
    id: checkin.id,
    url: checkin.photo_url || '',
    latitude: checkin.latitude,
    longitude: checkin.longitude,
    title: checkin.location_name,
    takenAt: checkin.checked_in_at,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">체크인</h1>

          {/* 여행 선택 */}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label htmlFor="trip-select" className="block text-sm font-medium text-gray-700 mb-1">
                여행 선택
              </label>
              {trips.length > 0 ? (
                <select
                  id="trip-select"
                  value={selectedTripId}
                  onChange={(e) => {
                    setSelectedTripId(e.target.value);
                    setEditingTrip(false);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {trips.map((trip) => (
                    <option key={trip.id} value={trip.id}>
                      {trip.title}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-500 text-sm py-2">여행이 없습니다. 새 여행을 만들어주세요.</p>
              )}
            </div>
            {selectedTripId && (
              <>
                <button
                  onClick={handleOpenTripEdit}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 whitespace-nowrap"
                >
                  수정
                </button>
                <button
                  onClick={handleDeleteTrip}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 whitespace-nowrap"
                >
                  삭제
                </button>
              </>
            )}
            <button
              onClick={handleCreateTrip}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 whitespace-nowrap"
            >
              + 새 여행
            </button>
          </div>

          {/* 여행 편집 폼 */}
          {editingTrip && selectedTrip && (
            <form onSubmit={handleUpdateTrip} className="mt-4 p-4 bg-white border border-gray-200 rounded-lg space-y-3">
              <h3 className="font-semibold text-gray-900">여행 수정</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
                <input
                  type="text"
                  value={tripEditTitle}
                  onChange={(e) => setTripEditTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  value={tripEditDescription}
                  onChange={(e) => setTripEditDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                  <input
                    type="date"
                    value={tripEditStartDate}
                    onChange={(e) => setTripEditStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                  <input
                    type="date"
                    value={tripEditEndDate}
                    onChange={(e) => setTripEditEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="trip-is-public"
                  type="checkbox"
                  checked={tripEditIsPublic}
                  onChange={(e) => setTripEditIsPublic(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="trip-is-public" className="text-sm text-gray-700">공개 여행</label>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={tripEditSubmitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 font-medium"
                >
                  {tripEditSubmitting ? '저장 중...' : '저장'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTrip(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  취소
                </button>
              </div>
            </form>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {selectedTripId && (
          <>
            {/* 새 체크인 버튼 */}
            {!showForm && (
              <div className="mb-6">
                <button
                  onClick={() => {
                    setEditingCheckin(null);
                    setShowForm(true);
                  }}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-lg"
                >
                  + 새 체크인 추가
                </button>
              </div>
            )}

            {/* 체크인 폼 */}
            {showForm && (
              <div className="mb-6">
                <CheckinForm
                  tripId={selectedTripId}
                  editingCheckin={editingCheckin ?? undefined}
                  onSuccess={handleCheckinSuccess}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingCheckin(null);
                  }}
                  onOpenLocationPicker={(initial, onSelect) => {
                    locationPickerInitial.current = initial;
                    locationPickerCallback.current = onSelect;
                    setShowLocationPicker(true);
                  }}
                />
              </div>
            )}

            {/* 지도 */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">지도</h2>
              <Map photos={mapPhotos} height="400px" />
              {mapPhotos.length === 0 && (
                <p className="mt-2 text-center text-sm text-gray-500">
                  체크인을 추가하면 지도에 위치가 표시됩니다
                </p>
              )}
            </div>

            {/* 체크인 목록 */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                체크인 목록 ({checkins.length})
              </h2>

              {checkins.length > 0 ? (
                <div className="space-y-4">
                  {checkins.map((checkin) => (
                    <CheckinListItem
                      key={checkin.id}
                      checkin={checkin}
                      onEdit={handleEditCheckin}
                      onDelete={handleDeleteCheckin}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                  <p className="text-gray-500 text-lg mb-2">아직 체크인이 없습니다</p>
                  <p className="text-gray-400 text-sm">
                    위의 &quot;새 체크인 추가&quot; 버튼을 눌러 첫 체크인을 만들어보세요!
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {!selectedTripId && trips.length === 0 && (
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <p className="text-gray-500 text-lg mb-2">여행이 없습니다</p>
            <p className="text-gray-400 text-sm mb-4">
              먼저 여행을 만들어주세요!
            </p>
            <button
              onClick={handleCreateTrip}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              + 첫 여행 만들기
            </button>
          </div>
        )}
      </div>
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
