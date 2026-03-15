/**
 * @jest-environment node
 */
import { GET } from '../route';
import { NextRequest } from 'next/server';

const mockGetSession = jest.fn();
const mockUpdate = jest.fn();
const mockCookiesGet = jest.fn();
const mockCookiesDelete = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: { getSession: (...args: any[]) => mockGetSession(...args) },
    from: jest.fn().mockReturnValue({
      update: (...args: any[]) => {
        mockUpdate(...args);
        return { eq: jest.fn().mockResolvedValue({ error: null }) };
      },
    }),
  }),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    get: (...args: any[]) => mockCookiesGet(...args),
    delete: (...args: any[]) => mockCookiesDelete(...args),
  }),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

const VALID_STATE = 'valid-state-value';
const VALID_CODE = 'auth-code-123';

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost:3000/api/calendar/connect/callback');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString());
}

describe('GET /api/calendar/connect/callback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    // 기본적으로 저장된 state가 VALID_STATE와 일치하도록 설정
    mockCookiesGet.mockReturnValue({ value: VALID_STATE });
  });

  it('state가 불일치하면 /settings?error=invalid_state로 redirect한다', async () => {
    mockCookiesGet.mockReturnValue({ value: 'other-state' });

    const res = await GET(makeRequest({ state: VALID_STATE, code: VALID_CODE }));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/settings?error=invalid_state');
  });

  it('state가 없으면 /settings?error=invalid_state로 redirect한다', async () => {
    mockCookiesGet.mockReturnValue(undefined);

    const res = await GET(makeRequest({ code: VALID_CODE }));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/settings?error=invalid_state');
  });

  it('code가 없으면 /settings?error=no_code로 redirect한다', async () => {
    const res = await GET(makeRequest({ state: VALID_STATE }));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/settings?error=no_code');
  });

  it('세션이 없으면 /login으로 redirect한다', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const res = await GET(makeRequest({ state: VALID_STATE, code: VALID_CODE }));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('Google token 교환 실패 시 /settings?error=token_exchange_failed로 redirect한다', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-id' } } },
    });
    mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) });

    const res = await GET(makeRequest({ state: VALID_STATE, code: VALID_CODE }));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/settings?error=token_exchange_failed');
  });

  it('refresh_token이 없으면 /settings?error=no_refresh_token으로 redirect한다', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-id' } } },
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'access-token' }), // refresh_token 없음
    });

    const res = await GET(makeRequest({ state: VALID_STATE, code: VALID_CODE }));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/settings?error=no_refresh_token');
  });

  it('DB update 실패 시 /settings?error=db_update_failed로 redirect한다', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-id' } } },
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ refresh_token: 'refresh-token-123' }),
    });

    const { createClient } = jest.requireMock('@/lib/supabase/server');
    createClient.mockResolvedValueOnce({
      auth: { getSession: mockGetSession },
      from: jest.fn().mockReturnValue({
        update: () => ({
          eq: jest.fn().mockResolvedValue({ error: { message: 'DB error' } }),
        }),
      }),
    });

    const res = await GET(makeRequest({ state: VALID_STATE, code: VALID_CODE }));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/settings?error=db_update_failed');
  });

  it('성공 시 DB update를 호출하고 /settings?calendar=connected로 redirect한다', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-id' } } },
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ refresh_token: 'new-refresh-token' }),
    });

    const mockEq = jest.fn().mockResolvedValue({ error: null });
    const { createClient } = jest.requireMock('@/lib/supabase/server');
    createClient.mockResolvedValueOnce({
      auth: { getSession: mockGetSession },
      from: jest.fn().mockReturnValue({
        update: (data: any) => {
          mockUpdate(data);
          return { eq: mockEq };
        },
      }),
    });

    const res = await GET(makeRequest({ state: VALID_STATE, code: VALID_CODE }));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/settings?calendar=connected');

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ google_refresh_token: 'new-refresh-token' })
    );
    expect(mockEq).toHaveBeenCalledWith('id', 'user-id');
  });
});
