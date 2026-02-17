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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const locationPickerInitial = useRef<{ latitude: number; longitude: number } | null>(null);
  const locationPickerCallback = useRef<((lat: number, lng: number) => void) | null>(null);

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

  const handleCheckinSuccess = (newCheckin: Checkin) => {
    setCheckins((prev) => [newCheckin, ...prev]);
    setShowForm(false);
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

  // Checkin을 MapPhoto 형식으로 변환
  const mapPhotos: MapPhoto[] = checkins.map((checkin) => ({
    id: checkin.id,
    url: checkin.photo_url || '',
    latitude: checkin.latitude,
    longitude: checkin.longitude,
    title: checkin.location_name,
    takenAt: checkin.checked_in_at, // ISO string 그대로 전달
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
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <label htmlFor="trip-select" className="block text-sm font-medium text-gray-700 mb-1">
                여행 선택
              </label>
              {trips.length > 0 ? (
                <select
                  id="trip-select"
                  value={selectedTripId}
                  onChange={(e) => setSelectedTripId(e.target.value)}
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
            <button
              onClick={handleCreateTrip}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 whitespace-nowrap"
            >
              + 새 여행
            </button>
          </div>
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
                  onClick={() => setShowForm(true)}
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
                  onSuccess={handleCheckinSuccess}
                  onCancel={() => setShowForm(false)}
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
                    <CheckinListItem key={checkin.id} checkin={checkin} />
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
