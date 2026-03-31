/**
 * @jest-environment node
 */
import { GET } from '../route';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockGetUser = jest.fn();
const mockGetSession = jest.fn();
const mockProfileSelect = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: {
      getUser: (...args: any[]) => mockGetUser(...args),
      getSession: (...args: any[]) => mockGetSession(...args),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: (...args: any[]) => mockProfileSelect(...args),
    }),
  }),
  getAuthenticatedClient: jest.fn(),
}));

const mockGenerateContent = jest.fn();
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: { generateContent: (...args: any[]) => mockGenerateContent(...args) },
  })),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

// ─── 픽스처 ───────────────────────────────────────────────────────────────────

const SESSION_WITH_TOKEN = {
  data: { session: { provider_token: 'access-token', provider_refresh_token: 'refresh-token' } },
};

const SESSION_NO_TOKENS = {
  data: { session: { provider_token: null, provider_refresh_token: null } },
};

const eventNoLocation = {
  id: 'ev-1',
  summary: '온라인 미팅',
  start: { dateTime: '2026-04-10T09:00:00+09:00' },
  end: { dateTime: '2026-04-10T10:00:00+09:00' },
};

const eventWithLocation = {
  id: 'ev-2',
  summary: '묵호 여행',
  location: '동해비치호텔, 강원도 동해시',
  start: { date: '2026-04-10' },
  end: { date: '2026-04-12' },
};

function makeRequest(headers: Record<string, string> = {}) {
  return new Request('http://localhost:3000/api/calendar/schedule', { headers });
}

function calendarOk(items: any[]) {
  return { ok: true, status: 200, json: async () => ({ items }) } as Response;
}

function calendarUnauthorized() {
  return { ok: false, status: 401, json: async () => ({}) } as Response;
}

function refreshOk(token = 'new-token') {
  return { ok: true, json: async () => ({ access_token: token }) } as Response;
}

function refreshFail() {
  return { ok: false, json: async () => ({}) } as Response;
}

function geocodeOk(lat = 37.52, lng = 129.11) {
  return {
    ok: true,
    json: async () => ({ results: [{ geometry: { location: { lat, lng } } }] }),
  } as Response;
}

function weatherOk() {
  return {
    ok: true,
    json: async () => ({
      daily: {
        time: ['2026-04-10'],
        temperature_2m_max: [18.1],
        temperature_2m_min: [11.8],
        precipitation_sum: [0.0],
        weathercode: [3],
        windspeed_10m_max: [17.3],
      },
    }),
  } as Response;
}

// ─── 테스트 ───────────────────────────────────────────────────────────────────

describe('GET /api/calendar/schedule', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      GOOGLE_CLIENT_ID: 'client-id',
      GOOGLE_CLIENT_SECRET: 'client-secret',
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'maps-key',
      GEMINI_API_KEY: 'gemini-key',
    };
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockGetSession.mockResolvedValue(SESSION_WITH_TOKEN);
    mockProfileSelect.mockResolvedValue({ data: { google_refresh_token: null }, error: null });
    mockGenerateContent.mockResolvedValue({ text: '묵호 첫날은 맑으니 해변 산책 좋아요!' });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // ── 인증 ──────────────────────────────────────────────────────────────────

  describe('인증', () => {
    it('세션이 없으면 401 Unauthorized를 반환한다', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      mockGetSession.mockResolvedValue({ data: { session: null } });

      const res = await GET(makeRequest());
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('access_token과 refresh_token 모두 없으면 TOKEN_EXPIRED를 반환한다', async () => {
      mockGetSession.mockResolvedValue(SESSION_NO_TOKENS);
      mockProfileSelect.mockResolvedValue({ data: { google_refresh_token: null }, error: null });

      const res = await GET(makeRequest());
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('TOKEN_EXPIRED');
    });

    it('Calendar API 401 시 refresh 시도 후 재호출한다', async () => {
      mockFetch
        .mockResolvedValueOnce(calendarUnauthorized())
        .mockResolvedValueOnce(refreshOk('refreshed-token'))
        .mockResolvedValueOnce(calendarOk([]));
      mockGenerateContent.mockResolvedValue({ text: '' });

      const res = await GET(makeRequest());
      expect(res.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('refresh도 실패하면 TOKEN_EXPIRED를 반환한다', async () => {
      mockFetch
        .mockResolvedValueOnce(calendarUnauthorized())
        .mockResolvedValueOnce(refreshFail());

      const res = await GET(makeRequest());
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('TOKEN_EXPIRED');
    });

    it('DB의 google_refresh_token으로 토큰을 갱신한다', async () => {
      mockGetSession.mockResolvedValue(SESSION_NO_TOKENS);
      mockProfileSelect.mockResolvedValue({ data: { google_refresh_token: 'db-refresh' }, error: null });
      mockFetch
        .mockResolvedValueOnce(refreshOk('db-token'))
        .mockResolvedValueOnce(calendarOk([]));
      mockGenerateContent.mockResolvedValue({ text: '' });

      const res = await GET(makeRequest());
      expect(res.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('calendar/v3/calendars/primary/events'),
        expect.objectContaining({ headers: { Authorization: 'Bearer db-token' } })
      );
    });
  });

  // ── 기본 응답 ─────────────────────────────────────────────────────────────

  describe('응답 형상', () => {
    it('items 배열과 advice를 반환한다', async () => {
      mockFetch.mockResolvedValueOnce(calendarOk([eventNoLocation]));
      mockGenerateContent.mockResolvedValue({ text: '온라인 미팅 잘 하세요!' });

      const res = await GET(makeRequest());
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(body.items)).toBe(true);
      expect(typeof body.advice).toBe('string');
    });

    it('위치 없는 이벤트는 weather 필드 없이 반환된다', async () => {
      mockFetch.mockResolvedValueOnce(calendarOk([eventNoLocation]));
      mockGenerateContent.mockResolvedValue({ text: '조언' });

      const res = await GET(makeRequest());
      const body = await res.json();

      expect(body.items[0].weather).toBeUndefined();
    });

    it('items가 빈 배열이면 advice는 null이다', async () => {
      mockFetch.mockResolvedValueOnce(calendarOk([]));

      const res = await GET(makeRequest());
      const body = await res.json();

      expect(body.items).toEqual([]);
      expect(body.advice).toBeNull();
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });
  });

  // ── 날씨 첨부 ─────────────────────────────────────────────────────────────

  describe('날씨 첨부', () => {
    it('위치 있는 이벤트에 geocoding → Open-Meteo 순서로 호출한다', async () => {
      mockFetch
        .mockResolvedValueOnce(calendarOk([eventWithLocation]))
        .mockResolvedValueOnce(geocodeOk())
        .mockResolvedValueOnce(weatherOk());

      const res = await GET(makeRequest());
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('geocode'));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('open-meteo.com'));
    });

    it('위치 있는 이벤트에 weather 필드가 포함된다', async () => {
      mockFetch
        .mockResolvedValueOnce(calendarOk([eventWithLocation]))
        .mockResolvedValueOnce(geocodeOk())
        .mockResolvedValueOnce(weatherOk());

      const res = await GET(makeRequest());
      const body = await res.json();
      const item = body.items[0];

      expect(item.weather).toBeDefined();
      expect(item.weather.tempMax).toBe(18);
      expect(item.weather.tempMin).toBe(12);
      expect(item.weather.description).toBe('흐림');
      expect(item.weather.emoji).toBe('☁️');
    });

    it('geocoding 실패 시 weather 없이 이벤트를 반환한다', async () => {
      mockFetch
        .mockResolvedValueOnce(calendarOk([eventWithLocation]))
        .mockResolvedValueOnce({ ok: true, json: async () => ({ results: [] }) } as Response);

      const res = await GET(makeRequest());
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.items[0].weather).toBeUndefined();
    });

    it('Open-Meteo 실패 시 weather 없이 이벤트를 반환한다', async () => {
      mockFetch
        .mockResolvedValueOnce(calendarOk([eventWithLocation]))
        .mockResolvedValueOnce(geocodeOk())
        .mockResolvedValueOnce({ ok: false, status: 500 } as Response);

      const res = await GET(makeRequest());
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.items[0].weather).toBeUndefined();
    });

    it('같은 위치를 가진 이벤트가 여러 개여도 geocoding은 한 번만 호출한다', async () => {
      const event2 = { ...eventWithLocation, id: 'ev-3' };
      mockFetch
        .mockResolvedValueOnce(calendarOk([eventWithLocation, event2]))
        .mockResolvedValueOnce(geocodeOk())          // geocode 1회
        .mockResolvedValueOnce(weatherOk())           // weather 이벤트 1
        .mockResolvedValueOnce(weatherOk());          // weather 이벤트 2

      await GET(makeRequest());

      const geocodeCalls = mockFetch.mock.calls.filter(([url]: any[]) =>
        typeof url === 'string' && url.includes('geocode')
      );
      expect(geocodeCalls).toHaveLength(1);
    });
  });

  // ── AI 조언 ───────────────────────────────────────────────────────────────

  describe('AI 조언', () => {
    it('Gemini 조언이 응답에 포함된다', async () => {
      mockFetch.mockResolvedValueOnce(calendarOk([eventNoLocation]));
      mockGenerateContent.mockResolvedValue({ text: '오늘 일정 파이팅!' });

      const res = await GET(makeRequest());
      const body = await res.json();

      expect(body.advice).toBe('오늘 일정 파이팅!');
    });

    it('GEMINI_API_KEY가 없으면 advice는 null이고 items는 반환된다', async () => {
      delete process.env.GEMINI_API_KEY;
      mockFetch.mockResolvedValueOnce(calendarOk([eventNoLocation]));

      const res = await GET(makeRequest());
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.advice).toBeNull();
      expect(body.items).toHaveLength(1);
    });

    it('Gemini 호출이 실패해도 items는 정상 반환된다', async () => {
      mockFetch.mockResolvedValueOnce(calendarOk([eventNoLocation]));
      mockGenerateContent.mockRejectedValue(new Error('Gemini error'));

      const res = await GET(makeRequest());
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.items).toHaveLength(1);
      expect(body.advice).toBeNull();
    });
  });

  // ── 날씨 코드 변환 ────────────────────────────────────────────────────────

  describe('WMO 날씨 코드 변환', () => {
    const weatherCases = [
      { code: 0, desc: '맑음', emoji: '☀️' },
      { code: 1, desc: '대체로 맑음', emoji: '🌤️' },
      { code: 2, desc: '구름 조금', emoji: '🌤️' },
      { code: 3, desc: '흐림', emoji: '☁️' },
      { code: 51, desc: '이슬비', emoji: '🌦️' },
      { code: 63, desc: '비', emoji: '🌧️' },
      { code: 73, desc: '눈', emoji: '🌨️' },
      { code: 80, desc: '소나기', emoji: '🌦️' },
      { code: 95, desc: '뇌우', emoji: '⛈️' },
    ];

    weatherCases.forEach(({ code, desc, emoji }) => {
      it(`코드 ${code} → "${desc}" ${emoji}`, async () => {
        const weatherResponse = {
          ok: true,
          json: async () => ({
            daily: {
              time: ['2026-04-10'],
              temperature_2m_max: [20],
              temperature_2m_min: [10],
              precipitation_sum: [0],
              weathercode: [code],
              windspeed_10m_max: [10],
            },
          }),
        } as Response;

        mockFetch
          .mockResolvedValueOnce(calendarOk([eventWithLocation]))
          .mockResolvedValueOnce(geocodeOk())
          .mockResolvedValueOnce(weatherResponse);
        mockGenerateContent.mockResolvedValue({ text: '' });

        const res = await GET(makeRequest());
        const body = await res.json();

        expect(body.items[0].weather.description).toBe(desc);
        expect(body.items[0].weather.emoji).toBe(emoji);
      });
    });
  });
});
