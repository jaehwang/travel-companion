import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAllCheckins } from '../useAllCheckins';
import { useCheckinsStore } from '../../store/checkinsStore';
import { fetchAllCheckins } from '../../lib/api';

jest.mock('../../lib/supabase', () => ({ supabase: {} }));
jest.mock('../../lib/api');
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb: () => void | (() => void)) => {
    const React = require('react');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useEffect(() => cb(), []);
  },
}));

const mockFetchAllCheckins = fetchAllCheckins as jest.MockedFunction<typeof fetchAllCheckins>;

const mockCheckins = [
  {
    id: 'c1',
    trip_id: 't1',
    title: '테스트 장소',
    latitude: 37.5,
    longitude: 127.0,
    checked_in_at: '2026-03-01T10:00:00Z',
    created_at: '2026-03-01T10:00:00Z',
  },
  {
    id: 'c2',
    trip_id: 't2',
    title: '다른 여행 장소',
    latitude: 35.1,
    longitude: 129.0,
    checked_in_at: '2026-03-15T14:00:00Z',
    created_at: '2026-03-15T14:00:00Z',
  },
];

describe('useAllCheckins', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Zustand store before each test
    useCheckinsStore.setState({
      checkins: [],
      tripId: null,
      loading: true,
      error: null,
      allCheckins: [],
      allCheckinsLoading: true,
      allCheckinsError: null,
    });
  });

  it('마운트 시 전체 체크인을 로드한다', async () => {
    mockFetchAllCheckins.mockResolvedValue(mockCheckins as any);

    const { result } = renderHook(() => useAllCheckins());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.checkins).toEqual(mockCheckins);
    expect(result.current.error).toBeNull();
    expect(mockFetchAllCheckins).toHaveBeenCalledWith(undefined);
  });

  it('tripId를 전달하면 해당 여행의 체크인만 요청한다', async () => {
    mockFetchAllCheckins.mockResolvedValue([mockCheckins[0]] as any);

    const { result } = renderHook(() => useAllCheckins('t1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.checkins).toEqual([mockCheckins[0]]);
    expect(mockFetchAllCheckins).toHaveBeenCalledWith('t1');
  });

  it('API 호출 실패 시 error 상태를 설정한다', async () => {
    mockFetchAllCheckins.mockRejectedValue(new Error('네트워크 오류'));

    const { result } = renderHook(() => useAllCheckins());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('네트워크 오류');
    expect(result.current.checkins).toEqual([]);
  });

  it('API가 Error 인스턴스가 아닌 값을 throw하면 기본 메시지를 설정한다', async () => {
    mockFetchAllCheckins.mockRejectedValue('unknown error');

    const { result } = renderHook(() => useAllCheckins());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load checkins');
  });

  it('reload를 호출하면 데이터를 다시 불러온다', async () => {
    mockFetchAllCheckins
      .mockResolvedValueOnce([mockCheckins[0]] as any)
      .mockResolvedValueOnce(mockCheckins as any);

    const { result } = renderHook(() => useAllCheckins());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.checkins).toHaveLength(1);

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.checkins).toHaveLength(2);
  });

  it('reload 호출 후 error 상태가 초기화된다', async () => {
    mockFetchAllCheckins
      .mockRejectedValueOnce(new Error('첫 번째 오류'))
      .mockResolvedValueOnce(mockCheckins as any);

    const { result } = renderHook(() => useAllCheckins());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('첫 번째 오류');

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.checkins).toEqual(mockCheckins);
  });
});
