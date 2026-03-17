'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * iOS PWA에서 백그라운드 복귀 시 Supabase 세션 갱신.
 * iOS PWA는 백그라운드에서 JS 타이머가 중단되어 access token 자동 갱신이 안 됨.
 * visibilitychange 이벤트로 포그라운드 복귀 시 강제 갱신.
 */
export default function SessionRefresher() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;

      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data.session) {
        // 세션 갱신 실패 → 로그인 페이지로
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [router]);

  return null;
}
