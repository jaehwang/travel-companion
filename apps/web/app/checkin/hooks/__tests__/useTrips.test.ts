/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTrips } from '../useTrips';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const MOCK_TRIP = {
  id: 'trip-1',
  title: '제주 여행',
  description: null,
  start_date: '2025-01-01',
  end_date: '2025-01-05',
  is_public: false,
  user_id: 'user-1',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  first_checkin_date: null,
};

function mockResponse(data: unknown, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
  } as Response);
}

describe('useTrips', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('초기 로딩', () => {
    it('마운트 시 /api/trips를 fetch하고 trips를 설정한다', async () => {
      mockFetch.mockReturnValueOnce(mockResponse({ trips: [MOCK_TRIP] }));

      const { result } = renderHook(() => useTrips());

      expect(result.current.loading).toBe(true);

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(mockFetch).toHaveBeenCalledWith('/api/trips');
      expect(result.current.trips).toEqual([MOCK_TRIP]);
      expect(result.current.error).toBeNull();
    });

    it('fetch 실패 시 error를 설정한다', async () => {
      mockFetch.mockReturnValueOnce(
        mockResponse({ error: 'DB error' }, false, 500)
      );

      const { result } = renderHook(() => useTrips());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.trips).toEqual([]);
      expect(result.current.error).toBe('DB error');
    });

    it('네트워크 에러 시 error를 설정한다', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useTrips());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBe('Network error');
    });
  });

  describe('createTrip', () => {
    it('POST 요청 후 trips 목록 앞에 추가한다', async () => {
      mockFetch.mockReturnValueOnce(mockResponse({ trips: [] }));
      const { result } = renderHook(() => useTrips());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const newTrip = { ...MOCK_TRIP, id: 'trip-2', title: '서울 여행' };
      mockFetch.mockReturnValueOnce(mockResponse({ trip: newTrip }));

      let returned: unknown;
      await act(async () => {
        returned = await result.current.createTrip({ title: '서울 여행' });
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/trips', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: '서울 여행' }),
      }));
      expect(returned).toEqual(newTrip);
      expect(result.current.trips[0]).toEqual(newTrip);
    });

    it('실패 시 에러를 throw한다', async () => {
      mockFetch.mockReturnValueOnce(mockResponse({ trips: [] }));
      const { result } = renderHook(() => useTrips());
      await waitFor(() => expect(result.current.loading).toBe(false));

      mockFetch.mockReturnValueOnce(mockResponse({ error: 'Unauthorized' }, false, 401));

      await expect(
        act(async () => { await result.current.createTrip({ title: '실패' }); })
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('updateTrip', () => {
    it('PATCH 요청 후 trips 목록을 업데이트한다', async () => {
      mockFetch.mockReturnValueOnce(mockResponse({ trips: [MOCK_TRIP] }));
      const { result } = renderHook(() => useTrips());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const updatedTrip = { ...MOCK_TRIP, title: '수정된 여행' };
      mockFetch.mockReturnValueOnce(mockResponse({ trip: updatedTrip }));

      await act(async () => {
        await result.current.updateTrip('trip-1', { title: '수정된 여행' });
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/trips/trip-1', expect.objectContaining({
        method: 'PATCH',
      }));
      expect(result.current.trips[0].title).toBe('수정된 여행');
    });
  });

  describe('deleteTrip', () => {
    it('DELETE 요청 후 trips 목록에서 제거한다', async () => {
      mockFetch.mockReturnValueOnce(mockResponse({ trips: [MOCK_TRIP] }));
      const { result } = renderHook(() => useTrips());
      await waitFor(() => expect(result.current.loading).toBe(false));

      mockFetch.mockReturnValueOnce(mockResponse({}, true, 200));

      await act(async () => {
        await result.current.deleteTrip('trip-1');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/trips/trip-1', { method: 'DELETE' });
      expect(result.current.trips).toHaveLength(0);
    });

    it('실패 시 에러를 throw하고 목록을 유지한다', async () => {
      mockFetch.mockReturnValueOnce(mockResponse({ trips: [MOCK_TRIP] }));
      const { result } = renderHook(() => useTrips());
      await waitFor(() => expect(result.current.loading).toBe(false));

      mockFetch.mockReturnValueOnce(mockResponse({ error: 'Not found' }, false, 404));

      await expect(
        act(async () => { await result.current.deleteTrip('trip-1'); })
      ).rejects.toThrow('Not found');
      expect(result.current.trips).toHaveLength(1);
    });
  });
});
