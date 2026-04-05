import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@travel-companion/shared';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component에서는 쿠키 설정 불가 (읽기만 가능)
          }
        },
      },
    }
  );
}

// Bearer 토큰 또는 쿠키 기반으로 인증된 클라이언트와 유저를 반환
// - Bearer 토큰: 모바일 앱에서 Authorization 헤더로 전달하는 경우
// - 쿠키: 웹 앱에서 세션 쿠키로 인증하는 경우
export async function getAuthenticatedClient(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const supabase = createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false },
      }
    );
    const { data: { user } } = await supabase.auth.getUser(token);
    return { supabase, user };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}
