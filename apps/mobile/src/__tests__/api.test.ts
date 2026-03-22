import {
  fetchTrips, createTrip, updateTrip, deleteTrip, fetchSettings,
  fetchCheckins, createCheckin, updateCheckin, deleteCheckin,
  searchPlaces, getPlaceDetails,
} from '../lib/api';

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

const mockCheckin = {
  id: 'checkin-1',
  trip_id: 'trip-1',
  title: '멋진 카페',
  latitude: 37.5665,
  longitude: 126.9780,
  checked_in_at: '2024-03-01T10:00:00Z',
  created_at: '2024-03-01T10:00:00Z',
  updated_at: '2024-03-01T10:00:00Z',
};

describe('fetchCheckins', () => {
  it('trip_id 쿼리 파라미터와 함께 /api/checkins를 호출한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ checkins: [mockCheckin] }),
    });

    await fetchCheckins('trip-1');

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/checkins?trip_id=trip-1');
    expect(options.headers['Authorization']).toBe('Bearer test-token');
  });

  it('checkins 배열을 반환한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ checkins: [mockCheckin] }),
    });

    const result = await fetchCheckins('trip-1');

    expect(result).toEqual([mockCheckin]);
  });
});

describe('createCheckin', () => {
  it('체크인 데이터를 POST로 전송한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ checkin: mockCheckin }),
    });

    const data = { trip_id: 'trip-1', title: '멋진 카페', latitude: 37.5665, longitude: 126.9780 };
    await createCheckin(data);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/checkins');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual(data);
  });

  it('생성된 checkin 객체를 반환한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ checkin: mockCheckin }),
    });

    const result = await createCheckin({ trip_id: 'trip-1', title: '멋진 카페', latitude: 37.5665, longitude: 126.9780 });

    expect(result).toEqual(mockCheckin);
  });
});

describe('updateCheckin', () => {
  it('특정 checkin에 PATCH 요청을 보낸다', async () => {
    const updated = { ...mockCheckin, title: '수정된 카페' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ checkin: updated }),
    });

    const result = await updateCheckin('checkin-1', { title: '수정된 카페' });

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/checkins/checkin-1');
    expect(options.method).toBe('PATCH');
    expect(result).toEqual(updated);
  });
});

describe('deleteCheckin', () => {
  it('특정 checkin에 DELETE 요청을 보낸다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await deleteCheckin('checkin-1');

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/checkins/checkin-1');
    expect(options.method).toBe('DELETE');
  });
});

describe('searchPlaces', () => {
  it('/api/places/autocomplete에 검색어를 전달한다', async () => {
    const mockPredictions = [{
      place_id: 'place-1',
      description: '스타벅스 강남점',
      structured_formatting: { main_text: '스타벅스 강남점', secondary_text: '서울' },
    }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ predictions: mockPredictions }),
    });

    const result = await searchPlaces('스타벅스');

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/places/autocomplete');
    expect(url).toContain('input=%EC%8A%A4%ED%83%80%EB%B2%85%EC%8A%A4');
    expect(result).toEqual(mockPredictions);
  });

  it('위치 정보를 제공하면 lat/lng 파라미터가 추가된다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ predictions: [] }),
    });

    await searchPlaces('카페', 37.5665, 126.9780);

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('lat=37.5665');
    expect(url).toContain('lng=126.978');
  });
});

describe('getPlaceDetails', () => {
  it('/api/places/details에 place_id를 전달하고 장소 정보를 반환한다', async () => {
    const mockPlace = { name: '스타벅스 강남점', place_id: 'place-1', latitude: 37.5, longitude: 127.0 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ place: mockPlace }),
    });

    const result = await getPlaceDetails('place-1');

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/places/details?place_id=place-1');
    expect(result).toEqual(mockPlace);
  });
});
