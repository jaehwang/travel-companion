import {
  fetchTrips, createTrip, updateTrip, deleteTrip, fetchSettings,
  fetchCheckins, createCheckin, updateCheckin, deleteCheckin,
  searchPlaces, getPlaceDetails, fetchScheduleWithWeather,
} from '../lib/api';

// ── Supabase query builder helper ──────────────────────────────────────

function createBuilder(resolvedValue: { data: any; error: any }) {
  const b: any = {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(resolvedValue),
  };
  b.then = (resolve: any, reject: any) =>
    Promise.resolve(resolvedValue).then(resolve, reject);
  return b;
}

// ── Mocks ──────────────────────────────────────────────────────────────

const mockFrom = jest.fn();

jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
      }),
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      }),
    },
    get from() { return mockFrom; },
  },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

// ── Fixtures ───────────────────────────────────────────────────────────

const mockTrip = {
  id: 'trip-1',
  title: '제주도 여행',
  is_public: false,
  created_at: '2024-03-01T00:00:00Z',
  updated_at: '2024-03-01T00:00:00Z',
};

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

beforeEach(() => {
  mockFrom.mockReset();
  mockFetch.mockReset();
});

// ── fetchTrips ─────────────────────────────────────────────────────────

describe('fetchTrips', () => {
  it('trips 배열을 반환한다', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'trips') return createBuilder({ data: [mockTrip], error: null });
      if (table === 'checkins') return createBuilder({ data: [], error: null });
      return createBuilder({ data: null, error: null });
    });

    const result = await fetchTrips();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('trip-1');
  });

  it('체크인이 있으면 cover_photo_url을 설정한다', async () => {
    const checkin = { trip_id: 'trip-1', checked_in_at: '2024-03-01T10:00:00Z', photo_url: 'https://example.com/photo.jpg' };
    mockFrom.mockImplementation((table: string) => {
      if (table === 'trips') return createBuilder({ data: [mockTrip], error: null });
      if (table === 'checkins') return createBuilder({ data: [checkin], error: null });
      return createBuilder({ data: null, error: null });
    });

    const result = await fetchTrips();

    expect(result[0].cover_photo_url).toBe('https://example.com/photo.jpg');
  });

  it('trips 쿼리 에러 시 예외를 던진다', async () => {
    mockFrom.mockImplementation(() =>
      createBuilder({ data: null, error: new Error('DB error') })
    );

    await expect(fetchTrips()).rejects.toThrow('DB error');
  });
});

// ── createTrip ─────────────────────────────────────────────────────────

describe('createTrip', () => {
  it('생성된 trip 객체를 반환한다', async () => {
    mockFrom.mockImplementation(() =>
      createBuilder({ data: mockTrip, error: null })
    );

    const result = await createTrip({ title: '제주도 여행', is_public: false });

    expect(result).toEqual(mockTrip);
  });

  it('에러 발생 시 예외를 던진다', async () => {
    mockFrom.mockImplementation(() =>
      createBuilder({ data: null, error: new Error('Insert error') })
    );

    await expect(createTrip({ title: '제주도 여행', is_public: false })).rejects.toThrow('Insert error');
  });
});

// ── updateTrip ─────────────────────────────────────────────────────────

describe('updateTrip', () => {
  it('수정된 trip 객체를 반환한다', async () => {
    const updated = { ...mockTrip, title: '수정된 제주도 여행' };
    mockFrom.mockImplementation(() =>
      createBuilder({ data: updated, error: null })
    );

    const result = await updateTrip('trip-1', { title: '수정된 제주도 여행' });

    expect(result).toEqual(updated);
  });
});

// ── deleteTrip ─────────────────────────────────────────────────────────

describe('deleteTrip', () => {
  it('에러 없이 완료된다', async () => {
    mockFrom.mockImplementation(() =>
      createBuilder({ data: null, error: null })
    );

    await expect(deleteTrip('trip-1')).resolves.toBeUndefined();
  });

  it('에러 발생 시 예외를 던진다', async () => {
    mockFrom.mockImplementation(() =>
      createBuilder({ data: null, error: new Error('Delete error') })
    );

    await expect(deleteTrip('trip-1')).rejects.toThrow('Delete error');
  });
});

// ── fetchSettings ──────────────────────────────────────────────────────

describe('fetchSettings', () => {
  it('settings 객체를 반환한다', async () => {
    const mockSettings = { calendar_sync_enabled: true };
    mockFrom.mockImplementation(() =>
      createBuilder({ data: { settings: mockSettings }, error: null })
    );

    const result = await fetchSettings();

    expect(result).toEqual(mockSettings);
  });

  it('profile이 없으면 빈 객체를 반환한다', async () => {
    mockFrom.mockImplementation(() =>
      createBuilder({ data: null, error: null })
    );

    const result = await fetchSettings();

    expect(result).toEqual({});
  });
});

// ── fetchCheckins ──────────────────────────────────────────────────────

describe('fetchCheckins', () => {
  it('checkins 배열을 반환한다', async () => {
    mockFrom.mockImplementation(() =>
      createBuilder({ data: [mockCheckin], error: null })
    );

    const result = await fetchCheckins('trip-1');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('checkin-1');
  });
});

// ── createCheckin ──────────────────────────────────────────────────────

describe('createCheckin', () => {
  it('생성된 checkin 객체를 반환한다', async () => {
    mockFrom.mockImplementation(() =>
      createBuilder({ data: mockCheckin, error: null })
    );

    const result = await createCheckin({ trip_id: 'trip-1', title: '멋진 카페', latitude: 37.5665, longitude: 126.9780 });

    expect(result).toEqual(mockCheckin);
  });
});

// ── updateCheckin ──────────────────────────────────────────────────────

describe('updateCheckin', () => {
  it('수정된 checkin 객체를 반환한다', async () => {
    const updated = { ...mockCheckin, title: '수정된 카페' };
    mockFrom.mockImplementation(() =>
      createBuilder({ data: updated, error: null })
    );

    const result = await updateCheckin('checkin-1', { title: '수정된 카페' });

    expect(result).toEqual(updated);
  });
});

// ── deleteCheckin ──────────────────────────────────────────────────────

describe('deleteCheckin', () => {
  it('에러 없이 완료된다', async () => {
    mockFrom.mockImplementation(() =>
      createBuilder({ data: null, error: null })
    );

    await expect(deleteCheckin('checkin-1')).resolves.toBeUndefined();
  });
});

// ── searchPlaces (Vercel API via fetch) ────────────────────────────────

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

// ── getPlaceDetails (Vercel API via fetch) ─────────────────────────────

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

// ── fetchScheduleWithWeather (Vercel API via fetch) ────────────────────

describe('fetchScheduleWithWeather', () => {
  const mockItem = {
    id: 'ev-1',
    summary: '묵호 여행',
    location: '동해비치호텔',
    start: { date: '2026-04-10' },
    end: { date: '2026-04-12' },
    weather: {
      date: '2026-04-10',
      tempMax: 18,
      tempMin: 11,
      precipitation: 0,
      weatherCode: 3,
      windspeedMax: 17,
      description: '흐림',
      emoji: '☁️',
    },
  };

  it('/api/calendar/schedule를 호출하고 items와 advice를 반환한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [mockItem],
        advice: '묵호 첫날은 흐리지만 비는 없어요.',
      }),
    });

    const result = await fetchScheduleWithWeather();

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/calendar/schedule');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].weather?.description).toBe('흐림');
    expect(result.advice).toBe('묵호 첫날은 흐리지만 비는 없어요.');
  });

  it('items가 없으면 빈 배열을 반환한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const result = await fetchScheduleWithWeather();

    expect(result.items).toEqual([]);
    expect(result.advice).toBeNull();
  });

  it('API 오류 시 예외를 던진다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: 'TOKEN_EXPIRED' }),
    });

    await expect(fetchScheduleWithWeather()).rejects.toThrow('TOKEN_EXPIRED');
  });
});
