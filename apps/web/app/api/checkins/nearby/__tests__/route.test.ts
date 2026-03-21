/**
 * @jest-environment node
 */
import { GET } from '../route';
import { NextRequest } from 'next/server';

function createQueryBuilder(resolvedValue: { data: any; error: any }) {
  const builder: any = {
    select: jest.fn(() => builder),
    order: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    in: jest.fn(() => builder),
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

// 서울 시청 좌표
const SEOUL_LAT = 37.5665;
const SEOUL_LNG = 126.9780;

// 서울 시청에서 약 100m 거리의 체크인
const nearbyCheckin = {
  id: 'checkin-1',
  trip_id: 'trip-1',
  title: '광화문 카페',
  place: '광화문',
  latitude: 37.5670,
  longitude: 126.9785,
  category: 'cafe',
  photo_url: null,
  checked_in_at: '2026-01-01T10:00:00Z',
  created_at: '2026-01-01T10:00:00Z',
  updated_at: '2026-01-01T10:00:00Z',
};

// 서울 시청에서 약 5km 거리의 체크인 (반경 밖)
const farCheckin = {
  id: 'checkin-2',
  trip_id: 'trip-1',
  title: '강남역',
  place: '강남',
  latitude: 37.4980,
  longitude: 127.0276,
  category: 'transportation',
  photo_url: null,
  checked_in_at: '2026-01-02T10:00:00Z',
  created_at: '2026-01-02T10:00:00Z',
  updated_at: '2026-01-02T10:00:00Z',
};

const frequentTrip = { id: 'trip-1', title: '서울 자주 가는 곳' };

describe('GET /api/checkins/nearby', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockReturnValue(authedUser);
  });

  it('비인증 요청 시 401을 반환한다', async () => {
    mockGetUser.mockReturnValue(null);

    const req = new NextRequest(
      `http://localhost:3000/api/checkins/nearby?lat=${SEOUL_LAT}&lng=${SEOUL_LNG}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('lat, lng 파라미터 누락 시 400을 반환한다', async () => {
    const req = new NextRequest('http://localhost:3000/api/checkins/nearby');
    const res = await GET(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('lat and lng are required');
  });

  it('lat만 있고 lng 없을 때 400을 반환한다', async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/checkins/nearby?lat=${SEOUL_LAT}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(400);
  });

  it('is_frequent 여행이 없으면 빈 배열을 반환한다', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'trips') return createQueryBuilder({ data: [], error: null });
      return createQueryBuilder({ data: null, error: null });
    });

    const req = new NextRequest(
      `http://localhost:3000/api/checkins/nearby?lat=${SEOUL_LAT}&lng=${SEOUL_LNG}`,
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.checkins).toEqual([]);
  });

  it('반경 내 체크인을 거리 및 여행명과 함께 반환한다', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'trips') return createQueryBuilder({ data: [frequentTrip], error: null });
      if (table === 'checkins') return createQueryBuilder({ data: [nearbyCheckin, farCheckin], error: null });
      return createQueryBuilder({ data: null, error: null });
    });

    const req = new NextRequest(
      `http://localhost:3000/api/checkins/nearby?lat=${SEOUL_LAT}&lng=${SEOUL_LNG}&radius=1000`,
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.checkins).toHaveLength(1);
    expect(body.checkins[0].id).toBe('checkin-1');
    expect(body.checkins[0].trip_title).toBe('서울 자주 가는 곳');
    expect(typeof body.checkins[0].distance).toBe('number');
    expect(body.checkins[0].distance).toBeLessThan(1000);
  });

  it('반경 밖 체크인은 결과에서 제외된다', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'trips') return createQueryBuilder({ data: [frequentTrip], error: null });
      if (table === 'checkins') return createQueryBuilder({ data: [farCheckin], error: null });
      return createQueryBuilder({ data: null, error: null });
    });

    const req = new NextRequest(
      `http://localhost:3000/api/checkins/nearby?lat=${SEOUL_LAT}&lng=${SEOUL_LNG}&radius=1000`,
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.checkins).toHaveLength(0);
  });

  it('기본 반경(1000m)이 적용된다', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'trips') return createQueryBuilder({ data: [frequentTrip], error: null });
      if (table === 'checkins') return createQueryBuilder({ data: [nearbyCheckin, farCheckin], error: null });
      return createQueryBuilder({ data: null, error: null });
    });

    // radius 파라미터 없이 요청
    const req = new NextRequest(
      `http://localhost:3000/api/checkins/nearby?lat=${SEOUL_LAT}&lng=${SEOUL_LNG}`,
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    // 강남역(~5km)은 기본 반경 1000m 밖이므로 제외
    expect(body.checkins).toHaveLength(1);
  });

  it('반경을 크게 설정하면 멀리 있는 체크인도 포함된다', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'trips') return createQueryBuilder({ data: [frequentTrip], error: null });
      if (table === 'checkins') return createQueryBuilder({ data: [nearbyCheckin, farCheckin], error: null });
      return createQueryBuilder({ data: null, error: null });
    });

    const req = new NextRequest(
      `http://localhost:3000/api/checkins/nearby?lat=${SEOUL_LAT}&lng=${SEOUL_LNG}&radius=10000`,
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.checkins).toHaveLength(2);
  });

  it('여행 조회 에러 시 500을 반환한다', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'trips') return createQueryBuilder({ data: null, error: new Error('DB error') });
      return createQueryBuilder({ data: null, error: null });
    });

    const req = new NextRequest(
      `http://localhost:3000/api/checkins/nearby?lat=${SEOUL_LAT}&lng=${SEOUL_LNG}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(500);
  });

  it('체크인 조회 에러 시 500을 반환한다', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'trips') return createQueryBuilder({ data: [frequentTrip], error: null });
      if (table === 'checkins') return createQueryBuilder({ data: null, error: new Error('DB error') });
      return createQueryBuilder({ data: null, error: null });
    });

    const req = new NextRequest(
      `http://localhost:3000/api/checkins/nearby?lat=${SEOUL_LAT}&lng=${SEOUL_LNG}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(500);
  });

  it('결과는 checked_in_at 내림차순으로 정렬된다', async () => {
    const checkin1 = { ...nearbyCheckin, id: 'c-1', checked_in_at: '2026-01-01T08:00:00Z' };
    const checkin2 = { ...nearbyCheckin, id: 'c-2', checked_in_at: '2026-01-03T08:00:00Z' };
    const checkin3 = { ...nearbyCheckin, id: 'c-3', checked_in_at: '2026-01-02T08:00:00Z' };

    mockFrom.mockImplementation((table: string) => {
      if (table === 'trips') return createQueryBuilder({ data: [frequentTrip], error: null });
      if (table === 'checkins') return createQueryBuilder({ data: [checkin1, checkin2, checkin3], error: null });
      return createQueryBuilder({ data: null, error: null });
    });

    const req = new NextRequest(
      `http://localhost:3000/api/checkins/nearby?lat=${SEOUL_LAT}&lng=${SEOUL_LNG}&radius=1000`,
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.checkins[0].id).toBe('c-2');
    expect(body.checkins[1].id).toBe('c-3');
    expect(body.checkins[2].id).toBe('c-1');
  });
});
