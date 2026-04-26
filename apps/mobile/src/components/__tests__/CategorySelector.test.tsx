import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import CategorySelector from '../CategorySelector';

jest.mock('react-native/Libraries/Modal/Modal', () => {
  return {
    __esModule: true,
    default: ({ children, visible }: { children: React.ReactNode; visible: boolean }) =>
      visible ? children : null,
  };
});

jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text>{name}</Text>;
  },
}));

describe('CategorySelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('선택된 카테고리에 강조 스타일을 적용한다', () => {
    render(
      <CategorySelector
        visible
        selected="cafe"
        onSelect={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    const selectedLabel = screen.getByText('카페');
    const selectedItem = selectedLabel.parent?.parent;

    expect(StyleSheet.flatten(selectedLabel.props.style)).toEqual(
      expect.objectContaining({ color: '#F59E0B', fontWeight: '800' }),
    );
    expect(StyleSheet.flatten(selectedItem?.props.style)).toEqual(
      expect.objectContaining({ borderColor: '#F59E0B', backgroundColor: '#F59E0B14' }),
    );
  });

  it('카테고리를 누르면 onSelect와 onClose를 순서대로 호출한다', () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();

    render(
      <CategorySelector
        visible
        selected="other"
        onSelect={onSelect}
        onClose={onClose}
      />,
    );

    const restaurantLabel = screen.getByText('음식점');
    fireEvent.press(restaurantLabel.parent!);

    expect(onSelect).toHaveBeenCalledWith('restaurant');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
