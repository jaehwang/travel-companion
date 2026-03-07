/**
 * @jest-environment node
 */
import { POST } from '../route';
import { NextRequest } from 'next/server';

function createQueryBuilder(resolvedValue: { data: any; error: any }) {
  const builder: any = {
    select: jest.fn(() => builder),
    update: jest.fn(() => builder),
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
  createClient: jest.fn().mockResolvedValue({
    auth: { getUser: (...args: any[]) => mockGetUser(...args) },
    from: (...args: any[]) => mockFrom(...args),
  }),
}));

const authedUser = { data: { user: { id: 'user-1' } }, error: null };
const params = Promise.resolve({ id: 'trip-123' });

const tripWithPlace = {
  id: 'trip-123',
  title: '도쿄 여행',
  place: '도쿄',
  place_id: 'ChIJ51cu8IcbXWARiRtXIothAS4',
  latitude: 35.6762,
  longitude: 139.6503,
};

describe('POST /api/trips/[id]/apply-place', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue(authedUser);
  });

  it('여행 장소를 모든 체크인에 일괄 적용하고 success를 반환한다', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'trips') return createQueryBuilder({ data: tripWithPlace, error: null });
      if (table === 'checkins') return createQueryBuilder({ data: null, error: null });
      return createQueryBuilder({ data: null, error: null });
    });

    const req = new NextRequest('http://localhost:3000/api/trips/trip-123/apply-place', {
      method: 'POST',
    });
    const res = await POST(req, { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('checkins 테이블에 올바른 장소 데이터로 update를 호출한다', async () => {
    const checkinsBuilder = createQueryBuilder({ data: null, error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'trips') return createQueryBuilder({ data: tripWithPlace, error: null });
      if (table === 'checkins') return checkinsBuilder;
      return createQueryBuilder({ data: null, error: null });
    });

    const req = new NextRequest('http://localhost:3000/api/trips/trip-123/apply-place', {
      method: 'POST',
    });
    await POST(req, { params });

    expect(checkinsBuilder.update).toHaveBeenCalledWith({
      place: '도쿄',
      place_id: tripWithPlace.place_id,
      latitude: tripWithPlace.latitude,
      longitude: tripWithPlace.longitude,
    });
  });

  it('trip_id로 체크인을 필터링하여 업데이트한다', async () => {
    const checkinsBuilder = createQueryBuilder({ data: null, error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'trips') return createQueryBuilder({ data: tripWithPlace, error: null });
      if (table === 'checkins') return checkinsBuilder;
      return createQueryBuilder({ data: null, error: null });
    });

    const req = new NextRequest('http://localhost:3000/api/trips/trip-123/apply-place', {
      method: 'POST',
    });
    await POST(req, { params });

    expect(checkinsBuilder.eq).toHaveBeenCalledWith('trip_id', 'trip-123');
  });

  it('여행에 place가 없으면 400을 반환한다', async () => {
    const tripWithoutPlace = { id: 'trip-123', title: '도쿄 여행', place: null, latitude: null, longitude: null };
    mockFrom.mockImplementation((table: string) => {
      if (table === 'trips') return createQueryBuilder({ data: tripWithoutPlace, error: null });
      return createQueryBuilder({ data: null, error: null });
    });

    const req = new NextRequest('http://localhost:3000/api/trips/trip-123/apply-place', {
      method: 'POST',
    });
    const res = await POST(req, { params });

    expect(res.status).toBe(400);
  });

  it('여행에 latitude/longitude가 없으면 400을 반환한다', async () => {
    const tripWithoutCoords = { id: 'trip-123', title: '도쿄 여행', place: '도쿄', latitude: null, longitude: null };
    mockFrom.mockImplementation((table: string) => {
      if (table === 'trips') return createQueryBuilder({ data: tripWithoutCoords, error: null });
      return createQueryBuilder({ data: null, error: null });
    });

    const req = new NextRequest('http://localhost:3000/api/trips/trip-123/apply-place', {
      method: 'POST',
    });
    const res = await POST(req, { params });

    expect(res.status).toBe(400);
  });

  it('여행을 찾지 못하면 404를 반환한다', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'trips') return createQueryBuilder({ data: null, error: new Error('not found') });
      return createQueryBuilder({ data: null, error: null });
    });

    const req = new NextRequest('http://localhost:3000/api/trips/trip-123/apply-place', {
      method: 'POST',
    });
    const res = await POST(req, { params });

    expect(res.status).toBe(404);
  });

  it('checkins 업데이트 실패 시 500을 반환한다', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'trips') return createQueryBuilder({ data: tripWithPlace, error: null });
      if (table === 'checkins') return createQueryBuilder({ data: null, error: new Error('DB error') });
      return createQueryBuilder({ data: null, error: null });
    });

    const req = new NextRequest('http://localhost:3000/api/trips/trip-123/apply-place', {
      method: 'POST',
    });
    const res = await POST(req, { params });

    expect(res.status).toBe(500);
  });

  it('비인증 요청 시 401을 반환한다', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const req = new NextRequest('http://localhost:3000/api/trips/trip-123/apply-place', {
      method: 'POST',
    });
    const res = await POST(req, { params });

    expect(res.status).toBe(401);
  });
});
