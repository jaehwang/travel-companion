import { buildTripMetaMap } from '../trip';

describe('buildTripMetaMap', () => {
  it('체크인이 없으면 빈 객체를 반환한다', () => {
    expect(buildTripMetaMap([])).toEqual({});
  });

  it('첫 번째 체크인 날짜와 사진 후보 중 하나를 반환한다', () => {
    const checkins = [
      { trip_id: 'trip-1', checked_in_at: '2026-04-01T10:00:00Z', photo_url: 'https://cdn/a.jpg' },
      { trip_id: 'trip-1', checked_in_at: '2026-04-02T10:00:00Z', photo_url: 'https://cdn/b.jpg' },
    ];
    const result = buildTripMetaMap(checkins);
    expect(result['trip-1'].first_checkin_date).toBe('2026-04-01T10:00:00Z');
    expect(['https://cdn/a.jpg', 'https://cdn/b.jpg']).toContain(result['trip-1'].cover_photo_url);
  });

  it('사진 없는 체크인만 있으면 cover_photo_url은 null', () => {
    const checkins = [
      { trip_id: 'trip-2', checked_in_at: '2026-04-01T10:00:00Z', photo_url: null },
    ];
    const result = buildTripMetaMap(checkins);
    expect(result['trip-2'].cover_photo_url).toBeNull();
    expect(result['trip-2'].first_checkin_date).toBe('2026-04-01T10:00:00Z');
  });

  it('여러 여행을 동시에 처리한다', () => {
    const checkins = [
      { trip_id: 'trip-1', checked_in_at: '2026-04-01T10:00:00Z', photo_url: 'https://cdn/a.jpg' },
      { trip_id: 'trip-2', checked_in_at: '2026-05-01T10:00:00Z', photo_url: null },
    ];
    const result = buildTripMetaMap(checkins);
    expect(Object.keys(result)).toHaveLength(2);
    expect(result['trip-1'].cover_photo_url).toBe('https://cdn/a.jpg');
    expect(result['trip-2'].cover_photo_url).toBeNull();
  });

  it('cover_photo_url은 사진이 있는 체크인 중 랜덤하게 선택한다', () => {
    const checkins = [
      { trip_id: 'trip-1', checked_in_at: '2026-04-01T10:00:00Z', photo_url: 'first.jpg' },
      { trip_id: 'trip-1', checked_in_at: '2026-04-02T10:00:00Z', photo_url: 'second.jpg' },
    ];

    const spy = jest.spyOn(Math, 'random').mockReturnValue(0);
    expect(buildTripMetaMap(checkins)['trip-1'].cover_photo_url).toBe('first.jpg');

    spy.mockReturnValue(0.99);
    expect(buildTripMetaMap(checkins)['trip-1'].cover_photo_url).toBe('second.jpg');

    spy.mockRestore();
  });

  it('첫 번째 체크인에 사진 없고 두 번째에 있으면 두 번째 사진을 cover로 사용', () => {
    const checkins = [
      { trip_id: 'trip-1', checked_in_at: '2026-04-01T10:00:00Z', photo_url: null },
      { trip_id: 'trip-1', checked_in_at: '2026-04-02T10:00:00Z', photo_url: 'https://cdn/b.jpg' },
    ];
    const result = buildTripMetaMap(checkins);
    expect(result['trip-1'].cover_photo_url).toBe('https://cdn/b.jpg');
    expect(result['trip-1'].first_checkin_date).toBe('2026-04-01T10:00:00Z');
  });
});
