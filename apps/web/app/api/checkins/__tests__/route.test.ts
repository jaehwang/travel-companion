/**
 * @jest-environment node
 */
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';

// Supabase 체이닝 패턴을 지원하는 mock builder
function createQueryBuilder(resolvedValue: { data: any; error: any }) {
  const builder: any = {
    select: jest.fn(() => builder),
    order: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    single: jest.fn().mockResolvedValue(resolvedValue),
    // await query 지원을 위한 thenable
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

// 문서(docs/api/checkins.md)에 명시된 전체 필드를 포함한 픽스처
const fullCheckin = {
  id: 'checkin-uuid',
  trip_id: 'trip-uuid',
  title: '성산일출봉',
  place: '성산일출봉',
  place_id: 'ChIJLU7jZClu5kcR4PcOOO6p3I0',
  message: '일출이 아름다웠다',
  category: 'attraction',
  latitude: 33.4585,
  longitude: 126.9422,
  photo_url: 'https://example.com/photo.jpg',
  photo_metadata: { width: 1920, height: 1080 },
  checked_in_at: '2026-01-01T06:00:00Z',
  created_at: '2026-01-01T06:00:00Z',
  updated_at: '2026-01-01T06:00:00Z',
};

const CHECKIN_DOC_FIELDS = [
  'id', 'trip_id', 'title', 'place', 'place_id',
  'message', 'category', 'latitude', 'longitude',
  'photo_url', 'photo_metadata', 'checked_in_at', 'created_at',
];

describe('GET /api/checkins', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockReturnValue(authedUser);
  });

  it('전체 체크인 목록을 반환한다', async () => {
    const checkins = [
      { id: '1', trip_id: 'trip-1', title: '에펠탑', latitude: 48.8584, longitude: 2.2945 },
    ];
    mockFrom.mockReturnValue(createQueryBuilder({ data: checkins, error: null }));

    const req = new NextRequest('http://localhost:3000/api/checkins');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.checkins).toEqual(checkins);
  });

  it('응답 형상이 문서와 일치한다', async () => {
    mockFrom.mockReturnValue(createQueryBuilder({ data: [fullCheckin], error: null }));

    const req = new NextRequest('http://localhost:3000/api/checkins');
    const res = await GET(req);
    const body = await res.json();

    expect(body).toHaveProperty('checkins');
    expect(Array.isArray(body.checkins)).toBe(true);
    const checkin = body.checkins[0];
    for (const field of CHECKIN_DOC_FIELDS) {
      expect(checkin).toHaveProperty(field);
    }
    expect(typeof checkin.latitude).toBe('number');
    expect(typeof checkin.longitude).toBe('number');
  });

  it('Supabase 에러 시 500을 반환한다', async () => {
    mockFrom.mockReturnValue(createQueryBuilder({ data: null, error: new Error('DB error') }));

    const req = new NextRequest('http://localhost:3000/api/checkins');
    const res = await GET(req);

    expect(res.status).toBe(500);
  });

  it('비인증 요청 시 401을 반환한다', async () => {
    mockGetUser.mockReturnValue(null);

    const req = new NextRequest('http://localhost:3000/api/checkins');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });
});

describe('POST /api/checkins', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockReturnValue(authedUser);
  });

  const validBody = {
    trip_id: 'trip-uuid',
    latitude: 37.5665,
    longitude: 126.9780,
    title: '경복궁',
  };

  it('유효한 데이터로 체크인을 생성한다', async () => {
    const createdCheckin = { id: 'new-id', ...validBody };
    mockFrom.mockReturnValue(createQueryBuilder({ data: createdCheckin, error: null }));

    const req = new NextRequest('http://localhost:3000/api/checkins', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.checkin).toEqual(createdCheckin);
  });

  it('응답 형상이 문서와 일치한다', async () => {
    mockFrom.mockReturnValue(createQueryBuilder({ data: fullCheckin, error: null }));

    const req = new NextRequest('http://localhost:3000/api/checkins', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(body).toHaveProperty('checkin');
    for (const field of CHECKIN_DOC_FIELDS) {
      expect(body.checkin).toHaveProperty(field);
    }
    expect(typeof body.checkin.latitude).toBe('number');
    expect(typeof body.checkin.longitude).toBe('number');
  });

  it('trip_id 누락 시 400을 반환한다', async () => {
    const req = new NextRequest('http://localhost:3000/api/checkins', {
      method: 'POST',
      body: JSON.stringify({ latitude: 37.5665, longitude: 126.9780 }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('위도 범위 초과 시 400을 반환한다', async () => {
    const req = new NextRequest('http://localhost:3000/api/checkins', {
      method: 'POST',
      body: JSON.stringify({ ...validBody, latitude: 95 }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('경도 범위 초과 시 400을 반환한다', async () => {
    const req = new NextRequest('http://localhost:3000/api/checkins', {
      method: 'POST',
      body: JSON.stringify({ ...validBody, longitude: 200 }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('비인증 요청 시 401을 반환한다', async () => {
    mockGetUser.mockReturnValue(null);

    const req = new NextRequest('http://localhost:3000/api/checkins', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });
});
