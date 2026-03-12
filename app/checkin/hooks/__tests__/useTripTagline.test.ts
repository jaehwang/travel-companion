/**
 * @jest-environment jsdom
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { useTripTagline } from '../useTripTagline';
import type { Trip } from '@/types/database';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const MOCK_TRIP: Trip = {
  id: 'trip-1',
  title: '제주 바람 산책',
  description: '오름과 바다를 번갈아 걷는 일정',
  start_date: '2025-04-01T00:00:00.000Z',
  end_date: '2025-04-03T00:00:00.000Z',
  is_public: false,
  user_id: 'user-1',
  created_at: '2025-04-01T00:00:00.000Z',
  updated_at: '2025-04-01T00:00:00.000Z',
  place: '제주',
};

function mockResponse(data: unknown, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(data),
  } as Response);
}

describe('useTripTagline', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('선택된 여행이 있으면 태그라인을 불러온다', async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ tagline: '바람도 일정표에 넣은 여행' }));

    const { result } = renderHook(() => useTripTagline(MOCK_TRIP));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFetch).toHaveBeenCalledWith('/api/trips/trip-1/tagline', { method: 'POST' });
    expect(result.current.tagline).toBe('바람도 일정표에 넣은 여행');
    expect(result.current.error).toBeNull();
  });

  it('같은 여행 시그니처면 캐시를 재사용한다', async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ tagline: '바람도 일정표에 넣은 여행' }));

    const { result, rerender } = renderHook(
      ({ trip }) => useTripTagline(trip),
      {
        initialProps: {
          trip: MOCK_TRIP,
        },
      }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    rerender({ trip: { ...MOCK_TRIP } });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.current.tagline).toBe('바람도 일정표에 넣은 여행');
  });

  it('refresh를 호출하면 다시 생성한다', async () => {
    mockFetch
      .mockReturnValueOnce(mockResponse({ tagline: '첫 번째 문구' }))
      .mockReturnValueOnce(mockResponse({ tagline: '두 번째 문구' }));

    const { result } = renderHook(() => useTripTagline(MOCK_TRIP));

    await waitFor(() => expect(result.current.tagline).toBe('첫 번째 문구'));

    await act(async () => {
      result.current.refresh();
    });

    await waitFor(() => expect(result.current.tagline).toBe('두 번째 문구'));
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
