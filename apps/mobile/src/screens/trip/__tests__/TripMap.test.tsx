import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import TripMap from '../TripMap';
import type { Checkin, Trip } from '@travel-companion/shared';

jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  const MapView = ({ children, testID }: { children?: React.ReactNode; testID?: string }) => (
    <View testID={testID ?? 'trip-map-view'}>{children}</View>
  );
  const Marker = ({
    children,
    onPress,
    testID,
  }: {
    children?: React.ReactNode;
    onPress?: () => void;
    testID?: string;
  }) => (
    <View testID={testID} onTouchEnd={onPress}>
      {children}
    </View>
  );
  return {
    __esModule: true,
    default: MapView,
    Marker,
    PROVIDER_GOOGLE: 'google',
  };
});

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'denied' }),
  getCurrentPositionAsync: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, testID }: { name: string; testID?: string }) => {
    const { Text } = require('react-native');
    return <Text testID={testID ?? `icon-${name}`}>{name}</Text>;
  },
}));

const mockTrip: Trip = {
  id: 'trip-1',
  title: '제주 여행',
  is_public: false,
  is_frequent: false,
  is_default: false,
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
};

function makeCheckin(id: string, lat = 37.5665, lng = 126.978): Checkin {
  return {
    id,
    trip_id: 'trip-1',
    title: `장소 ${id}`,
    latitude: lat,
    longitude: lng,
    tags: [],
    checked_in_at: `2026-03-0${id}T10:00:00Z`,
    created_at: `2026-03-0${id}T10:00:00Z`,
    updated_at: `2026-03-0${id}T10:00:00Z`,
  };
}

describe('TripMap', () => {
  it('각 체크인마다 순서 번호 마커를 렌더링한다', () => {
    const checkins = [
      makeCheckin('1', 37.5665, 126.978),
      makeCheckin('2', 37.5700, 126.982),
      makeCheckin('3', 37.5720, 126.990),
    ];
    render(<TripMap checkins={checkins} trip={mockTrip} />);

    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('체크인이 없어도 크래시 없이 렌더링된다', () => {
    expect(() => render(<TripMap checkins={[]} trip={mockTrip} />)).not.toThrow();
  });

  it('마커 탭 시 info card가 표시된다', () => {
    const checkins = [
      makeCheckin('1', 37.5665, 126.978),
      makeCheckin('2', 37.5700, 126.982),
    ];
    render(<TripMap checkins={checkins} trip={mockTrip} />);

    expect(screen.queryByText('장소 1')).toBeNull();
    fireEvent(screen.getByText('1'), 'touchEnd');
    expect(screen.getByText('장소 1')).toBeTruthy();
  });
});
