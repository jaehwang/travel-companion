/**
 * @jest-environment node
 */
import { PATCH, DELETE } from '../route';
import { NextRequest } from 'next/server';

function createQueryBuilder(resolvedValue: { data: any; error: any }) {
  const builder: any = {
    select: jest.fn(() => builder),
    update: jest.fn(() => builder),
    delete: jest.fn(() => builder),
    eq: jest.fn(() => builder),
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
const params = Promise.resolve({ id: 'trip-123' });

// 문서(docs/api/trips.md)에 명시된 전체 필드를 포함한 픽스처
const fullTrip = {
  id: 'trip-123',
  title: '수정된 여행',
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

describe('PATCH /api/trips/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockReturnValue(authedUser);
  });

  it('title을 업데이트하고 수정된 여행을 반환한다', async () => {
    const updated = { id: 'trip-123', title: '수정된 여행', description: '' };
    mockFrom.mockReturnValue(createQueryBuilder({ data: updated, error: null }));

    const req = new NextRequest('http://localhost:3000/api/trips/trip-123', {
      method: 'PATCH',
      body: JSON.stringify({ title: '수정된 여행' }),
    });
    const res = await PATCH(req, { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.trip).toEqual(updated);
  });

  it('여러 필드를 동시에 업데이트한다', async () => {
    const updated = { id: 'trip-123', title: '도쿄', description: '봄 여행', is_public: true };
    mockFrom.mockReturnValue(createQueryBuilder({ data: updated, error: null }));

    const req = new NextRequest('http://localhost:3000/api/trips/trip-123', {
      method: 'PATCH',
      body: JSON.stringify({ title: '도쿄', description: '봄 여행', is_public: true }),
    });
    const res = await PATCH(req, { params });

    expect(res.status).toBe(200);
  });

  it('응답 형상이 문서와 일치한다', async () => {
    mockFrom.mockReturnValue(createQueryBuilder({ data: fullTrip, error: null }));

    const req = new NextRequest('http://localhost:3000/api/trips/trip-123', {
      method: 'PATCH',
      body: JSON.stringify({ title: '수정된 여행' }),
    });
    const res = await PATCH(req, { params });
    const body = await res.json();

    expect(body).toHaveProperty('trip');
    for (const field of TRIP_DOC_FIELDS) {
      expect(body.trip).toHaveProperty(field);
    }
    expect(typeof body.trip.is_public).toBe('boolean');
  });

  it('빈 title로 수정 시 400을 반환한다', async () => {
    const req = new NextRequest('http://localhost:3000/api/trips/trip-123', {
      method: 'PATCH',
      body: JSON.stringify({ title: '' }),
    });
    const res = await PATCH(req, { params });

    expect(res.status).toBe(400);
  });

  it('공백만 있는 title로 수정 시 400을 반환한다', async () => {
    const req = new NextRequest('http://localhost:3000/api/trips/trip-123', {
      method: 'PATCH',
      body: JSON.stringify({ title: '   ' }),
    });
    const res = await PATCH(req, { params });

    expect(res.status).toBe(400);
  });

  it('Supabase 에러 시 500을 반환한다', async () => {
    mockFrom.mockReturnValue(createQueryBuilder({ data: null, error: new Error('DB error') }));

    const req = new NextRequest('http://localhost:3000/api/trips/trip-123', {
      method: 'PATCH',
      body: JSON.stringify({ title: '수정' }),
    });
    const res = await PATCH(req, { params });

    expect(res.status).toBe(500);
  });

  it('비인증 요청 시 401을 반환한다', async () => {
    mockGetUser.mockReturnValue(null);

    const req = new NextRequest('http://localhost:3000/api/trips/trip-123', {
      method: 'PATCH',
      body: JSON.stringify({ title: '수정' }),
    });
    const res = await PATCH(req, { params });

    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/trips/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockReturnValue(authedUser);
  });

  it('여행을 정상 삭제하고 success를 반환한다', async () => {
    mockFrom.mockReturnValue(createQueryBuilder({ data: null, error: null }));

    const req = new NextRequest('http://localhost:3000/api/trips/trip-123', {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('Supabase 에러 시 500을 반환한다', async () => {
    mockFrom.mockReturnValue(createQueryBuilder({ data: null, error: new Error('DB error') }));

    const req = new NextRequest('http://localhost:3000/api/trips/trip-123', {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params });

    expect(res.status).toBe(500);
  });

  it('비인증 요청 시 401을 반환한다', async () => {
    mockGetUser.mockReturnValue(null);

    const req = new NextRequest('http://localhost:3000/api/trips/trip-123', {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params });

    expect(res.status).toBe(401);
  });
});
