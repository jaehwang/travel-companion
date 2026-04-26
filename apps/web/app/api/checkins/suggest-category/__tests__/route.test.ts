/**
 * @jest-environment node
 */
import { POST } from '../route';

const mockGenerateContent = jest.fn();
const mockGetUser = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  getAuthenticatedClient: jest.fn().mockImplementation(async () => ({
    user: mockGetUser(),
  })),
}));

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerateContent },
  })),
}));

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/checkins/suggest-category', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/checkins/suggest-category', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockReturnValue({ id: 'user-1' });
    mockGenerateContent.mockResolvedValue({ text: 'restaurant' });
    process.env.GEMINI_API_KEY = 'test-key';
  });

  it('미인증 요청에 401을 반환한다', async () => {
    mockGetUser.mockReturnValue(null);
    const res = await POST(makeRequest({ title: '스시' }));
    expect(res.status).toBe(401);
  });

  it('콘텐츠가 모두 비어있으면 400을 반환한다', async () => {
    const res = await POST(makeRequest({ title: '', message: '', tags: [] }));
    expect(res.status).toBe(400);
  });

  it('Gemini 응답에서 유효한 카테고리를 파싱하여 반환한다', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'restaurant' });
    const res = await POST(makeRequest({ title: '스시 오마카세', message: '최고의 점심' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.category).toBe('restaurant');
  });

  it('Gemini 응답에 알 수 없는 값이 오면 other로 폴백하고 클라이언트에 반환한다', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'unknown_value' });
    const res = await POST(makeRequest({ title: '어딘가' }));
    const body = await res.json();
    expect(body.category).toBe('other');
  });

  it('other 카테고리도 정상적으로 반환한다', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'other' });
    const res = await POST(makeRequest({ title: '알 수 없는 장소' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.category).toBe('other');
  });

  it('태그만 있어도 카테고리를 추천한다', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'cafe' });
    const res = await POST(makeRequest({ tags: ['아메리카노', '카페'] }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.category).toBe('cafe');
  });

  it('클라이언트 필수 필드가 응답에 포함된다', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'attraction' });
    const res = await POST(makeRequest({ title: '경복궁' }));
    const body = await res.json();
    // category: 모바일 앱이 CategorySuggestionBanner 렌더링에 사용
    expect(typeof body.category).toBe('string');
    expect(body.category.length).toBeGreaterThan(0);
  });
});
