'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * iOS PWA에서 백그라운드 복귀 시 Supabase 세션 갱신.
 * iOS PWA는 백그라운드에서 JS 타이머가 중단되어 access token 자동 갱신이 안 됨.
 * visibilitychange 이벤트로 포그라운드 복귀 시 강제 갱신만 수행.
 * 인증 여부 판단 및 /login 리다이렉트는 미들웨어 책임.
 */
export default function SessionRefresher() {
  useEffect(() => {
    const supabase = createClient();

    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;
      await supabase.auth.refreshSession();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return null;
}
