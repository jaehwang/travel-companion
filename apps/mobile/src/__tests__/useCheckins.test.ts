import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useCheckins } from '../hooks/useCheckins';
import { useCheckinsStore } from '../store/checkinsStore';
import { fetchCheckins, createCheckin, updateCheckin, deleteCheckin } from '../lib/api';

jest.mock('../lib/api', () => ({
  fetchCheckins: jest.fn(),
  createCheckin: jest.fn(),
  updateCheckin: jest.fn(),
  deleteCheckin: jest.fn(),
}));

const mockFetchCheckins = fetchCheckins as jest.MockedFunction<typeof fetchCheckins>;
const mockCreateCheckin = createCheckin as jest.MockedFunction<typeof createCheckin>;
const mockUpdateCheckin = updateCheckin as jest.MockedFunction<typeof updateCheckin>;
const mockDeleteCheckin = deleteCheckin as jest.MockedFunction<typeof deleteCheckin>;

const makeCheckin = (id: string, title: string) => ({
  id,
  trip_id: 'trip-1',
  title,
  latitude: 37.5665,
  longitude: 126.9780,
  checked_in_at: '2024-03-01T10:00:00Z',
  created_at: '2024-03-01T10:00:00Z',
  updated_at: '2024-03-01T10:00:00Z',
});

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

describe('useCheckins', () => {
  it('마운트 시 체크인 목록을 로드한다', async () => {
    const checkins = [makeCheckin('1', '카페'), makeCheckin('2', '식당')];
    mockFetchCheckins.mockResolvedValueOnce(checkins);

    const { result } = renderHook(() => useCheckins('trip-1'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.checkins).toEqual(checkins);
    expect(result.current.error).toBeNull();
  });

  it('fetchCheckins 실패 시 error 상태가 설정된다', async () => {
    mockFetchCheckins.mockRejectedValueOnce(new Error('네트워크 오류'));

    const { result } = renderHook(() => useCheckins('trip-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('네트워크 오류');
    expect(result.current.checkins).toEqual([]);
  });

  it('create를 호출하면 체크인이 목록 앞에 추가된다', async () => {
    const existing = makeCheckin('1', '카페');
    mockFetchCheckins.mockResolvedValueOnce([existing]);

    const { result } = renderHook(() => useCheckins('trip-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newCheckin = makeCheckin('2', '식당');
    mockCreateCheckin.mockResolvedValueOnce(newCheckin);

    await act(async () => {
      await result.current.create({
        trip_id: 'trip-1',
        title: '식당',
        latitude: 37.5665,
        longitude: 126.9780,
      });
    });

    expect(result.current.checkins[0]).toEqual(newCheckin);
    expect(result.current.checkins[1]).toEqual(existing);
    expect(result.current.checkins).toHaveLength(2);
  });

  it('update를 호출하면 해당 체크인이 목록에서 수정된다', async () => {
    const checkin = makeCheckin('1', '카페');
    mockFetchCheckins.mockResolvedValueOnce([checkin]);

    const { result } = renderHook(() => useCheckins('trip-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const updatedCheckin = { ...checkin, title: '멋진 카페' };
    mockUpdateCheckin.mockResolvedValueOnce(updatedCheckin);

    await act(async () => {
      await result.current.update('1', { title: '멋진 카페' });
    });

    expect(result.current.checkins[0]).toEqual(updatedCheckin);
    expect(result.current.checkins).toHaveLength(1);
  });

  it('remove를 호출하면 해당 체크인이 목록에서 제거된다', async () => {
    const checkins = [makeCheckin('1', '카페'), makeCheckin('2', '식당')];
    mockFetchCheckins.mockResolvedValueOnce(checkins);

    const { result } = renderHook(() => useCheckins('trip-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    mockDeleteCheckin.mockResolvedValueOnce(undefined);

    await act(async () => {
      await result.current.remove('1');
    });

    expect(result.current.checkins).toHaveLength(1);
    expect(result.current.checkins[0].id).toBe('2');
  });

  it('reload를 호출하면 목록을 다시 불러온다', async () => {
    const initial = [makeCheckin('1', '카페')];
    const reloaded = [makeCheckin('1', '카페'), makeCheckin('2', '식당')];
    mockFetchCheckins.mockResolvedValueOnce(initial).mockResolvedValueOnce(reloaded);

    const { result } = renderHook(() => useCheckins('trip-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.checkins).toHaveLength(1);

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.checkins).toHaveLength(2);
  });

  it('tripId가 없으면 fetch를 호출하지 않는다', async () => {
    const { result } = renderHook(() => useCheckins(''));

    // tripId 없으면 load()가 early return → loading은 true 유지
    expect(result.current.loading).toBe(true);
    expect(mockFetchCheckins).not.toHaveBeenCalled();
    expect(result.current.checkins).toEqual([]);
  });
});
