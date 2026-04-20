import React from 'react';
import { render, screen } from '@testing-library/react-native';
import ClusterMarker from '../ClusterMarker';

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

describe('ClusterMarker', () => {
  it('카운트 숫자를 뱃지에 표시한다', () => {
    render(<ClusterMarker count={5} photoUrl={undefined} />);

    expect(screen.getByTestId('cluster-count')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('photoUrl이 있으면 Image를 렌더링한다', () => {
    render(<ClusterMarker count={3} photoUrl="https://example.com/photo.jpg" />);

    const image = screen.getByTestId('cluster-photo');
    expect(image).toBeTruthy();
    expect(image.props.source).toEqual({ uri: 'https://example.com/photo.jpg' });
  });

  it('photoUrl이 없으면 아이콘을 표시한다', () => {
    render(<ClusterMarker count={3} photoUrl={undefined} />);

    expect(screen.getByTestId('cluster-icon')).toBeTruthy();
    expect(screen.queryByTestId('cluster-photo')).toBeNull();
  });

  it('카운트 뱃지는 파란 배경(#3B82F6)이다', () => {
    render(<ClusterMarker count={7} photoUrl={undefined} />);

    const badge = screen.getByTestId('cluster-badge');
    const style = Array.isArray(badge.props.style)
      ? Object.assign({}, ...badge.props.style)
      : badge.props.style;
    expect(style?.backgroundColor).toBe('#3B82F6');
  });

  it('단일 마커(52px)보다 클러스터 마커(64px)가 크다', () => {
    render(<ClusterMarker count={2} photoUrl={undefined} />);

    const circle = screen.getByTestId('cluster-circle');
    const style = Array.isArray(circle.props.style)
      ? Object.assign({}, ...circle.props.style)
      : circle.props.style;
    expect(style?.width).toBeGreaterThanOrEqual(64);
    expect(style?.height).toBeGreaterThanOrEqual(64);
  });
});
