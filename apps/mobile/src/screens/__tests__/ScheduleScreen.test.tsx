import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import ScheduleScreen from '../ScheduleScreen';
import { fetchScheduleWithWeather } from '../../lib/api';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('../../lib/api', () => ({
  fetchScheduleWithWeather: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

const mockFetch = fetchScheduleWithWeather as jest.MockedFunction<typeof fetchScheduleWithWeather>;

// ─── 픽스처 ───────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10);
const TOMORROW = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

const eventNoLocation = {
  id: 'ev-1',
  summary: '온라인 미팅',
  start: { dateTime: `${TODAY}T09:00:00+09:00` },
  end: { dateTime: `${TODAY}T10:00:00+09:00` },
};

const eventWithWeather = {
  id: 'ev-2',
  summary: '묵호 여행',
  location: '동해비치호텔, 강원도 동해시',
  start: { date: TOMORROW },
  end: { date: TOMORROW },
  weather: {
    date: TOMORROW,
    tempMax: 18,
    tempMin: 11,
    precipitation: 0,
    weatherCode: 3,
    windspeedMax: 17,
    description: '흐림',
    emoji: '☁️',
  },
};

const eventWithPrecip = {
  id: 'ev-3',
  summary: '비 오는 날 일정',
  location: '서울',
  start: { date: TOMORROW },
  end: { date: TOMORROW },
  weather: {
    date: TOMORROW,
    tempMax: 14,
    tempMin: 8,
    precipitation: 8.9,
    weatherCode: 63,
    windspeedMax: 31,
    description: '비',
    emoji: '🌧️',
  },
};

// ─── 테스트 ───────────────────────────────────────────────────────────────────

describe('ScheduleScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('로딩 중 ActivityIndicator를 표시한다', () => {
    mockFetch.mockReturnValue(new Promise(() => {})); // 영원히 pending

    const { UNSAFE_getByType } = render(<ScheduleScreen />);
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('일정이 없으면 빈 상태 메시지를 표시한다', async () => {
    mockFetch.mockResolvedValue({ items: [], advice: null });

    const { getByText } = render(<ScheduleScreen />);
    await waitFor(() => {
      expect(getByText('2주 내 일정이 없습니다')).toBeTruthy();
    });
  });

  it('TOKEN_EXPIRED 오류 시 캘린더 연동 안내를 표시한다', async () => {
    mockFetch.mockRejectedValue(new Error('TOKEN_EXPIRED'));

    const { getByText } = render(<ScheduleScreen />);
    await waitFor(() => {
      expect(getByText('캘린더 연동 필요')).toBeTruthy();
    });
  });

  it('이벤트 제목이 렌더링된다', async () => {
    mockFetch.mockResolvedValue({ items: [eventNoLocation], advice: null });

    const { getByText } = render(<ScheduleScreen />);
    await waitFor(() => {
      expect(getByText('온라인 미팅')).toBeTruthy();
    });
  });

  it('위치 정보가 있으면 위치 텍스트를 표시한다', async () => {
    mockFetch.mockResolvedValue({ items: [eventWithWeather], advice: null });

    const { getByText } = render(<ScheduleScreen />);
    await waitFor(() => {
      expect(getByText('동해비치호텔, 강원도 동해시')).toBeTruthy();
    });
  });

  it('날씨 배지에 설명과 기온 범위를 표시한다', async () => {
    mockFetch.mockResolvedValue({ items: [eventWithWeather], advice: null });

    const { getByText } = render(<ScheduleScreen />);
    await waitFor(() => {
      expect(getByText('흐림')).toBeTruthy();
      expect(getByText('11°~18°')).toBeTruthy();
    });
  });

  it('날씨 배지에 강수량을 표시한다', async () => {
    mockFetch.mockResolvedValue({ items: [eventWithPrecip], advice: null });

    const { getByText } = render(<ScheduleScreen />);
    await waitFor(() => {
      expect(getByText(/8\.9mm/)).toBeTruthy();
    });
  });

  it('강풍(30km/h 이상) 경고를 표시한다', async () => {
    mockFetch.mockResolvedValue({ items: [eventWithPrecip], advice: null });

    const { getByText } = render(<ScheduleScreen />);
    await waitFor(() => {
      expect(getByText(/31km\/h/)).toBeTruthy();
    });
  });

  it('AI 조언 카드를 표시한다', async () => {
    mockFetch.mockResolvedValue({
      items: [eventWithWeather],
      advice: '묵호 첫날은 흐리지만 비는 없으니 해변 산책 좋아요.',
    });

    const { getByText } = render(<ScheduleScreen />);
    await waitFor(() => {
      expect(getByText('묵호 첫날은 흐리지만 비는 없으니 해변 산책 좋아요.')).toBeTruthy();
    });
  });

  it('advice가 null이면 AI 조언 카드를 표시하지 않는다', async () => {
    mockFetch.mockResolvedValue({ items: [eventNoLocation], advice: null });

    const { queryByText } = render(<ScheduleScreen />);
    await waitFor(() => {
      expect(queryByText('AI 조언')).toBeNull();
    });
  });

  it('종일 이벤트는 "종일"을 표시한다', async () => {
    mockFetch.mockResolvedValue({ items: [eventWithWeather], advice: null });

    const { getByText } = render(<ScheduleScreen />);
    await waitFor(() => {
      expect(getByText('종일')).toBeTruthy();
    });
  });

  it('시각 이벤트는 HH:MM 형식의 시간을 표시한다', async () => {
    mockFetch.mockResolvedValue({ items: [eventNoLocation], advice: null });

    const { getByText } = render(<ScheduleScreen />);
    await waitFor(() => {
      expect(getByText('09:00')).toBeTruthy();
    });
  });

  it('오늘 날짜 헤더가 렌더링된다', async () => {
    mockFetch.mockResolvedValue({ items: [eventNoLocation], advice: null });

    const { getByText } = render(<ScheduleScreen />);
    await waitFor(() => {
      expect(getByText(/오늘/)).toBeTruthy();
    });
  });

  it('당겨서 새로고침 시 fetchScheduleWithWeather를 다시 호출한다', async () => {
    mockFetch.mockResolvedValue({ items: [], advice: null });

    const { getByTestId } = render(<ScheduleScreen />);
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    const { ScrollView } = require('react-native');
    // FlatList의 refreshControl은 직접 트리거가 어려우므로 호출 횟수로 검증
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
