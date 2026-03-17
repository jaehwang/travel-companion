/**
 * @jest-environment node
 */
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';

// 체이닝 패턴을 지원하는 mock builder
function createQueryBuilder(resolvedValue: { data: any; error: any }) {
  const builder: any = {
    select: jest.fn(() => builder),
    order: jest.fn(() => builder),
    in: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    single: jest.fn().mockResolvedValue(resolvedValue),
    then: (resolve: any, reject: any) =>
      Promise.resolve(resolvedValue).then(resolve, reject),
  };
  return builder;
}

const mockFrom = jest.fn();
const mockGetUser = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createApiClient: jest.fn().mockResolvedValue({
    auth: { getUser: (...args: any[]) => mockGetUser(...args) },
    from: (...args: any[]) => mockFrom(...args),
  }),
}));

const authedUser = { data: { user: { id: 'user-1' } }, error: null };

describe('GET /api/trips', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue(authedUser);
  });

  it('여행 목록을 first_checkin_date와 함께 반환한다', async () => {
    const trips = [
      { id: 'trip-1', title: '도쿄 여행' },
      { id: 'trip-2', title: '파리 여행' },
    ];
    const checkins = [
      { trip_id: 'trip-1', checked_in_at: '2024-01-02T10:00:00Z' },
      { trip_id: 'trip-1', checked_in_at: '2024-01-03T10:00:00Z' },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === 'trips') return createQueryBuilder({ data: trips, error: null });
      if (table === 'checkins') return createQueryBuilder({ data: checkins, error: null });
      return createQueryBuilder({ data: null, error: null });
    });

    const req = new NextRequest('http://localhost:3000/api/trips');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.trips).toHaveLength(2);
    expect(body.trips[0].first_checkin_date).toBe('2024-01-02T10:00:00Z');
    expect(body.trips[1].first_checkin_date).toBeNull();
  });

  it('여행이 없으면 빈 배열을 반환한다', async () => {
    mockFrom.mockImplementation(() => createQueryBuilder({ data: [], error: null }));

    const req = new NextRequest('http://localhost:3000/api/trips');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.trips).toEqual([]);
  });

  it('Supabase 에러 시 500을 반환한다', async () => {
    mockFrom.mockReturnValue(createQueryBuilder({ data: null, error: new Error('DB error') }));

    const req = new NextRequest('http://localhost:3000/api/trips');
    const res = await GET(req);

    expect(res.status).toBe(500);
  });

  it('비인증 요청 시 401을 반환한다', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const req = new NextRequest('http://localhost:3000/api/trips');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });
});

describe('POST /api/trips', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue(authedUser);
  });

  const validBody = { title: '도쿄 여행', description: '봄 여행' };

  it('유효한 데이터로 여행을 생성한다', async () => {
    const created = { id: 'new-trip', ...validBody };
    mockFrom.mockReturnValue(createQueryBuilder({ data: created, error: null }));

    const req = new NextRequest('http://localhost:3000/api/trips', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.trip).toEqual(created);
  });

  it('title 누락 시 400을 반환한다', async () => {
    const req = new NextRequest('http://localhost:3000/api/trips', {
      method: 'POST',
      body: JSON.stringify({ description: '설명만 있음' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('빈 title 시 400을 반환한다', async () => {
    const req = new NextRequest('http://localhost:3000/api/trips', {
      method: 'POST',
      body: JSON.stringify({ title: '   ' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('Supabase 에러 시 500을 반환한다', async () => {
    mockFrom.mockReturnValue(createQueryBuilder({ data: null, error: new Error('DB error') }));

    const req = new NextRequest('http://localhost:3000/api/trips', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
  });

  it('비인증 요청 시 401을 반환한다', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const req = new NextRequest('http://localhost:3000/api/trips', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });
});
