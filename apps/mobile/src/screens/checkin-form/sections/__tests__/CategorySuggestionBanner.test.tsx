import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import CategorySuggestionBanner from '../CategorySuggestionBanner';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text>{name}</Text>;
  },
}));

describe('CategorySuggestionBanner', () => {
  const defaultProps = {
    category: 'restaurant',
    onAccept: jest.fn(),
    onDismiss: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('추천 카테고리의 한글 레이블을 표시한다', () => {
    render(<CategorySuggestionBanner {...defaultProps} category="restaurant" />);
    expect(screen.getByText('음식점')).toBeTruthy();
  });

  it('"적용" 버튼과 닫기 버튼을 표시한다', () => {
    render(<CategorySuggestionBanner {...defaultProps} />);
    expect(screen.getByTestId('btn-accept-suggestion')).toBeTruthy();
    expect(screen.getByTestId('btn-dismiss-suggestion')).toBeTruthy();
  });

  it('"적용" 버튼을 탭하면 onAccept를 호출한다', () => {
    const onAccept = jest.fn();
    render(<CategorySuggestionBanner {...defaultProps} onAccept={onAccept} />);
    fireEvent.press(screen.getByTestId('btn-accept-suggestion'));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('닫기 버튼을 탭하면 onDismiss를 호출한다', () => {
    const onDismiss = jest.fn();
    render(<CategorySuggestionBanner {...defaultProps} onDismiss={onDismiss} />);
    fireEvent.press(screen.getByTestId('btn-dismiss-suggestion'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('카테고리별로 다른 레이블을 표시한다', () => {
    render(<CategorySuggestionBanner {...defaultProps} category="cafe" />);
    expect(screen.getByText('카페')).toBeTruthy();
  });
});
