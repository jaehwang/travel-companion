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
  fetchNearbyCheckins: jest.fn().mockResolvedValue([]),
  API_URL: 'https://travel-companion.vercel.app',
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'denied' }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('../../hooks/useTrips', () => ({
  useTrips: jest.fn(),
}));

jest.mock('../../components/TripCard', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return ({ trip, onMenuPress }: { trip: { id: string; title: string }; onMenuPress: () => void }) => (
    <>
      <Text testID={`trip-${trip.id}`}>{trip.title}</Text>
      <TouchableOpacity testID={`menu-${trip.id}`} onPress={onMenuPress}>
        <Text>...</Text>
      </TouchableOpacity>
    </>
  );
});

jest.mock('../../components/TripFormModal', () => () => null);
jest.mock('../../components/QuickCheckinSheet', () => () => null);

import { useTrips } from '../../hooks/useTrips';
import HomeScreen from '../HomeScreen';

const mockUseTrips = useTrips as jest.MockedFunction<typeof useTrips>;

const makeTrip = (id: string, title: string, isPublic: boolean) => ({
  id,
  title,
  is_public: isPublic,
  is_frequent: false,
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
});

const publicTrip = makeTrip('trip-public', '공개 여행', true);
const privateTrip = makeTrip('trip-private', '비공개 여행', false);

function setupMocks(trips = [publicTrip, privateTrip]) {
  mockUseTrips.mockReturnValue({
    trips: trips as any,
    loading: false,
    error: null,
    reload: jest.fn(),
    create: jest.fn(),
    update: jest.fn().mockResolvedValue({}),
    remove: jest.fn(),
  });
}

describe('HomeScreen - 공개 여행 링크 복사', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
    jest.spyOn(Alert, 'alert');
    jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions').mockImplementation(
      (_options, _callback) => {}
    );
  });

  describe('iOS ActionSheet', () => {
    beforeEach(() => {
      Object.defineProperty(Platform, 'OS', { value: 'ios' });
    });

    it('공개 여행 메뉴에 공개 여행 링크 복사 옵션이 포함된다', () => {
      const { getByTestId } = render(<HomeScreen />);

      fireEvent.press(getByTestId('menu-trip-public'));

      expect(ActionSheetIOS.showActionSheetWithOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.arrayContaining(['공개 여행 링크 복사']),
        }),
        expect.any(Function),
      );
    });

    it('비공개 여행 메뉴에 공개 여행 링크 복사 옵션이 없다', () => {
      const { getByTestId } = render(<HomeScreen />);

      fireEvent.press(getByTestId('menu-trip-private'));

      const callArgs = (ActionSheetIOS.showActionSheetWithOptions as jest.Mock).mock.calls[0];
      const options: string[] = callArgs[0].options;
      expect(options).not.toContain('공개 여행 링크 복사');
    });

    it('공개 여행 링크 복사 선택 시 클립보드에 URL이 복사되고 알림이 표시된다', async () => {
      let capturedCallback: ((index: number) => void) | undefined;
      (ActionSheetIOS.showActionSheetWithOptions as jest.Mock).mockImplementation(
        (_options: any, callback: (index: number) => void) => { capturedCallback = callback; }
      );

      const { getByTestId } = render(<HomeScreen />);
      fireEvent.press(getByTestId('menu-trip-public'));

      // options: [toggleLabel, '공개 여행 링크 복사', '수정', '삭제', '취소']
      // index 1 = '공개 여행 링크 복사'
      await act(async () => {
        capturedCallback!(1);
      });

      await waitFor(() => {
        expect(Clipboard.setStringAsync).toHaveBeenCalledWith(
          'https://travel-companion.vercel.app/story/trip-public'
        );
        expect(Alert.alert).toHaveBeenCalledWith('링크 복사됨', '클립보드에 복사되었습니다.');
      });
    });

    it('공개 여행 메뉴의 취소 인덱스가 4이고 삭제 인덱스가 3이다', () => {
      const { getByTestId } = render(<HomeScreen />);

      fireEvent.press(getByTestId('menu-trip-public'));

      expect(ActionSheetIOS.showActionSheetWithOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          cancelButtonIndex: 4,
          destructiveButtonIndex: 3,
        }),
        expect.any(Function),
      );
    });

    it('비공개 여행 메뉴의 취소 인덱스가 3이고 삭제 인덱스가 2이다', () => {
      const { getByTestId } = render(<HomeScreen />);

      fireEvent.press(getByTestId('menu-trip-private'));

      expect(ActionSheetIOS.showActionSheetWithOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          cancelButtonIndex: 3,
          destructiveButtonIndex: 2,
        }),
        expect.any(Function),
      );
    });
  });

  describe('Android Alert', () => {
    beforeEach(() => {
      Object.defineProperty(Platform, 'OS', { value: 'android' });
    });

    afterEach(() => {
      Object.defineProperty(Platform, 'OS', { value: 'ios' });
    });

    it('공개 여행 메뉴에 공개 여행 링크 복사 항목이 포함된다', () => {
      const { getByTestId } = render(<HomeScreen />);
      fireEvent.press(getByTestId('menu-trip-public'));

      expect(Alert.alert).toHaveBeenCalledWith(
        publicTrip.title,
        undefined,
        expect.arrayContaining([
          expect.objectContaining({ text: '공개 여행 링크 복사' }),
        ]),
      );
    });

    it('비공개 여행 메뉴에 공개 여행 링크 복사 항목이 없다', () => {
      const { getByTestId } = render(<HomeScreen />);
      fireEvent.press(getByTestId('menu-trip-private'));

      const callArgs = (Alert.alert as jest.Mock).mock.calls[0];
      const buttons: { text: string }[] = callArgs[2];
      expect(buttons.map(b => b.text)).not.toContain('공개 여행 링크 복사');
    });

    it('공개 여행 링크 복사 버튼 onPress 호출 시 클립보드에 복사된다', async () => {
      const { getByTestId } = render(<HomeScreen />);
      fireEvent.press(getByTestId('menu-trip-public'));

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
  });
});
