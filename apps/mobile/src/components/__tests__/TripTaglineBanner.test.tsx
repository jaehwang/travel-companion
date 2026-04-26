import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import TripTaglineBanner from '../TripTaglineBanner';
import { fetchTripTagline } from '../../lib/api';

jest.mock('../../lib/api', () => ({
  fetchTripTagline: jest.fn(),
}));

const mockFetchTripTagline = fetchTripTagline as jest.MockedFunction<typeof fetchTripTagline>;

describe('TripTaglineBanner', () => {
  beforeEach(() => jest.clearAllMocks());

  it('로딩 중에 두근, 두근... 텍스트를 표시한다', () => {
    mockFetchTripTagline.mockReturnValue(new Promise(() => {}));
    render(<TripTaglineBanner tripId="trip-1" />);
    expect(screen.getByText('두근, 두근...')).toBeTruthy();
  });

  it('로드 완료 후 tagline을 표시한다', async () => {
    mockFetchTripTagline.mockResolvedValue('서울의 봄을 만끽한 여행');
    render(<TripTaglineBanner tripId="trip-1" />);
    await waitFor(() => {
      expect(screen.getByText(/서울의 봄을 만끽한 여행/)).toBeTruthy();
    });
  });

  it('tagline이 null이면 아무것도 렌더링하지 않는다', async () => {
    mockFetchTripTagline.mockResolvedValue(null);
    const { toJSON } = render(<TripTaglineBanner tripId="trip-1" />);
    await waitFor(() => expect(toJSON()).toBeNull());
  });

  it('fetch 실패 시 아무것도 렌더링하지 않는다', async () => {
    mockFetchTripTagline.mockRejectedValue(new Error('network error'));
    const { toJSON } = render(<TripTaglineBanner tripId="trip-1" />);
    await waitFor(() => expect(toJSON()).toBeNull());
  });

  it('새로고침 버튼을 누르면 fetchTripTagline을 다시 호출한다', async () => {
    mockFetchTripTagline.mockResolvedValue('첫 번째 tagline');
    render(<TripTaglineBanner tripId="trip-1" />);

    await waitFor(() => expect(screen.getByText(/첫 번째 tagline/)).toBeTruthy());

    mockFetchTripTagline.mockResolvedValue('새로운 tagline');
    fireEvent.press(screen.getByText('↺'));

    await waitFor(() => expect(screen.getByText(/새로운 tagline/)).toBeTruthy());
    expect(mockFetchTripTagline).toHaveBeenCalledTimes(2);
  });
});
