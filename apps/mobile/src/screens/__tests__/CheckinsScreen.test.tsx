import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CheckinsScreen from '../CheckinsScreen';
import { useAllCheckins } from '../../hooks/useAllCheckins';
import { useTrips } from '../../hooks/useTrips';

jest.mock('../../lib/supabase', () => ({ supabase: {} }));
jest.mock('../../hooks/useAllCheckins');
jest.mock('../../hooks/useTrips');
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

const makeTrip = (id: string, title: string, isFrequent: boolean) => ({
  id,
  title,
  is_public: false,
  is_frequent: isFrequent,
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
});

const makeCheckin = (id: string, tripId: string, title: string) => ({
  id,
  trip_id: tripId,
  title,
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
});
