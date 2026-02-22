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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-10 rounded-2xl shadow-sm text-center max-w-sm w-full">
        <div className="mb-6">
          <img src="/icon.png" alt="Travel Companion" className="w-16 h-16 mx-auto rounded-xl" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Travel Companion</h1>
        <p className="text-gray-500 text-sm mb-8">여행의 순간을 기록하세요</p>
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700 shadow-sm"
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.8 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.9 6.1C12.4 13.4 17.8 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z"/>
            <path fill="#FBBC05" d="M10.5 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.7-4.6L2.3 13.3A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.9-6.1z"/>
            <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.2 0-11.5-4-13.5-9.3l-7.9 6.1C6.5 42.5 14.6 48 24 48z"/>
          </svg>
          Google로 로그인
        </button>
      </div>
    </div>
  );
}
