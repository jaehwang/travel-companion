import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import MapBrowseScreen from '../MapBrowseScreen';
import { useAllCheckins } from '../../hooks/useAllCheckins';

jest.mock('../../lib/supabase', () => ({ supabase: {} }));
jest.mock('../../hooks/useAllCheckins');

jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  const MapView = ({ children, testID }: { children?: React.ReactNode; testID?: string }) => (
    <View testID={testID ?? 'map-view'}>{children}</View>
  );
  MapView.Marker = ({ children }: { children?: React.ReactNode }) => <View>{children}</View>;
  return {
    __esModule: true,
    default: MapView,
    Marker: MapView.Marker,
    PROVIDER_GOOGLE: 'google',
  };
});

jest.mock('@gorhom/bottom-sheet', () => {
  const { View, ScrollView } = require('react-native');
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
      <View testID="bottom-sheet">{children}</View>
    ),
    BottomSheetScrollView: ScrollView,
  };
});

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'denied' }),
  getCurrentPositionAsync: jest.fn(),
}));

jest.mock('expo-image', () => ({
  Image: ({ testID }: { testID?: string; onLoad?: () => void }) => {
    const { View } = require('react-native');
    return <View testID={testID} />;
  },
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, top: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('../../utils/categoryIcons', () => ({
  CATEGORY_META: {
    other: { icon: 'location', color: '#9CA3AF', label: '기타' },
    restaurant: { icon: 'restaurant', color: '#F97316', label: '음식점' },
  },
}));

const mockUseAllCheckins = useAllCheckins as jest.MockedFunction<typeof useAllCheckins>;

function makeCheckin(id: string, lat = 37.5665, lng = 126.978) {
  return {
    id,
    trip_id: 'trip-1',
    title: `장소 ${id}`,
    latitude: lat,
    longitude: lng,
    tags: [],
    checked_in_at: '2026-03-01T10:00:00Z',
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-01T10:00:00Z',
  };
}

describe('MapBrowseScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('마운트 시 로딩 상태를 표시한다', () => {
    mockUseAllCheckins.mockReturnValue({
      checkins: [],
      loading: true,
      error: null,
      reload: jest.fn(),
    });

    render(<MapBrowseScreen />);
    expect(screen.getByTestId('map-loading')).toBeTruthy();
  });

  it('로딩 완료 후 MapView를 렌더링한다', async () => {
    mockUseAllCheckins.mockReturnValue({
      checkins: [makeCheckin('c1')],
      loading: false,
      error: null,
      reload: jest.fn(),
    });

    render(<MapBrowseScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('map-view')).toBeTruthy();
    });
  });

  it('체크인이 없으면 빈 상태가 BottomSheet에 표시된다', async () => {
    mockUseAllCheckins.mockReturnValue({
      checkins: [],
      loading: false,
      error: null,
      reload: jest.fn(),
    });

    render(<MapBrowseScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('sheet-empty')).toBeTruthy();
    });
  });

  it('로딩 완료 후 BottomSheet가 렌더링된다', async () => {
    mockUseAllCheckins.mockReturnValue({
      checkins: [makeCheckin('c1')],
      loading: false,
      error: null,
      reload: jest.fn(),
    });

    render(<MapBrowseScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('bottom-sheet')).toBeTruthy();
    });
  });

  it('에러 상태에서도 화면이 크래시 없이 렌더링된다', () => {
    mockUseAllCheckins.mockReturnValue({
      checkins: [],
      loading: false,
      error: '네트워크 오류',
      reload: jest.fn(),
    });

    expect(() => render(<MapBrowseScreen />)).not.toThrow();
  });
});
