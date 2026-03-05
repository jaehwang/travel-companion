/**
 * @jest-environment node
 */
import { fetchTrips } from '../lib/fetchTrips';

function createQueryBuilder(resolvedValue: { data: any; error: any }) {
  const builder: any = {
    select: jest.fn(() => builder),
    order: jest.fn(() => builder),
    in: jest.fn(() => builder),
    then: (resolve: any, reject: any) =>
      Promise.resolve(resolvedValue).then(resolve, reject),
  };
  return builder;
}

describe('fetchTrips', () => {
  it('빈 trips를 반환한다 (에러 발생 시)', async () => {
    const mockSupabase: any = {
      from: jest.fn().mockReturnValue(
        createQueryBuilder({ data: null, error: { message: 'DB error' } })
      ),
    };

    const result = await fetchTrips(mockSupabase);
    expect(result).toEqual([]);
  });

  it('trips를 first_checkin_date와 함께 반환한다', async () => {
    const trips = [
      { id: 'trip-1', title: '도쿄 여행' },
      { id: 'trip-2', title: '파리 여행' },
    ];
    const checkins = [
      { trip_id: 'trip-1', checked_in_at: '2024-01-02T10:00:00Z', photo_url: null },
      { trip_id: 'trip-1', checked_in_at: '2024-01-03T10:00:00Z', photo_url: null },
    ];

    const mockFrom = jest.fn().mockImplementation((table: string) => {
      if (table === 'trips') return createQueryBuilder({ data: trips, error: null });
      if (table === 'checkins') return createQueryBuilder({ data: checkins, error: null });
      return createQueryBuilder({ data: null, error: null });
    });

    const mockSupabase: any = { from: mockFrom };
    const result = await fetchTrips(mockSupabase);

    expect(result).toHaveLength(2);
    expect(result[0].first_checkin_date).toBe('2024-01-02T10:00:00Z');
    expect(result[1].first_checkin_date).toBeNull();
  });

  it('체크인이 없으면 cover_photo_url은 null이다', async () => {
    const trips = [{ id: 'trip-1', title: '도쿄 여행' }];

    const mockFrom = jest.fn().mockImplementation((table: string) => {
      if (table === 'trips') return createQueryBuilder({ data: trips, error: null });
      if (table === 'checkins') return createQueryBuilder({ data: [], error: null });
      return createQueryBuilder({ data: null, error: null });
    });

    const mockSupabase: any = { from: mockFrom };
    const result = await fetchTrips(mockSupabase);

    expect(result[0].cover_photo_url).toBeNull();
  });

  it('photo_url이 있는 체크인이 있으면 cover_photo_url을 설정한다', async () => {
    const trips = [{ id: 'trip-1', title: '도쿄 여행' }];
    const checkins = [
      { trip_id: 'trip-1', checked_in_at: '2024-01-01T10:00:00Z', photo_url: 'https://example.com/photo.jpg' },
    ];

    const mockFrom = jest.fn().mockImplementation((table: string) => {
      if (table === 'trips') return createQueryBuilder({ data: trips, error: null });
      if (table === 'checkins') return createQueryBuilder({ data: checkins, error: null });
      return createQueryBuilder({ data: null, error: null });
    });

    const mockSupabase: any = { from: mockFrom };
    const result = await fetchTrips(mockSupabase);

    expect(result[0].cover_photo_url).toBe('https://example.com/photo.jpg');
  });

  it('trips가 없으면 checkins 쿼리를 하지 않는다', async () => {
    const mockFrom = jest.fn().mockImplementation((table: string) => {
      if (table === 'trips') return createQueryBuilder({ data: [], error: null });
      return createQueryBuilder({ data: null, error: null });
    });

    const mockSupabase: any = { from: mockFrom };
    const result = await fetchTrips(mockSupabase);

    expect(result).toEqual([]);
    // checkins 쿼리 호출 안 됨
    expect(mockFrom).toHaveBeenCalledTimes(1);
    expect(mockFrom).toHaveBeenCalledWith('trips');
  });
});
