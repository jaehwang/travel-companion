import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API, auth는 intl 처리 제외
  if (pathname.startsWith('/api/') || pathname.startsWith('/auth/')) {
    return NextResponse.next();
  }

  // next-intl 로케일 라우팅 처리 (리다이렉트/rewrite)
  const intlResponse = intlMiddleware(request);

  // 리다이렉트(307/308)는 그대로 반환
  if (intlResponse.status === 307 || intlResponse.status === 308) {
    return intlResponse;
  }

  // Supabase 세션 처리 (intlResponse를 기반으로 쿠키 설정)
  let supabaseResponse = intlResponse;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 세션 토큰 갱신 (중요: getUser()가 갱신을 트리거함)
  const { data: { user } } = await supabase.auth.getUser();

  // 로케일 prefix 제거 후 실제 경로로 공개 여부 판단
  // pathname 예: /en/checkin → strippedPath: /checkin
  const localeSegment = routing.locales.find(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );
  const strippedPath = localeSegment
    ? pathname.slice(`/${localeSegment}`.length) || '/'
    : pathname;

  const isPublicPath =
    strippedPath === '/' ||
    strippedPath.startsWith('/login') ||
    strippedPath.startsWith('/story');

  // 비로그인 상태에서 보호된 경로 접근 시 /{locale}/login으로 리다이렉트
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = localeSegment ? `/${localeSegment}/login` : '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // 정적 파일 및 이미지 제외
    '/((?!_next/static|_next/image|favicon.ico|manifest\\.webmanifest|icon\\.png|apple-icon\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
