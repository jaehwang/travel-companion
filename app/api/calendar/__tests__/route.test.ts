/**
 * @jest-environment node
 */
import { GET } from '../route';
import { NextRequest } from 'next/server';

const mockGetSession = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: { getSession: (...args: any[]) => mockGetSession(...args) },
  }),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost:3000/api/calendar');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString());
}

function mockCalendarResponse(items: any[]) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ items }),
  } as Response;
}

function mockCalendarExpired() {
  return { ok: false, status: 401, json: async () => ({}) } as Response;
}

function mockRefreshSuccess(accessToken = 'new-access-token') {
  return {
    ok: true,
    json: async () => ({ access_token: accessToken }),
  } as Response;
}

function mockRefreshFailure() {
  return { ok: false, json: async () => ({}) } as Response;
}

const SESSION_WITH_TOKEN = {
  data: {
    session: {
      provider_token: 'valid-access-token',
      provider_refresh_token: 'refresh-token',
    },
  },
};

const SESSION_EXPIRED_TOKEN = {
  data: {
    session: {
      provider_token: null,
      provider_refresh_token: 'refresh-token',
    },
  },
};

const SESSION_NO_TOKENS = {
  data: {
    session: {
      provider_token: null,
      provider_refresh_token: null,
    },
  },
};

describe('GET /api/calendar', () => {
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

  it('provider_token과 refresh_token 모두 없으면 TOKEN_EXPIRED를 반환한다', async () => {
    mockGetSession.mockResolvedValue(SESSION_NO_TOKENS);

    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('TOKEN_EXPIRED');
  });

  it('유효한 access token으로 캘린더 일정을 반환한다', async () => {
    mockGetSession.mockResolvedValue(SESSION_WITH_TOKEN);
    const events = [{ id: '1', summary: '회의' }];
    mockFetch.mockResolvedValueOnce(mockCalendarResponse(events));

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toEqual(events);

    // Calendar API 호출 시 access token 사용 확인
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('calendar/v3/calendars/primary/events'),
      expect.objectContaining({
        headers: { Authorization: 'Bearer valid-access-token' },
      })
    );
  });

  it('access token 만료(401) 시 refresh token으로 재발급 후 재시도한다', async () => {
    mockGetSession.mockResolvedValue(SESSION_WITH_TOKEN);
    const events = [{ id: '2', summary: '점심' }];

    mockFetch
      .mockResolvedValueOnce(mockCalendarExpired())     // 1차: 401
      .mockResolvedValueOnce(mockRefreshSuccess())       // refresh 성공
      .mockResolvedValueOnce(mockCalendarResponse(events)); // 2차: 성공

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toEqual(events);

    // refresh 요청 확인
    expect(mockFetch).toHaveBeenCalledWith(
      'https://oauth2.googleapis.com/token',
      expect.objectContaining({ method: 'POST' })
    );

    // 새 토큰으로 재시도 확인
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('calendar/v3/calendars/primary/events'),
      expect.objectContaining({
        headers: { Authorization: 'Bearer new-access-token' },
      })
    );
  });

  it('provider_token이 없고 refresh_token만 있으면 즉시 refresh 후 캘린더를 호출한다', async () => {
    mockGetSession.mockResolvedValue(SESSION_EXPIRED_TOKEN);
    const events = [{ id: '3', summary: '저녁' }];

    mockFetch
      .mockResolvedValueOnce(mockRefreshSuccess('refreshed-token'))
      .mockResolvedValueOnce(mockCalendarResponse(events));

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toEqual(events);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('calendar/v3/calendars/primary/events'),
      expect.objectContaining({
        headers: { Authorization: 'Bearer refreshed-token' },
      })
    );
  });

  it('refresh token도 실패하면 TOKEN_EXPIRED를 반환한다', async () => {
    mockGetSession.mockResolvedValue(SESSION_WITH_TOKEN);

    mockFetch
      .mockResolvedValueOnce(mockCalendarExpired())  // 1차: 401
      .mockResolvedValueOnce(mockRefreshFailure());   // refresh 실패

    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('TOKEN_EXPIRED');
  });

  it('쿼리 파라미터가 Calendar API URL에 전달된다', async () => {
    mockGetSession.mockResolvedValue(SESSION_WITH_TOKEN);
    mockFetch.mockResolvedValueOnce(mockCalendarResponse([]));

    await GET(makeRequest({
      timeMin: '2026-03-14T00:00:00.000Z',
      timeMax: '2026-03-14T23:59:59.000Z',
      maxResults: '5',
    }));

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('timeMin=2026-03-14T00%3A00%3A00.000Z');
    expect(calledUrl).toContain('timeMax=2026-03-14T23%3A59%3A59.000Z');
    expect(calledUrl).toContain('maxResults=5');
  });
});
