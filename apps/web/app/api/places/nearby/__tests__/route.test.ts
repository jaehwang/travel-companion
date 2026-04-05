/**
 * @jest-environment node
 */
import { GET } from '../route';
import { NextRequest } from 'next/server';

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-api-key';
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
});

const makePlacesResponse = (status: string, results: any[] = []) => ({
  status,
  results,
});

const samplePlaces = [
  {
    place_id: 'place-1',
    name: '스타벅스 강남점',
    vicinity: '서울 강남구 테헤란로',
    types: ['cafe', 'food'],
    rating: 4.2,
  },
  {
    place_id: 'place-2',
    name: '맥도날드',
    vicinity: '서울 강남구',
    types: ['restaurant', 'food'],
    rating: 3.8,
  },
];

describe('GET /api/places/nearby', () => {
  describe('Positive', () => {
    it('좌표 제공 시 근처 장소 목록을 반환한다', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(makePlacesResponse('OK', samplePlaces)),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/places/nearby?latitude=37.5665&longitude=126.978'
      );
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toHaveProperty('places');
      expect(Array.isArray(body.places)).toBe(true);
      expect(body.places[0]).toEqual({
        id: 'place-1',
        name: '스타벅스 강남점',
        address: '서울 강남구 테헤란로',
        types: ['cafe', 'food'],
        rating: 4.2,
      });
    });

    it('결과가 5개를 초과하면 최대 5개만 반환한다', async () => {
      const manyPlaces = Array.from({ length: 10 }, (_, i) => ({
        place_id: `place-${i}`,
        name: `장소 ${i}`,
        vicinity: '주소',
        types: ['restaurant'],
        rating: 4.0,
      }));

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(makePlacesResponse('OK', manyPlaces)),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/places/nearby?latitude=37.5665&longitude=126.978'
      );
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.places).toHaveLength(5);
    });
  });

  describe('Negative', () => {
    it('latitude 누락 시 400을 반환한다', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/places/nearby?longitude=126.978'
      );
      const res = await GET(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toHaveProperty('error');
    });

    it('longitude 누락 시 400을 반환한다', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/places/nearby?latitude=37.5665'
      );
      const res = await GET(req);

      expect(res.status).toBe(400);
    });

    it('API 키 미설정 시 500을 반환한다', async () => {
      delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

      const req = new NextRequest(
        'http://localhost:3000/api/places/nearby?latitude=37.5665&longitude=126.978'
      );
      const res = await GET(req);

      expect(res.status).toBe(500);
    });

    it('Places API 오류 응답 시 500을 반환한다', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(makePlacesResponse('REQUEST_DENIED')),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/places/nearby?latitude=37.5665&longitude=126.978'
      );
      const res = await GET(req);

      expect(res.status).toBe(500);
    });

    it('fetch 예외 발생 시 500을 반환한다', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const req = new NextRequest(
        'http://localhost:3000/api/places/nearby?latitude=37.5665&longitude=126.978'
      );
      const res = await GET(req);

      expect(res.status).toBe(500);
    });
  });

  describe('Boundary', () => {
    it('ZERO_RESULTS 응답 시 빈 배열을 반환한다', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(makePlacesResponse('ZERO_RESULTS', [])),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/places/nearby?latitude=0&longitude=0'
      );
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.places).toEqual([]);
    });

    it('type 파라미터가 없으면 기본값으로 요청한다', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(makePlacesResponse('OK', [])),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/places/nearby?latitude=37.5665&longitude=126.978'
      );
      await GET(req);

      const calledUrl = new URL(mockFetch.mock.calls[0][0]);
      expect(calledUrl.searchParams.get('type')).toContain('restaurant');
    });

    it('type 파라미터가 있으면 해당 값으로 요청한다', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(makePlacesResponse('OK', [])),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/places/nearby?latitude=37.5665&longitude=126.978&type=cafe'
      );
      await GET(req);

      const calledUrl = new URL(mockFetch.mock.calls[0][0]);
      expect(calledUrl.searchParams.get('type')).toBe('cafe');
    });
  });
});
