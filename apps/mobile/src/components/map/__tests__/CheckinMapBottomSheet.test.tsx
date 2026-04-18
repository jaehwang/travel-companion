import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import CheckinMapBottomSheet from '../CheckinMapBottomSheet';
import type { Checkin } from '@travel-companion/shared';

// @gorhom/bottom-sheet를 단순 View로 모킹
jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View, ScrollView } = require('react-native');
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
      <View testID="bottom-sheet">{children}</View>
    ),
    BottomSheetScrollView: ScrollView,
  };
});

jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, testID }: { name: string; testID?: string }) => {
    const { Text } = require('react-native');
    return <Text testID={testID ?? `icon-${name}`}>{name}</Text>;
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, top: 0, left: 0, right: 0 }),
}));

function makeCheckin(id: string, overrides: Partial<Checkin> = {}): Checkin {
  return {
    id,
    trip_id: 'trip-1',
    title: `장소 ${id}`,
    latitude: 37.5665,
    longitude: 126.978,
    tags: [],
    checked_in_at: '2026-03-15T10:00:00Z',
    created_at: '2026-03-15T10:00:00Z',
    updated_at: '2026-03-15T10:00:00Z',
    ...overrides,
  };
}

const defaultProps = {
  allCheckins: [makeCheckin('c1'), makeCheckin('c2'), makeCheckin('c3')],
  selectedCheckins: null as Checkin[] | null,
  headerTitle: null as string | null,
  onCheckinPress: jest.fn(),
};

describe('CheckinMapBottomSheet', () => {
  beforeEach(() => jest.clearAllMocks());

  it('초기 상태(selectedCheckins=null)에서 헤더가 표시되지 않는다', () => {
    render(<CheckinMapBottomSheet {...defaultProps} />);
    expect(screen.queryByTestId('sheet-header')).toBeNull();
  });

  it('selectedCheckins가 있고 headerTitle이 있으면 헤더가 표시된다', () => {
    render(
      <CheckinMapBottomSheet
        {...defaultProps}
        selectedCheckins={[makeCheckin('c1')]}
        headerTitle="2026년 3월 · 제주 여행"
      />
    );
    expect(screen.getByTestId('sheet-header')).toBeTruthy();
    expect(screen.getByText('2026년 3월 · 제주 여행')).toBeTruthy();
  });

  it('selectedCheckins=null이면 allCheckins 전체를 그리드에 표시한다', () => {
    render(<CheckinMapBottomSheet {...defaultProps} />);
    expect(screen.getAllByTestId('checkin-card')).toHaveLength(3);
  });

  it('selectedCheckins가 있으면 해당 체크인만 그리드에 표시한다', () => {
    render(
      <CheckinMapBottomSheet
        {...defaultProps}
        selectedCheckins={[makeCheckin('c1')]}
        headerTitle="2026년 3월"
      />
    );
    expect(screen.getAllByTestId('checkin-card')).toHaveLength(1);
  });

  it('체크인 카드를 탭하면 onCheckinPress 콜백이 해당 체크인과 함께 호출된다', () => {
    const onCheckinPress = jest.fn();
    const checkin = makeCheckin('c1');
    render(
      <CheckinMapBottomSheet
        {...defaultProps}
        allCheckins={[checkin]}
        onCheckinPress={onCheckinPress}
      />
    );

    fireEvent.press(screen.getAllByTestId('checkin-card')[0]);
    expect(onCheckinPress).toHaveBeenCalledTimes(1);
    expect(onCheckinPress).toHaveBeenCalledWith(checkin);
  });

  it('allCheckins가 비어 있으면 빈 상태 메시지를 표시한다', () => {
    render(
      <CheckinMapBottomSheet
        {...defaultProps}
        allCheckins={[]}
      />
    );
    expect(screen.getByTestId('sheet-empty')).toBeTruthy();
    expect(screen.queryAllByTestId('checkin-card')).toHaveLength(0);
  });

  it('selectedCheckins가 빈 배열이면 빈 상태 메시지를 표시한다', () => {
    render(
      <CheckinMapBottomSheet
        {...defaultProps}
        selectedCheckins={[]}
        headerTitle="2026년 3월"
      />
    );
    expect(screen.getByTestId('sheet-empty')).toBeTruthy();
  });

  it('체크인 카드에 제목이 표시된다', () => {
    const checkin = makeCheckin('c1', { title: '경복궁' });
    render(
      <CheckinMapBottomSheet
        {...defaultProps}
        allCheckins={[checkin]}
      />
    );
    expect(screen.getByText('경복궁')).toBeTruthy();
  });
});
