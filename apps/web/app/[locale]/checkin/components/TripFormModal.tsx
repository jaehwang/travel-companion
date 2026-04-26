'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plane, Pencil, Calendar, Flag } from 'lucide-react';
import type { Trip } from '@travel-companion/shared';
import type { TripFormData } from '@travel-companion/shared';

interface TripFormModalProps {
  mode: 'create' | 'edit';
  initialTrip?: Trip;
  onSuccess: (trip: Trip) => void;
  onCancel: () => void;
  onCreate: (data: TripFormData) => Promise<Trip>;
  onUpdate: (id: string, data: Partial<TripFormData>) => Promise<Trip>;
}

function useTripFormCheckin(mode: string, initialTrip: Trip | undefined, onSuccess: (t: Trip) => void, onCreate: (d: TripFormData) => Promise<Trip>, onUpdate: (id: string, d: Partial<TripFormData>) => Promise<Trip>) {
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
    setSubmitting(true); setError(null);
    try {
      const data: TripFormData = { title: title.trim(), description: description.trim() || undefined, start_date: startDate || undefined, end_date: endDate || undefined, is_public: isPublic };
      const trip = mode === 'create' ? await onCreate(data) : await onUpdate(initialTrip!.id, data);
      onSuccess(trip);
    } catch (err) { setError(err instanceof Error ? err.message : '저장에 실패했습니다.'); }
    finally { setSubmitting(false); }
  };

  return { title, setTitle, description, setDescription, startDate, setStartDate, endDate, setEndDate, isPublic, setIsPublic, error, submitting, canSubmit, handleSubmit };
}

interface TripFormHeaderProps { mode: string; onCancel: () => void; onSubmit: () => void; submitting: boolean; canSubmit: boolean; }
function TripFormHeader({ mode, onCancel, onSubmit, submitting, canSubmit }: TripFormHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1.5px solid var(--tc-dot)', gap: 10, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,107,71,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {mode === 'create' ? <Plane size={15} color="#FF6B47" /> : <Pencil size={15} color="#FF6B47" />}
        </div>
        <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--tc-warm-dark)', letterSpacing: '-0.01em' }}>
          {mode === 'create' ? '새 여행 만들기' : '여행 수정'}
        </span>
      </div>
      <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: 9999, background: 'var(--tc-card-empty)', color: 'var(--tc-warm-mid)', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>취소</button>
      <button onClick={onSubmit} disabled={!canSubmit} style={{ padding: '8px 18px', borderRadius: 9999, background: canSubmit ? '#FF6B47' : 'var(--tc-card-empty)', color: canSubmit ? 'white' : 'var(--tc-warm-faint)', fontWeight: 700, fontSize: 14, border: 'none', cursor: canSubmit ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', flexShrink: 0, boxShadow: canSubmit ? '0 3px 10px rgba(255,107,71,0.4)' : 'none', transition: 'all 0.2s ease' }}>
        {submitting ? '저장 중...' : mode === 'create' ? '만들기' : '저장'}
      </button>
    </div>
  );
}

interface TripFormDateInputsProps { startDate: string; setStartDate: (v: string) => void; endDate: string; setEndDate: (v: string) => void; }
function TripFormDateInputs({ startDate, setStartDate, endDate, setEndDate }: TripFormDateInputsProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
      {([['#FF6B47', <Calendar key="c" size={11} />, '시작일', startDate, setStartDate], ['#F59E0B', <Flag key="f" size={11} />, '종료일', endDate, setEndDate]] as const).map(([color, icon, label, val, setter]) => (
        <div key={label as string} style={{ background: 'var(--tc-card-bg)', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 8px rgba(45,36,22,0.06)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: color as string, letterSpacing: '0.06em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>{icon}{label as string}</p>
          <input type="date" value={val as string} onChange={(e) => (setter as (v: string) => void)(e.target.value)} style={{ fontSize: 16, fontWeight: 600, border: 'none', outline: 'none', color: (val as string) ? 'var(--tc-warm-dark)' : 'var(--tc-warm-faint)', background: 'transparent', width: '100%' }} />
        </div>
      ))}
    </div>
  );
}

export default function TripFormModal({ mode, initialTrip, onSuccess, onCancel, onCreate, onUpdate }: TripFormModalProps) {
  const { title, setTitle, description, setDescription, startDate, setStartDate, endDate, setEndDate, isPublic, setIsPublic, error, submitting, canSubmit, handleSubmit } = useTripFormCheckin(mode, initialTrip, onSuccess, onCreate, onUpdate);

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10001,
      backgroundColor: 'var(--tc-bg)',
      display: 'flex', flexDirection: 'column',
    }}>
      <TripFormHeader mode={mode} onCancel={onCancel} onSubmit={handleSubmit} submitting={submitting} canSubmit={canSubmit} />

      {/* 본문 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>

        {/* 여행 이름 */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="여행 이름을 지어주세요"
          autoFocus
          style={{
            width: '100%',
            fontSize: 26, fontWeight: 800,
            border: 'none', outline: 'none',
            color: 'var(--tc-warm-dark)',
            background: 'transparent',
            marginBottom: 14,
            letterSpacing: '-0.02em', lineHeight: 1.3,
          }}
        />

        {/* 구분선 */}
        <div style={{ height: 1.5, background: 'var(--tc-dot)', marginBottom: 14 }} />

        {/* 여행 설명 */}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="어떤 여행인지 적어보세요..."
          rows={3}
          style={{
            width: '100%',
            fontSize: 17,
            border: 'none', outline: 'none', resize: 'none',
            color: 'var(--tc-warm-mid)',
            background: 'transparent',
            lineHeight: 1.7,
            marginBottom: 24,
          }}
        />

        {/* 날짜 섹션 */}
        <TripFormDateInputs startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} />

        {/* 공개 토글 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--tc-card-bg)',
          borderRadius: 14,
          padding: '14px 16px',
          boxShadow: '0 2px 8px rgba(45,36,22,0.06)',
          marginBottom: 20,
        }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--tc-warm-dark)', marginBottom: 2 }}>공개 여행</p>
            <p style={{ fontSize: 12, color: 'var(--tc-warm-faint)' }}>링크로 공유할 수 있어요</p>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: 51, height: 31, cursor: 'pointer', flexShrink: 0 }}>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: 'absolute', inset: 0,
              borderRadius: 15.5,
              backgroundColor: isPublic ? '#FF6B47' : 'var(--tc-dot)',
              transition: 'background-color 0.2s',
              boxShadow: isPublic ? '0 2px 8px rgba(255,107,71,0.4)' : 'none',
            }} />
            <span style={{
              position: 'absolute',
              width: 27, height: 27,
              borderRadius: '50%',
              backgroundColor: 'white',
              top: 2,
              left: isPublic ? 22 : 2,
              transition: 'left 0.2s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }} />
          </label>
        </div>

        {/* 에러 */}
        {error && (
          <div style={{
            padding: '10px 14px',
            background: '#FFF5F5',
            border: '1px solid #fca5a5',
            borderRadius: 12,
          }}>
            <p style={{ fontSize: 13, color: '#DC2626' }}>{error}</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
