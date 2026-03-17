import { renderHook, act, waitFor } from '@testing-library/react';
import { usePlaceSearch } from '../usePlaceSearch';

// ─── Helpers ───

const mockPredictions = [
  {
    place_id: 'place-1',
    description: '경복궁, 서울',
    structured_formatting: { main_text: '경복궁', secondary_text: '서울' },
  },
  {
    place_id: 'place-2',
    description: '경복궁역, 서울',
    structured_formatting: { main_text: '경복궁역', secondary_text: '서울' },
  },
];

const mockPlaceDetails = {
  place: { latitude: 37.5796, longitude: 126.977, name: '경복궁', address: '서울 종로구' },
};

function mockFetch(response: object, ok = true) {
  return jest.fn().mockResolvedValue({
    ok,
    json: jest.fn().mockResolvedValue(response),
  });
}

const defaultOptions = {
  isActive: true,
  onPlaceSelected: jest.fn(),
};

// ─── Tests ───

describe('usePlaceSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('초기 상태', () => {
    it('searchQuery가 비어 있고 predictions가 빈 배열이다', () => {
      const { result } = renderHook(() => usePlaceSearch(defaultOptions));
      expect(result.current.searchQuery).toBe('');
      expect(result.current.predictions).toEqual([]);
      expect(result.current.searchingPlaces).toBe(false);
    });
  });

  describe('검색어 입력 → API 호출 (300ms 디바운스)', () => {
    it('2자 미만 검색어는 API를 호출하지 않는다', async () => {
      global.fetch = mockFetch({ predictions: mockPredictions });
      const { result } = renderHook(() => usePlaceSearch(defaultOptions));

      act(() => result.current.setSearchQuery('경'));
      act(() => { jest.runAllTimers(); });

      expect(global.fetch).not.toHaveBeenCalled();
      expect(result.current.predictions).toEqual([]);
    });

    it('2자 이상 입력 후 300ms 경과 시 autocomplete API를 호출한다', async () => {
      global.fetch = mockFetch({ predictions: mockPredictions });
      const { result } = renderHook(() => usePlaceSearch(defaultOptions));

      act(() => result.current.setSearchQuery('경복궁'));
      act(() => { jest.runAllTimers(); });

      await waitFor(() => expect(result.current.predictions).toHaveLength(2));
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/places/autocomplete?'),
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('input=%EA%B2%BD%EB%B3%B5%EA%B6%81'),
      );
    });

    it('location이 있으면 lat/lng 파라미터를 함께 전달한다', async () => {
      global.fetch = mockFetch({ predictions: mockPredictions });
      const { result } = renderHook(() =>
        usePlaceSearch({ ...defaultOptions, location: { lat: 37.5, lng: 127.0 } }),
      );

      act(() => result.current.setSearchQuery('경복궁'));
      act(() => { jest.runAllTimers(); });

      await waitFor(() => expect(global.fetch).toHaveBeenCalled());
      const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(calledUrl).toContain('lat=37.5');
      expect(calledUrl).toContain('lng=127');
    });

    it('isActive=false이면 API를 호출하지 않는다', async () => {
      global.fetch = mockFetch({ predictions: mockPredictions });
      const { result } = renderHook(() =>
        usePlaceSearch({ ...defaultOptions, isActive: false }),
      );

      act(() => result.current.setSearchQuery('경복궁'));
      act(() => { jest.runAllTimers(); });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('API 오류 응답 시 predictions는 빈 배열을 유지한다', async () => {
      global.fetch = mockFetch({ error: 'API error' }, false);
      const { result } = renderHook(() => usePlaceSearch(defaultOptions));

      act(() => result.current.setSearchQuery('경복궁'));
      act(() => { jest.runAllTimers(); });

      await waitFor(() => expect(result.current.searchingPlaces).toBe(false));
      expect(result.current.predictions).toEqual([]);
    });

    it('300ms 내에 새 입력이 오면 이전 요청을 취소(디바운스)한다', async () => {
      global.fetch = mockFetch({ predictions: mockPredictions });
      const { result } = renderHook(() => usePlaceSearch(defaultOptions));

      act(() => result.current.setSearchQuery('경'));
      act(() => { jest.advanceTimersByTime(100); });
      act(() => result.current.setSearchQuery('경복'));
      act(() => { jest.advanceTimersByTime(100); });
      act(() => result.current.setSearchQuery('경복궁'));
      act(() => { jest.runAllTimers(); });

      await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    });
  });

  describe('handleSelectPlace', () => {
    it('장소 선택 시 details API를 호출하고 onPlaceSelected 콜백을 실행한다', async () => {
      global.fetch = mockFetch(mockPlaceDetails);
      const onPlaceSelected = jest.fn();
      const { result } = renderHook(() =>
        usePlaceSearch({ ...defaultOptions, onPlaceSelected }),
      );

      await act(async () => {
        await result.current.handleSelectPlace(mockPredictions[0]);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/places/details?place_id=place-1'),
      );
      expect(onPlaceSelected).toHaveBeenCalledWith(
        37.5796, 126.977, '경복궁', 'place-1',
      );
    });

    it('details API 오류 시 onError를 호출한다', async () => {
      global.fetch = mockFetch({ error: 'Not found' }, false);
      const onError = jest.fn();
      const { result } = renderHook(() =>
        usePlaceSearch({ ...defaultOptions, onError }),
      );

      await act(async () => {
        await result.current.handleSelectPlace(mockPredictions[0]);
      });

      expect(onError).toHaveBeenCalledWith('장소 정보를 가져오는데 실패했습니다.');
    });

    it('details API 오류 시 searchingPlaces가 false로 복구된다', async () => {
      global.fetch = mockFetch({ error: 'error' }, false);
      const { result } = renderHook(() => usePlaceSearch(defaultOptions));

      await act(async () => {
        await result.current.handleSelectPlace(mockPredictions[0]);
      });

      expect(result.current.searchingPlaces).toBe(false);
    });
  });

  describe('reset', () => {
    it('searchQuery와 predictions를 초기화한다', async () => {
      global.fetch = mockFetch({ predictions: mockPredictions });
      const { result } = renderHook(() => usePlaceSearch(defaultOptions));

      act(() => result.current.setSearchQuery('경복궁'));
      act(() => { jest.runAllTimers(); });
      await waitFor(() => expect(result.current.predictions).toHaveLength(2));

      act(() => result.current.reset());

      expect(result.current.searchQuery).toBe('');
      expect(result.current.predictions).toEqual([]);
    });
  });
});
