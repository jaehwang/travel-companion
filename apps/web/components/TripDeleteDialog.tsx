'use client';

import { createPortal } from 'react-dom';

interface TripDeleteDialogProps {
  tripTitle: string;
  onDeleteCheckins: () => void;
  onKeepCheckins: () => void;
  onCancel: () => void;
}

export default function TripDeleteDialog({
  tripTitle,
  onDeleteCheckins,
  onKeepCheckins,
  onCancel,
}: TripDeleteDialogProps) {
  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}
      onClick={onCancel}
    >
      <div
        style={{ background: 'white', borderRadius: 16, padding: '24px 20px', width: '100%', maxWidth: 360 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#111827' }}>
          &quot;{tripTitle}&quot; 삭제
        </h3>
        <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 20, lineHeight: 1.5 }}>
          체크인도 함께 삭제할까요?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={onDeleteCheckins}
            style={{
              padding: '11px 16px', borderRadius: 10, border: '1.5px solid #EF4444',
              background: '#EF4444', color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}
          >
            예, 체크인도 삭제
          </button>
          <button
            onClick={onKeepCheckins}
            style={{
              padding: '11px 16px', borderRadius: 10, border: '1.5px solid #6366F1',
              background: 'white', color: '#6366F1', fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}
          >
            아니오, 미할당으로 보관
          </button>
          <button
            onClick={onCancel}
            style={{
              padding: '11px 16px', borderRadius: 10, border: '1.5px solid #E5E7EB',
              background: 'white', color: '#6B7280', fontWeight: 500, fontSize: 14, cursor: 'pointer',
            }}
          >
            취소
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
