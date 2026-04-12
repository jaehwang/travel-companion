import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    const errorCode = error || 'no_code';
    return NextResponse.redirect(
      `travel-companion://calendar-callback?error=${encodeURIComponent(errorCode)}`
    );
  }

  return NextResponse.redirect(
    `travel-companion://calendar-callback?code=${encodeURIComponent(code)}`
  );
}
