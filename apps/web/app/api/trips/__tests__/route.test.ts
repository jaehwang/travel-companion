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
  getAuthenticatedClient: jest.fn().mockImplementation(async () => ({
    supabase: { from: (...args: any[]) => mockFrom(...args) },
    user: mockGetUser(),
  })),
}));

const authedUser = { id: 'user-1' };

// 문서(docs/api/trips.md)에 명시된 전체 필드를 포함한 픽스처
const fullTrip = {
  id: 'trip-uuid',
  title: '제주도 여행',
  description: '3박 4일',
  start_date: '2026-01-01',
  end_date: '2026-01-04',
  is_public: false,
  place: '제주도',
  place_id: 'ChIJhxwf_LyifDUR5t5IAzpHmKY',
  latitude: 33.4996,
  longitude: 126.5312,
  user_id: 'user-1',
  created_at: '2026-01-01T00:00:00Z',
};

const TRIP_DOC_FIELDS = [
  'id', 'title', 'description', 'start_date', 'end_date',
  'is_public', 'place', 'place_id', 'latitude', 'longitude',
  'user_id', 'created_at',
];

// GET 응답에만 포함되는 추가 필드
const TRIP_LIST_EXTRA_FIELDS = ['first_checkin_date', 'cover_photo_url'];

describe('GET /api/trips', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockReturnValue(authedUser);
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

  it('응답 형상이 문서와 일치한다', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'trips') return createQueryBuilder({ data: [fullTrip], error: null });
      if (table === 'checkins') return createQueryBuilder({
        data: [{ trip_id: fullTrip.id, checked_in_at: '2026-01-01T10:00:00Z', photo_url: 'https://example.com/photo.jpg' }],
        error: null,
      });
      return createQueryBuilder({ data: null, error: null });
    });

    const req = new NextRequest('http://localhost:3000/api/trips');
    const res = await GET(req);
    const body = await res.json();

    expect(body).toHaveProperty('trips');
    expect(Array.isArray(body.trips)).toBe(true);
    const trip = body.trips[0];
    for (const field of [...TRIP_DOC_FIELDS, ...TRIP_LIST_EXTRA_FIELDS]) {
      expect(trip).toHaveProperty(field);
    }
    expect(typeof trip.is_public).toBe('boolean');
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
    mockGetUser.mockReturnValue(null);

    const req = new NextRequest('http://localhost:3000/api/trips');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });
});

describe('POST /api/trips', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockReturnValue(authedUser);
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

  it('응답 형상이 문서와 일치한다', async () => {
    mockFrom.mockReturnValue(createQueryBuilder({ data: fullTrip, error: null }));

    const req = new NextRequest('http://localhost:3000/api/trips', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(body).toHaveProperty('trip');
    for (const field of TRIP_DOC_FIELDS) {
      expect(body.trip).toHaveProperty(field);
    }
    expect(typeof body.trip.is_public).toBe('boolean');
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
    mockGetUser.mockReturnValue(null);

    const req = new NextRequest('http://localhost:3000/api/trips', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });
});
