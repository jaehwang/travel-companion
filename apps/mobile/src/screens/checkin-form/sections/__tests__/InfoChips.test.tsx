import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import InfoChips from '../InfoChips';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text>{name}</Text>;
  },
}));

describe('InfoChips', () => {
  const checkedInAt = new Date('2026-03-20T10:30:00+09:00');

  it('위치, 카테고리, 시간 정보가 모두 있으면 각 칩을 렌더링한다', () => {
    render(
      <InfoChips
        latitude={37.5665}
        longitude={126.978}
        place="광화문"
        category="cafe"
        checkedInAt={checkedInAt}
        catColor="#F59E0B"
        catIconName="cafe-outline"
        onClearLocation={jest.fn()}
        onClearCategory={jest.fn()}
        onClearTime={jest.fn()}
      />,
    );

    expect(screen.getByText('광화문')).toBeTruthy();
    expect(screen.getByText('카페')).toBeTruthy();
    expect(
      screen.getByText(
        new Intl.DateTimeFormat('ko-KR', {
          month: 'long',
          day: 'numeric',
          weekday: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }).format(checkedInAt),
      ),
    ).toBeTruthy();
  });

  it('카테고리 칩에 전달된 색상을 유지하고 누르면 clear 콜백을 호출한다', () => {
    const onClearCategory = jest.fn();

    render(
      <InfoChips
        latitude={undefined}
        longitude={undefined}
        place=""
        category="cafe"
        checkedInAt={null}
        catColor="#F59E0B"
        catIconName="cafe-outline"
        onClearLocation={jest.fn()}
        onClearCategory={onClearCategory}
        onClearTime={jest.fn()}
      />,
    );

    const categoryLabel = screen.getByText('카페');
    fireEvent.press(categoryLabel.parent!);

    expect(StyleSheet.flatten(categoryLabel.props.style)).toEqual(
      expect.objectContaining({ color: '#F59E0B' }),
    );
    expect(onClearCategory).toHaveBeenCalledTimes(1);
  });

  it('위치 칩을 누르면 onClearLocation을 호출한다', () => {
    const onClearLocation = jest.fn();

    render(
      <InfoChips
        latitude={37.5665}
        longitude={126.978}
        place="광화문"
        category=""
        checkedInAt={null}
        catColor="#F59E0B"
        catIconName="cafe-outline"
        onClearLocation={onClearLocation}
        onClearCategory={jest.fn()}
        onClearTime={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByText('광화문').parent!);

    expect(onClearLocation).toHaveBeenCalledTimes(1);
  });
});
