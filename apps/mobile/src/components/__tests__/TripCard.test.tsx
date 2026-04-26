import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import TripCard from '../TripCard';
import type { Trip } from '@travel-companion/shared';

jest.mock('expo-image', () => ({ Image: 'Image' }));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text>{name}</Text>;
  },
}));

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 't1',
    title: '서울 여행',
    is_public: false,
    is_frequent: false,
    is_default: false,
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
    ...overrides,
  };
}

describe('TripCard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('제목을 표시한다', () => {
    render(<TripCard trip={makeTrip()} onPress={jest.fn()} />);
    expect(screen.getByText('서울 여행')).toBeTruthy();
  });

  it('설명이 있으면 표시한다', () => {
    render(<TripCard trip={makeTrip({ description: '즐거운 서울 여행' })} onPress={jest.fn()} />);
    expect(screen.getByText('즐거운 서울 여행')).toBeTruthy();
  });

  it('start_date가 있으면 날짜 텍스트를 표시한다', () => {
    render(<TripCard trip={makeTrip({ start_date: '2026-04-15' })} onPress={jest.fn()} />);
    expect(screen.getByText(/2026/)).toBeTruthy();
  });

  it('날짜가 없으면 날짜 미정을 표시한다', () => {
    render(
      <TripCard
        trip={makeTrip({ start_date: undefined, first_checkin_date: undefined })}
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByText('날짜 미정')).toBeTruthy();
  });

  it('is_public이면 공개 배지를 표시한다', () => {
    render(<TripCard trip={makeTrip({ is_public: true })} onPress={jest.fn()} />);
    expect(screen.getByText('공개')).toBeTruthy();
  });

  it('is_public이 false이면 비공개 배지를 표시한다', () => {
    render(<TripCard trip={makeTrip({ is_public: false })} onPress={jest.fn()} />);
    expect(screen.getByText('비공개')).toBeTruthy();
  });

  it('is_frequent이면 자주 가는 곳 배지를 표시한다', () => {
    render(<TripCard trip={makeTrip({ is_frequent: true })} onPress={jest.fn()} />);
    expect(screen.getByText('자주 가는 곳')).toBeTruthy();
  });

  it('is_frequent이 false이면 자주 가는 곳 배지를 표시하지 않는다', () => {
    render(<TripCard trip={makeTrip({ is_frequent: false })} onPress={jest.fn()} />);
    expect(screen.queryByText('자주 가는 곳')).toBeNull();
  });

  it('카드를 누르면 onPress를 호출한다', () => {
    const onPress = jest.fn();
    render(<TripCard trip={makeTrip()} onPress={onPress} />);
    fireEvent.press(screen.getByTestId('trip-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('onMenuPress가 있으면 케밥 메뉴를 표시한다', () => {
    render(<TripCard trip={makeTrip()} onPress={jest.fn()} onMenuPress={jest.fn()} />);
    expect(screen.getByText('⋮')).toBeTruthy();
  });

  it('케밥 메뉴를 누르면 onMenuPress를 호출한다', () => {
    const onMenuPress = jest.fn();
    render(<TripCard trip={makeTrip()} onPress={jest.fn()} onMenuPress={onMenuPress} />);
    fireEvent.press(screen.getByText('⋮'));
    expect(onMenuPress).toHaveBeenCalledTimes(1);
  });

  it('onMenuPress가 없으면 케밥 메뉴를 표시하지 않는다', () => {
    render(<TripCard trip={makeTrip()} onPress={jest.fn()} />);
    expect(screen.queryByText('⋮')).toBeNull();
  });
});
