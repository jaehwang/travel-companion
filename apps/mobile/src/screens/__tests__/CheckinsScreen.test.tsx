import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CheckinsScreen from '../CheckinsScreen';
import { useAllCheckins } from '../../hooks/useAllCheckins';
import { useTrips } from '../../hooks/useTrips';
import { useCheckinsStore } from '../../store/checkinsStore';

jest.mock('../../lib/supabase', () => ({ supabase: {} }));
jest.mock('../../hooks/useAllCheckins');
jest.mock('../../hooks/useTrips');
jest.mock('../../store/checkinsStore');
jest.mock('../../utils/categoryIcons', () => ({
  CATEGORY_META: {
    other: { icon: 'location', color: '#9CA3AF', label: '기타' },
    restaurant: { icon: 'restaurant', color: '#F97316', label: '음식점' },
  },
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

const mockUseAllCheckins = useAllCheckins as jest.MockedFunction<typeof useAllCheckins>;
const mockUseTrips = useTrips as jest.MockedFunction<typeof useTrips>;
const mockUseCheckinsStore = useCheckinsStore as jest.MockedFunction<typeof useCheckinsStore>;

const mockUpdateCheckin = jest.fn();

const makeTrip = (id: string, title: string, isFrequent: boolean, isDefault = false) => ({
  id,
  title,
  is_public: false,
  is_frequent: isFrequent,
  is_default: isDefault,
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
});

const makeCheckin = (id: string, tripId: string, title: string) => ({
  id,
  trip_id: tripId,
  title,
  tags: [],
  latitude: 37.5,
  longitude: 127.0,
  checked_in_at: '2026-03-15T10:00:00Z',
  created_at: '2026-03-15T10:00:00Z',
  updated_at: '2026-03-15T10:00:00Z',
});

const normalTrip = makeTrip('t1', '제주도 여행', false);
const frequentTrip = makeTrip('t2', '단골 카페', true);
const normalCheckin = makeCheckin('c1', 't1', '성산일출봉');
const frequentCheckin = makeCheckin('c2', 't2', '스타벅스');

const defaultReload = jest.fn();

function setupMocks(checkins = [normalCheckin, frequentCheckin], trips = [normalTrip, frequentTrip]) {
  mockUseAllCheckins.mockReturnValue({
    checkins: checkins as any,
    loading: false,
    error: null,
    reload: defaultReload,
  });
  mockUseTrips.mockReturnValue({
    trips: trips as any,
    loading: false,
    error: null,
    reload: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  });
  mockUseCheckinsStore.mockReturnValue(mockUpdateCheckin as any);
}

describe('CheckinsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('세그먼트 탭이 일반과 자주 가는 곳으로 렌더링된다', () => {
    setupMocks();
    const { getByText } = render(<CheckinsScreen />);
    expect(getByText('일반')).toBeTruthy();
    expect(getByText('자주 가는 곳')).toBeTruthy();
  });

  it('기본값은 일반 탭이며 일반 여행의 체크인만 표시된다', () => {
    setupMocks();
    const { getByText, queryByText } = render(<CheckinsScreen />);
    expect(getByText('성산일출봉')).toBeTruthy();
    expect(queryByText('스타벅스')).toBeNull();
  });

  it('자주 가는 곳 탭을 누르면 is_frequent 여행의 체크인만 표시된다', async () => {
    setupMocks();
    const { getByText, queryByText } = render(<CheckinsScreen />);

    fireEvent.press(getByText('자주 가는 곳'));

    await waitFor(() => {
      expect(getByText('스타벅스')).toBeTruthy();
    });
    expect(queryByText('성산일출봉')).toBeNull();
  });

  it('탭을 다시 일반으로 전환하면 일반 여행의 체크인만 표시된다', async () => {
    setupMocks();
    const { getByText, queryByText } = render(<CheckinsScreen />);

    fireEvent.press(getByText('자주 가는 곳'));
    fireEvent.press(getByText('일반'));

    await waitFor(() => {
      expect(getByText('성산일출봉')).toBeTruthy();
    });
    expect(queryByText('스타벅스')).toBeNull();
  });

  it('해당 탭에 체크인이 없으면 빈 상태 메시지를 표시한다', () => {
    setupMocks([normalCheckin], [normalTrip, frequentTrip]);
    const { getByText } = render(<CheckinsScreen />);

    fireEvent.press(getByText('자주 가는 곳'));

    expect(getByText('체크인 기록이 없습니다')).toBeTruthy();
  });

  it('로딩 중에는 ActivityIndicator를 표시한다', () => {
    mockUseAllCheckins.mockReturnValue({
      checkins: [],
      loading: true,
      error: null,
      reload: defaultReload,
    });
    mockUseTrips.mockReturnValue({
      trips: [],
      loading: false,
      error: null,
      reload: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    });

    const { UNSAFE_getByType } = render(<CheckinsScreen />);
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('에러가 있으면 에러 메시지와 다시 시도 버튼을 표시한다', () => {
    mockUseAllCheckins.mockReturnValue({
      checkins: [],
      loading: false,
      error: '네트워크 오류',
      reload: defaultReload,
    });
    mockUseTrips.mockReturnValue({
      trips: [],
      loading: false,
      error: null,
      reload: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    });

    const { getByText } = render(<CheckinsScreen />);
    expect(getByText('네트워크 오류')).toBeTruthy();
    expect(getByText('다시 시도')).toBeTruthy();
  });

  it('useAllCheckins를 인자 없이 호출한다', () => {
    setupMocks();
    render(<CheckinsScreen />);
    expect(mockUseAllCheckins).toHaveBeenCalledWith();
  });

  describe('미할당 뱃지', () => {
    // fetchTrips는 is_default=false 필터 → default trip이 trips 배열에 없음
    // 따라서 미할당 체크인의 trip은 tripMap에서 undefined
    const defaultCheckin = makeCheckin('c-default', 't-default', '미할당 체크인');

    it('tripMap에 없는 trip의 체크인에 미할당 뱃지가 표시된다', () => {
      // defaultCheckin의 trip_id('t-default')는 trips 목록에 없음
      setupMocks([defaultCheckin, normalCheckin], [normalTrip]);
      const { getAllByTestId } = render(<CheckinsScreen />);
      expect(getAllByTestId('badge-unassigned')).toHaveLength(1);
    });

    it('tripMap에 있는 trip의 체크인에는 미할당 뱃지가 표시되지 않는다', () => {
      setupMocks([normalCheckin], [normalTrip]);
      const { queryByTestId } = render(<CheckinsScreen />);
      expect(queryByTestId('badge-unassigned')).toBeNull();
    });
  });

  describe('여행으로 이동', () => {
    const defaultCheckin = makeCheckin('c-default', 't-default', '미할당 체크인');

    it('카드 롱프레스 시 여행 선택 모달이 표시된다', () => {
      setupMocks([defaultCheckin, normalCheckin], [normalTrip]);

      const { getByTestId, getByText } = render(<CheckinsScreen />);
      fireEvent(getByTestId('checkin-card-unassigned'), 'longPress');

      expect(getByText('여행으로 이동')).toBeTruthy();
      expect(getByTestId('move-modal-trip-t1')).toBeTruthy();
    });

    it('모달에서 여행 선택 시 updateCheckin 호출 후 reload된다', async () => {
      setupMocks([defaultCheckin, normalCheckin], [normalTrip]);
      mockUpdateCheckin.mockResolvedValue({});

      const { getByTestId } = render(<CheckinsScreen />);
      fireEvent(getByTestId('checkin-card-unassigned'), 'longPress');
      fireEvent.press(getByTestId('move-modal-trip-t1'));

      await waitFor(() => {
        expect(mockUpdateCheckin).toHaveBeenCalledWith(
          'c-default',
          expect.objectContaining({ trip_id: 't1' })
        );
        expect(defaultReload).toHaveBeenCalled();
      });
    });

    it('X 버튼으로 모달을 닫을 수 있다', () => {
      setupMocks([defaultCheckin, normalCheckin], [normalTrip]);

      const { getByTestId, queryByTestId } = render(<CheckinsScreen />);
      fireEvent(getByTestId('checkin-card-unassigned'), 'longPress');
      expect(getByTestId('move-modal-close')).toBeTruthy();

      fireEvent.press(getByTestId('move-modal-close'));
      expect(queryByTestId('move-modal-close')).toBeNull();
    });
  });
});
