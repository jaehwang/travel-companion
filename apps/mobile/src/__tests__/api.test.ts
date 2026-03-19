import { fetchTrips, createTrip, updateTrip, deleteTrip, fetchSettings } from '../lib/api';

jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
      }),
    },
  },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockTrip = {
  id: 'trip-1',
  title: '제주도 여행',
  is_public: false,
  created_at: '2024-03-01T00:00:00Z',
  updated_at: '2024-03-01T00:00:00Z',
};

beforeEach(() => {
  mockFetch.mockReset();
});

describe('fetchTrips', () => {
  it('/api/trips를 인증 헤더와 함께 호출한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ trips: [mockTrip] }),
    });

    await fetchTrips();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/trips');
    expect(options.headers['Authorization']).toBe('Bearer test-token');
  });

  it('trips 배열을 반환한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ trips: [mockTrip] }),
    });

    const result = await fetchTrips();

    expect(result).toEqual([mockTrip]);
  });

  it('API 에러 응답 시 예외를 던진다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: 'Unauthorized' }),
    });

    await expect(fetchTrips()).rejects.toThrow('Unauthorized');
  });
});

describe('createTrip', () => {
  it('여행 데이터를 POST로 전송한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ trip: mockTrip }),
    });

    const tripData = { title: '제주도 여행', is_public: false };
    await createTrip(tripData);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/trips');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual(tripData);
  });

  it('생성된 trip 객체를 반환한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ trip: mockTrip }),
    });

    const result = await createTrip({ title: '제주도 여행', is_public: false });

    expect(result).toEqual(mockTrip);
  });
});

describe('updateTrip', () => {
  it('특정 trip에 PATCH 요청을 보낸다', async () => {
    const updatedTrip = { ...mockTrip, title: '수정된 제주도 여행' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ trip: updatedTrip }),
    });

    const result = await updateTrip('trip-1', { title: '수정된 제주도 여행' });

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/trips/trip-1');
    expect(options.method).toBe('PATCH');
    expect(result).toEqual(updatedTrip);
  });
});

describe('deleteTrip', () => {
  it('특정 trip에 DELETE 요청을 보낸다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await deleteTrip('trip-1');

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/trips/trip-1');
    expect(options.method).toBe('DELETE');
  });
});

describe('fetchSettings', () => {
  it('settings 객체를 반환한다', async () => {
    const mockSettings = { calendar_sync_enabled: true };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ settings: mockSettings }),
    });

    const result = await fetchSettings();

    expect(result).toEqual(mockSettings);
  });

  it('/api/settings 엔드포인트를 호출한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ settings: {} }),
    });

    await fetchSettings();

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/settings');
  });
});
