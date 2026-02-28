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
    <div className="flex items-center px-4 py-2.5 border-b border-gray-200 gap-3 shrink-0">
      {userAvatarUrl ? (
        <img
          src={userAvatarUrl}
          alt=""
          style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: '#e5e7eb', flexShrink: 0 }} />
      )}

      <span className="flex-1 text-sm text-gray-500 truncate">
        {tripName || '여행'}
      </span>

      <button
        onClick={onCancel}
        className="px-5 py-2 rounded-full bg-gray-200 text-gray-700 font-bold text-sm cursor-pointer border-0 whitespace-nowrap"
      >
        취소
      </button>

      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className={`px-5 py-2 rounded-full border-0 font-bold text-sm whitespace-nowrap transition-colors duration-150 ${
          canSubmit ? 'bg-green-600 text-white cursor-pointer' : 'bg-gray-300 text-gray-400 cursor-not-allowed'
        }`}
      >
        {isSubmitting ? '저장 중...' : isEditMode ? '수정 완료' : '체크인'}
      </button>
    </div>
  );
}
