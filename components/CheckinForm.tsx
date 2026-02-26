'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/lib/supabase';
import { extractPhotoMetadata } from '@/lib/exif';
import { CHECKIN_CATEGORY_LABELS } from '@/types/database';
import type { Checkin, CheckinCategory } from '@/types/database';
import type { PhotoMetadata } from '@/lib/exif';

type Panel = 'main' | 'place-search' | 'category';

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

const CATEGORY_EMOJI: Record<string, string> = {
  restaurant: '🍽️',
  attraction: '🏛️',
  accommodation: '🏨',
  cafe: '☕',
  shopping: '🛍️',
  nature: '🌿',
  activity: '🎯',
  transportation: '🚌',
  other: '📌',
};

interface CheckinFormProps {
  tripId: string;
  tripName?: string;
  userAvatarUrl?: string;
  editingCheckin?: Checkin;
  onSuccess?: (checkin: Checkin) => void;
  onCancel?: () => void;
  onOpenLocationPicker?: (
    initial: { latitude: number; longitude: number } | null,
    onSelect: (lat: number, lng: number) => void
  ) => void;
}

export function CheckinForm({
  tripId,
  tripName,
  userAvatarUrl,
  editingCheckin,
  onSuccess,
  onCancel,
  onOpenLocationPicker,
}: CheckinFormProps) {
  const [activePanel, setActivePanel] = useState<Panel>('main');

  // 폼 필드
  const [title, setTitle] = useState('');
  const [place, setPlace] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string>('');
  const [photoMetadata, setPhotoMetadata] = useState<PhotoMetadata | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 사진 업로드 상태
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 장소 검색 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);

  // 키보드 높이 추적 (Visual Viewport API)
  const [toolbarBottom, setToolbarBottom] = useState(0);
  const TOOLBAR_HEIGHT = 72;

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handler = () => {
      const kbHeight = Math.max(0, window.innerHeight - vv.height - (vv.offsetTop || 0));
      setToolbarBottom(kbHeight);
    };
    vv.addEventListener('resize', handler);
    vv.addEventListener('scroll', handler);
    handler();
    return () => {
      vv.removeEventListener('resize', handler);
      vv.removeEventListener('scroll', handler);
    };
  }, []);

  const isEditMode = !!editingCheckin;
  const canSubmit =
    !!selectedLocation &&
    !!title.trim() &&
    !isSubmitting &&
    !isProcessingPhoto &&
    !isUploadingPhoto;

  // 수정 모드 초기화
  useEffect(() => {
    if (editingCheckin) {
      setTitle(editingCheckin.title || '');
      setPlace(editingCheckin.place || '');
      setPlaceId(editingCheckin.place_id || '');
      setCategory(editingCheckin.category || '');
      setMessage(editingCheckin.message || '');
      setSelectedLocation({
        latitude: editingCheckin.latitude,
        longitude: editingCheckin.longitude,
      });
      setPhotoUrl(editingCheckin.photo_url || '');
      setPhotoPreviewUrl(editingCheckin.photo_url || '');
      setPhotoMetadata(null);
    } else {
      setTitle('');
      setPlace('');
      setPlaceId('');
      setCategory('');
      setMessage('');
      setSelectedLocation(null);
      setPhotoUrl('');
      setPhotoPreviewUrl('');
      setPhotoMetadata(null);
    }
    setActivePanel('main');
    setSearchQuery('');
    setPredictions([]);
    setError(null);
  }, [editingCheckin]);

  // 장소 검색 debounce
  useEffect(() => {
    if (activePanel !== 'place-search' || !searchQuery || searchQuery.trim().length < 2) {
      setPredictions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingPlaces(true);
      try {
        const response = await fetch(
          `/api/places/autocomplete?input=${encodeURIComponent(searchQuery)}`
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setPredictions(data.predictions || []);
      } catch {
        setPredictions([]);
      } finally {
        setSearchingPlaces(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, activePanel]);

  // 사진 파일 선택 + 업로드
  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }

    setIsProcessingPhoto(true);
    setError(null);
    const preview = URL.createObjectURL(file);
    setPhotoPreviewUrl(preview);
    setPhotoUrl('');

    try {
      const meta = await extractPhotoMetadata(file);
      setPhotoMetadata(meta);

      if (meta.gps?.latitude && meta.gps?.longitude) {
        setSelectedLocation({ latitude: meta.gps.latitude, longitude: meta.gps.longitude });
      }

      setIsUploadingPhoto(true);
      setIsProcessingPhoto(false);

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: 0.85,
      };
      const compressed = await imageCompression(file, options);
      const filePath = `photos/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('trip-photos')
        .upload(filePath, compressed, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;

      const { data: signedData, error: signedError } = await supabase.storage
        .from('trip-photos')
        .createSignedUrl(filePath, 31536000);
      if (signedError) throw signedError;

      setPhotoUrl(signedData.signedUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '사진 업로드에 실패했습니다.';
      setError(msg);
      setPhotoPreviewUrl('');
      setPhotoMetadata(null);
    } finally {
      setIsProcessingPhoto(false);
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 장소 선택
  const handleSelectPlace = async (prediction: PlacePrediction) => {
    setSearchingPlaces(true);
    try {
      const response = await fetch(`/api/places/details?place_id=${prediction.place_id}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSelectedLocation({ latitude: data.place.latitude, longitude: data.place.longitude });
      setPlace(prediction.structured_formatting.main_text);
      setPlaceId(prediction.place_id);
      setError(null);
      setActivePanel('main');
      setSearchQuery('');
      setPredictions([]);
    } catch {
      setError('장소 정보를 가져오는데 실패했습니다.');
    } finally {
      setSearchingPlaces(false);
    }
  };

  // 제출
  const handleSubmit = async () => {
    if (!selectedLocation) {
      setError('위치를 선택해주세요.');
      return;
    }
    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const url = isEditMode ? `/api/checkins/${editingCheckin!.id}` : '/api/checkins';
      const method = isEditMode ? 'PATCH' : 'POST';
      const body: Record<string, unknown> = {
        title: title.trim(),
        place: place.trim() || undefined,
        place_id: placeId || undefined,
        message: message.trim() || undefined,
        category: category || undefined,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        photo_url: photoUrl || undefined,
        photo_metadata: photoMetadata || undefined,
      };
      if (!isEditMode) body.trip_id = tripId;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || (isEditMode ? 'Failed to update checkin' : 'Failed to create checkin')
        );

      onSuccess?.(data.checkin);
    } catch (err) {
      setError(err instanceof Error ? err.message : '체크인 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 16px',
          borderBottom: '1px solid #e5e7eb',
          gap: 12,
          flexShrink: 0,
        }}
      >
        {userAvatarUrl ? (
          <img
            src={userAvatarUrl}
            alt=""
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              objectFit: 'cover',
              flexShrink: 0,
            }}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: '#e5e7eb',
              flexShrink: 0,
            }}
          />
        )}

        <span
          style={{
            flex: 1,
            fontSize: 14,
            color: '#6b7280',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {tripName || '여행'}
        </span>

        <button
          onClick={onCancel}
          style={{
            padding: '8px 20px',
            borderRadius: 20,
            border: 'none',
            backgroundColor: '#e5e7eb',
            color: '#374151',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          취소
        </button>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            padding: '8px 20px',
            borderRadius: 20,
            border: 'none',
            backgroundColor: canSubmit ? '#16a34a' : '#d1d5db',
            color: canSubmit ? 'white' : '#9ca3af',
            fontWeight: 700,
            fontSize: 14,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            whiteSpace: 'nowrap',
            transition: 'background-color 0.15s',
          }}
        >
          {isSubmitting ? '저장 중...' : isEditMode ? '수정 완료' : '체크인'}
        </button>
      </div>

      {/* 메인 패널 */}
      {activePanel === 'main' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', paddingBottom: TOOLBAR_HEIGHT + 16 }}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요..."
            style={{
              width: '100%',
              fontSize: 22,
              fontWeight: 500,
              border: 'none',
              outline: 'none',
              color: '#111827',
              marginBottom: 12,
              background: 'transparent',
            }}
          />

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="메모를 남겨보세요..."
            rows={4}
            style={{
              width: '100%',
              fontSize: 16,
              border: 'none',
              outline: 'none',
              resize: 'none',
              color: '#374151',
              background: 'transparent',
              lineHeight: 1.6,
            }}
          />

          {/* 사진 처리 중 */}
          {(isProcessingPhoto || isUploadingPhoto) && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                backgroundColor: '#f3f4f6',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full" />
              <span style={{ fontSize: 14, color: '#6b7280' }}>
                {isProcessingPhoto ? '사진 처리 중...' : '업로드 중...'}
              </span>
            </div>
          )}

          {/* 사진 미리보기 */}
          {photoPreviewUrl && !isProcessingPhoto && !isUploadingPhoto && (
            <div style={{ marginTop: 12, position: 'relative' }}>
              <img
                src={photoPreviewUrl}
                alt="사진"
                style={{
                  width: '100%',
                  maxHeight: 240,
                  objectFit: 'cover',
                  borderRadius: 12,
                }}
              />
              <button
                onClick={() => {
                  setPhotoUrl('');
                  setPhotoPreviewUrl('');
                  setPhotoMetadata(null);
                }}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: 'rgba(0,0,0,0.55)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
              {photoMetadata?.gps && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 8,
                    left: 8,
                    backgroundColor: 'rgba(0,0,0,0.55)',
                    color: 'white',
                    fontSize: 12,
                    padding: '3px 8px',
                    borderRadius: 10,
                  }}
                >
                  📍 GPS 추출됨
                </div>
              )}
            </div>
          )}

          {/* 선택된 정보 chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
            {selectedLocation && (
              <button
                onClick={() => {
                  setSelectedLocation(null);
                  setPlace('');
                  setPlaceId('');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 12px',
                  borderRadius: 20,
                  border: '1px solid #bbf7d0',
                  backgroundColor: '#f0fdf4',
                  color: '#15803d',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                📍{' '}
                {place ||
                  `${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`}
                <span style={{ color: '#86efac', marginLeft: 2, fontSize: 11 }}>✕</span>
              </button>
            )}
            {category && (
              <button
                onClick={() => setCategory('')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 12px',
                  borderRadius: 20,
                  border: '1px solid #bfdbfe',
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {CATEGORY_EMOJI[category] || '🏷️'}{' '}
                {CHECKIN_CATEGORY_LABELS[category as CheckinCategory] || category}
                <span style={{ color: '#93c5fd', marginLeft: 2, fontSize: 11 }}>✕</span>
              </button>
            )}
          </div>

          {/* 에러 */}
          {error && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 8,
              }}
            >
              <p style={{ fontSize: 14, color: '#dc2626' }}>{error}</p>
            </div>
          )}
        </div>
      )}

      {/* 장소 검색 패널 */}
      {activePanel === 'place-search' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 16px',
              borderBottom: '1px solid #e5e7eb',
              gap: 10,
            }}
          >
            <button
              onClick={() => {
                setActivePanel('main');
                setSearchQuery('');
                setPredictions([]);
              }}
              style={{
                color: '#6b7280',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                whiteSpace: 'nowrap',
              }}
            >
              ← 뒤로
            </button>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="장소 이름을 입력하세요"
                autoFocus
                style={{
                  width: '100%',
                  padding: '8px 36px 8px 14px',
                  border: '1px solid #d1d5db',
                  borderRadius: 20,
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    fontSize: 16,
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
            {searchingPlaces && (
              <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full flex-shrink-0" />
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {predictions.map((p) => (
              <button
                key={p.place_id}
                onClick={() => handleSelectPlace(p)}
                className="hover:bg-gray-50"
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '14px 16px',
                  border: 'none',
                  borderBottom: '1px solid #f3f4f6',
                  background: 'white',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 500, fontSize: 15, color: '#111827' }}>
                  {p.structured_formatting.main_text}
                </div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                  {p.structured_formatting.secondary_text}
                </div>
              </button>
            ))}
            {searchQuery.trim().length >= 2 && predictions.length === 0 && !searchingPlaces && (
              <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
                검색 결과가 없습니다
              </div>
            )}
            {searchQuery.trim().length < 2 && (
              <div style={{ padding: 32, textAlign: 'center', color: '#d1d5db', fontSize: 14 }}>
                장소 이름을 2자 이상 입력하세요
              </div>
            )}
          </div>
        </div>
      )}

      {/* 카테고리 패널 */}
      {activePanel === 'category' && (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 16, color: '#111827' }}>카테고리 선택</span>
            <button
              onClick={() => setActivePanel('main')}
              style={{
                color: '#6b7280',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              닫기
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
              }}
            >
              {Object.entries(CHECKIN_CATEGORY_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => {
                    setCategory(value);
                    setActivePanel('main');
                  }}
                  style={{
                    padding: '14px 8px',
                    borderRadius: 12,
                    border: `2px solid ${category === value ? '#16a34a' : '#e5e7eb'}`,
                    backgroundColor: category === value ? '#f0fdf4' : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'border-color 0.15s',
                  }}
                >
                  <span style={{ fontSize: 26 }}>{CATEGORY_EMOJI[value] || '📌'}</span>
                  <span
                    style={{
                      fontSize: 12,
                      color: '#374151',
                      fontWeight: category === value ? 600 : 400,
                    }}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 하단 툴바 - 키보드 위로 올라오도록 fixed */}
      {activePanel === 'main' && (
        <div
          style={{
            position: 'fixed',
            bottom: toolbarBottom,
            left: 0,
            right: 0,
            zIndex: 10000,
            borderTop: '1px solid #e5e7eb',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            backgroundColor: 'white',
          }}
        >
          {/* 사진 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="checkin-photo-input"
          />
          <label
            htmlFor="checkin-photo-input"
            className="flex items-center justify-center w-14 h-14 rounded-full hover:bg-gray-100 cursor-pointer text-3xl"
            style={{ color: photoPreviewUrl ? '#16a34a' : '#6b7280' }}
            title="사진 추가"
          >
            📷
          </label>

          {/* 장소 검색 */}
          <button
            onClick={() => {
              setActivePanel('place-search');
              setSearchQuery('');
              setPredictions([]);
            }}
            className="flex items-center justify-center w-14 h-14 rounded-full hover:bg-gray-100 text-3xl"
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: selectedLocation && place ? '#16a34a' : '#6b7280',
            }}
            title="장소 검색"
          >
            📍
          </button>

          {/* 지도에서 선택 */}
          <button
            onClick={() =>
              onOpenLocationPicker?.(selectedLocation, (lat, lng) => {
                setSelectedLocation({ latitude: lat, longitude: lng });
                setPlace('');
                setPlaceId('');
                setError(null);
              })
            }
            disabled={!onOpenLocationPicker}
            className="flex items-center justify-center w-14 h-14 rounded-full hover:bg-gray-100 text-3xl"
            style={{
              border: 'none',
              background: 'none',
              cursor: onOpenLocationPicker ? 'pointer' : 'not-allowed',
              color: selectedLocation && !place ? '#16a34a' : '#6b7280',
              opacity: onOpenLocationPicker ? 1 : 0.4,
            }}
            title="지도에서 위치 선택"
          >
            🗺️
          </button>

          {/* 카테고리 */}
          <button
            onClick={() => setActivePanel('category')}
            className="flex items-center justify-center w-14 h-14 rounded-full hover:bg-gray-100 text-3xl"
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: category ? '#1d4ed8' : '#6b7280',
            }}
            title="카테고리 선택"
          >
            🏷️
          </button>
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
}
