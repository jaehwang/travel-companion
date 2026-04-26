import { useCheckinsStore } from '../checkinsStore';
import {
  fetchCheckins,
  fetchAllCheckins,
  createCheckin,
  updateCheckin,
  deleteCheckin,
} from '../../lib/api';
import type { Checkin } from '@travel-companion/shared';

jest.mock('../../lib/api', () => ({
  fetchCheckins: jest.fn(),
  fetchAllCheckins: jest.fn(),
  createCheckin: jest.fn(),
  updateCheckin: jest.fn(),
  deleteCheckin: jest.fn(),
}));

const mockFetchCheckins = fetchCheckins as jest.MockedFunction<typeof fetchCheckins>;
const mockFetchAllCheckins = fetchAllCheckins as jest.MockedFunction<typeof fetchAllCheckins>;
const mockCreateCheckin = createCheckin as jest.MockedFunction<typeof createCheckin>;
const mockUpdateCheckin = updateCheckin as jest.MockedFunction<typeof updateCheckin>;
const mockDeleteCheckin = deleteCheckin as jest.MockedFunction<typeof deleteCheckin>;

function makeCheckin(id: string, tripId = 'trip-1', overrides: Partial<Checkin> = {}): Checkin {
  return {
    id,
    trip_id: tripId,
    title: `장소 ${id}`,
    latitude: 37.5665,
    longitude: 126.978,
    tags: [],
    checked_in_at: '2026-04-01T10:00:00Z',
    created_at: '2026-04-01T10:00:00Z',
    updated_at: '2026-04-01T10:00:00Z',
    ...overrides,
  };
}

const resetState = () =>
  useCheckinsStore.setState({
    checkins: [],
    tripId: null,
    loading: true,
    error: null,
    allCheckins: [],
    allCheckinsLoading: true,
    allCheckinsError: null,
  });

describe('useCheckinsStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetState();
  });

  it('loadCheckins 성공 시 tripId·checkins를 설정하고 loading=false로 바꾼다', async () => {
    mockFetchCheckins.mockResolvedValue([makeCheckin('c1'), makeCheckin('c2')]);
    await useCheckinsStore.getState().loadCheckins('trip-1');
    const { checkins, tripId, loading } = useCheckinsStore.getState();
    expect(checkins).toHaveLength(2);
    expect(tripId).toBe('trip-1');
    expect(loading).toBe(false);
  });

  it('loadCheckins 실패 시 error를 설정한다', async () => {
    mockFetchCheckins.mockRejectedValue(new Error('Network error'));
    await useCheckinsStore.getState().loadCheckins('trip-1');
    const { error, loading } = useCheckinsStore.getState();
    expect(error).toBe('Network error');
    expect(loading).toBe(false);
  });

  it('loadAllCheckins 성공 시 allCheckins를 설정한다', async () => {
    mockFetchAllCheckins.mockResolvedValue([makeCheckin('c1'), makeCheckin('c2', 'trip-2')]);
    await useCheckinsStore.getState().loadAllCheckins();
    const { allCheckins, allCheckinsLoading } = useCheckinsStore.getState();
    expect(allCheckins).toHaveLength(2);
    expect(allCheckinsLoading).toBe(false);
  });

  it('addCheckin 후 tripId가 일치하면 checkins에 앞에 추가된다', async () => {
    useCheckinsStore.setState({ checkins: [makeCheckin('c1')], tripId: 'trip-1', loading: false });
    const newCheckin = makeCheckin('c2', 'trip-1');
    mockCreateCheckin.mockResolvedValue(newCheckin);
    await useCheckinsStore.getState().addCheckin({
      trip_id: 'trip-1', latitude: 37, longitude: 126, tags: [], checked_in_at: '',
    });
    const { checkins } = useCheckinsStore.getState();
    expect(checkins[0].id).toBe('c2');
    expect(checkins).toHaveLength(2);
  });

  it('addCheckin 후 tripId가 다르면 checkins에 추가되지 않는다', async () => {
    useCheckinsStore.setState({ checkins: [makeCheckin('c1')], tripId: 'trip-1', loading: false });
    mockCreateCheckin.mockResolvedValue(makeCheckin('c2', 'trip-2'));
    await useCheckinsStore.getState().addCheckin({
      trip_id: 'trip-2', latitude: 37, longitude: 126, tags: [], checked_in_at: '',
    });
    expect(useCheckinsStore.getState().checkins).toHaveLength(1);
  });

  it('addCheckin 후 allCheckins에는 항상 추가된다', async () => {
    useCheckinsStore.setState({ allCheckins: [makeCheckin('c1')], tripId: 'trip-1', loading: false });
    mockCreateCheckin.mockResolvedValue(makeCheckin('c2', 'trip-2'));
    await useCheckinsStore.getState().addCheckin({
      trip_id: 'trip-2', latitude: 37, longitude: 126, tags: [], checked_in_at: '',
    });
    expect(useCheckinsStore.getState().allCheckins).toHaveLength(2);
  });

  it('updateCheckin 후 checkins와 allCheckins 모두 업데이트된다', async () => {
    const original = makeCheckin('c1');
    useCheckinsStore.setState({ checkins: [original], allCheckins: [original], tripId: 'trip-1', loading: false });
    mockUpdateCheckin.mockResolvedValue({ ...original, title: '수정된 장소' });
    await useCheckinsStore.getState().updateCheckin('c1', { title: '수정된 장소' });
    const { checkins, allCheckins } = useCheckinsStore.getState();
    expect(checkins[0].title).toBe('수정된 장소');
    expect(allCheckins[0].title).toBe('수정된 장소');
  });

  it('removeCheckin 후 checkins와 allCheckins 모두에서 제거된다', async () => {
    useCheckinsStore.setState({
      checkins: [makeCheckin('c1'), makeCheckin('c2')],
      allCheckins: [makeCheckin('c1'), makeCheckin('c2')],
      tripId: 'trip-1',
      loading: false,
    });
    mockDeleteCheckin.mockResolvedValue(undefined);
    await useCheckinsStore.getState().removeCheckin('c1');
    const { checkins, allCheckins } = useCheckinsStore.getState();
    expect(checkins).toHaveLength(1);
    expect(allCheckins).toHaveLength(1);
    expect(checkins[0].id).toBe('c2');
  });
});
