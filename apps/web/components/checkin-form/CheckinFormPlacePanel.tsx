'use client';

import { Search, MapPin, X } from 'lucide-react';
import type { PlacePrediction } from '@travel-companion/shared';

// 이 패널은 체크인의 `place` 필드(공식 장소명)를 채우기 위한 검색 화면이다.
// `place`와 `title`(체크인 제목)의 차이:
//   - title: 사용자가 직접 자유롭게 입력하는 체크인 제목 (예: "점심 먹은 곳")
//   - place: 이 패널의 자동완성을 통해 선택한 경우에만 저장되는 Google Places 공식 장소명.
//            장소 검색을 건너뛰면 null로 저장된다.
// place를 선택하면 위도/경도도 함께 자동 반영된다(usePlaceSearch → onPlaceSelected 콜백).

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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--tc-bg)' }}>
      {/* 검색 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '10px 16px',
        borderBottom: '1.5px solid var(--tc-dot)',
        gap: 10,
      }}>
        <button
          onClick={onBack}
          style={{
            fontSize: 13, fontWeight: 700,
            color: '#FF6B47',
            background: 'none', border: 'none', cursor: 'pointer',
            whiteSpace: 'nowrap', flexShrink: 0,
            padding: '4px 0',
          }}
        >
          ← 뒤로
        </button>

        {/* 검색 인풋
            자동완성은 usePlaceSearch 훅이 담당한다.
            입력값이 2자 미만이면 API 호출을 하지 않고(불필요한 요청 방지),
            2자 이상이 되면 300ms 디바운스 후 Google Places Autocomplete API를 호출한다. */}
        <div style={{
          flex: 1,
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--tc-card-bg)',
          border: '1.5px solid var(--tc-dot)',
          borderRadius: 9999,
          padding: '8px 14px',
        }}>
          <Search size={16} color="#9CA3AF" style={{ flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="장소 이름을 입력하세요"
            autoFocus
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            style={{
              flex: 1, minWidth: 0,
              fontSize: 15,
              outline: 'none', border: 'none',
              background: 'transparent',
              color: 'var(--tc-warm-dark)',
            }}
          />
          {searchingPlaces && (
            <div style={{
              width: 16, height: 16, flexShrink: 0,
              border: '2px solid #FF6B47',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
          )}
          {searchQuery && !searchingPlaces && (
            <button
              onClick={() => onSearchQueryChange('')}
              style={{
                width: 20, height: 20, flexShrink: 0,
                borderRadius: '50%',
                background: 'var(--tc-card-empty)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', cursor: 'pointer',
                color: 'var(--tc-warm-mid)',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 검색 결과
          항목 선택 시 onSelectPlace → usePlaceSearch.handleSelectPlace 로 전달되어
          Places Details API로 정확한 위도/경도를 조회한 뒤 위치까지 함께 업데이트한다. */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {predictions.map((p) => (
          <button
            key={p.place_id}
            onClick={() => onSelectPlace(p)}
            style={{
              width: '100%', textAlign: 'left',
              padding: '14px 20px',
              background: 'none', border: 'none',
              borderBottom: '1px solid var(--tc-dot)',
              cursor: 'pointer',
              display: 'block',
            }}
          >
            {/* structured_formatting: Google Places API가 장소명(main_text)과
                주소/지역(secondary_text)을 분리해서 내려주는 구조체 */}
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tc-warm-dark)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} color="#9CA3AF" style={{ flexShrink: 0 }} />
              {p.structured_formatting.main_text}
            </div>
            <div style={{ fontSize: 12, color: 'var(--tc-warm-mid)' }}>
              {p.structured_formatting.secondary_text}
            </div>
          </button>
        ))}

        {searchQuery.trim().length >= 2 && predictions.length === 0 && !searchingPlaces && (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <Search size={36} color="#C4B49A" />
            </div>
            <p style={{ fontSize: 14, color: 'var(--tc-warm-faint)' }}>검색 결과가 없습니다</p>
          </div>
        )}
        {searchQuery.trim().length < 2 && (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <MapPin size={36} color="#C4B49A" />
            </div>
            <p style={{ fontSize: 14, color: 'var(--tc-warm-faint)' }}>장소 이름을 2자 이상 입력하세요</p>
          </div>
        )}
      </div>
    </div>
  );
}
