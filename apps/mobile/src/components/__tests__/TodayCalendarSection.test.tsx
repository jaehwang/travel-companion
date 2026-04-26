import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import TodayCalendarSection from '../TodayCalendarSection';
import { fetchCalendarAdvice, fetchCalendarEvents } from '../../lib/api';

jest.mock('../../lib/api', () => ({
  fetchCalendarEvents: jest.fn(),
  fetchCalendarAdvice: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text>{name}</Text>;
  },
}));

const mockFetchCalendarEvents = fetchCalendarEvents as jest.MockedFunction<typeof fetchCalendarEvents>;
const mockFetchCalendarAdvice = fetchCalendarAdvice as jest.MockedFunction<typeof fetchCalendarAdvice>;

describe('TodayCalendarSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchCalendarEvents.mockResolvedValue([
      {
        id: 'event-1',
        summary: '오전 미팅',
        start: { dateTime: '2026-04-25T10:00:00Z' },
        end: { dateTime: '2026-04-25T11:00:00Z' },
        location: '서울역',
      } as any,
    ]);
    mockFetchCalendarAdvice.mockResolvedValue('지금 출발하면 좋아요');
  });

  it('이벤트를 불러온 뒤 펼치면 일정 상세를 보여준다', async () => {
    render(<TodayCalendarSection tripEndDate="2026-04-25" />);

    await waitFor(() => {
      expect(screen.getByText('여행 일정 1개')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('여행 일정 1개'));

    await waitFor(() => {
      expect(screen.getByText('오전 미팅')).toBeTruthy();
      expect(screen.getByText('서울역')).toBeTruthy();
    });
  });

  it('이벤트가 없으면 아무것도 렌더링하지 않는다', async () => {
    mockFetchCalendarEvents.mockResolvedValue([]);

    const { toJSON } = render(<TodayCalendarSection />);

    await waitFor(() => expect(toJSON()).toBeNull());
  });
});
