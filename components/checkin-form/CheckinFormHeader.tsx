'use client';

interface CheckinFormHeaderProps {
  userAvatarUrl?: string;
  tripName?: string;
  isEditMode: boolean;
  isSubmitting: boolean;
  canSubmit: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

export default function CheckinFormHeader({
  userAvatarUrl,
  tripName,
  isEditMode,
  isSubmitting,
  canSubmit,
  onCancel,
  onSubmit,
}: CheckinFormHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--color-border)', gap: 12, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flex: 1, minWidth: 0 }}>
        {userAvatarUrl ? (
          <img
            src={userAvatarUrl}
            alt=""
            style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'var(--color-border)', flexShrink: 0 }} />
        )}

        <span className="text-[16px] text-gray-600 truncate font-medium">
          {tripName || '여행'}
        </span>
      </div>

      <button
        onClick={onCancel}
        className="px-5 py-3 rounded-full bg-gray-200 text-gray-700 font-bold text-[15px] cursor-pointer border-0 whitespace-nowrap"
      >
        취소
      </button>

      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className={`px-5 py-3 rounded-full border-0 font-bold text-[15px] whitespace-nowrap transition-colors duration-150 ${
          canSubmit ? 'bg-green-600 text-white cursor-pointer' : 'bg-gray-300 text-gray-400 cursor-not-allowed'
        }`}
      >
        {isSubmitting ? '저장 중...' : isEditMode ? '수정 완료' : '체크인'}
      </button>
    </div>
  );
}
