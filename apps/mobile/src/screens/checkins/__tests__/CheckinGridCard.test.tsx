import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';
import { CheckinGridCard, formatDateTime } from '../CheckinGridCard';
import type { Checkin, Trip } from '@travel-companion/shared';

jest.mock('expo-image', () => ({ Image: 'Image' }));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text>{name}</Text>;
  },
}));

function makeCheckin(overrides: Partial<Checkin> = {}): Checkin {
  return {
    id: 'c1',
    trip_id: 'trip-1',
    title: '경복궁',
    latitude: 37.5759,
    longitude: 126.9769,
    tags: [],
    checked_in_at: '2026-04-26T10:30:00Z',
    created_at: '2026-04-26T10:30:00Z',
    updated_at: '2026-04-26T10:30:00Z',
    ...overrides,
  };
}

function makeTrip(id: string, title: string): Trip {
  return {
    id,
    title,
    is_public: false,
    is_frequent: false,
    is_default: false,
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
  };
}

const defaultProps = {
  tripMap: new Map([['trip-1', makeTrip('trip-1', '서울 여행')]]),
  onPress: jest.fn(),
  onLongPress: jest.fn(),
  onEdit: jest.fn(),
  onDelete: jest.fn(),
};

describe('formatDateTime', () => {
  it('날짜(월/일)와 시간(AM/PM 또는 오전/오후)을 포함한 문자열을 반환한다', () => {
    const result = formatDateTime('2026-04-26T01:30:00Z');
    expect(result).toMatch(/\d+\/\d+/);
    expect(result).toMatch(/AM|PM|오전|오후/);
  });
});

describe('CheckinGridCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  });

  it('제목을 표시한다', () => {
    render(<CheckinGridCard checkin={makeCheckin()} {...defaultProps} />);
    expect(screen.getByText('경복궁')).toBeTruthy();
  });

  it('title이 없으면 "이름 없는 장소"를 표시한다', () => {
    render(<CheckinGridCard checkin={makeCheckin({ title: undefined })} {...defaultProps} />);
    expect(screen.getByText('이름 없는 장소')).toBeTruthy();
  });

  it('tripMap에 여행이 있으면 여행 제목을 표시한다', () => {
    render(<CheckinGridCard checkin={makeCheckin()} {...defaultProps} />);
    expect(screen.getByText('서울 여행')).toBeTruthy();
  });

  it('tripMap에 여행이 없으면 "미할당" 배지를 표시한다', () => {
    render(<CheckinGridCard checkin={makeCheckin()} {...defaultProps} tripMap={new Map()} />);
    expect(screen.getByTestId('badge-unassigned')).toBeTruthy();
  });

  it('태그를 최대 2개까지 표시하고 나머지를 +N으로 표시한다', () => {
    render(<CheckinGridCard checkin={makeCheckin({ tags: ['a', 'b', 'c'] })} {...defaultProps} />);
    expect(screen.getByText('#a')).toBeTruthy();
    expect(screen.getByText('#b')).toBeTruthy();
    expect(screen.queryByText('#c')).toBeNull();
    expect(screen.getByText('+1')).toBeTruthy();
  });

  it('카드를 누르면 onPress에 체크인과 여행을 전달하여 호출한다', () => {
    const onPress = jest.fn();
    const checkin = makeCheckin();
    const trip = makeTrip('trip-1', '서울 여행');
    render(<CheckinGridCard checkin={checkin} {...defaultProps} onPress={onPress} />);
    fireEvent.press(screen.getByTestId('checkin-card-c1'));
    expect(onPress).toHaveBeenCalledWith(checkin, trip);
  });

  it('카드를 길게 누르면 onLongPress에 체크인을 전달하여 호출한다', () => {
    const onLongPress = jest.fn();
    const checkin = makeCheckin();
    render(<CheckinGridCard checkin={checkin} {...defaultProps} onLongPress={onLongPress} />);
    fireEvent(screen.getByTestId('checkin-card-c1'), 'longPress');
    expect(onLongPress).toHaveBeenCalledWith(checkin);
  });

  it('메뉴에서 수정을 선택하면 onEdit을 호출한다', () => {
    const onEdit = jest.fn();
    const checkin = makeCheckin();
    render(<CheckinGridCard checkin={checkin} {...defaultProps} onEdit={onEdit} />);
    fireEvent.press(screen.getByText('⋮'));
    const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0];
    buttons.find((b: { text: string }) => b.text === '수정').onPress();
    expect(onEdit).toHaveBeenCalledWith(checkin);
  });

  it('메뉴에서 삭제를 선택하면 확인 Alert를 표시한다', () => {
    render(<CheckinGridCard checkin={makeCheckin()} {...defaultProps} />);
    fireEvent.press(screen.getByText('⋮'));
    const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0];
    buttons.find((b: { text: string }) => b.text === '삭제').onPress();
    const [title] = (Alert.alert as jest.Mock).mock.calls[1];
    expect(title).toBe('삭제 확인');
  });
});
