/**
 * @jest-environment node
 */
import { POST } from '../route';

const mockGetUser = jest.fn();
const mockProfileSingle = jest.fn();
const mockUpdate = jest.fn();

const mockSupabase = {
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
};

jest.mock('@/lib/supabase/server', () => ({
  getAuthenticatedClient: jest.fn().mockImplementation(async () => ({
    supabase: mockSupabase,
    user: mockGetUser(),
  })),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

function makeRequest() {
  return new Request('http://localhost:3000/api/calendar/disconnect', { method: 'POST' });
}

describe('POST /api/calendar/disconnect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockReturnValue({ id: 'user-id' });
    mockProfileSingle.mockResolvedValue({
      data: { google_refresh_token: 'existing-refresh-token' },
      error: null,
    });
    mockFetch.mockResolvedValue({ ok: true });
  });

  it('세션이 없으면 401 Unauthorized를 반환한다', async () => {
    mockGetUser.mockReturnValue(null);

    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('연동 해제 시 Google revoke API를 호출한다', async () => {
    await POST(makeRequest());

    expect(mockFetch).toHaveBeenCalledWith(
      'https://oauth2.googleapis.com/revoke?token=existing-refresh-token',
      { method: 'POST' }
    );
  });

  it('DB update에서 google_refresh_token=null, calendar_sync_enabled=false를 설정한다', async () => {
    await POST(makeRequest());

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        google_refresh_token: null,
        settings: { calendar_sync_enabled: false },
      })
    );
  });

  it('성공 시 { success: true }를 반환한다', async () => {
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true });
  });

  it('revoke API가 실패해도 DB update는 수행되고 성공을 반환한다', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network error'));

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ google_refresh_token: null })
    );
  });

  it('google_refresh_token이 없으면 revoke API를 호출하지 않는다', async () => {
    mockProfileSingle.mockResolvedValue({
      data: { google_refresh_token: null },
      error: null,
    });

    await POST(makeRequest());

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
