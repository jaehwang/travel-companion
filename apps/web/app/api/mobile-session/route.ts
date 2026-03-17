import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 모바일 앱에서 access_token + refresh_token을 전달받아
// 서버 사이드 쿠키로 세션을 설정한 후 /checkin으로 리다이렉트
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const access_token = searchParams.get('access_token');
  const refresh_token = searchParams.get('refresh_token');

  if (!access_token || !refresh_token) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const response = NextResponse.redirect(`${origin}/checkin`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) {
    return NextResponse.redirect(`${origin}/login`);
  }

  return response;
}
