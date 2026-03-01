'use client';

import type { PlacePrediction } from './hooks/usePlaceSearch';

interface CheckinFormPlacePanelProps {
  searchQuery: string;
  onSearchQueryChange: (v: string) => void;
  predictions: PlacePrediction[];
  searchingPlaces: boolean;
  onSelectPlace: (prediction: PlacePrediction) => void;
  onBack: () => void;
}

export default function CheckinFormPlacePanel({
  searchQuery,
  onSearchQueryChange,
  predictions,
  searchingPlaces,
  onSelectPlace,
  onBack,
}: CheckinFormPlacePanelProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center px-4 py-2.5 border-b border-gray-200 gap-2">
        <button
          onClick={onBack}
          className="text-gray-500 bg-transparent border-0 cursor-pointer text-sm whitespace-nowrap shrink-0"
        >
          ← 뒤로
        </button>
        <div className="flex-1 flex items-center gap-1 border border-gray-300 rounded-full py-2 pl-4 pr-2 mr-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="장소 이름을 입력하세요"
            autoFocus
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            className="flex-1 min-w-0 text-base outline-none bg-transparent border-0"
          />
          {searchingPlaces && (
            <div className="shrink-0 animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full" />
          )}
          {searchQuery && !searchingPlaces && (
            <button
              onClick={() => onSearchQueryChange('')}
              className="shrink-0 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center border-0 cursor-pointer text-gray-500 text-[11px] leading-none"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {predictions.map((p) => (
          <button
            key={p.place_id}
            onClick={() => onSelectPlace(p)}
            className="w-full text-left px-4 py-3.5 border-0 border-b border-gray-100 bg-white cursor-pointer hover:bg-gray-50"
          >
            <div className="font-medium text-[15px] text-gray-900">
              {p.structured_formatting.main_text}
            </div>
            <div className="text-[13px] text-gray-500 mt-0.5">
              {p.structured_formatting.secondary_text}
            </div>
          </button>
        ))}
        {searchQuery.trim().length >= 2 && predictions.length === 0 && !searchingPlaces && (
          <div className="p-8 text-center text-gray-400 text-sm">
            검색 결과가 없습니다
          </div>
        )}
        {searchQuery.trim().length < 2 && (
          <div className="p-8 text-center text-gray-300 text-sm">
            장소 이름을 2자 이상 입력하세요
          </div>
        )}
      </div>
    </div>
  );
}
