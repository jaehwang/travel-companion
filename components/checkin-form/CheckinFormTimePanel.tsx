'use client';

interface CheckinFormTimePanelProps {
  checkedInAt: string;
  onCheckedInAtChange: (v: string) => void;
  onClose: () => void;
}

export default function CheckinFormTimePanel({
  checkedInAt,
  onCheckedInAtChange,
  onClose,
}: CheckinFormTimePanelProps) {
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-200">
        <span className="font-semibold text-base text-gray-900">시각 지정</span>
        <button
          onClick={onClose}
          className="text-gray-500 bg-transparent border-0 cursor-pointer text-sm"
        >
          닫기
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <input
          type="datetime-local"
          value={checkedInAt}
          onChange={(e) => onCheckedInAtChange(e.target.value)}
          autoFocus
          style={{ fontSize: 18, padding: '12px 16px', borderRadius: 12, border: '1.5px solid #d1d5db', width: '100%', maxWidth: 340, color: '#111827', background: 'white' }}
        />
        {checkedInAt && (
          <button
            onClick={() => { onCheckedInAtChange(''); onClose(); }}
            className="text-sm text-gray-400 bg-transparent border-0 cursor-pointer"
          >
            시각 지정 삭제
          </button>
        )}
      </div>
    </div>
  );
}
