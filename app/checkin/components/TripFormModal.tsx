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
      <div className="flex items-center px-4 py-2.5 border-b border-gray-200 gap-3 shrink-0">
        <span className="flex-1 text-sm text-gray-500">
          {mode === 'create' ? '새 여행' : '여행 수정'}
        </span>
        <button
          onClick={onCancel}
          className="px-5 py-2 rounded-full bg-gray-200 text-gray-700 font-bold text-sm cursor-pointer border-0 whitespace-nowrap"
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`px-5 py-2 rounded-full border-0 font-bold text-sm whitespace-nowrap transition-colors duration-150 ${
            canSubmit ? 'bg-green-600 text-white cursor-pointer' : 'bg-gray-300 text-gray-400 cursor-not-allowed'
          }`}
        >
          {submitting ? '저장 중...' : mode === 'create' ? '만들기' : '저장'}
        </button>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto px-4 pt-5">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="여행 이름을 입력하세요..."
          autoFocus
          className="w-full text-[22px] font-medium border-0 outline-none text-gray-900 mb-3 bg-transparent"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="여행 설명을 남겨보세요..."
          rows={3}
          className="w-full text-base border-0 outline-none resize-none text-gray-700 bg-transparent leading-relaxed"
        />

        {/* 날짜 */}
        <div className="border-t border-gray-100 pt-4 mt-2">
          <div className="mb-4">
            <div className="text-xs text-gray-400 mb-1.5">시작일</div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`text-base border-0 outline-none bg-transparent w-full ${startDate ? 'text-gray-900' : 'text-gray-400'}`}
            />
          </div>
          <div className="border-t border-gray-100 pt-4 mb-4">
            <div className="text-xs text-gray-400 mb-1.5">종료일</div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`text-base border-0 outline-none bg-transparent w-full ${endDate ? 'text-gray-900' : 'text-gray-400'}`}
            />
          </div>
        </div>

        {/* 공개 토글 */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <span className="text-[15px] text-gray-700">공개 여행</span>
          <label className="relative inline-block w-11 h-[26px] cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="opacity-0 w-0 h-0 absolute"
            />
            <span
              className={`absolute inset-0 rounded-[13px] transition-colors duration-200 ${isPublic ? 'bg-green-600' : 'bg-gray-300'}`}
            >
              <span
                style={{ left: isPublic ? 21 : 3 }}
                className="absolute w-5 h-5 rounded-full bg-white top-[3px] transition-[left] duration-200 shadow-sm"
              />
            </span>
          </label>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
