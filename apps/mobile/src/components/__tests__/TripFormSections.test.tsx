import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import {
  TripPlaceSection,
  TripToggleSection,
} from '../TripFormSections';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text>{name}</Text>;
  },
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = require('react-native');
  return () => <View testID="date-time-picker" />;
});

describe('TripPlaceSection', () => {
  it('장소가 설정되어 있으면 장소 이름을 표시한다', () => {
    render(<TripPlaceSection place="광화문" onClear={jest.fn()} onAdd={jest.fn()} />);
    expect(screen.getByText('광화문')).toBeTruthy();
  });

  it('장소가 없으면 장소 추가 버튼을 표시한다', () => {
    render(<TripPlaceSection place="" onClear={jest.fn()} onAdd={jest.fn()} />);
    expect(screen.getByText('장소 추가')).toBeTruthy();
  });

  it('장소가 설정된 상태에서 X 버튼을 누르면 onClear를 호출한다', () => {
    const onClear = jest.fn();
    render(<TripPlaceSection place="광화문" onClear={onClear} onAdd={jest.fn()} />);
    fireEvent.press(screen.getByText('close'));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('장소 추가 버튼을 누르면 onAdd를 호출한다', () => {
    const onAdd = jest.fn();
    render(<TripPlaceSection place="" onClear={jest.fn()} onAdd={onAdd} />);
    fireEvent.press(screen.getByText('장소 추가'));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });
});

describe('TripToggleSection', () => {
  const defaultProps = {
    isPublic: false,
    setIsPublic: jest.fn(),
    isFrequent: false,
    setIsFrequent: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('공개 여행과 자주 가는 곳 레이블을 표시한다', () => {
    render(<TripToggleSection {...defaultProps} />);
    expect(screen.getByText('공개 여행')).toBeTruthy();
    expect(screen.getByText('자주 가는 곳')).toBeTruthy();
  });

  it('공개 스위치를 토글하면 setIsPublic을 호출한다', () => {
    const setIsPublic = jest.fn();
    render(<TripToggleSection {...defaultProps} setIsPublic={setIsPublic} />);
    const switches = screen.getAllByRole('switch');
    fireEvent(switches[0], 'valueChange', true);
    expect(setIsPublic).toHaveBeenCalledWith(true);
  });

  it('자주 가는 곳 스위치를 토글하면 setIsFrequent를 호출한다', () => {
    const setIsFrequent = jest.fn();
    render(<TripToggleSection {...defaultProps} setIsFrequent={setIsFrequent} />);
    const switches = screen.getAllByRole('switch');
    fireEvent(switches[1], 'valueChange', true);
    expect(setIsFrequent).toHaveBeenCalledWith(true);
  });
});
