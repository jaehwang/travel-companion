/**
 * @jest-environment node
 */
import { GET } from '../route';
import { NextRequest } from 'next/server';

const mockGetSession = jest.fn();
const mockCookiesSet = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: { getSession: (...args: any[]) => mockGetSession(...args) },
  }),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    set: (...args: any[]) => mockCookiesSet(...args),
  }),
}));

function makeRequest(url = 'http://localhost:3000/api/calendar/connect') {
  return new NextRequest(url);
}

describe('GET /api/calendar/connect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
  });

  it('세션이 없으면 401 Unauthorized를 반환한다', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('세션이 있으면 Google OAuth URL로 307 redirect한다', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-id' } } },
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(307);

    const location = res.headers.get('location') ?? '';
    expect(location).toContain('https://accounts.google.com/o/oauth2/v2/auth');
  });

  it('redirect URL에 client_id, scope, access_type, prompt, state, redirect_uri가 포함된다', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-id' } } },
    });

    const res = await GET(makeRequest());
    const location = res.headers.get('location') ?? '';
    const redirectUrl = new URL(location);

    expect(redirectUrl.searchParams.get('client_id')).toBe('test-client-id');
    expect(redirectUrl.searchParams.get('scope')).toBe(
      'https://www.googleapis.com/auth/calendar.readonly'
    );
    expect(redirectUrl.searchParams.get('access_type')).toBe('offline');
    expect(redirectUrl.searchParams.get('prompt')).toBe('consent');
    expect(redirectUrl.searchParams.get('state')).toBeTruthy();
    expect(redirectUrl.searchParams.get('redirect_uri')).toContain(
      '/api/calendar/connect/callback'
    );
  });

  it('state 쿠키가 설정된다', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-id' } } },
    });

    const res = await GET(makeRequest());
    const location = res.headers.get('location') ?? '';
    const stateInUrl = new URL(location).searchParams.get('state');

    expect(mockCookiesSet).toHaveBeenCalledWith(
      'calendar_oauth_state',
      stateInUrl,
      expect.objectContaining({ httpOnly: true, sameSite: 'lax' })
    );
  });
});
