interface TaglineBannerProps {
  tagline: string | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export default function TaglineBanner({ tagline, loading, error, onRefresh }: TaglineBannerProps) {
  return (
    <div style={{
      marginBottom: 16,
      padding: '12px 16px',
      background: 'var(--tc-card-bg)',
      borderRadius: 14,
      boxShadow: '0 2px 8px rgba(45,36,22,0.06)',
      borderLeft: '4px solid rgba(255,107,71,0.45)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0,
            fontSize: 14,
            lineHeight: 1.6,
            fontWeight: 500,
            fontStyle: 'italic',
            color: 'var(--tc-warm-dark)',
          }}>
            {!loading && (tagline || error) && <span style={{ marginRight: 4, fontStyle: 'normal' }}>✨</span>}
            {loading ? '두근, 두근...' : (tagline || error)}
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          title="문구 다시 만들기"
          style={{
            width: 28,
            height: 28,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--tc-warm-mid)',
            background: 'var(--tc-card-empty)',
            border: '1px solid var(--tc-dot)',
            borderRadius: 8,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.4 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          {loading ? (
            <div style={{
              width: 12,
              height: 12,
              border: '2px solid var(--tc-warm-mid)',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6" />
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M3 22v-6h6" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
