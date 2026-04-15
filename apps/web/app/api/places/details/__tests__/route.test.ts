/**
 * @jest-environment node
 */
import { GET } from '../route';
import { NextRequest } from 'next/server';

// ─── Helpers ───

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost:3000/api/places/details');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString());
}

const mockGooglePlace = {
  name: '경복궁',
  formatted_address: '서울특별시 종로구 사직로 161',
  geometry: { location: { lat: 37.5796, lng: 126.977 } },
  rating: 4.5,
  types: ['tourist_attraction', 'point_of_interest'],
};

// ─── Tests ───

describe('GET /api/places/details', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'test-api-key' };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('place_id가 없으면 400을 반환한다', async () => {
    const res = await GET(makeRequest());

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('place_id is required');
  });

  it('API 키가 없으면 500을 반환한다', async () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const res = await GET(makeRequest({ place_id: 'place-1' }));

    expect(res.status).toBe(500);
  });

  it('정상 응답 시 장소 정보를 반환한다', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ status: 'OK', result: mockGooglePlace }),
    } as any);

    const res = await GET(makeRequest({ place_id: 'place-1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.place).toEqual({
      name: '경복궁',
      place_id: 'place-1',
      latitude: 37.5796,
      longitude: 126.977,
    });
  });

  it('클라이언트 필수 필드가 응답에 포함된다', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ status: 'OK', result: mockGooglePlace }),
    } as any);

    const res = await GET(makeRequest({ place_id: 'place-1' }));
    const body = await res.json();
    const place = body.place;

    // place_id: 지도 링크 생성 분기 로직에 사용 (없으면 좌표 링크로 폴백)
    expect(typeof place.place_id).toBe('string');
    expect(place.place_id.length).toBeGreaterThan(0);
    // name: 장소명 표시 및 폴백 체인에 사용
    expect(typeof place.name).toBe('string');
    // latitude, longitude: 지도 이동 및 좌표 링크 생성에 사용
    expect(typeof place.latitude).toBe('number');
    expect(typeof place.longitude).toBe('number');
  });

  it('geometry.location.lat/lng을 latitude/longitude로 변환한다', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ status: 'OK', result: mockGooglePlace }),
    } as any);

    const res = await GET(makeRequest({ place_id: 'place-1' }));
    const body = await res.json();

    expect(body.place.latitude).toBe(37.5796);
    expect(body.place.longitude).toBe(126.977);
    // Google API의 lat/lng 키가 외부에 노출되지 않는다
    expect(body.place.lat).toBeUndefined();
    expect(body.place.lng).toBeUndefined();
  });

  it('Google API가 NOT_FOUND를 반환하면 404를 반환한다', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ status: 'NOT_FOUND' }),
    } as any);

    const res = await GET(makeRequest({ place_id: 'invalid-id' }));

    expect(res.status).toBe(404);
  });

  it('네트워크 오류 시 500을 반환한다', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

    const res = await GET(makeRequest({ place_id: 'place-1' }));

    expect(res.status).toBe(500);
  });

  it('place_id를 Google API 요청 URL에 포함한다', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ status: 'OK', result: mockGooglePlace }),
    } as any);

    await GET(makeRequest({ place_id: 'ChIJN1t_tDeuEmsRUsoyG83frY4' }));

    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain('place_id=ChIJN1t_tDeuEmsRUsoyG83frY4');
  });
});
