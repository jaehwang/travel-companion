/**
 * @jest-environment node
 */
import { GET } from '../route';
import { NextRequest } from 'next/server';

// ─── Helpers ───

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost:3000/api/places/autocomplete');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString());
}

const mockPredictions = [
  {
    place_id: 'place-1',
    description: '경복궁',
    structured_formatting: { main_text: '경복궁', secondary_text: '서울' },
  },
];

// ─── Tests ───

describe('GET /api/places/autocomplete', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'test-api-key' };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('input이 없으면 빈 predictions를 반환한다', async () => {
    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.predictions).toEqual([]);
  });

  it('input이 공백만이면 빈 predictions를 반환한다', async () => {
    const res = await GET(makeRequest({ input: '   ' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.predictions).toEqual([]);
  });

  it('API 키가 없으면 500을 반환한다', async () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const res = await GET(makeRequest({ input: '경복궁' }));

    expect(res.status).toBe(500);
  });

  it('정상 검색 시 predictions를 반환한다', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ status: 'OK', predictions: mockPredictions }),
    } as any);

    const res = await GET(makeRequest({ input: '경복궁' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.predictions).toEqual(mockPredictions);
  });

  it('ZERO_RESULTS 상태는 빈 predictions를 반환한다', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ status: 'ZERO_RESULTS', predictions: [] }),
    } as any);

    const res = await GET(makeRequest({ input: '없는장소xyz' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.predictions).toEqual([]);
  });

  it('Google API가 에러 상태를 반환하면 500을 반환한다', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ status: 'REQUEST_DENIED' }),
    } as any);

    const res = await GET(makeRequest({ input: '경복궁' }));

    expect(res.status).toBe(500);
  });

  it('lat/lng 파라미터가 있으면 location과 radius를 Google API에 전달한다', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ status: 'OK', predictions: mockPredictions }),
    } as any);

    await GET(makeRequest({ input: '경복궁', lat: '37.5', lng: '127.0' }));

    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain('location=37.5%2C127');
    expect(calledUrl).toContain('radius=50000');
  });

  it('네트워크 오류 시 500을 반환한다', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

    const res = await GET(makeRequest({ input: '경복궁' }));

    expect(res.status).toBe(500);
  });
});
