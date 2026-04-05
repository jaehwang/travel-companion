import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert, ActionSheetIOS, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
    },
  },
}));

jest.mock('../../lib/api', () => ({
  API_URL: 'https://travel-companion.vercel.app',
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'denied' }),
  getCurrentPositionAsync: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('../../navigation/AppNavigator', () => ({
  setTripCheckinContext: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ bottom: 0, top: 0, left: 0, right: 0 }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
  useRoute: jest.fn(),
  useFocusEffect: jest.fn((cb: () => void) => cb()),
}));

jest.mock('../../hooks/useCheckins', () => ({
  useCheckins: jest.fn(() => ({
    checkins: [],
    loading: false,
    error: null,
    reload: jest.fn(),
    remove: jest.fn(),
  })),
}));

jest.mock('../../hooks/useTrips', () => ({
  useTrips: jest.fn(() => ({
    trips: [],
    loading: false,
    error: null,
    reload: jest.fn(),
    create: jest.fn(),
    update: jest.fn().mockResolvedValue({}),
    remove: jest.fn(),
  })),
}));

jest.mock('../../store/tripsStore', () => ({
  useTripsStore: jest.fn((selector: (s: any) => any) => selector({ trips: [] })),
}));

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockMapView = React.forwardRef(({ children }: any, _ref: any) => <View>{children}</View>);
  MockMapView.displayName = 'MapView';
  return {
    __esModule: true,
    default: MockMapView,
    Marker: ({ children }: any) => <View>{children}</View>,
    PROVIDER_GOOGLE: 'google',
  };
});

jest.mock('../../components/CheckinCard', () => () => null);
jest.mock('../../components/TripTaglineBanner', () => () => null);
jest.mock('../../components/TodayCalendarSection', () => () => null);
jest.mock('../../components/SideDrawer', () => () => null);
jest.mock('../../components/TripFormModal', () => () => null);

import TripScreen from '../trip/TripScreen';
import { useRoute } from '@react-navigation/native';

const mockUseRoute = useRoute as jest.MockedFunction<typeof useRoute>;

const publicTrip = {
  id: 'trip-public',
  title: '공개 여행',
  is_public: true,
  is_frequent: false,
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
};

const privateTrip = {
  id: 'trip-private',
  title: '비공개 여행',
  is_public: false,
  is_frequent: false,
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
};

describe('TripScreen - 공개 여행 링크 복사 (iOS)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert');
    jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions').mockImplementation(
      (_options, _callback) => {}
    );
    Object.defineProperty(Platform, 'OS', { value: 'ios' });
    mockUseRoute.mockReturnValue({ params: { trip: publicTrip } } as any);
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: 'ios' });
  });

  it('공개 여행 옵션 시트에 공개 여행 링크 복사 항목이 포함된다', () => {
    const { getByTestId } = render(<TripScreen />);

    fireEvent.press(getByTestId('trip-options-button'));

    expect(ActionSheetIOS.showActionSheetWithOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.arrayContaining(['공개 여행 링크 복사']),
      }),
      expect.any(Function),
    );
  });

  it('공개 여행 옵션 시트의 취소 인덱스가 4이다', () => {
    const { getByTestId } = render(<TripScreen />);

    fireEvent.press(getByTestId('trip-options-button'));

    expect(ActionSheetIOS.showActionSheetWithOptions).toHaveBeenCalledWith(
      expect.objectContaining({ cancelButtonIndex: 4 }),
      expect.any(Function),
    );
  });

  it('공개 여행 링크 복사 선택 시 클립보드에 URL이 복사되고 알림이 표시된다', async () => {
    let capturedCallback: ((index: number) => void) | undefined;
    (ActionSheetIOS.showActionSheetWithOptions as jest.Mock).mockImplementation(
      (_options: any, callback: (index: number) => void) => { capturedCallback = callback; }
    );

    const { getByTestId } = render(<TripScreen />);
    fireEvent.press(getByTestId('trip-options-button'));

    // options: ['여행 수정', publicLabel, '공개 여행 링크 복사', frequentLabel, '취소']
    // index 2 = '공개 여행 링크 복사'
    await act(async () => {
      capturedCallback!(2);
    });

    await waitFor(() => {
      expect(Clipboard.setStringAsync).toHaveBeenCalledWith(
        'https://travel-companion.vercel.app/story/trip-public'
      );
      expect(Alert.alert).toHaveBeenCalledWith('링크 복사됨', '클립보드에 복사되었습니다.');
    });
  });

  it('비공개 여행 옵션 시트에 공개 여행 링크 복사 항목이 없다', () => {
    mockUseRoute.mockReturnValue({ params: { trip: privateTrip } } as any);

    const { getByTestId } = render(<TripScreen />);
    fireEvent.press(getByTestId('trip-options-button'));

    const callArgs = (ActionSheetIOS.showActionSheetWithOptions as jest.Mock).mock.calls[0];
    const options: string[] = callArgs[0].options;
    expect(options).not.toContain('공개 여행 링크 복사');
  });

  it('비공개 여행 옵션 시트의 취소 인덱스가 3이다', () => {
    mockUseRoute.mockReturnValue({ params: { trip: privateTrip } } as any);

    const { getByTestId } = render(<TripScreen />);
    fireEvent.press(getByTestId('trip-options-button'));

    expect(ActionSheetIOS.showActionSheetWithOptions).toHaveBeenCalledWith(
      expect.objectContaining({ cancelButtonIndex: 3 }),
      expect.any(Function),
    );
  });
});

describe('TripScreen - 공개 여행 링크 복사 (Android)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert');
    Object.defineProperty(Platform, 'OS', { value: 'android' });
    mockUseRoute.mockReturnValue({ params: { trip: publicTrip } } as any);
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: 'ios' });
  });

  it('공개 여행 메뉴에 공개 여행 링크 복사 항목이 포함된다', () => {
    const { getByTestId } = render(<TripScreen />);
    fireEvent.press(getByTestId('trip-options-button'));

    expect(Alert.alert).toHaveBeenCalledWith(
      '여행 설정',
      undefined,
      expect.arrayContaining([
        expect.objectContaining({ text: '공개 여행 링크 복사' }),
      ]),
    );
  });

  it('공개 여행 링크 복사 버튼 onPress 호출 시 클립보드에 복사된다', async () => {
    const { getByTestId } = render(<TripScreen />);
    fireEvent.press(getByTestId('trip-options-button'));

    const callArgs = (Alert.alert as jest.Mock).mock.calls[0];
    const buttons: { text: string; onPress?: () => void }[] = callArgs[2];
    const copyButton = buttons.find(b => b.text === '공개 여행 링크 복사');

    await act(async () => {
      copyButton?.onPress?.();
    });

    await waitFor(() => {
      expect(Clipboard.setStringAsync).toHaveBeenCalledWith(
        'https://travel-companion.vercel.app/story/trip-public'
      );
    });
  });

  it('비공개 여행 메뉴에 공개 여행 링크 복사 항목이 없다', () => {
    mockUseRoute.mockReturnValue({ params: { trip: privateTrip } } as any);

    const { getByTestId } = render(<TripScreen />);
    fireEvent.press(getByTestId('trip-options-button'));

    const callArgs = (Alert.alert as jest.Mock).mock.calls[0];
    const buttons: { text: string }[] = callArgs[2];
    expect(buttons.map(b => b.text)).not.toContain('공개 여행 링크 복사');
  });
});
