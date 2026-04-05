/**
 * @jest-environment node
 */
import { GET, PATCH } from '../route';
import { NextRequest } from 'next/server';

function createQueryBuilder(resolvedValue: { data: any; error: any }) {
  const builder: any = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    update: jest.fn(() => builder),
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

describe('GET /api/settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockReturnValue(authedUser);
  });

  describe('Positive', () => {
    it('사용자 설정을 반환한다', async () => {
      const settings = { theme: 'dark', language: 'ko' };
      mockFrom.mockReturnValue(createQueryBuilder({ data: { settings }, error: null }));

      const req = new NextRequest('http://localhost:3000/api/settings');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.settings).toEqual(settings);
    });
  });

  describe('Negative', () => {
    it('비인증 요청 시 401을 반환한다', async () => {
      mockGetUser.mockReturnValue(null);

      const req = new NextRequest('http://localhost:3000/api/settings');
      const res = await GET(req);

      expect(res.status).toBe(401);
    });

    it('Supabase 오류 시 500을 반환한다', async () => {
      mockFrom.mockReturnValue(createQueryBuilder({ data: null, error: new Error('DB error') }));

      const req = new NextRequest('http://localhost:3000/api/settings');
      const res = await GET(req);

      expect(res.status).toBe(500);
    });
  });

  describe('Boundary', () => {
    it('settings가 없는 초기 상태이면 빈 객체를 반환한다', async () => {
      mockFrom.mockReturnValue(createQueryBuilder({ data: { settings: null }, error: null }));

      const req = new NextRequest('http://localhost:3000/api/settings');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.settings).toEqual({});
    });

    it('profile이 null이면 빈 객체를 반환한다', async () => {
      mockFrom.mockReturnValue(createQueryBuilder({ data: null, error: null }));

      const req = new NextRequest('http://localhost:3000/api/settings');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.settings).toEqual({});
    });
  });
});

describe('PATCH /api/settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockReturnValue(authedUser);
  });

  describe('Positive', () => {
    it('기존 설정에 새 값을 병합해 반환한다', async () => {
      const existing = { theme: 'dark', notifications: true };
      const patch = { language: 'ko' };
      const updateBuilder = createQueryBuilder({ data: null, error: null });

      mockFrom.mockImplementation(() => {
        const b = createQueryBuilder({ data: { settings: existing }, error: null });
        b.update = jest.fn(() => updateBuilder);
        return b;
      });

      const req = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.settings).toEqual({ ...existing, ...patch });
    });

    it('기존 값을 덮어쓸 수 있다', async () => {
      const existing = { theme: 'dark' };
      const patch = { theme: 'light' };
      const updateBuilder = createQueryBuilder({ data: null, error: null });

      mockFrom.mockImplementation(() => {
        const b = createQueryBuilder({ data: { settings: existing }, error: null });
        b.update = jest.fn(() => updateBuilder);
        return b;
      });

      const req = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.settings.theme).toBe('light');
    });
  });

  describe('Negative', () => {
    it('비인증 요청 시 401을 반환한다', async () => {
      mockGetUser.mockReturnValue(null);

      const req = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PATCH',
        body: JSON.stringify({ theme: 'dark' }),
      });
      const res = await PATCH(req);

      expect(res.status).toBe(401);
    });

    it('잘못된 JSON 시 400을 반환한다', async () => {
      const req = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PATCH',
        body: 'not-json',
      });
      const res = await PATCH(req);

      expect(res.status).toBe(400);
    });

    it('update 오류 시 500을 반환한다', async () => {
      const updateBuilder = createQueryBuilder({ data: null, error: new Error('DB error') });
      mockFrom.mockImplementation(() => {
        const b = createQueryBuilder({ data: { settings: {} }, error: null });
        b.update = jest.fn(() => updateBuilder);
        return b;
      });

      const req = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PATCH',
        body: JSON.stringify({ theme: 'dark' }),
      });
      const res = await PATCH(req);

      expect(res.status).toBe(500);
    });
  });

  describe('Boundary', () => {
    it('settings가 없는 초기 상태에서 PATCH 하면 새 값만 반환한다', async () => {
      const patch = { theme: 'dark' };
      const updateBuilder = createQueryBuilder({ data: null, error: null });

      mockFrom.mockImplementation(() => {
        const b = createQueryBuilder({ data: null, error: null });
        b.update = jest.fn(() => updateBuilder);
        return b;
      });

      const req = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.settings).toEqual(patch);
    });
  });
});
