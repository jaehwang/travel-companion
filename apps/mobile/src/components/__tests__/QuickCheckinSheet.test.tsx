import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import QuickCheckinSheet from '../QuickCheckinSheet';
import * as Location from 'expo-location';
import { fetchNearbyCheckins, updateCheckin } from '../../lib/api';

jest.mock('react-native/Libraries/Modal/Modal', () => ({
  __esModule: true,
  default: ({ children, visible }: { children: React.ReactNode; visible: boolean }) =>
    visible ? children : null,
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

jest.mock('../../lib/api', () => ({
  fetchNearbyCheckins: jest.fn(),
  updateCheckin: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text>{name}</Text>;
  },
}));

const mockRequestForegroundPermissionsAsync =
  Location.requestForegroundPermissionsAsync as jest.MockedFunction<
    typeof Location.requestForegroundPermissionsAsync
  >;
const mockGetCurrentPositionAsync = Location.getCurrentPositionAsync as jest.MockedFunction<
  typeof Location.getCurrentPositionAsync
>;
const mockFetchNearbyCheckins = fetchNearbyCheckins as jest.MockedFunction<typeof fetchNearbyCheckins>;
const mockUpdateCheckin = updateCheckin as jest.MockedFunction<typeof updateCheckin>;

const now = new Date('2026-04-25T12:00:00Z');

function makeNearbyCheckin(
  id: string,
  overrides: Partial<Awaited<ReturnType<typeof fetchNearbyCheckins>>[number]> = {},
) {
  return {
    id,
    trip_id: 'trip-1',
    trip_title: '서울 단골',
    title: `장소 ${id}`,
    place: `장소 ${id}`,
    latitude: 37.5665,
    longitude: 126.978,
    checked_in_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
    distance: 120,
    ...overrides,
  };
}

describe('QuickCheckinSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(now);
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

    mockRequestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
    mockGetCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 37.5665, longitude: 126.978 },
    } as any);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('같은 여행의 체크인을 그룹으로 묶고 최근 체크인을 현재 상태로 표시한다', async () => {
    mockFetchNearbyCheckins.mockResolvedValue([
      makeNearbyCheckin('current', {
        trip_id: 'trip-1',
        trip_title: '서울 단골',
        title: '광화문',
        checked_in_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
      }),
      makeNearbyCheckin('older', {
        trip_id: 'trip-1',
        trip_title: '서울 단골',
        title: '을지로',
        checked_in_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
      }),
      makeNearbyCheckin('busan', {
        trip_id: 'trip-2',
        trip_title: '부산 단골',
        title: '광안리',
      }),
    ]);

    render(<QuickCheckinSheet visible onClose={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('서울 단골')).toBeTruthy();
      expect(screen.getByText('부산 단골')).toBeTruthy();
      expect(screen.getByText('현재: 광화문 · 5분 전')).toBeTruthy();
    });
  });

  it('체크인 성공 시 updateCheckin, onCheckedIn, onClose를 호출한다', async () => {
    const onCheckedIn = jest.fn();
    const onClose = jest.fn();
    mockFetchNearbyCheckins.mockResolvedValue([
      makeNearbyCheckin('current', { title: '광화문' }),
      makeNearbyCheckin('next', {
        title: '을지로',
        checked_in_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
      }),
    ]);
    mockUpdateCheckin.mockResolvedValue({} as any);

    render(<QuickCheckinSheet visible onClose={onClose} onCheckedIn={onCheckedIn} />);

    await waitFor(() => expect(screen.getByText('체크인')).toBeTruthy());

    fireEvent.press(screen.getByText('체크인'));

    await waitFor(() => {
      expect(mockUpdateCheckin).toHaveBeenCalledWith(
        'next',
        expect.objectContaining({ checked_in_at: expect.any(String) }),
      );
    });
    expect(onCheckedIn).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'next', title: '을지로', checked_in_at: expect.any(String) }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('위치 권한이 거부되면 오류 메시지를 보여준다', async () => {
    mockRequestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' } as any);
    mockFetchNearbyCheckins.mockResolvedValue([]);

    render(<QuickCheckinSheet visible onClose={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('위치 권한이 필요합니다.')).toBeTruthy();
    });
  });
});
