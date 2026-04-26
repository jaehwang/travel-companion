import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import PlaceSearchPanel from '../PlaceSearchPanel';
import { searchPlaces, getPlaceDetails } from '../../lib/api';

jest.mock('react-native/Libraries/Modal/Modal', () => ({
  __esModule: true,
  default: ({ children, visible }: { children: React.ReactNode; visible: boolean }) =>
    visible ? children : null,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text>{name}</Text>;
  },
}));

jest.mock('../../lib/api', () => ({
  searchPlaces: jest.fn(),
  getPlaceDetails: jest.fn(),
}));

const mockSearchPlaces = searchPlaces as jest.MockedFunction<typeof searchPlaces>;
const mockGetPlaceDetails = getPlaceDetails as jest.MockedFunction<typeof getPlaceDetails>;

function makePrediction(id: string, main: string, secondary = '서울') {
  return {
    place_id: id,
    description: `${main}, ${secondary}`,
    structured_formatting: {
      main_text: main,
      secondary_text: secondary,
    },
  };
}

const defaultProps = {
  visible: true,
  onClose: jest.fn(),
  onPlaceSelected: jest.fn(),
};

describe('PlaceSearchPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('초기에 2자 이상 입력 안내를 표시한다', () => {
    render(<PlaceSearchPanel {...defaultProps} />);
    expect(screen.getByText('장소 이름을 2자 이상 입력하세요')).toBeTruthy();
  });

  it('query가 2자 이상이면 300ms 후 searchPlaces를 호출한다', async () => {
    mockSearchPlaces.mockResolvedValue([makePrediction('p1', '광화문')]);
    render(<PlaceSearchPanel {...defaultProps} />);

    fireEvent.changeText(screen.getByPlaceholderText('장소 이름을 입력하세요'), '광화');
    act(() => { jest.advanceTimersByTime(300); });

    await waitFor(() => expect(mockSearchPlaces).toHaveBeenCalledWith('광화', undefined, undefined));
  });

  it('검색 결과 목록을 표시한다', async () => {
    mockSearchPlaces.mockResolvedValue([
      makePrediction('p1', '광화문'),
      makePrediction('p2', '광화문역'),
    ]);
    render(<PlaceSearchPanel {...defaultProps} />);

    fireEvent.changeText(screen.getByPlaceholderText('장소 이름을 입력하세요'), '광화문');
    act(() => { jest.advanceTimersByTime(300); });

    await waitFor(() => {
      expect(screen.getByText('광화문')).toBeTruthy();
      expect(screen.getByText('광화문역')).toBeTruthy();
    });
  });

  it('결과를 누르면 getPlaceDetails를 호출하고 onPlaceSelected를 실행한다', async () => {
    mockSearchPlaces.mockResolvedValue([makePrediction('p1', '광화문')]);
    mockGetPlaceDetails.mockResolvedValue({
      place_id: 'p1',
      name: '광화문',
      latitude: 37.5759,
      longitude: 126.9769,
    });
    render(<PlaceSearchPanel {...defaultProps} />);

    fireEvent.changeText(screen.getByPlaceholderText('장소 이름을 입력하세요'), '광화문');
    act(() => { jest.advanceTimersByTime(300); });

    await waitFor(() => expect(screen.getByText('광화문')).toBeTruthy());
    fireEvent.press(screen.getByText('광화문'));

    await waitFor(() => {
      expect(defaultProps.onPlaceSelected).toHaveBeenCalledWith(
        37.5759, 126.9769, '광화문', 'p1',
      );
    });
  });

  it('검색 결과가 없으면 검색 결과 없음 메시지를 표시한다', async () => {
    mockSearchPlaces.mockResolvedValue([]);
    render(<PlaceSearchPanel {...defaultProps} />);

    fireEvent.changeText(screen.getByPlaceholderText('장소 이름을 입력하세요'), '없는장소');
    act(() => { jest.advanceTimersByTime(300); });

    await waitFor(() => expect(screen.getByText('검색 결과가 없습니다')).toBeTruthy());
  });

  it('뒤로 버튼을 누르면 onClose를 호출한다', () => {
    const onClose = jest.fn();
    render(<PlaceSearchPanel {...defaultProps} onClose={onClose} />);
    fireEvent.press(screen.getByText('뒤로'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('X 버튼을 누르면 query를 초기화한다', async () => {
    mockSearchPlaces.mockResolvedValue([makePrediction('p1', '광화문')]);
    render(<PlaceSearchPanel {...defaultProps} />);

    const input = screen.getByPlaceholderText('장소 이름을 입력하세요');
    fireEvent.changeText(input, '광화문');
    act(() => { jest.advanceTimersByTime(300); });

    await waitFor(() => expect(screen.getByText('광화문')).toBeTruthy());

    fireEvent.press(screen.getByText('close-circle'));
    expect(input.props.value).toBe('');
  });
});
