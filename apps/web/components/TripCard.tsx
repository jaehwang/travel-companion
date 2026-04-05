'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Map, Star } from 'lucide-react';
import { DropdownMenu } from '@/components/DropdownMenu';
import TripFormModal from '@/components/TripFormModal';
import TripDeleteDialog from '@/components/TripDeleteDialog';
import type { Trip, TripFormData } from '@travel-companion/shared';

interface TripCardProps {
  trip: Trip;
  accent: string;
  style?: React.CSSProperties;
}

const formatTripDate = (dateStr?: string | null) => {
  if (!dateStr) return null;
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  const date = isDateOnly
    ? (() => { const [y, m, d] = dateStr.split('-').map(Number); return new Date(y, m - 1, d); })()
    : new Date(dateStr);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(date);
};

export default function TripCard({ trip, accent, style }: TripCardProps) {
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(trip.is_public);
  const [toggling, setToggling] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentTrip, setCurrentTrip] = useState(trip);

  const handleTogglePublic = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      const res = await fetch(`/api/trips/${trip.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: !isPublic }),
      });
      if (res.ok) {
        setIsPublic(!isPublic);
      }
    } catch {
      // 실패 시 무시
    } finally {
      setToggling(false);
    }
  };

  const handleCopyStoryLink = async () => {
    const url = `${window.location.origin}/story/${trip.id}`;
    let copied = false;

    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        copied = true;
      } catch {
        // 폴백으로 진행
      }
    }

    if (!copied) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        copied = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch {
        // ignore
      }
    }

    if (copied) {
      alert('스토리 링크가 복사되었습니다.');
    } else {
      prompt('아래 링크를 복사하세요:', url);
    }
  };

  const handleEdit = () => setShowEditModal(true);

  const handleDelete = () => setShowDeleteDialog(true);

  const executeDelete = async (moveCheckins: boolean) => {
    setShowDeleteDialog(false);
    try {
      const url = moveCheckins
        ? `/api/trips/${currentTrip.id}?moveCheckins=true`
        : `/api/trips/${currentTrip.id}`;
      const res = await fetch(url, { method: 'DELETE' });
      if (res.ok) router.refresh();
    } catch {
      // ignore
    }
  };

  const handleUpdate = async (id: string, data: Partial<TripFormData>): Promise<Trip> => {
    const res = await fetch(`/api/trips/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('수정에 실패했습니다.');
    const { trip: updated } = await res.json();
    return updated;
  };

  const dropdownItems = [
    {
      label: isPublic ? '비공개로 전환' : '공개로 전환',
      onClick: handleTogglePublic,
    },
    ...(isPublic ? [{
      label: '스토리 링크 복사',
      onClick: handleCopyStoryLink,
    }] : []),
    { label: '수정', onClick: handleEdit },
    { label: '삭제', onClick: handleDelete, variant: 'danger' as const },
  ];

  return (
    <div style={style}>
      {showDeleteDialog && (
        <TripDeleteDialog
          tripTitle={currentTrip.title}
          onDeleteCheckins={() => executeDelete(false)}
          onKeepCheckins={() => executeDelete(true)}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}
      {showEditModal && (
        <TripFormModal
          mode="edit"
          initialTrip={currentTrip}
          onSuccess={(updated) => { setCurrentTrip(updated); setIsPublic(updated.is_public); setShowEditModal(false); router.refresh(); }}
          onCancel={() => setShowEditModal(false)}
          onCreate={async () => { throw new Error('not used'); }}
          onUpdate={handleUpdate}
        />
      )}
      {/* tc-trip-card CSS에 position:relative 있음 → 버튼 containing block으로 동작 */}
      <div className="tc-trip-card rounded-[20px] overflow-hidden flex flex-col">
        {/* 드롭다운: portal 방식이라 overflow-hidden에 클리핑 안 됨 */}
        <div style={{
          position: 'absolute', top: 8, right: 8, zIndex: 10,
          background: 'rgba(0,0,0,0.35)', borderRadius: '50%',
          backdropFilter: 'blur(4px)',
        }}>
          <DropdownMenu items={dropdownItems} align="right" buttonStyle={{ color: 'white' }} />
        </div>

        <Link
          href={`/checkin?trip_id=${trip.id}`}
          className="no-underline flex flex-col flex-1"
        >
          {/* 액센트 상단 스트립 */}
          <div className="h-[5px] shrink-0" style={{ background: accent }} />

          {/* 커버 사진: padding-top 비율 방식으로 높이 명시 (Safari aspect-ratio 버그 우회) */}
          <div className="tc-card-photo-empty shrink-0" style={{ position: 'relative', paddingTop: '75%' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
              {trip.cover_photo_url ? (
                <img
                  src={trip.cover_photo_url}
                  alt={trip.title}
                  className="w-full h-full object-cover block"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Map size={48} color="#C4A882" />
                </div>
              )}
            </div>

            {/* 자주 가는 곳 뱃지 */}
            {currentTrip.is_frequent && (
              <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  padding: '2px 7px', borderRadius: 9999,
                  fontSize: 10, fontWeight: 700,
                  background: 'rgba(245, 158, 11, 0.92)', color: 'white',
                }}>
                  <Star size={10} color="#FFF" fill="#FFF" /> 자주 가는 곳
                </span>
              </div>
            )}

            {/* 공개/비공개 뱃지 */}
            <div style={{ position: 'absolute', bottom: 8, left: 8, zIndex: 10 }}>
              {isPublic ? (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '2px 8px', borderRadius: 9999,
                  fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', width: 'max-content',
                  background: 'rgba(16, 185, 129, 0.9)', color: 'white',
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  공개
                </span>
              ) : (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '2px 8px', borderRadius: 9999,
                  fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', width: 'max-content',
                  background: 'rgba(55, 65, 81, 0.92)', color: 'white',
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  비공개
                </span>
              )}
            </div>
          </div>

        {/* 텍스트 영역 */}
        <div className="px-3 py-2.5 pb-3 flex-1 flex flex-col">
          <p
            className="text-[10px] font-bold tracking-[0.06em] uppercase mb-1"
            style={{ color: accent }}
          >
            {formatTripDate(trip.start_date ?? trip.first_checkin_date) ?? '날짜 미정'}
          </p>

          <h3 className={`text-sm md:text-[15px] font-black text-tc-warm-dark overflow-hidden text-ellipsis whitespace-nowrap tracking-[-0.01em] ${trip.description ? 'mb-1' : ''}`}>
            {trip.title}
          </h3>

          {trip.description && (
            <p className="text-[11px] md:text-xs text-tc-warm-mid leading-[1.45] line-clamp-2 overflow-hidden flex-1">
              {trip.description}
            </p>
          )}
        </div>
        </Link>
      </div>
    </div>
  );
}
