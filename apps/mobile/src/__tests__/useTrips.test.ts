import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useTrips } from '../hooks/useTrips';
import { fetchTrips, createTrip, updateTrip, deleteTrip } from '../lib/api';

jest.mock('../lib/api', () => ({
  fetchTrips: jest.fn(),
  createTrip: jest.fn(),
  updateTrip: jest.fn(),
  deleteTrip: jest.fn(),
}));

const mockFetchTrips = fetchTrips as jest.MockedFunction<typeof fetchTrips>;
const mockCreateTrip = createTrip as jest.MockedFunction<typeof createTrip>;
const mockUpdateTrip = updateTrip as jest.MockedFunction<typeof updateTrip>;
const mockDeleteTrip = deleteTrip as jest.MockedFunction<typeof deleteTrip>;

const makeTrip = (id: string, title: string) => ({
  id,
  title,
  is_public: false,
  is_frequent: false,
  created_at: '2024-03-01T00:00:00Z',
  updated_at: '2024-03-01T00:00:00Z',
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useTrips', () => {
  it('마운트 시 여행 목록을 로드한다', async () => {
    const trips = [makeTrip('1', '제주도 여행'), makeTrip('2', '부산 여행')];
    mockFetchTrips.mockResolvedValueOnce(trips);

    const { result } = renderHook(() => useTrips());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.trips).toEqual(trips);
    expect(result.current.error).toBeNull();
  });

  it('fetchTrips 실패 시 error 상태가 설정된다', async () => {
    mockFetchTrips.mockRejectedValueOnce(new Error('네트워크 오류'));

    const { result } = renderHook(() => useTrips());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('네트워크 오류');
    expect(result.current.trips).toEqual([]);
  });

  it('create를 호출하면 trip이 목록 앞에 추가된다', async () => {
    const existing = makeTrip('1', '제주도 여행');
    mockFetchTrips.mockResolvedValueOnce([existing]);

    const { result } = renderHook(() => useTrips());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newTrip = makeTrip('2', '서울 여행');
    mockCreateTrip.mockResolvedValueOnce(newTrip);

    await act(async () => {
      await result.current.create({ title: '서울 여행', is_public: false });
    });

    expect(result.current.trips[0]).toEqual(newTrip);
    expect(result.current.trips[1]).toEqual(existing);
    expect(result.current.trips).toHaveLength(2);
  });

  it('update를 호출하면 해당 trip이 목록에서 수정된다', async () => {
    const trip = makeTrip('1', '제주도 여행');
    mockFetchTrips.mockResolvedValueOnce([trip]);

    const { result } = renderHook(() => useTrips());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const updatedTrip = { ...trip, title: '수정된 제주도 여행' };
    mockUpdateTrip.mockResolvedValueOnce(updatedTrip);

    await act(async () => {
      await result.current.update('1', { title: '수정된 제주도 여행' });
    });

    expect(result.current.trips[0]).toEqual(updatedTrip);
    expect(result.current.trips).toHaveLength(1);
  });

  it('remove를 호출하면 해당 trip이 목록에서 제거된다', async () => {
    const trips = [makeTrip('1', '제주도 여행'), makeTrip('2', '부산 여행')];
    mockFetchTrips.mockResolvedValueOnce(trips);

    const { result } = renderHook(() => useTrips());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    mockDeleteTrip.mockResolvedValueOnce(undefined);

    await act(async () => {
      await result.current.remove('1');
    });

    expect(result.current.trips).toHaveLength(1);
    expect(result.current.trips[0].id).toBe('2');
  });

  it('reload를 호출하면 목록을 다시 불러온다', async () => {
    const initialTrips = [makeTrip('1', '제주도 여행')];
    const reloadedTrips = [makeTrip('1', '제주도 여행'), makeTrip('2', '부산 여행')];
    mockFetchTrips.mockResolvedValueOnce(initialTrips).mockResolvedValueOnce(reloadedTrips);

    const { result } = renderHook(() => useTrips());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.trips).toHaveLength(1);

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.trips).toHaveLength(2);
  });
});
