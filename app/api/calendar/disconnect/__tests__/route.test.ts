/**
 * @jest-environment node
 */
import { POST } from '../route';

const mockGetSession = jest.fn();
const mockProfileSingle = jest.fn();
const mockUpdate = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: { getSession: (...args: any[]) => mockGetSession(...args) },
    from: jest.fn().mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: (...args: any[]) => mockProfileSingle(...args),
          update: (...args: any[]) => {
            mockUpdate(...args);
            return { eq: jest.fn().mockResolvedValue({ error: null }) };
          },
        };
      }
      return {};
    }),
  }),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('POST /api/calendar/disconnect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProfileSingle.mockResolvedValue({
      data: { google_refresh_token: 'existing-refresh-token' },
      error: null,
    });
    mockFetch.mockResolvedValue({ ok: true });
  });

  it('세션이 없으면 401 Unauthorized를 반환한다', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const res = await POST();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('연동 해제 시 Google revoke API를 호출한다', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-id' } } },
    });

    await POST();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://oauth2.googleapis.com/revoke?token=existing-refresh-token',
      { method: 'POST' }
    );
  });

  it('DB update에서 google_refresh_token=null, calendar_sync_enabled=false를 설정한다', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-id' } } },
    });

    await POST();

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        google_refresh_token: null,
        settings: { calendar_sync_enabled: false },
      })
    );
  });

  it('성공 시 { success: true }를 반환한다', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-id' } } },
    });

    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true });
  });

  it('revoke API가 실패해도 DB update는 수행되고 성공을 반환한다', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-id' } } },
    });
    mockFetch.mockRejectedValueOnce(new Error('network error'));

    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ google_refresh_token: null })
    );
  });

  it('google_refresh_token이 없으면 revoke API를 호출하지 않는다', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-id' } } },
    });
    mockProfileSingle.mockResolvedValue({
      data: { google_refresh_token: null },
      error: null,
    });

    await POST();

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
