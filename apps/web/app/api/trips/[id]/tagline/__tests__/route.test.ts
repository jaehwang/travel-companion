/**
 * @jest-environment node
 */
import { POST } from '../route';
import { NextRequest } from 'next/server';

const mockGenerateContent = jest.fn();
const mockFrom = jest.fn();
const mockGetUser = jest.fn();

function createQueryBuilder(resolvedValue: { data: any; error: any }) {
  const builder: any = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    order: jest.fn(() => builder),
    single: jest.fn().mockResolvedValue(resolvedValue),
    then: (resolve: any, reject: any) =>
      Promise.resolve(resolvedValue).then(resolve, reject),
  };
  return builder;
}

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: (...args: any[]) => mockGenerateContent(...args),
    },
  })),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: { getUser: (...args: any[]) => mockGetUser(...args) },
    from: (...args: any[]) => mockFrom(...args),
  }),
}));

const authedUser = { data: { user: { id: 'user-1' } }, error: null };
const params = Promise.resolve({ id: 'trip-123' });

describe('POST /api/trips/[id]/tagline', () => {
  const originalApiKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-key';
    mockGetUser.mockResolvedValue(authedUser);
  });

  afterAll(() => {
    process.env.GEMINI_API_KEY = originalApiKey;
  });

  it('여행 정보로 재치 문구를 생성한다', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'trips') {
        return createQueryBuilder({
          data: {
            id: 'trip-123',
            title: '도쿄 야간 산책',
            description: '편의점과 골목 탐방',
            place: '도쿄',
            start_date: '2025-05-01T00:00:00.000Z',
            end_date: '2025-05-03T00:00:00.000Z',
          },
          error: null,
        });
      }

      return createQueryBuilder({
        data: [
          {
            checked_in_at: '2025-05-01T10:00:00.000Z',
            place: '신주쿠',
            title: '첫 끼는 라멘',
            message: '국물까지 싹 비웠다',
            category: 'restaurant',
          },
          {
            checked_in_at: '2025-05-02T10:00:00.000Z',
            place: '시부야',
            title: '골목 산책',
            message: '예상보다 오래 걷고 더 오래 구경했다',
            category: 'attraction',
          },
        ],
        error: null,
      });
    });

    mockGenerateContent.mockResolvedValue({ text: '밤공기까지 체크인한 여행' });

    const req = new NextRequest('http://localhost:3000/api/trips/trip-123/tagline', {
      method: 'POST',
    });
    const res = await POST(req, { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.tagline).toBe('밤공기까지 체크인한 여행');
    expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gemini-2.5-flash-lite',
      contents: expect.stringContaining('대표 체크인:'),
    }));
    expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
      contents: expect.stringContaining('신주쿠'),
    }));
    expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
      contents: expect.stringContaining('국물까지 싹 비웠다'),
    }));
  });

  it('Gemini API 키가 없으면 503을 반환한다', async () => {
    delete process.env.GEMINI_API_KEY;

    const req = new NextRequest('http://localhost:3000/api/trips/trip-123/tagline', {
      method: 'POST',
    });
    const res = await POST(req, { params });

    expect(res.status).toBe(503);
  });

  it('비인증 요청 시 401을 반환한다', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const req = new NextRequest('http://localhost:3000/api/trips/trip-123/tagline', {
      method: 'POST',
    });
    const res = await POST(req, { params });

    expect(res.status).toBe(401);
  });
});
