'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Trip } from '@/types/database';
import type { TripFormData } from '../hooks/useTrips';

interface TripFormModalProps {
  mode: 'create' | 'edit';
  initialTrip?: Trip;
  onSuccess: (trip: Trip) => void;
  onCancel: () => void;
  onCreate: (data: TripFormData) => Promise<Trip>;
  onUpdate: (id: string, data: Partial<TripFormData>) => Promise<Trip>;
}

export default function TripFormModal({
  mode,
  initialTrip,
  onSuccess,
  onCancel,
  onCreate,
  onUpdate,
}: TripFormModalProps) {
  const [title, setTitle] = useState(initialTrip?.title ?? '');
  const [description, setDescription] = useState(initialTrip?.description ?? '');
  const [startDate, setStartDate] = useState(initialTrip?.start_date ?? '');
  const [endDate, setEndDate] = useState(initialTrip?.end_date ?? '');
  const [isPublic, setIsPublic] = useState(initialTrip?.is_public ?? false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !!title.trim() && !submitting;

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const data: TripFormData = {
        title: title.trim(),
        description: description.trim() || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        is_public: isPublic,
      };
      const trip =
        mode === 'create'
          ? await onCreate(data)
          : await onUpdate(initialTrip!.id, data);
      onSuccess(trip);
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 10001, backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}
    >
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #e5e7eb', gap: 10, flexShrink: 0 }}>
        <span style={{ flex: 1, fontSize: 15, color: '#6b7280' }}>
          {mode === 'create' ? '새 여행' : '여행 수정'}
        </span>
        <button
          onClick={onCancel}
          style={{ padding: '7px 18px', borderRadius: 20, border: 'none', backgroundColor: '#e5e7eb', color: '#374151', fontWeight: 600, fontSize: 15, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            padding: '7px 18px',
            borderRadius: 20,
            border: 'none',
            backgroundColor: canSubmit ? '#16a34a' : '#d1d5db',
            color: canSubmit ? 'white' : '#9ca3af',
            fontWeight: 600,
            fontSize: 15,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            whiteSpace: 'nowrap',
          }}
        >
          {submitting ? '저장 중...' : mode === 'create' ? '만들기' : '저장'}
        </button>
      </div>

      {/* 본문 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="여행 이름을 입력하세요..."
          autoFocus
          style={{ width: '100%', fontSize: 26, fontWeight: 600, border: 'none', outline: 'none', color: '#111827', marginBottom: 12, background: 'transparent' }}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="여행 설명을 남겨보세요..."
          rows={3}
          style={{ width: '100%', fontSize: 14, border: 'none', outline: 'none', resize: 'none', color: '#6b7280', background: 'transparent', lineHeight: 1.6 }}
        />

        {/* 날짜 */}
        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 16, marginTop: 8 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>시작일</div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ fontSize: 16, border: 'none', outline: 'none', color: startDate ? '#111827' : '#9ca3af', background: 'transparent', width: '100%' }}
            />
          </div>
          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>종료일</div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ fontSize: 16, border: 'none', outline: 'none', color: endDate ? '#111827' : '#9ca3af', background: 'transparent', width: '100%' }}
            />
          </div>
        </div>

        {/* 공개 토글 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
          <span style={{ fontSize: 15, color: '#374151' }}>공개 여행</span>
          <label style={{ position: 'relative', display: 'inline-block', width: 51, height: 31, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 15.5,
              backgroundColor: isPublic ? '#16a34a' : '#d1d5db',
              transition: 'background-color 0.2s',
            }} />
            <span style={{
              position: 'absolute',
              width: 27,
              height: 27,
              borderRadius: '50%',
              backgroundColor: 'white',
              top: 2,
              left: isPublic ? 22 : 2,
              transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
            }} />
          </label>
        </div>

        {error && (
          <div style={{ marginTop: 16, padding: 12, backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8 }}>
            <p style={{ fontSize: 14, color: '#dc2626' }}>{error}</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
