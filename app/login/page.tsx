'use client';

import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  };

  return (
    <main className="tc-page-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>

        {/* 로고 SVG */}
        <div style={{ marginBottom: 28 }}>
          <svg viewBox="0 0 100 100" style={{ width: 96, height: 96, margin: '0 auto', display: 'block' }} xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" rx="22" fill="#FF6B47"/>
            <path d="M20 40 L50 40 L78 65" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="20" cy="40" r="10" fill="white"/>
            <circle cx="20" cy="40" r="5" fill="#FF6B47"/>
            <circle cx="50" cy="40" r="8" fill="white" opacity="0.85"/>
            <circle cx="50" cy="40" r="4" fill="#FF6B47"/>
            <path d="M78 80 C71 72, 65 65, 65 57 A13 13 0 0 1 91 57 C91 65, 85 72, 78 80 Z" fill="white"/>
            <circle cx="78" cy="56" r="5.5" fill="#FF6B47"/>
          </svg>
        </div>

        {/* 타이틀 */}
        <h1 className="tc-brand tc-hero" style={{ fontSize: 'clamp(2.2rem, 10vw, 3rem)', lineHeight: 1.1, marginBottom: 12 }}>
          Travel<br />Companion
        </h1>

        {/* 서브타이틀 */}
        <p className="tc-hero-sub" style={{ fontSize: 15, color: 'var(--tc-warm-mid)', marginBottom: 40 }}>
          여행의 순간을 기록하고 공유하세요
        </p>

        {/* 기능 소개 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 40 }}>
          {[
            { icon: '📸', text: '사진에서 GPS 위치 자동 추출' },
            { icon: '🗺️', text: '지도로 여행 경로 시각화' },
            { icon: '📖', text: '나만의 여행 일기 기록' },
          ].map(({ icon, text }) => (
            <div key={text} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px',
              background: 'var(--tc-card-bg)',
              borderRadius: 14,
              boxShadow: '0 2px 8px rgba(45,36,22,0.06)',
              textAlign: 'left',
            }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--tc-warm-dark)' }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Google 로그인 버튼 */}
        <button
          onClick={handleGoogleLogin}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            padding: '16px 24px',
            background: 'var(--tc-card-bg)',
            border: '1.5px solid var(--tc-dot)',
            borderRadius: 9999,
            fontSize: 15, fontWeight: 700,
            color: 'var(--tc-warm-dark)',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(45,36,22,0.1)',
            transition: 'box-shadow 0.2s ease, transform 0.15s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(45,36,22,0.16)';
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(45,36,22,0.1)';
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.8 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.9 6.1C12.4 13.4 17.8 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z"/>
            <path fill="#FBBC05" d="M10.5 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.7-4.6L2.3 13.3A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.9-6.1z"/>
            <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.2 0-11.5-4-13.5-9.3l-7.9 6.1C6.5 42.5 14.6 48 24 48z"/>
          </svg>
          Google로 로그인
        </button>

      </div>
    </main>
  );
}
