import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import SearchScreen from '../SearchScreen';
import { searchTrips, searchCheckins } from '../../lib/api';
import { useTripsStore } from '../../store/tripsStore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('../../lib/api', () => ({
  searchTrips: jest.fn(),
  searchCheckins: jest.fn(),
}));

jest.mock('../../store/tripsStore', () => ({
  useTripsStore: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useFocusEffect: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  const { createElement } = require('react');
  return {
    SafeAreaView: ({ children, ...props }: any) => createElement(View, props, children),
  };
});

// ─── 픽스처 ───────────────────────────────────────────────────────────────────

const mockTrip = {
  id: 'trip-1',
  title: '제주도 여행',
  start_date: '2024-03-01',
  end_date: '2024-03-05',
  is_public: false,
  is_frequent: false,
  is_default: false,
  created_at: '2024-03-01T00:00:00Z',
  updated_at: '2024-03-01T00:00:00Z',
};

const mockCheckin = {
  id: 'checkin-1',
  trip_id: 'trip-1',
  title: '성산일출봉',
  place: '성산일출봉',
  category: 'attraction',
  latitude: 33.458,
  longitude: 126.942,
  checked_in_at: '2024-03-02T09:00:00Z',
  created_at: '2024-03-02T09:00:00Z',
  updated_at: '2024-03-02T09:00:00Z',
};

const mockNavigate = jest.fn();

// ─── 테스트 ───────────────────────────────────────────────────────────────────

describe('SearchScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    (useNavigation as jest.Mock).mockReturnValue({ navigate: mockNavigate });
    (useFocusEffect as jest.Mock).mockImplementation(() => {});
    (useTripsStore as unknown as jest.Mock).mockReturnValue([mockTrip]);
    (searchTrips as jest.Mock).mockResolvedValue([]);
    (searchCheckins as jest.Mock).mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('검색창이 렌더링된다', () => {
    const { getByTestId } = render(<SearchScreen />);
    expect(getByTestId('screen-search')).toBeTruthy();
    expect(getByTestId('input-search')).toBeTruthy();
  });

  it('2자 미만 입력 시 검색 함수를 호출하지 않는다', () => {
    const { getByTestId } = render(<SearchScreen />);
    fireEvent.changeText(getByTestId('input-search'), '제');
    act(() => { jest.runAllTimers(); });
    expect(searchTrips).not.toHaveBeenCalled();
    expect(searchCheckins).not.toHaveBeenCalled();
  });

  it('2자 이상 입력 시 300ms 후 검색 함수를 호출한다', async () => {
    const { getByTestId } = render(<SearchScreen />);
    fireEvent.changeText(getByTestId('input-search'), '제주');
    act(() => { jest.advanceTimersByTime(300); });
    await waitFor(() => {
      expect(searchTrips).toHaveBeenCalledWith('제주');
      expect(searchCheckins).toHaveBeenCalledWith('제주');
    });
  });

  it('여행 결과가 렌더링된다', async () => {
    (searchTrips as jest.Mock).mockResolvedValue([mockTrip]);
    const { getByTestId, getByText } = render(<SearchScreen />);
    fireEvent.changeText(getByTestId('input-search'), '제주');
    act(() => { jest.advanceTimersByTime(300); });
    await waitFor(() => {
      expect(getByText('제주도 여행')).toBeTruthy();
    });
    expect(getByTestId(`search-trip-${mockTrip.id}`)).toBeTruthy();
  });

  it('체크인 결과에 여행명이 표시된다', async () => {
    (searchCheckins as jest.Mock).mockResolvedValue([mockCheckin]);
    const { getByTestId, getByText } = render(<SearchScreen />);
    fireEvent.changeText(getByTestId('input-search'), '성산');
    act(() => { jest.advanceTimersByTime(300); });
    await waitFor(() => {
      expect(getByText('성산일출봉')).toBeTruthy();
      // 여행명 표시 확인 (rowSub에 포함)
      expect(getByText(/제주도 여행/)).toBeTruthy();
    });
    expect(getByTestId(`search-checkin-${mockCheckin.id}`)).toBeTruthy();
  });

  it('여행 선택 시 TripsTab > Trip으로 이동한다', async () => {
    (searchTrips as jest.Mock).mockResolvedValue([mockTrip]);
    const { getByTestId } = render(<SearchScreen />);
    fireEvent.changeText(getByTestId('input-search'), '제주');
    act(() => { jest.advanceTimersByTime(300); });
    await waitFor(() => getByTestId(`search-trip-${mockTrip.id}`));
    fireEvent.press(getByTestId(`search-trip-${mockTrip.id}`));
    expect(mockNavigate).toHaveBeenCalledWith('TripsTab', {
      screen: 'Trip',
      params: { trip: mockTrip },
    });
  });

  it('체크인 선택 시 scrollToCheckinId와 함께 TripScreen으로 이동한다', async () => {
    (searchCheckins as jest.Mock).mockResolvedValue([mockCheckin]);
    const { getByTestId } = render(<SearchScreen />);
    fireEvent.changeText(getByTestId('input-search'), '성산');
    act(() => { jest.advanceTimersByTime(300); });
    await waitFor(() => getByTestId(`search-checkin-${mockCheckin.id}`));
    fireEvent.press(getByTestId(`search-checkin-${mockCheckin.id}`));
    expect(mockNavigate).toHaveBeenCalledWith('TripsTab', {
      screen: 'Trip',
      params: { trip: mockTrip, scrollToCheckinId: mockCheckin.id },
    });
  });

  it('체크인의 trip_id가 스토어에 없으면 이동하지 않는다', async () => {
    (useTripsStore as unknown as jest.Mock).mockReturnValue([]); // 빈 스토어
    (searchCheckins as jest.Mock).mockResolvedValue([mockCheckin]);
    const { getByTestId } = render(<SearchScreen />);
    fireEvent.changeText(getByTestId('input-search'), '성산');
    act(() => { jest.advanceTimersByTime(300); });
    await waitFor(() => getByTestId(`search-checkin-${mockCheckin.id}`));
    fireEvent.press(getByTestId(`search-checkin-${mockCheckin.id}`));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('X 버튼으로 검색어를 지운다', async () => {
    (searchTrips as jest.Mock).mockResolvedValue([mockTrip]);
    const { getByTestId, queryByTestId } = render(<SearchScreen />);
    fireEvent.changeText(getByTestId('input-search'), '제주');
    act(() => { jest.advanceTimersByTime(300); });
    await waitFor(() => getByTestId(`search-trip-${mockTrip.id}`));

    // X 버튼 누르기 (testID 없어서 query text 확인)
    const input = getByTestId('input-search');
    fireEvent.changeText(input, '');
    act(() => { jest.runAllTimers(); });

    expect(queryByTestId(`search-trip-${mockTrip.id}`)).toBeNull();
  });

  it('결과가 없으면 "검색 결과가 없습니다" 메시지를 표시한다', async () => {
    (searchTrips as jest.Mock).mockResolvedValue([]);
    (searchCheckins as jest.Mock).mockResolvedValue([]);
    const { getByTestId, getByText } = render(<SearchScreen />);
    fireEvent.changeText(getByTestId('input-search'), '없는곳xyz');
    act(() => { jest.advanceTimersByTime(300); });
    await waitFor(() => {
      expect(getByText('검색 결과가 없습니다')).toBeTruthy();
    });
  });
});
