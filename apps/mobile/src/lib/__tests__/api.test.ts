import { createCheckin, fetchTrips } from '../api';

// supabase 모듈 mock
const mockFrom = jest.fn();
const mockGetUser = jest.fn();
const mockGetSession = jest.fn();

jest.mock('../supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    auth: {
      getUser: () => mockGetUser(),
      getSession: () => mockGetSession(),
    },
  },
}));

function makeBuilder(resolved: { data: unknown; error: unknown }) {
  const b: Record<string, unknown> = {};
  b.select = jest.fn(() => b);
  b.insert = jest.fn(() => b);
  b.update = jest.fn(() => b);
  b.delete = jest.fn(() => b);
  b.eq = jest.fn(() => b);
  b.in = jest.fn(() => b);
  b.order = jest.fn(() => b);
  b.single = jest.fn().mockResolvedValue(resolved);
  b.then = (resolve: (v: unknown) => unknown, reject: (v: unknown) => unknown) =>
    Promise.resolve(resolved).then(resolve, reject);
  return b;
}

const authedUser = { id: 'user-1' };

// ------------------------------------------------------------------
describe('fetchTrips', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: authedUser } });
  });

  it('is_default=false 필터를 적용한다', async () => {
    const tripsBuilder = makeBuilder({ data: [], error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'trips') return tripsBuilder;
      return makeBuilder({ data: [], error: null });
    });

    await fetchTrips();

    expect(tripsBuilder.eq).toHaveBeenCalledWith('is_default', false);
  });
});

// ------------------------------------------------------------------
describe('createCheckin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: authedUser } });
  });

  it('trip_id가 있으면 그대로 사용한다', async () => {
    const newCheckin = { id: 'c-1', trip_id: 'trip-123', latitude: 37.5, longitude: 126.9 };
    const checkinsBuilder = makeBuilder({ data: newCheckin, error: null });
    mockFrom.mockReturnValue(checkinsBuilder);

    const result = await createCheckin({ trip_id: 'trip-123', latitude: 37.5, longitude: 126.9 });

    expect(result.trip_id).toBe('trip-123');
    // trips 테이블 조회 없이 바로 insert
    expect(mockFrom).toHaveBeenCalledWith('checkins');
    expect(mockFrom).not.toHaveBeenCalledWith('trips');
  });

  it('trip_id가 없으면 default trip을 조회/생성해 할당한다', async () => {
    const defaultTrip = { id: 'default-trip-id', is_default: true };
    const newCheckin = { id: 'c-2', trip_id: 'default-trip-id', latitude: 37.5, longitude: 126.9 };

    mockFrom.mockImplementation((table: string) => {
      if (table === 'trips') return makeBuilder({ data: defaultTrip, error: null });
      return makeBuilder({ data: newCheckin, error: null });
    });

    const result = await createCheckin({ latitude: 37.5, longitude: 126.9 } as never);

    expect(result.trip_id).toBe('default-trip-id');
    expect(mockFrom).toHaveBeenCalledWith('trips');
    expect(mockFrom).toHaveBeenCalledWith('checkins');
  });

  it('trip_id 없고 default trip도 없으면 새로 생성한다', async () => {
    const newTrip = { id: 'new-default-id', is_default: true };
    const newCheckin = { id: 'c-3', trip_id: 'new-default-id', latitude: 37.5, longitude: 126.9 };

    // trips 첫 호출(select) → no rows, 두 번째 호출(insert) → 성공
    const selectBuilder = makeBuilder({ data: null, error: { code: 'PGRST116' } });
    const insertTripBuilder = makeBuilder({ data: newTrip, error: null });
    const checkinsBuilder = makeBuilder({ data: newCheckin, error: null });

    let tripsCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'trips') {
        tripsCallCount += 1;
        return tripsCallCount === 1 ? selectBuilder : insertTripBuilder;
      }
      return checkinsBuilder;
    });

    const result = await createCheckin({ latitude: 37.5, longitude: 126.9 } as never);

    expect(result.trip_id).toBe('new-default-id');
  });
});
