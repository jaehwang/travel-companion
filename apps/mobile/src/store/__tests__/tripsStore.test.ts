import { useTripsStore } from '../tripsStore';
import { fetchTrips, createTrip, updateTrip, deleteTrip } from '../../lib/api';
import type { Trip } from '@travel-companion/shared';

jest.mock('../../lib/api', () => ({
  fetchTrips: jest.fn(),
  createTrip: jest.fn(),
  updateTrip: jest.fn(),
  deleteTrip: jest.fn(),
}));

const mockFetchTrips = fetchTrips as jest.MockedFunction<typeof fetchTrips>;
const mockCreateTrip = createTrip as jest.MockedFunction<typeof createTrip>;
const mockUpdateTrip = updateTrip as jest.MockedFunction<typeof updateTrip>;
const mockDeleteTrip = deleteTrip as jest.MockedFunction<typeof deleteTrip>;

function makeTrip(id: string, overrides: Partial<Trip> = {}): Trip {
  return {
    id,
    title: `여행 ${id}`,
    is_public: false,
    is_frequent: false,
    is_default: false,
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
    ...overrides,
  };
}

describe('useTripsStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTripsStore.setState({ trips: [], loading: true, error: null });
  });

  it('초기 상태: trips=[], loading=true, error=null', () => {
    const { trips, loading, error } = useTripsStore.getState();
    expect(trips).toEqual([]);
    expect(loading).toBe(true);
    expect(error).toBeNull();
  });

  it('loadTrips 성공 시 trips를 설정하고 loading=false로 바꾼다', async () => {
    mockFetchTrips.mockResolvedValue([makeTrip('t1'), makeTrip('t2')]);
    await useTripsStore.getState().loadTrips();
    const { trips, loading, error } = useTripsStore.getState();
    expect(trips).toHaveLength(2);
    expect(loading).toBe(false);
    expect(error).toBeNull();
  });

  it('loadTrips 실패 시 error를 설정하고 loading=false로 바꾼다', async () => {
    mockFetchTrips.mockRejectedValue(new Error('Network error'));
    await useTripsStore.getState().loadTrips();
    const { error, loading } = useTripsStore.getState();
    expect(error).toBe('Network error');
    expect(loading).toBe(false);
  });

  it('addTrip 후 새 여행이 목록 맨 앞에 추가된다', async () => {
    useTripsStore.setState({ trips: [makeTrip('t1')], loading: false });
    const newTrip = makeTrip('t2', { title: '새 여행' });
    mockCreateTrip.mockResolvedValue(newTrip);
    await useTripsStore.getState().addTrip({
      title: '새 여행', is_public: false, is_frequent: false, is_default: false,
    });
    const { trips } = useTripsStore.getState();
    expect(trips[0].id).toBe('t2');
    expect(trips).toHaveLength(2);
  });

  it('updateTrip 후 해당 여행의 데이터가 교체된다', async () => {
    useTripsStore.setState({ trips: [makeTrip('t1', { title: '원래 제목' })], loading: false });
    const updated = makeTrip('t1', { title: '수정된 제목' });
    mockUpdateTrip.mockResolvedValue(updated);
    await useTripsStore.getState().updateTrip('t1', { title: '수정된 제목' });
    const { trips } = useTripsStore.getState();
    expect(trips[0].title).toBe('수정된 제목');
  });

  it('removeTrip 후 해당 여행이 목록에서 제거된다', async () => {
    useTripsStore.setState({ trips: [makeTrip('t1'), makeTrip('t2')], loading: false });
    mockDeleteTrip.mockResolvedValue(undefined);
    await useTripsStore.getState().removeTrip('t1');
    const { trips } = useTripsStore.getState();
    expect(trips).toHaveLength(1);
    expect(trips[0].id).toBe('t2');
  });
});
