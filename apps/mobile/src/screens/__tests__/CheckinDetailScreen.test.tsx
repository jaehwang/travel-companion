import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import CheckinDetailScreen from '../CheckinDetailScreen';
import type { Checkin } from '@travel-companion/shared';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, testID }: { name: string; testID?: string }) => {
    const { Text } = require('react-native');
    return <Text testID={testID ?? `icon-${name}`}>{name}</Text>;
  },
}));

const mockUseRoute = jest.fn(() => ({ params: { checkin: mockCheckin } }));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
  useRoute: () => mockUseRoute(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34 }),
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../utils/categoryIcons', () => ({
  CATEGORY_META: {
    other: { icon: 'location', color: '#9CA3AF', label: '기타' },
    restaurant: { icon: 'restaurant', color: '#F97316', label: '음식점' },
    cafe: { icon: 'cafe', color: '#92400E', label: '카페' },
  },
}));

const mockGoBack = jest.fn();

const mockCheckin: Checkin = {
  id: 'c1',
  trip_id: 'trip-1',
  title: '경복궁',
  place: '경복궁 정문',
  category: 'attraction',
  message: '멋진 곳이었다',
  tags: ['여행', '서울'],
  latitude: 37.5796,
  longitude: 126.9770,
  photo_url: 'https://example.com/photo.jpg',
  checked_in_at: '2026-03-15T14:30:00Z',
  created_at: '2026-03-15T14:30:00Z',
  updated_at: '2026-03-15T14:30:00Z',
};

describe('CheckinDetailScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('체크인 제목을 렌더링한다', () => {
    render(<CheckinDetailScreen />);
    expect(screen.getByText('경복궁')).toBeTruthy();
  });

  it('photo_url이 있으면 Image를 렌더링한다', () => {
    render(<CheckinDetailScreen />);
    const image = screen.getByTestId('detail-photo');
    expect(image).toBeTruthy();
    expect(image.props.source).toEqual({ uri: 'https://example.com/photo.jpg' });
  });

  it('장소명을 렌더링한다', () => {
    render(<CheckinDetailScreen />);
    expect(screen.getByText('경복궁 정문')).toBeTruthy();
  });

  it('메시지를 렌더링한다', () => {
    render(<CheckinDetailScreen />);
    expect(screen.getByText('멋진 곳이었다')).toBeTruthy();
  });

  it('태그를 렌더링한다', () => {
    render(<CheckinDetailScreen />);
    expect(screen.getByText('#여행')).toBeTruthy();
    expect(screen.getByText('#서울')).toBeTruthy();
  });

  it('뒤로가기 버튼 탭 시 navigation.goBack()을 호출한다', () => {
    render(<CheckinDetailScreen />);
    fireEvent.press(screen.getByTestId('btn-back'));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('photo_url이 없어도 크래시 없이 렌더링된다', () => {
    mockUseRoute.mockReturnValueOnce({
      params: { checkin: { ...mockCheckin, photo_url: undefined } },
    });
    expect(() => render(<CheckinDetailScreen />)).not.toThrow();
  });
});
