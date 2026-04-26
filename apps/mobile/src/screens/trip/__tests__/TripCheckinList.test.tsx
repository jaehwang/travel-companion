import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import TripCheckinList from '../TripCheckinList';
import type { ListItem } from '../hooks/useTripDetail';
import type { Checkin } from '@travel-companion/shared';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text>{name}</Text>;
  },
}));

jest.mock('../../../components/CheckinCard', () => ({
  __esModule: true,
  default: ({ checkin }: { checkin: Checkin }) => {
    const { Text } = require('react-native');
    return <Text testID={`checkin-card-${checkin.id}`}>{checkin.title}</Text>;
  },
}));

function makeCheckin(id: string): Checkin {
  return {
    id,
    trip_id: 'trip-1',
    title: `장소 ${id}`,
    latitude: 37.5665,
    longitude: 126.978,
    tags: [],
    checked_in_at: '2026-04-01T10:00:00Z',
    created_at: '2026-04-01T10:00:00Z',
    updated_at: '2026-04-01T10:00:00Z',
  };
}

const checkins = [makeCheckin('c1'), makeCheckin('c2')];
const groupedData: ListItem[] = [
  { type: 'date', date: '2026-04-01', label: '2026년 4월 1일 (수)' },
  { type: 'checkin', checkin: checkins[0] },
  { type: 'checkin', checkin: checkins[1] },
];

const defaultProps = {
  loading: false,
  refreshing: false,
  error: null,
  groupedData,
  filteredCheckins: checkins,
  sortOrder: 'newest' as const,
  onSortToggle: jest.fn(),
  onRefresh: jest.fn(),
  onEditCheckin: jest.fn(),
  onDeleteCheckin: jest.fn(),
  ListHeaderComponent: null,
};

describe('TripCheckinList', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loading=true이면 체크인 목록을 표시하지 않는다', () => {
    render(<TripCheckinList {...defaultProps} loading />);
    expect(screen.queryByTestId('list-checkins')).toBeNull();
  });

  it('error가 있으면 에러 메시지를 표시한다', () => {
    render(<TripCheckinList {...defaultProps} error="네트워크 오류" />);
    expect(screen.getByText('네트워크 오류')).toBeTruthy();
  });

  it('체크인 개수를 표시한다', () => {
    render(<TripCheckinList {...defaultProps} />);
    expect(screen.getByText('기록 2곳')).toBeTruthy();
  });

  it('sortOrder=newest이면 "최신순 ↓"을 표시한다', () => {
    render(<TripCheckinList {...defaultProps} sortOrder="newest" />);
    expect(screen.getByText('최신순 ↓')).toBeTruthy();
  });

  it('sortOrder=oldest이면 "오래된순 ↑"을 표시한다', () => {
    render(<TripCheckinList {...defaultProps} sortOrder="oldest" />);
    expect(screen.getByText('오래된순 ↑')).toBeTruthy();
  });

  it('정렬 버튼을 누르면 onSortToggle을 호출한다', () => {
    const onSortToggle = jest.fn();
    render(<TripCheckinList {...defaultProps} onSortToggle={onSortToggle} />);
    fireEvent.press(screen.getByText('최신순 ↓'));
    expect(onSortToggle).toHaveBeenCalledTimes(1);
  });

  it('groupedData가 비어있으면 빈 상태 메시지를 표시한다', () => {
    render(<TripCheckinList {...defaultProps} groupedData={[]} filteredCheckins={[]} />);
    expect(screen.getByText('아직 체크인이 없습니다')).toBeTruthy();
  });

  it('날짜 구분선 레이블을 표시한다', () => {
    render(<TripCheckinList {...defaultProps} />);
    expect(screen.getByText('2026년 4월 1일 (수)')).toBeTruthy();
  });
});
