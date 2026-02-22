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

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (...args: any[]) => mockFrom(...args) },
}));

describe('GET /api/checkins', () => {
  beforeEach(() => jest.clearAllMocks());

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

  it('Supabase 에러 시 500을 반환한다', async () => {
    mockFrom.mockReturnValue(createQueryBuilder({ data: null, error: new Error('DB error') }));

    const req = new NextRequest('http://localhost:3000/api/checkins');
    const res = await GET(req);

    expect(res.status).toBe(500);
  });
});

describe('POST /api/checkins', () => {
  beforeEach(() => jest.clearAllMocks());

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
});
