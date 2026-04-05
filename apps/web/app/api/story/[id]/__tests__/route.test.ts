/**
 * @jest-environment node
 */
import { GET } from '../route';

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

const mockFrom = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockImplementation(async () => ({
    from: (...args: any[]) => mockFrom(...args),
  })),
}));

const publicTrip = {
  id: 'trip-public',
  title: '공개 여행',
  is_public: true,
  created_at: '2026-01-01T00:00:00Z',
};

const privateTrip = {
  id: 'trip-private',
  title: '비공개 여행',
  is_public: false,
};

const sampleCheckins = [
  { id: 'checkin-1', trip_id: 'trip-public', title: '경복궁', checked_in_at: '2026-01-01T10:00:00Z' },
  { id: 'checkin-2', trip_id: 'trip-public', title: '명동', checked_in_at: '2026-01-01T14:00:00Z' },
];

function makeRequest(id: string) {
  return {
    request: new Request(`http://localhost:3000/api/story/${id}`),
    context: { params: Promise.resolve({ id }) },
  };
}

describe('GET /api/story/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Positive', () => {
    it('공개 여행을 비인증으로 조회할 수 있다', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'trips') return createQueryBuilder({ data: publicTrip, error: null });
        if (table === 'checkins') return createQueryBuilder({ data: sampleCheckins, error: null });
        return createQueryBuilder({ data: null, error: null });
      });

      const { request, context } = makeRequest('trip-public');
      const res = await GET(request, context);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.trip.id).toBe('trip-public');
      expect(body.trip.is_public).toBe(true);
      expect(Array.isArray(body.checkins)).toBe(true);
      expect(body.checkins).toHaveLength(2);
    });

    it('응답에 trip과 checkins 필드가 ��함된다', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'trips') return createQueryBuilder({ data: publicTrip, error: null });
        if (table === 'checkins') return createQueryBuilder({ data: sampleCheckins, error: null });
        return createQueryBuilder({ data: null, error: null });
      });

      const { request, context } = makeRequest('trip-public');
      const res = await GET(request, context);
      const body = await res.json();

      expect(body).toHaveProperty('trip');
      expect(body).toHaveProperty('checkins');
    });
  });

  describe('Negative', () => {
    it('존재하지 않는 ID는 404를 반환한다', async () => {
      mockFrom.mockReturnValue(createQueryBuilder({ data: null, error: new Error('not found') }));

      const { request, context } = makeRequest('non-existent');
      const res = await GET(request, context);

      expect(res.status).toBe(404);
    });

    it('비공개 여행은 체크인 없이 is_public: false만 반환한다', async () => {
      mockFrom.mockReturnValue(createQueryBuilder({ data: privateTrip, error: null }));

      const { request, context } = makeRequest('trip-private');
      const res = await GET(request, context);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.trip.is_public).toBe(false);
      expect(body.checkins).toEqual([]);
      // 비공개 여행의 title 등은 노출되지 않아야 함
      expect(body.trip.title).toBeUndefined();
    });

    it('체크인 조회 오류 시 500을 반환한다', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'trips') return createQueryBuilder({ data: publicTrip, error: null });
        if (table === 'checkins') return createQueryBuilder({ data: null, error: new Error('DB error') });
        return createQueryBuilder({ data: null, error: null });
      });

      const { request, context } = makeRequest('trip-public');
      const res = await GET(request, context);

      expect(res.status).toBe(500);
    });
  });

  describe('Boundary', () => {
    it('체크인이 없는 공개 여행은 빈 배열을 반환한다', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'trips') return createQueryBuilder({ data: publicTrip, error: null });
        if (table === 'checkins') return createQueryBuilder({ data: [], error: null });
        return createQueryBuilder({ data: null, error: null });
      });

      const { request, context } = makeRequest('trip-public');
      const res = await GET(request, context);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.checkins).toEqual([]);
    });

    it('checkins가 null이면 빈 배열을 반환한다', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'trips') return createQueryBuilder({ data: publicTrip, error: null });
        if (table === 'checkins') return createQueryBuilder({ data: null, error: null });
        return createQueryBuilder({ data: null, error: null });
      });

      const { request, context } = makeRequest('trip-public');
      const res = await GET(request, context);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.checkins).toEqual([]);
    });
  });
});
