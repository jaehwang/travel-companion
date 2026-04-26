import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { HomeQuickCheckinCard, HomeTripList } from '../HomeScreenSections';
import type { Trip } from '@travel-companion/shared';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text>{name}</Text>;
  },
}));

function makeTrip(id: string): Trip {
  return {
    id,
    title: `여행 ${id}`,
    is_public: false,
    is_frequent: false,
    is_default: false,
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
  };
}

describe('HomeQuickCheckinCard', () => {
  it('statusText를 표시한다', () => {
    render(<HomeQuickCheckinCard statusText="3개 여행 근처" isActive={false} onPress={jest.fn()} />);
    expect(screen.getByText('3개 여행 근처')).toBeTruthy();
  });

  it('라벨 텍스트를 표시한다', () => {
    render(<HomeQuickCheckinCard statusText="" isActive={false} onPress={jest.fn()} />);
    expect(screen.getByText('자주 가는 곳에 체크인하기')).toBeTruthy();
  });

  it('카드를 누르면 onPress를 호출한다', () => {
    const onPress = jest.fn();
    render(<HomeQuickCheckinCard statusText="" isActive={false} onPress={onPress} />);
    fireEvent.press(screen.getByText('자주 가는 곳에 체크인하기'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('HomeTripList', () => {
  const renderTrip = ({ item }: { item: Trip }) => {
    const { Text } = require('react-native');
    return <Text testID={`trip-item-${item.id}`}>{item.title}</Text>;
  };

  const defaultProps = {
    trips: [makeTrip('t1'), makeTrip('t2')],
    loading: false,
    refreshing: false,
    error: null,
    onRefresh: jest.fn().mockResolvedValue(undefined),
    reload: jest.fn().mockResolvedValue(undefined),
    renderTrip,
  };

  beforeEach(() => jest.clearAllMocks());

  it('loading=true이고 refreshing=false이면 목록을 표시하지 않는다', () => {
    render(<HomeTripList {...defaultProps} loading refreshing={false} trips={[]} />);
    expect(screen.queryByTestId('list-trips')).toBeNull();
  });

  it('에러가 있으면 에러 메시지를 표시한다', () => {
    render(<HomeTripList {...defaultProps} error="연결 실패" />);
    expect(screen.getByText('연결 실패')).toBeTruthy();
  });

  it('에러 상태에서 "다시 시도" 버튼을 표시한다', () => {
    render(<HomeTripList {...defaultProps} error="연결 실패" />);
    expect(screen.getByText('다시 시도')).toBeTruthy();
  });

  it('"다시 시도"를 누르면 reload를 호출한다', () => {
    const reload = jest.fn().mockResolvedValue(undefined);
    render(<HomeTripList {...defaultProps} error="연결 실패" reload={reload} />);
    fireEvent.press(screen.getByText('다시 시도'));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('여행이 없으면 빈 상태 메시지를 표시한다', () => {
    render(<HomeTripList {...defaultProps} trips={[]} />);
    expect(screen.getByText('아직 여행이 없습니다')).toBeTruthy();
  });
});
