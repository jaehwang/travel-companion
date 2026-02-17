'use client';

import { useState, useEffect } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import PhotoUpload from '@/components/PhotoUpload';
import { CHECKIN_CATEGORY_LABELS } from '@/types/database';
import type { Checkin } from '@/types/database';
import type { PhotoMetadata } from '@/lib/exif';

interface CheckinFormProps {
  tripId: string;
  editingCheckin?: Checkin;
  onSuccess?: (checkin: Checkin) => void;
  onCancel?: () => void;
  onOpenLocationPicker?: (
    initial: { latitude: number; longitude: number } | null,
    onSelect: (lat: number, lng: number) => void
  ) => void;
}

export function CheckinForm({ tripId, editingCheckin, onSuccess, onCancel, onOpenLocationPicker }: CheckinFormProps) {
  const [locationName, setLocationName] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoMetadata, setPhotoMetadata] = useState<PhotoMetadata | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getCurrentPosition, loading: gettingLocation, error: locationError } = useGeolocation();

  // 수정 모드: editingCheckin이 바뀌면 폼 초기화
  useEffect(() => {
    if (editingCheckin) {
      setLocationName(editingCheckin.location_name || '');
      setCategory(editingCheckin.category || '');
      setMessage(editingCheckin.message || '');
      setSelectedLocation({
        latitude: editingCheckin.latitude,
        longitude: editingCheckin.longitude,
      });
      setPhotoUrl(editingCheckin.photo_url || '');
      setPhotoMetadata(null);
    } else {
      setLocationName('');
      setCategory('');
      setMessage('');
      setSelectedLocation(null);
      setPhotoUrl('');
      setPhotoMetadata(null);
    }
    setError(null);
  }, [editingCheckin]);

  const handleUseCurrentLocation = async () => {
    try {
      const position = await getCurrentPosition();
      setSelectedLocation({
        latitude: position.latitude,
        longitude: position.longitude,
      });
      setError(null);
    } catch (err) {
      console.error('Failed to get current location:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLocation) {
      setError('위치를 선택해주세요.');
      return;
    }

    if (!locationName.trim()) {
      setError('장소 이름을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const isEditMode = !!editingCheckin;
      const url = isEditMode ? `/api/checkins/${editingCheckin!.id}` : '/api/checkins';
      const method = isEditMode ? 'PATCH' : 'POST';

      const body: Record<string, unknown> = {
        location_name: locationName.trim(),
        message: message.trim() || undefined,
        category: category || undefined,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        photo_url: photoUrl || undefined,
        photo_metadata: photoMetadata || undefined,
      };

      if (!isEditMode) {
        body.trip_id = tripId;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || (isEditMode ? 'Failed to update checkin' : 'Failed to create checkin'));
      }

      // 성공 시 폼 리셋 (새 체크인 모드만)
      if (!isEditMode) {
        setLocationName('');
        setCategory('');
        setMessage('');
        setSelectedLocation(null);
        setPhotoUrl('');
        setPhotoMetadata(null);
      }

      if (onSuccess) {
        onSuccess(data.checkin);
      }
    } catch (err) {
      const isEditMode = !!editingCheckin;
      console.error(isEditMode ? 'Failed to update checkin:' : 'Failed to create checkin:', err);
      setError(err instanceof Error ? err.message : (isEditMode ? '체크인 수정에 실패했습니다.' : '체크인 생성에 실패했습니다.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditMode = !!editingCheckin;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold text-gray-900">
        {isEditMode ? '체크인 수정' : '새 체크인'}
      </h2>

      {/* 장소 이름 */}
      <div>
        <label htmlFor="location-name" className="block text-sm font-medium text-gray-700 mb-1">
          장소 이름 *
        </label>
        <input
          id="location-name"
          type="text"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          placeholder="예: 에펠탑, 스타벅스 강남점"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* 카테고리 */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          카테고리
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">선택 안 함</option>
          {Object.entries(CHECKIN_CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* 메모 */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
          메모
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="여행 중 느낀 점이나 기억하고 싶은 내용을 적어보세요..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 사진 첨부 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          사진 첨부 (선택)
        </label>
        <PhotoUpload
          onUploadComplete={(url, metadata) => {
            setPhotoUrl(url);
            setPhotoMetadata(metadata);

            // GPS 정보가 있으면 자동으로 위치 설정
            if (metadata.gps && metadata.gps.latitude && metadata.gps.longitude) {
              setSelectedLocation({
                latitude: metadata.gps.latitude,
                longitude: metadata.gps.longitude,
              });
              setError(null);
            }
          }}
          onUploadError={(error) => {
            setError(error);
          }}
        />
        {photoUrl && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              ✅ 사진 업로드 완료
              {photoMetadata?.gps && ' (GPS 정보 자동 추출됨)'}
            </p>
          </div>
        )}
      </div>

      {/* 위치 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          위치 *
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={gettingLocation}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {gettingLocation ? '위치 가져오는 중...' : '📍 현재 위치'}
          </button>
          <button
            type="button"
            onClick={() => onOpenLocationPicker?.(selectedLocation, (lat, lng) => {
              setSelectedLocation({ latitude: lat, longitude: lng });
              setError(null);
            })}
            disabled={!onOpenLocationPicker}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400"
          >
            🗺️ 지도에서 선택
          </button>
        </div>

        {selectedLocation && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              ✅ 위치 선택됨: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
            </p>
          </div>
        )}

        {locationError && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">{locationError.message}</p>
            {locationError.code === 1 && (
              <p className="text-xs text-yellow-700 mt-1">
                💡 &quot;지도에서 선택&quot; 버튼으로 위치를 선택할 수 있습니다.
              </p>
            )}
          </div>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* 버튼 */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting || !selectedLocation}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {isSubmitting ? (isEditMode ? '수정 중...' : '등록 중...') : (isEditMode ? '수정 완료' : '체크인 등록')}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100"
          >
            취소
          </button>
        )}
      </div>
    </form>
  );
}
