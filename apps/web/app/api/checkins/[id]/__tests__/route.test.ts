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
const params = Promise.resolve({ id: 'checkin-123' });

// 문서(docs/api/checkins.md)에 명시된 전체 필드를 포함한 픽스처
const fullCheckin = {
  id: 'checkin-123',
  trip_id: 'trip-uuid',
  title: '수정된 제목',
  place: '경복궁',
  place_id: 'ChIJhxwf_LyifDUR5t5IAzpHmKY',
  message: '멋진 곳',
  category: 'attraction',
  latitude: 37.5796,
  longitude: 126.977,
  photo_url: 'https://example.com/photo.jpg',
  photo_metadata: { width: 1920, height: 1080 },
  checked_in_at: '2026-01-01T10:00:00Z',
  created_at: '2026-01-01T10:00:00Z',
  updated_at: '2026-01-02T10:00:00Z',
};

const CHECKIN_DOC_FIELDS = [
  'id', 'trip_id', 'title', 'place', 'place_id',
  'message', 'category', 'latitude', 'longitude',
  'photo_url', 'photo_metadata', 'checked_in_at', 'created_at', 'updated_at',
];

describe('PATCH /api/checkins/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockReturnValue(authedUser);
  });

  it('필드를 부분 업데이트하고 수정된 체크인을 반환한다', async () => {
    const updated = { id: 'checkin-123', title: '수정된 제목', latitude: 37.5665, longitude: 126.978 };
    mockFrom.mockReturnValue(createQueryBuilder({ data: updated, error: null }));

    const req = new NextRequest('http://localhost:3000/api/checkins/checkin-123', {
      method: 'PATCH',
      body: JSON.stringify({ title: '수정된 제목' }),
    });
    const res = await PATCH(req, { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.checkin).toEqual(updated);
  });

  it('응답 형상이 문서와 일치한다', async () => {
    mockFrom.mockReturnValue(createQueryBuilder({ data: fullCheckin, error: null }));

    const req = new NextRequest('http://localhost:3000/api/checkins/checkin-123', {
      method: 'PATCH',
      body: JSON.stringify({ title: '수정된 제목' }),
    });
    const res = await PATCH(req, { params });
    const body = await res.json();

    expect(body).toHaveProperty('checkin');
    for (const field of CHECKIN_DOC_FIELDS) {
      expect(body.checkin).toHaveProperty(field);
    }
    expect(typeof body.checkin.latitude).toBe('number');
    expect(typeof body.checkin.longitude).toBe('number');
  });

  it('여러 필드를 동시에 업데이트한다', async () => {
    const updated = { id: 'checkin-123', title: '경복궁', message: '멋진 곳', category: 'attraction' };
    mockFrom.mockReturnValue(createQueryBuilder({ data: updated, error: null }));

    const req = new NextRequest('http://localhost:3000/api/checkins/checkin-123', {
      method: 'PATCH',
      body: JSON.stringify({ title: '경복궁', message: '멋진 곳', category: 'attraction' }),
    });
    const res = await PATCH(req, { params });

    expect(res.status).toBe(200);
  });

  it('위도가 -90~90 범위를 벗어나면 400을 반환한다', async () => {
    const req = new NextRequest('http://localhost:3000/api/checkins/checkin-123', {
      method: 'PATCH',
      body: JSON.stringify({ latitude: 95 }),
    });
    const res = await PATCH(req, { params });

    expect(res.status).toBe(400);
  });

  it('경도가 -180~180 범위를 벗어나면 400을 반환한다', async () => {
    const req = new NextRequest('http://localhost:3000/api/checkins/checkin-123', {
      method: 'PATCH',
      body: JSON.stringify({ longitude: -200 }),
    });
    const res = await PATCH(req, { params });

    expect(res.status).toBe(400);
  });

  it('Supabase 에러 시 500을 반환한다', async () => {
    mockFrom.mockReturnValue(createQueryBuilder({ data: null, error: new Error('DB error') }));

    const req = new NextRequest('http://localhost:3000/api/checkins/checkin-123', {
      method: 'PATCH',
      body: JSON.stringify({ title: '수정' }),
    });
    const res = await PATCH(req, { params });

    expect(res.status).toBe(500);
  });

  it('trip_id PATCH 성공 — 자신의 여행으로 이동하면 200을 반환한다', async () => {
    const targetTrip = { id: 'trip-mine', user_id: 'user-1' };
    const updated = { ...fullCheckin, trip_id: 'trip-mine' };

    mockFrom.mockImplementation((table: string) => {
      if (table === 'trips') return createQueryBuilder({ data: targetTrip, error: null });
      return createQueryBuilder({ data: updated, error: null });
    });

    const req = new NextRequest('http://localhost:3000/api/checkins/checkin-123', {
      method: 'PATCH',
      body: JSON.stringify({ trip_id: 'trip-mine' }),
    });
    const res = await PATCH(req, { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.checkin.trip_id).toBe('trip-mine');
  });

  it('trip_id PATCH — 타인 소유 trip_id로 변경 시도 시 403을 반환한다', async () => {
    const otherTrip = { id: 'trip-other', user_id: 'user-999' };

    mockFrom.mockImplementation((table: string) => {
      if (table === 'trips') return createQueryBuilder({ data: otherTrip, error: null });
      return createQueryBuilder({ data: null, error: null });
    });

    const req = new NextRequest('http://localhost:3000/api/checkins/checkin-123', {
      method: 'PATCH',
      body: JSON.stringify({ trip_id: 'trip-other' }),
    });
    const res = await PATCH(req, { params });

    expect(res.status).toBe(403);
  });

  it('비인증 요청 시 401을 반환한다', async () => {
    mockGetUser.mockReturnValue(null);

    const req = new NextRequest('http://localhost:3000/api/checkins/checkin-123', {
      method: 'PATCH',
      body: JSON.stringify({ title: '수정' }),
    });
    const res = await PATCH(req, { params });

    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/checkins/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockReturnValue(authedUser);
  });

  it('체크인을 정상 삭제하고 success를 반환한다', async () => {
    mockFrom.mockReturnValue(createQueryBuilder({ data: null, error: null }));

    const req = new NextRequest('http://localhost:3000/api/checkins/checkin-123', {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('Supabase 에러 시 500을 반환한다', async () => {
    mockFrom.mockReturnValue(createQueryBuilder({ data: null, error: new Error('DB error') }));

    const req = new NextRequest('http://localhost:3000/api/checkins/checkin-123', {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params });

    expect(res.status).toBe(500);
  });

  it('비인증 요청 시 401을 반환한다', async () => {
    mockGetUser.mockReturnValue(null);

    const req = new NextRequest('http://localhost:3000/api/checkins/checkin-123', {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params });

    expect(res.status).toBe(401);
  });
});
