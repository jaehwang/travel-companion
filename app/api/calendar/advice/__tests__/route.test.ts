/**
 * @jest-environment node
 */
import { POST } from '../route';

// ─── Mocks ───

const mockGetUser = jest.fn();
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: { getUser: (...args: any[]) => mockGetUser(...args) },
  }),
}));

const mockGenerateContent = jest.fn();
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: { generateContent: (...args: any[]) => mockGenerateContent(...args) },
  })),
}));

const authedUser = { data: { user: { id: 'user-1' } }, error: null };

// ─── Helpers ───

function makeRequest(body: object) {
  return new Request('http://localhost:3000/api/calendar/advice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const sampleEvents = [
  { summary: '경복궁 투어', minutesUntil: 60 },
  { summary: '점심 식사', location: '명동', minutesUntil: 120 },
];

// ─── Tests ───

describe('POST /api/calendar/advice', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      GEMINI_API_KEY: 'test-gemini-key',
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'test-maps-key',
    };
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue(authedUser);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('인증 및 설정 검사', () => {
    it('비인증 요청 시 401을 반환한다', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const res = await POST(makeRequest({ events: sampleEvents }));
      expect(res.status).toBe(401);
    });

    it('GEMINI_API_KEY가 없으면 503을 반환한다', async () => {
      delete process.env.GEMINI_API_KEY;

      const res = await POST(makeRequest({ events: sampleEvents }));
      expect(res.status).toBe(503);
    });

    it('events가 빈 배열이면 400을 반환한다', async () => {
      const res = await POST(makeRequest({ events: [] }));
      expect(res.status).toBe(400);
    });

    it('events가 없으면 400을 반환한다', async () => {
      const res = await POST(makeRequest({}));
      expect(res.status).toBe(400);
    });
  });

  describe('조언 생성', () => {
    it('정상 요청 시 advice를 반환한다', async () => {
      mockGenerateContent.mockResolvedValue({ text: '🗺️ 지금 출발하면 경복궁에 딱 맞게 도착해요' });

      const res = await POST(makeRequest({ events: sampleEvents }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.advice).toBe('🗺️ 지금 출발하면 경복궁에 딱 맞게 도착해요');
    });

    it('Gemini 응답의 따옴표를 제거한다', async () => {
      mockGenerateContent.mockResolvedValue({ text: '"지금 바로 출발하세요"' });

      const res = await POST(makeRequest({ events: sampleEvents }));
      const body = await res.json();

      expect(body.advice).toBe('지금 바로 출발하세요');
    });

    it('Gemini 응답이 여러 줄이면 첫 번째 줄만 사용한다', async () => {
      mockGenerateContent.mockResolvedValue({ text: '첫 번째 조언\n두 번째 줄' });

      const res = await POST(makeRequest({ events: sampleEvents }));
      const body = await res.json();

      expect(body.advice).toBe('첫 번째 조언');
    });

    it('advice가 60자를 초과하면 잘라낸다', async () => {
      const longAdvice = '가'.repeat(80);
      mockGenerateContent.mockResolvedValue({ text: longAdvice });

      const res = await POST(makeRequest({ events: sampleEvents }));
      const body = await res.json();

      expect(body.advice.length).toBeLessThanOrEqual(60);
    });
  });

  describe('이벤트 처리', () => {
    it('location이 있는 이벤트에 대해 geocode API를 호출한다', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          results: [{ geometry: { location: { lat: 37.563, lng: 126.983 } } }],
        }),
      } as any);
      mockGenerateContent.mockResolvedValue({ text: '조언' });

      await POST(makeRequest({
        events: [{ summary: '명동 쇼핑', location: '명동', minutesUntil: 60 }],
        userLat: 37.5,
        userLng: 127.0,
      }));

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('geocode'),
      );
    });

    it('location이 없는 이벤트는 거리를 "-"로 표시한다', async () => {
      let capturedPrompt = '';
      mockGenerateContent.mockImplementation(({ contents }: any) => {
        capturedPrompt = contents;
        return { text: '조언' };
      });

      await POST(makeRequest({
        events: [{ summary: '온라인 미팅', minutesUntil: 30 }],
      }));

      expect(capturedPrompt).toContain('- / 온라인 미팅');
    });

    it('종일 이벤트는 "내일" 또는 "N일 후"로 표시한다', async () => {
      let capturedPrompt = '';
      mockGenerateContent.mockImplementation(({ contents }: any) => {
        capturedPrompt = contents;
        return { text: '조언' };
      });

      await POST(makeRequest({
        events: [{ summary: '생일 파티', minutesUntil: 1440, isAllDay: true }],
      }));

      expect(capturedPrompt).toMatch(/내일|일 후/);
    });

    it('minutesUntil이 0 이하인 이벤트는 "진행 중"으로 표시한다', async () => {
      let capturedPrompt = '';
      mockGenerateContent.mockImplementation(({ contents }: any) => {
        capturedPrompt = contents;
        return { text: '조언' };
      });

      await POST(makeRequest({
        events: [{ summary: '현재 이벤트', minutesUntil: -10 }],
      }));

      expect(capturedPrompt).toContain('진행 중');
    });
  });
});
