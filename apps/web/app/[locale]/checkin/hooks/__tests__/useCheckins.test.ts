/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCheckins } from '../useCheckins';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const MOCK_CHECKIN = {
  id: 'checkin-1',
  trip_id: 'trip-1',
  title: '성산일출봉',
  place: '성산일출봉',
  place_id: undefined,
  message: '멋진 뷰!',
  category: 'attraction',
  latitude: 33.458,
  longitude: 126.942,
  photo_url: undefined,
  photo_metadata: undefined,
  checked_in_at: '2025-01-02T09:00:00Z',
  created_at: '2025-01-02T09:00:00Z',
  updated_at: '2025-01-02T09:00:00Z',
  user_id: 'user-1',
};

function mockResponse(data: unknown, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(data),
  } as Response);
}

describe('useCheckins', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('초기 로딩', () => {
    it('tripId가 있으면 /api/checkins?trip_id=X를 fetch한다', async () => {
      mockFetch.mockReturnValueOnce(mockResponse({ checkins: [MOCK_CHECKIN] }));

      const { result } = renderHook(() => useCheckins('trip-1'));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(mockFetch).toHaveBeenCalledWith('/api/checkins?trip_id=trip-1');
      expect(result.current.checkins).toEqual([MOCK_CHECKIN]);
      expect(result.current.error).toBeNull();
    });

    it('tripId가 빈 문자열이면 fetch하지 않고 빈 배열을 반환한다', () => {
      const { result } = renderHook(() => useCheckins(''));

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current.checkins).toEqual([]);
      expect(result.current.loading).toBe(false);
    });

    it('fetch 실패 시 error를 설정한다', async () => {
      mockFetch.mockReturnValueOnce(mockResponse({ error: 'DB error' }, false));

      const { result } = renderHook(() => useCheckins('trip-1'));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.checkins).toEqual([]);
      expect(result.current.error).toBe('DB error');
    });

    it('tripId가 변경되면 새로 fetch한다', async () => {
      mockFetch.mockReturnValueOnce(mockResponse({ checkins: [MOCK_CHECKIN] }));

      const { result, rerender } = renderHook(
        ({ tripId }) => useCheckins(tripId),
        { initialProps: { tripId: 'trip-1' } }
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const checkin2 = { ...MOCK_CHECKIN, id: 'checkin-2', trip_id: 'trip-2' };
      mockFetch.mockReturnValueOnce(mockResponse({ checkins: [checkin2] }));

      rerender({ tripId: 'trip-2' });

      await waitFor(() => expect(result.current.checkins[0].trip_id).toBe('trip-2'));
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('addCheckin', () => {
    it('체크인을 목록 앞에 추가한다', async () => {
      mockFetch.mockReturnValueOnce(mockResponse({ checkins: [MOCK_CHECKIN] }));
      const { result } = renderHook(() => useCheckins('trip-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      const newCheckin = { ...MOCK_CHECKIN, id: 'checkin-2', title: '협재해수욕장' };

      act(() => {
        result.current.addCheckin(newCheckin);
      });

      expect(result.current.checkins[0]).toEqual(newCheckin);
      expect(result.current.checkins).toHaveLength(2);
    });
  });

  describe('updateCheckin', () => {
    it('같은 id의 체크인을 업데이트한다', async () => {
      mockFetch.mockReturnValueOnce(mockResponse({ checkins: [MOCK_CHECKIN] }));
      const { result } = renderHook(() => useCheckins('trip-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      const updated = { ...MOCK_CHECKIN, title: '성산일출봉 (수정)' };

      act(() => {
        result.current.updateCheckin(updated);
      });

      expect(result.current.checkins[0].title).toBe('성산일출봉 (수정)');
    });
  });

  describe('deleteCheckin', () => {
    it('DELETE 요청 후 목록에서 제거한다', async () => {
      mockFetch.mockReturnValueOnce(mockResponse({ checkins: [MOCK_CHECKIN] }));
      const { result } = renderHook(() => useCheckins('trip-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      mockFetch.mockReturnValueOnce(mockResponse({}, true));

      await act(async () => {
        await result.current.deleteCheckin('checkin-1');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/checkins/checkin-1', { method: 'DELETE' });
      expect(result.current.checkins).toHaveLength(0);
    });

    it('실패 시 에러를 throw하고 목록을 유지한다', async () => {
      mockFetch.mockReturnValueOnce(mockResponse({ checkins: [MOCK_CHECKIN] }));
      const { result } = renderHook(() => useCheckins('trip-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      mockFetch.mockReturnValueOnce(mockResponse({ error: 'Not found' }, false));

      await expect(
        act(async () => { await result.current.deleteCheckin('checkin-1'); })
      ).rejects.toThrow('Not found');
      expect(result.current.checkins).toHaveLength(1);
    });
  });
});
