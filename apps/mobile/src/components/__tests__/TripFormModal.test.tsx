import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import TripFormModal from '../TripFormModal';

jest.mock('react-native/Libraries/Modal/Modal', () => ({
  __esModule: true,
  default: ({ children, visible }: { children: React.ReactNode; visible: boolean }) =>
    visible ? children : null,
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = require('react-native');
  return () => <View testID="date-time-picker" />;
});

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

jest.mock('../LocationPickerContent', () => ({
  __esModule: true,
  default: ({
    onConfirm,
    onClose,
  }: {
    onConfirm: (lat: number, lng: number, placeName?: string, placeId?: string) => void;
    onClose: () => void;
  }) => {
    const { Text, TouchableOpacity, View } = require('react-native');

    return (
      <View testID="location-picker-content">
        <TouchableOpacity
          testID="confirm-location"
          onPress={() => onConfirm(37.5665, 126.978, '광화문', 'place-123')}
        >
          <Text>confirm-location</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="close-location" onPress={onClose}>
          <Text>close-location</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

describe('TripFormModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('위치 선택 결과를 저장 payload에 반영한다', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();

    render(
      <TripFormModal
        visible
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.changeText(screen.getByTestId('input-trip-title'), '서울 여행');
    fireEvent.press(screen.getByText('장소 추가'));
    fireEvent.press(screen.getByTestId('confirm-location'));

    await waitFor(() => expect(screen.getByText('광화문')).toBeTruthy());

    fireEvent.press(screen.getByTestId('btn-save-trip'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '서울 여행',
          place: '광화문',
          place_id: 'place-123',
          latitude: 37.5665,
          longitude: 126.978,
        }),
      );
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('위치 선택 모달을 닫으면 picker가 사라진다', async () => {
    render(
      <TripFormModal
        visible
        onClose={jest.fn()}
        onSubmit={jest.fn().mockResolvedValue(undefined)}
      />,
    );

    fireEvent.press(screen.getByText('장소 추가'));
    expect(screen.getByTestId('location-picker-content')).toBeTruthy();

    fireEvent.press(screen.getByTestId('close-location'));

    await waitFor(() => expect(screen.queryByTestId('location-picker-content')).toBeNull());
  });
});
