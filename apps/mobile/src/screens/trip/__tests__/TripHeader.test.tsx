import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import TripHeader from '../TripHeader';

jest.mock('expo-image', () => ({ Image: 'Image' }));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text>{name}</Text>;
  },
}));

const defaultProps = {
  title: '서울 여행',
  onOpenDrawer: jest.fn(),
  onTripOptions: jest.fn(),
  onNavigateSettings: jest.fn(),
};

describe('TripHeader', () => {
  beforeEach(() => jest.clearAllMocks());

  it('여행 제목을 표시한다', () => {
    render(<TripHeader {...defaultProps} />);
    expect(screen.getByText('서울 여행')).toBeTruthy();
  });

  it('햄버거 버튼을 누르면 onOpenDrawer를 호출한다', () => {
    const onOpenDrawer = jest.fn();
    render(<TripHeader {...defaultProps} onOpenDrawer={onOpenDrawer} />);
    fireEvent.press(screen.getByText('≡'));
    expect(onOpenDrawer).toHaveBeenCalledTimes(1);
  });

  it('옵션 버튼을 누르면 onTripOptions를 호출한다', () => {
    const onTripOptions = jest.fn();
    render(<TripHeader {...defaultProps} onTripOptions={onTripOptions} />);
    fireEvent.press(screen.getByTestId('trip-options-button'));
    expect(onTripOptions).toHaveBeenCalledTimes(1);
  });

  it('avatarUrl이 없으면 person-outline 기본 아이콘을 표시한다', () => {
    render(<TripHeader {...defaultProps} avatarUrl={undefined} />);
    expect(screen.getByText('person-outline')).toBeTruthy();
  });
});
