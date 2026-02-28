'use client';

import { CHECKIN_CATEGORY_LABELS } from '@/types/database';

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

interface CheckinFormCategoryPanelProps {
  category: string;
  onSelectCategory: (category: string) => void;
  onClose: () => void;
}

export default function CheckinFormCategoryPanel({
  category,
  onSelectCategory,
  onClose,
}: CheckinFormCategoryPanelProps) {
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-200">
        <span className="font-semibold text-base text-gray-900">카테고리 선택</span>
        <button
          onClick={onClose}
          className="text-gray-500 bg-transparent border-0 cursor-pointer text-sm"
        >
          닫기
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-3 gap-2.5">
          {Object.entries(CHECKIN_CATEGORY_LABELS).map(([value, label]) => (
            <button
              key={value}
              onClick={() => {
                onSelectCategory(value);
                onClose();
              }}
              className={`py-3.5 px-2 rounded-xl border-2 cursor-pointer flex flex-col items-center gap-1.5 transition-colors duration-150 ${
                category === value
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <span className="text-[26px]">{CATEGORY_EMOJI[value] || '📌'}</span>
              <span
                className={`text-xs text-gray-700 ${category === value ? 'font-semibold' : 'font-normal'}`}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
