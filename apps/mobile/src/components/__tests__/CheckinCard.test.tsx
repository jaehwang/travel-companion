import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';
import CheckinCard from '../CheckinCard';
import type { Checkin } from '@travel-companion/shared';

jest.mock('expo-image', () => ({ Image: 'Image' }));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text>{name}</Text>;
  },
}));

jest.mock('../PhotoViewerModal', () => ({
  __esModule: true,
  default: () => null,
}));

function makeCheckin(overrides: Partial<Checkin> = {}): Checkin {
  return {
    id: 'c1',
    trip_id: 'trip-1',
    title: '광화문',
    category: 'attraction',
    latitude: 37.5665,
    longitude: 126.978,
    checked_in_at: '2026-04-26T10:30:00Z',
    tags: [],
    created_at: '2026-04-26T10:30:00Z',
    updated_at: '2026-04-26T10:30:00Z',
    ...overrides,
  };
}

describe('CheckinCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  });

  it('제목을 표시한다', () => {
    render(<CheckinCard checkin={makeCheckin()} />);
    expect(screen.getByText('광화문')).toBeTruthy();
  });

  it('title이 없으면 기본 텍스트를 표시한다', () => {
    render(<CheckinCard checkin={makeCheckin({ title: undefined })} />);
    expect(screen.getByText('이름 없는 장소')).toBeTruthy();
  });

  it('카테고리 라벨을 표시한다', () => {
    render(<CheckinCard checkin={makeCheckin({ category: 'cafe' })} />);
    expect(screen.getByText('카페')).toBeTruthy();
  });

  it('메모를 표시한다', () => {
    render(<CheckinCard checkin={makeCheckin({ message: '아름다운 곳이었다' })} />);
    expect(screen.getByText('아름다운 곳이었다')).toBeTruthy();
  });

  it('메모가 없으면 표시하지 않는다', () => {
    render(<CheckinCard checkin={makeCheckin({ message: undefined })} />);
    expect(screen.queryByText('아름다운 곳이었다')).toBeNull();
  });

  it('태그를 최대 3개까지 표시하고 나머지는 +N으로 표시한다', () => {
    render(<CheckinCard checkin={makeCheckin({ tags: ['a', 'b', 'c', 'd'] })} />);
    expect(screen.getByText('#a')).toBeTruthy();
    expect(screen.getByText('#b')).toBeTruthy();
    expect(screen.getByText('#c')).toBeTruthy();
    expect(screen.queryByText('#d')).toBeNull();
    expect(screen.getByText('+1')).toBeTruthy();
  });

  it('place_id가 있으면 Google Maps place URL을 연다', () => {
    render(
      <CheckinCard
        checkin={makeCheckin({ title: '경복궁', place: '광화문', place_id: 'ChIJplace123' })}
      />,
    );
    fireEvent.press(screen.getByText('광화문'));
    expect(Linking.openURL).toHaveBeenCalledWith(
      expect.stringContaining('query_place_id=ChIJplace123'),
    );
  });

  it('place_id가 없으면 좌표 URL을 연다', () => {
    render(
      <CheckinCard
        checkin={makeCheckin({ place_id: undefined, latitude: 37.5665, longitude: 126.978 })}
      />,
    );
    fireEvent.press(screen.getByText('지도에서 보기'));
    expect(Linking.openURL).toHaveBeenCalledWith(
      'https://www.google.com/maps?q=37.5665,126.978',
    );
  });

  it('onEdit, onDelete가 모두 없으면 메뉴 버튼을 표시하지 않는다', () => {
    render(<CheckinCard checkin={makeCheckin()} />);
    expect(screen.queryByText('⋮')).toBeNull();
  });

  it('onEdit이 있으면 메뉴 버튼을 표시한다', () => {
    render(<CheckinCard checkin={makeCheckin()} onEdit={jest.fn()} />);
    expect(screen.getByText('⋮')).toBeTruthy();
  });

  it('메뉴에서 수정을 누르면 onEdit을 호출한다', () => {
    const onEdit = jest.fn();
    const checkin = makeCheckin();
    render(<CheckinCard checkin={checkin} onEdit={onEdit} />);
    fireEvent.press(screen.getByText('⋮'));

    const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0];
    const editButton = buttons.find((b: { text: string }) => b.text === '수정');
    editButton.onPress();
    expect(onEdit).toHaveBeenCalledWith(checkin);
  });

  it('메뉴에서 삭제를 누르면 확인 Alert를 띄운다', () => {
    const onDelete = jest.fn();
    render(<CheckinCard checkin={makeCheckin()} onDelete={onDelete} />);
    fireEvent.press(screen.getByText('⋮'));

    const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0];
    const deleteButton = buttons.find((b: { text: string }) => b.text === '삭제');
    deleteButton.onPress();

    const [title] = (Alert.alert as jest.Mock).mock.calls[1];
    expect(title).toBe('삭제 확인');
  });
});
