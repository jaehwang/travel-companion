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
  createApiClient: jest.fn().mockResolvedValue({
    auth: { getUser: (...args: any[]) => mockGetUser(...args) },
    from: (...args: any[]) => mockFrom(...args),
  }),
}));

const authedUser = { data: { user: { id: 'user-1' } }, error: null };
const params = Promise.resolve({ id: 'checkin-123' });

describe('PATCH /api/checkins/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue(authedUser);
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

  it('비인증 요청 시 401을 반환한다', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

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
    mockGetUser.mockResolvedValue(authedUser);
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
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const req = new NextRequest('http://localhost:3000/api/checkins/checkin-123', {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params });

    expect(res.status).toBe(401);
  });
});
