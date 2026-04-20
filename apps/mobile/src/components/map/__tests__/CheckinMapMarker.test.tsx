import React from 'react';
import { render, screen } from '@testing-library/react-native';
import CheckinMapMarker from '../CheckinMapMarker';
import type { Checkin } from '@travel-companion/shared';

jest.mock('expo-image', () => ({
  Image: ({ testID, source }: { testID?: string; source?: unknown; onLoad?: () => void }) => {
    const { View } = require('react-native');
    return <View testID={testID} source={source} />;
  },
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, testID }: { name: string; testID?: string }) => {
    const { Text } = require('react-native');
    return <Text testID={testID ?? `icon-${name}`}>{name}</Text>;
  },
}));

function makeCheckin(overrides: Partial<Checkin> = {}): Checkin {
  return {
    id: 'c1',
    trip_id: 'trip-1',
    title: '테스트 장소',
    latitude: 37.5665,
    longitude: 126.978,
    tags: [],
    checked_in_at: '2026-01-01T10:00:00Z',
    created_at: '2026-01-01T10:00:00Z',
    updated_at: '2026-01-01T10:00:00Z',
    ...overrides,
  };
}

describe('CheckinMapMarker', () => {
  it('photo_url이 있으면 Image를 렌더링한다', () => {
    const checkin = makeCheckin({ photo_url: 'https://example.com/photo.jpg' });
    render(<CheckinMapMarker checkin={checkin} selected={false} />);

    const image = screen.getByTestId('marker-photo');
    expect(image).toBeTruthy();
    expect(image.props.source).toEqual({ uri: 'https://example.com/photo.jpg' });
  });

  it('photo_url이 없으면 카테고리 아이콘을 렌더링한다', () => {
    const checkin = makeCheckin({ photo_url: undefined, category: 'restaurant' });
    render(<CheckinMapMarker checkin={checkin} selected={false} />);

    expect(screen.getByTestId('marker-icon')).toBeTruthy();
    expect(screen.queryByTestId('marker-photo')).toBeNull();
  });

  it('selected=true이면 파란색 테두리를 적용한다', () => {
    const checkin = makeCheckin({ photo_url: 'https://example.com/photo.jpg' });
    render(<CheckinMapMarker checkin={checkin} selected={true} />);

    const circle = screen.getByTestId('marker-circle');
    const borderColor = circle.props.style?.borderColor
      ?? circle.props.style?.find?.((s: Record<string, unknown>) => s?.borderColor)?.borderColor;
    expect(borderColor).toBe('#3B82F6');
  });

  it('selected=false이면 흰색 테두리를 적용한다', () => {
    const checkin = makeCheckin({ photo_url: 'https://example.com/photo.jpg' });
    render(<CheckinMapMarker checkin={checkin} selected={false} />);

    const circle = screen.getByTestId('marker-circle');
    const style = Array.isArray(circle.props.style)
      ? Object.assign({}, ...circle.props.style)
      : circle.props.style;
    expect(style?.borderColor).toBe('#FFFFFF');
  });

  it('마커 하단에 꼬리(tail) 요소를 렌더링한다', () => {
    const checkin = makeCheckin();
    render(<CheckinMapMarker checkin={checkin} selected={false} />);

    expect(screen.getByTestId('marker-tail')).toBeTruthy();
  });

  it('photo_url 없고 category 없으면 기본 아이콘을 표시한다', () => {
    const checkin = makeCheckin({ photo_url: undefined, category: undefined });
    render(<CheckinMapMarker checkin={checkin} selected={false} />);

    expect(screen.getByTestId('marker-icon')).toBeTruthy();
  });
});
