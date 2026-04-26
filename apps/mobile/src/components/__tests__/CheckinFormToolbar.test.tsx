import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import CheckinFormToolbar from '../CheckinFormToolbar';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text>{name}</Text>;
  },
}));

const defaultProps = {
  hasPhoto: false,
  hasLocation: false,
  hasCategory: false,
  hasTime: false,
  onPhoto: jest.fn(),
  onPlace: jest.fn(),
  onCategory: jest.fn(),
  onTime: jest.fn(),
};

describe('CheckinFormToolbar', () => {
  beforeEach(() => jest.clearAllMocks());

  it('사진, 장소, 분류, 시각 버튼 레이블을 표시한다', () => {
    render(<CheckinFormToolbar {...defaultProps} />);
    expect(screen.getByText('사진')).toBeTruthy();
    expect(screen.getByText('장소')).toBeTruthy();
    expect(screen.getByText('분류')).toBeTruthy();
    expect(screen.getByText('시각')).toBeTruthy();
  });

  it('사진 버튼을 누르면 onPhoto를 호출한다', () => {
    const onPhoto = jest.fn();
    render(<CheckinFormToolbar {...defaultProps} onPhoto={onPhoto} />);
    fireEvent.press(screen.getByText('사진'));
    expect(onPhoto).toHaveBeenCalledTimes(1);
  });

  it('장소 버튼을 누르면 onPlace를 호출한다', () => {
    const onPlace = jest.fn();
    render(<CheckinFormToolbar {...defaultProps} onPlace={onPlace} />);
    fireEvent.press(screen.getByText('장소'));
    expect(onPlace).toHaveBeenCalledTimes(1);
  });

  it('분류 버튼을 누르면 onCategory를 호출한다', () => {
    const onCategory = jest.fn();
    render(<CheckinFormToolbar {...defaultProps} onCategory={onCategory} />);
    fireEvent.press(screen.getByText('분류'));
    expect(onCategory).toHaveBeenCalledTimes(1);
  });

  it('시각 버튼을 누르면 onTime을 호출한다', () => {
    const onTime = jest.fn();
    render(<CheckinFormToolbar {...defaultProps} onTime={onTime} />);
    fireEvent.press(screen.getByText('시각'));
    expect(onTime).toHaveBeenCalledTimes(1);
  });

  it('active 상태의 버튼 레이블은 강조 색상을 적용한다', () => {
    render(<CheckinFormToolbar {...defaultProps} hasPhoto />);
    const label = screen.getByText('사진');
    expect(StyleSheet.flatten(label.props.style)).toEqual(
      expect.objectContaining({ color: '#FF6B47' }),
    );
  });

  it('inactive 상태의 버튼 레이블은 기본 색상을 적용한다', () => {
    render(<CheckinFormToolbar {...defaultProps} hasPhoto={false} />);
    const label = screen.getByText('사진');
    expect(StyleSheet.flatten(label.props.style)).toEqual(
      expect.objectContaining({ color: '#C4B49A' }),
    );
  });
});
