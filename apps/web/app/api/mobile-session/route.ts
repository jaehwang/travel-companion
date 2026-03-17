import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 모바일 앱에서 access_token + refresh_token을 전달받아
// 서버 사이드 쿠키로 세션을 설정한 후 /checkin으로 리다이렉트
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const access_token = searchParams.get('access_token');
  const refresh_token = searchParams.get('refresh_token');

  // Host 헤더 기반으로 baseUrl 구성 (192.168.0.x vs localhost 불일치 방지)
  const host = request.headers.get('host') ?? 'localhost:3000';
  const protocol = new URL(request.url).protocol.replace(':', '');
  const baseUrl = `${protocol}://${host}`;

  if (!access_token || !refresh_token) {
    return NextResponse.redirect(`${baseUrl}/login`);
  }

  const response = NextResponse.redirect(`${baseUrl}/checkin`);

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
    return NextResponse.redirect(`${baseUrl}/login`);
  }

  return response;
}
