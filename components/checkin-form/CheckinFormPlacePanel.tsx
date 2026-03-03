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

        {/* 검색 인풋 */}
        <div style={{
          flex: 1,
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--tc-card-bg)',
          border: '1.5px solid var(--tc-dot)',
          borderRadius: 9999,
          padding: '8px 14px',
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🔍</span>
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
                color: 'var(--tc-warm-mid)', fontSize: 11,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 검색 결과 */}
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
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tc-warm-dark)', marginBottom: 3 }}>
              📍 {p.structured_formatting.main_text}
            </div>
            <div style={{ fontSize: 12, color: 'var(--tc-warm-mid)' }}>
              {p.structured_formatting.secondary_text}
            </div>
          </button>
        ))}

        {searchQuery.trim().length >= 2 && predictions.length === 0 && !searchingPlaces && (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: 14, color: 'var(--tc-warm-faint)' }}>검색 결과가 없습니다</p>
          </div>
        )}
        {searchQuery.trim().length < 2 && (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📍</div>
            <p style={{ fontSize: 14, color: 'var(--tc-warm-faint)' }}>장소 이름을 2자 이상 입력하세요</p>
          </div>
        )}
      </div>
    </div>
  );
}
